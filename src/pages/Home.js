import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../Styles/colors';
import { TV_HEIGHT, TV_WIDTH } from '../Styles/viewport';
import {
  CONTEXT_MENU_CLOSE_DURATION,
  HOME_LOADING_DELAY_MS,
  SCROLL_DURATION,
  SCROLL_EASING,
} from '../Styles/motion';
import StatusGradient from '../components/StatusGradient';
import Status from '../components/Status';
import HomeLoadingOverlay from '../components/HomeLoadingOverlay';
import ContextMenu, { getContextMenuPosition } from '../components/ContextMenu';
import CountryRow, {
  ROW_GAP,
  ROW_WIDTH,
  TILE_GAP,
  TILE_HEIGHT,
  TILE_WIDTH,
} from '../components/CountryRow';
import CountryGridTitle, { GRID_TITLE_HEIGHT } from '../components/CountryGridTitle';
import { COUNTRIES } from '../data/countries';
import { getContextMenuItems } from '../data/cities';
import {
  buildIntentFromCountryTile,
  buildIntentFromMenuItem,
  buildIntentFromRecentItem,
  resolveConnectionLabelFromIntent,
  resolveMenuConnectionLabel,
  resolveTileConnectionLabel,
  withIntentKey,
} from '../utils/connection';
import { getRecentsMenuItems, CLEAR_RECENTS_EVENT, useRecents } from '../utils/recents';
import {
  buildHomeGridLayout,
  buildTileRefGrid,
  getCountryRowAt,
  getRowItemCount,
  getTargetColumn,
  isPlusServerTile,
  shouldAllowCountryContextMenu,
  shouldOpenUpsell,
} from '../utils/homeGrid';
import { USER_TYPES } from '../utils/userType';
import SideNav, {
  NAV_COLLAPSED_WIDTH,
  NAV_EXPAND_DELTA,
} from '../components/SideNav';
import {
  getHomeRevealCompleteDelayMs,
  getHomeRevealStyle,
  getHomeStatusRevealDelayMs,
  getHomeTileRevealDelayMs,
} from '../utils/homeReveal';

import freeUserBannerImage from '../assets/home/free-user-banner.png';

const STATUS_LEFT = 190;
const STATUS_TOP = 120;
const STATUS_HEIGHT = 300;
const STATUS_TO_ROW_GAP = 100;
const BANNER_SOURCE_WIDTH = 1540;
const BANNER_SOURCE_HEIGHT = 296;
const BANNER_HEIGHT = Math.round(
  BANNER_SOURCE_HEIGHT * (ROW_WIDTH / BANNER_SOURCE_WIDTH),
);
const BANNER_BOTTOM_GAP = 32;
const SCROLL_ANCHOR_Y = 280;
const SCROLL_FADE_RATIO = 0.2;
const CONTENT_LEFT = STATUS_LEFT - NAV_COLLAPSED_WIDTH;
const SHADOW_BLEED_LEFT = 120;
const ENTER_LONG_PRESS_MS = 500;
const CONNECTION_DURATION_MS = 2000;
const SCROLL_SMOOTH_TIME_S = SCROLL_DURATION / 1000 / 4.6;

const GRADIENT_STATE = {
  unprotected: 'Unprotected',
  connecting: 'Connecting',
  protected: 'Protected',
};

const FASTEST_COUNTRY = COUNTRIES.find((country) => country.slug === 'fastest');

function recentToTileData(recent) {
  if (recent.type === 'fastest') {
    return {
      country: FASTEST_COUNTRY,
      label: 'Fastest',
      subtitle: null,
      intentKey: recent.intentKey,
    };
  }

  const country = COUNTRIES.find((entry) => entry.slug === recent.countrySlug);

  return {
    country,
    label: country?.name ?? recent.countryName,
    subtitle: recent.type === 'city' ? recent.city : null,
    intentKey: recent.intentKey,
  };
}

function getEstimatedRowTops(entries, countryRows, hasBanner) {
  const bannerBlockHeight = hasBanner ? BANNER_HEIGHT + BANNER_BOTTOM_GAP : 0;
  let y = STATUS_TOP + STATUS_HEIGHT + STATUS_TO_ROW_GAP + bannerBlockHeight;
  const topsByRow = {};

  entries.forEach((entry, index) => {
    if (entry.kind === 'title') {
      y += GRID_TITLE_HEIGHT;
      return;
    }

    if (entry.kind === 'recents-row' || entry.kind === 'country-row') {
      topsByRow[entry.logicalRowIndex] = y;
      y += TILE_HEIGHT;

      const nextEntry = entries[index + 1];
      if (
        nextEntry?.kind === 'country-row' ||
        nextEntry?.kind === 'recents-row'
      ) {
        y += ROW_GAP;
      }
    }
  });

  return countryRows.map((row) => topsByRow[row.logicalRowIndex] ?? 0);
}

function measureRowTopsFromDom(
  gridContainer,
  scrollContent,
  countryRows,
  entries,
  hasBanner,
) {
  const estimated = getEstimatedRowTops(entries, countryRows, hasBanner);

  if (!scrollContent || !gridContainer) {
    return estimated;
  }

  const originTop = scrollContent.getBoundingClientRect().top;

  return countryRows.map((row, index) => {
    const rowEl = gridContainer.querySelector(
      `[data-logical-row="${row.logicalRowIndex}"]`,
    );

    if (!rowEl) {
      return estimated[index] ?? 0;
    }

    return rowEl.getBoundingClientRect().top - originTop;
  });
}

function getMaxScroll(rowTops) {
  const secondToLastRowIndex = rowTops.length - 2;

  if (secondToLastRowIndex < 1) {
    return 0;
  }

  return Math.max(0, rowTops[secondToLastRowIndex] - SCROLL_ANCHOR_Y);
}

function getScrollOffset(focusedRowIndex, rowTops, hasBanner) {
  if (focusedRowIndex == null) {
    return 0;
  }

  if (focusedRowIndex === 0) {
    if (hasBanner && rowTops.length > 0) {
      return Math.min(
        Math.max(0, rowTops[0] - SCROLL_ANCHOR_Y),
        getMaxScroll(rowTops),
      );
    }

    return 0;
  }

  const lastRowIndex = rowTops.length - 1;

  if (focusedRowIndex >= lastRowIndex) {
    return getMaxScroll(rowTops);
  }

  return Math.min(
    rowTops[focusedRowIndex] - SCROLL_ANCHOR_Y,
    getMaxScroll(rowTops),
  );
}

function getActiveTitleKey(entries, focusedRow) {
  if (focusedRow == null) {
    return null;
  }

  let lastTitleKey = null;

  for (const entry of entries) {
    if (entry.kind === 'title') {
      lastTitleKey = entry.key;
    }

    if (
      (entry.kind === 'country-row' || entry.kind === 'recents-row') &&
      entry.logicalRowIndex === focusedRow
    ) {
      return lastTitleKey;
    }
  }

  return null;
}

export default function Home({
  activeSection = 'Home',
  onSectionChange = () => {},
  userType = USER_TYPES.PAID,
  freeCountrySort = 'alphabetical',
  showInitialLoading = false,
  onInitialLoadingComplete = () => {},
  onNavigateToUpsell = () => {},
  upsellReturnFocus = null,
  onUpsellReturnFocusHandled = () => {},
}) {
  const { recents, recordDisconnect, pinAt, unpinAt, removeAt, clearAll } = useRecents();
  const showRecents = userType !== USER_TYPES.FREE && recents.length > 0;
  const showBanner = userType === USER_TYPES.FREE;

  const gridLayout = useMemo(
    () =>
      buildHomeGridLayout({
        showRecents,
        recentsCount: recents.length,
        userType,
        freeCountrySort,
      }),
    [showRecents, recents.length, userType, freeCountrySort],
  );

  const { entries, countryRows, totalRows } = gridLayout;

  const [navExpanded, setNavExpanded] = useState(false);
  const [focusedTile, setFocusedTile] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [shortPressPulse, setShortPressPulse] = useState(null);
  const [connectionState, setConnectionState] = useState('unprotected');
  const [connectionTarget, setConnectionTarget] = useState(null);
  const [isLoadingCountries, setIsLoadingCountries] = useState(showInitialLoading);
  const [countriesRevealed, setCountriesRevealed] = useState(!showInitialLoading);
  const [isContentReady, setIsContentReady] = useState(false);

  const contentFocusRef = useRef(null);
  const connectTimeoutRef = useRef(null);
  const connectionStateRef = useRef('unprotected');
  const connectionTargetRef = useRef(null);
  const lastTilePressAtRef = useRef(0);
  const tileRefs = useRef(buildTileRefGrid(countryRows));
  const contextMenuItemRefs = useRef([]);
  const lastContentFocus = useRef({ type: 'button' });
  const enterLongPressFired = useRef(false);
  const enterTimerRef = useRef(null);
  const awaitingEnterKeyUpRef = useRef(false);
  const pendingMenuFocusRef = useRef(false);
  const focusedTileRef = useRef(null);
  const gridContainerRef = useRef(null);
  const scrollContentRef = useRef(null);
  const scrollTargetRef = useRef(0);
  const displayScrollRef = useRef(0);
  const prevShowRecentsRef = useRef(showRecents);
  const [layoutRowTops, setLayoutRowTops] = useState(() =>
    getEstimatedRowTops(entries, countryRows, showBanner),
  );
  const [displayScrollOffset, setDisplayScrollOffset] = useState(0);
  const rowTops = layoutRowTops;

  const recentsTileData = useMemo(
    () => recents.map(recentToTileData),
    [recents],
  );

  const recentsCountries = useMemo(
    () => recentsTileData.map((entry) => entry.country).filter(Boolean),
    [recentsTileData],
  );

  const recentsLabels = useMemo(
    () => recentsTileData.map((entry) => entry.label),
    [recentsTileData],
  );

  const recentsSubtitles = useMemo(
    () => recentsTileData.map((entry) => entry.subtitle),
    [recentsTileData],
  );

  const recentsIntentKeys = useMemo(
    () => recentsTileData.map((entry) => entry.intentKey),
    [recentsTileData],
  );

  const connectionIntentKey = connectionTarget?.intent?.intentKey ?? null;

  const activeTile = useMemo(() => {
    if (contextMenu?.isClosing && contextMenu.returnTo) {
      return contextMenu.returnTo;
    }

    if (contextMenu && !contextMenu.isClosing) {
      return { row: contextMenu.row, col: contextMenu.col };
    }

    return focusedTile;
  }, [contextMenu, focusedTile]);

  const scrollOffset = getScrollOffset(
    activeTile?.row ?? null,
    rowTops,
    showBanner,
  );
  scrollTargetRef.current = scrollOffset;

  useEffect(() => {
    const handleClearRecents = () => {
      clearAll();
    };

    window.addEventListener(CLEAR_RECENTS_EVENT, handleClearRecents);

    return () => {
      window.removeEventListener(CLEAR_RECENTS_EVENT, handleClearRecents);
    };
  }, [clearAll]);

  useLayoutEffect(() => {
    if (!isContentReady) {
      return;
    }

    setLayoutRowTops(
      measureRowTopsFromDom(
        gridContainerRef.current,
        scrollContentRef.current,
        countryRows,
        entries,
        showBanner,
      ),
    );
  }, [
    countryRows,
    entries,
    showBanner,
    isContentReady,
    freeCountrySort,
    userType,
    recents.length,
    showRecents,
  ]);

  useEffect(() => {
    if (!isContentReady) {
      return undefined;
    }

    let frameId;
    let lastTime = performance.now();

    const tick = (now) => {
      const target = scrollTargetRef.current;
      const current = displayScrollRef.current;
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      if (current !== target) {
        const alpha = 1 - Math.exp(-dt / SCROLL_SMOOTH_TIME_S);
        let next = current + (target - current) * alpha;

        if (Math.abs(target - next) < 0.5) {
          next = target;
        }

        displayScrollRef.current = next;
        setDisplayScrollOffset(next);
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameId);
  }, [isContentReady]);

  const focusButton = useCallback(() => {
    focusedTileRef.current = null;
    setFocusedTile(null);

    lastContentFocus.current = { type: 'button' };
    requestAnimationFrame(() =>
      contentFocusRef.current?.focus?.({ preventScroll: true }),
    );
  }, []);

  const focusTile = useCallback((rowIndex, colIndex) => {
    const next = { row: rowIndex, col: colIndex };
    focusedTileRef.current = next;

    setFocusedTile((current) => {
      if (current?.row === rowIndex && current?.col === colIndex) {
        return current;
      }

      return next;
    });

    lastContentFocus.current = { type: 'tile', row: rowIndex, col: colIndex };
    requestAnimationFrame(() => {
      const node = tileRefs.current[rowIndex]?.[colIndex];
      if (node?.focus && document.activeElement !== node) {
        node.focus({ preventScroll: true });
      }
    });
  }, []);

  useEffect(() => {
    const prevShowRecents = prevShowRecentsRef.current;
    prevShowRecentsRef.current = showRecents;

    const focused = focusedTileRef.current;
    if (!focused || prevShowRecents === showRecents) {
      return;
    }

    if (prevShowRecents && !showRecents) {
      if (focused.row === 0) {
        focusTile(0, getTargetColumn(focused.col, 0, countryRows));
      } else {
        const nextRow = focused.row - 1;
        focusTile(nextRow, getTargetColumn(focused.col, nextRow, countryRows));
      }
      return;
    }

    if (!prevShowRecents && showRecents) {
      const nextRow = focused.row + 1;
      focusTile(nextRow, getTargetColumn(focused.col, nextRow, countryRows));
    }
  }, [countryRows, focusTile, showRecents]);

  const focusContent = useCallback(() => {
    const last = lastContentFocus.current;

    if (last.type === 'tile') {
      focusTile(last.row, last.col);
      return;
    }

    focusButton();
  }, [focusButton, focusTile]);

  useEffect(() => {
    tileRefs.current = buildTileRefGrid(countryRows);

    const focused = focusedTileRef.current;
    if (!focused) {
      return;
    }

    const maxCol = getRowItemCount(countryRows, focused.row) - 1;
    if (focused.row >= totalRows || focused.col > maxCol) {
      focusButton();
    }
  }, [countryRows, totalRows, focusButton]);

  const closeContextMenu = useCallback((returnTo) => {
    setContextMenu((current) => {
      if (!current || current.isClosing) {
        return current;
      }

      const target = returnTo ?? { row: current.row, col: current.col };

      focusedTileRef.current = target;
      setFocusedTile(target);
      lastContentFocus.current = { type: 'tile', row: target.row, col: target.col };

      return {
        ...current,
        isClosing: true,
        isReady: false,
        showItemFocus: false,
        focusedIndex: -1,
        returnTo: target,
      };
    });
  }, []);

  useEffect(() => {
    if (!contextMenu?.isClosing) {
      return undefined;
    }

    const target = contextMenu.returnTo ?? {
      row: contextMenu.row,
      col: contextMenu.col,
    };
    const timeout = setTimeout(() => {
      setContextMenu(null);
      focusTile(target.row, target.col);
    }, CONTEXT_MENU_CLOSE_DURATION);

    return () => clearTimeout(timeout);
  }, [contextMenu, focusTile]);

  const openCountryContextMenu = useCallback(
    (rowIndex, colIndex, options = {}) => {
      const rowData = getCountryRowAt(countryRows, rowIndex);

      if (!rowData || rowData.kind === 'recents') {
        return;
      }

      const country = rowData.countries[colIndex];

      if (
        !shouldAllowCountryContextMenu(country, userType, rowData.section)
      ) {
        return;
      }

      const items = getContextMenuItems(country.name);

      contextMenuItemRefs.current = Array(items.length).fill(null);

      if (options.fromEnter) {
        awaitingEnterKeyUpRef.current = true;
        pendingMenuFocusRef.current = true;
      } else {
        awaitingEnterKeyUpRef.current = false;
        pendingMenuFocusRef.current = false;
      }

      setContextMenu({
        type: 'country',
        row: rowIndex,
        col: colIndex,
        items,
        focusedIndex: -1,
        isClosing: false,
        isReady: false,
        showItemFocus: false,
      });
    },
    [countryRows, userType],
  );

  const openRecentsContextMenu = useCallback(
    (rowIndex, colIndex, options = {}) => {
      const recent = recents[colIndex];

      if (!recent) {
        return;
      }

      const items = getRecentsMenuItems(recent);

      contextMenuItemRefs.current = Array(items.length).fill(null);

      if (options.fromEnter) {
        awaitingEnterKeyUpRef.current = true;
        pendingMenuFocusRef.current = true;
      } else {
        awaitingEnterKeyUpRef.current = false;
        pendingMenuFocusRef.current = false;
      }

      setContextMenu({
        type: 'recents',
        row: rowIndex,
        col: colIndex,
        recentIndex: colIndex,
        items,
        focusedIndex: -1,
        isClosing: false,
        isReady: false,
        showItemFocus: false,
      });
    },
    [recents],
  );

  const openContextMenu = useCallback(
    (rowIndex, colIndex, options = {}) => {
      const rowData = getCountryRowAt(countryRows, rowIndex);

      if (rowData?.kind === 'recents') {
        openRecentsContextMenu(rowIndex, colIndex, options);
        return;
      }

      openCountryContextMenu(rowIndex, colIndex, options);
    },
    [countryRows, openCountryContextMenu, openRecentsContextMenu],
  );

  const handleMenuOpenComplete = useCallback(() => {
    setContextMenu((current) => {
      if (!current || current.isClosing) {
        return current;
      }

      return {
        ...current,
        isReady: true,
        showItemFocus: true,
        focusedIndex: 0,
      };
    });

    if (!pendingMenuFocusRef.current) {
      requestAnimationFrame(() => {
        contextMenuItemRefs.current[0]?.focus?.({ preventScroll: true });
      });
    }
  }, []);

  const triggerShortPress = useCallback((rowIndex, colIndex) => {
    setShortPressPulse({ row: rowIndex, col: colIndex, id: Date.now() });
  }, []);

  const clearConnectionTimeout = useCallback(() => {
    if (connectTimeoutRef.current) {
      clearTimeout(connectTimeoutRef.current);
      connectTimeoutRef.current = null;
    }
  }, []);

  const startConnection = useCallback(
    (displayLabel, sourceTile, intent) => {
      clearConnectionTimeout();

      const currentState = connectionStateRef.current;
      const currentTarget = connectionTargetRef.current;

      if (currentState === 'protected' && currentTarget?.intent) {
        recordDisconnect(currentTarget.intent);
      }

      const scrambleFrom =
        currentState === 'protected'
          ? currentTarget?.displayLabel ?? 'United Kingdom'
          : currentState === 'connecting'
            ? currentTarget?.scrambleFrom ?? 'Norway'
            : 'Norway';

      const nextTarget = {
        displayLabel,
        intent,
        sourceTile,
        scrambleFrom,
      };
      connectionStateRef.current = 'connecting';
      connectionTargetRef.current = nextTarget;
      setConnectionTarget(nextTarget);
      setConnectionState('connecting');
      connectTimeoutRef.current = setTimeout(() => {
        connectionStateRef.current = 'protected';
        setConnectionState('protected');
        connectTimeoutRef.current = null;
      }, CONNECTION_DURATION_MS);
    },
    [clearConnectionTimeout, recordDisconnect],
  );

  const resetConnection = useCallback(() => {
    const wasProtected = connectionStateRef.current === 'protected';
    const intent = connectionTargetRef.current?.intent;

    clearConnectionTimeout();
    connectionStateRef.current = 'unprotected';
    connectionTargetRef.current = null;
    setConnectionState('unprotected');
    setConnectionTarget(null);

    if (wasProtected && intent) {
      recordDisconnect(intent);
    }
  }, [clearConnectionTimeout, recordDisconnect]);

  const handleQuickConnect = useCallback(() => {
    if (connectionStateRef.current === 'unprotected') {
      const uk = COUNTRIES.find((country) => country.name === 'United Kingdom');
      const intent = withIntentKey(buildIntentFromCountryTile(uk));
      startConnection('United Kingdom', null, intent);
      return;
    }

    resetConnection();
  }, [resetConnection, startConnection]);

  const getTileIntentKey = useCallback(
    (rowIndex, colIndex) => {
      const rowData = getCountryRowAt(countryRows, rowIndex);

      if (!rowData) {
        return null;
      }

      if (rowData.kind === 'recents') {
        return recentsIntentKeys[colIndex] ?? null;
      }

      const country = rowData.countries[colIndex];
      return withIntentKey(buildIntentFromCountryTile(country)).intentKey;
    },
    [countryRows, recentsIntentKeys],
  );

  const handleTileShortPress = useCallback(
    (rowIndex, colIndex) => {
      const now = Date.now();
      if (now - lastTilePressAtRef.current < 100) {
        return;
      }

      lastTilePressAtRef.current = now;
      triggerShortPress(rowIndex, colIndex);

      const currentState = connectionStateRef.current;
      const currentTarget = connectionTargetRef.current;
      const tileIntentKey = getTileIntentKey(rowIndex, colIndex);
      const isConnectionSource =
        (currentTarget?.sourceTile?.row === rowIndex &&
          currentTarget?.sourceTile?.col === colIndex) ||
        (currentTarget?.intent?.intentKey &&
          tileIntentKey &&
          currentTarget.intent.intentKey === tileIntentKey);

      if (
        isConnectionSource &&
        (currentState === 'connecting' || currentState === 'protected')
      ) {
        resetConnection();
        return;
      }

      const rowData = getCountryRowAt(countryRows, rowIndex);

      if (!rowData) {
        return;
      }

      if (rowData.kind === 'recents') {
        const recent = recents[colIndex];
        const intent = withIntentKey(buildIntentFromRecentItem(recent));
        const displayLabel = resolveConnectionLabelFromIntent(intent, userType);
        startConnection(displayLabel, { row: rowIndex, col: colIndex }, intent);
        return;
      }

      const country = rowData.countries[colIndex];

      if (shouldOpenUpsell(country, userType, rowData.section)) {
        onNavigateToUpsell({ type: 'tile', row: rowIndex, col: colIndex });
        return;
      }

      const intent = withIntentKey(buildIntentFromCountryTile(country));
      const displayLabel = resolveTileConnectionLabel(country, userType);
      startConnection(displayLabel, { row: rowIndex, col: colIndex }, intent);
    },
    [
      countryRows,
      getTileIntentKey,
      onNavigateToUpsell,
      recents,
      resetConnection,
      startConnection,
      triggerShortPress,
      userType,
    ],
  );

  const handleRecentsMenuSelect = useCallback(
    (index) => {
      if (!contextMenu || contextMenu.isClosing || !contextMenu.isReady) {
        return;
      }

      const item = contextMenu.items[index];
      const recentIndex = contextMenu.recentIndex;

      closeContextMenu();

      if (item.action === 'pin') {
        pinAt(recentIndex);
      } else if (item.action === 'unpin') {
        unpinAt(recentIndex);
      } else if (item.action === 'remove') {
        removeAt(recentIndex);
      }
    },
    [closeContextMenu, contextMenu, pinAt, removeAt, unpinAt],
  );

  const handleContextMenuSelect = useCallback(
    (index, item) => {
      if (!contextMenu || contextMenu.isClosing || !contextMenu.isReady) {
        return;
      }

      if (contextMenu.type === 'recents') {
        handleRecentsMenuSelect(index);
        return;
      }

      const { row, col } = contextMenu;
      const rowData = getCountryRowAt(countryRows, row);
      const country = rowData?.countries?.[col];
      const intent = withIntentKey(buildIntentFromMenuItem(country, item));
      const displayLabel = resolveMenuConnectionLabel(country.name, item);

      closeContextMenu();
      startConnection(displayLabel, { row, col }, intent);
    },
    [
      closeContextMenu,
      contextMenu,
      countryRows,
      handleRecentsMenuSelect,
      startConnection,
    ],
  );

  const focusContextMenuItem = useCallback((index) => {
    setContextMenu((current) => {
      if (!current || current.isClosing || !current.isReady) {
        return current;
      }

      return { ...current, focusedIndex: index, showItemFocus: true };
    });

    requestAnimationFrame(() => {
      contextMenuItemRefs.current[index]?.focus?.({ preventScroll: true });
    });
  }, []);

  const contentOffset =
    NAV_COLLAPSED_WIDTH + (navExpanded ? NAV_EXPAND_DELTA : 0);

  const contextMenuPosition = useMemo(() => {
    if (!contextMenu) {
      return null;
    }

    return getContextMenuPosition({
      row: contextMenu.row,
      col: contextMenu.col,
      itemCount: contextMenu.items.length,
      contentOffset,
      contentLeft: CONTENT_LEFT,
      scrollOffset: displayScrollOffset,
      tileWidth: TILE_WIDTH,
      tileGap: TILE_GAP,
      rowTops,
    });
  }, [contextMenu, contentOffset, displayScrollOffset, rowTops]);

  useEffect(() => {
    if (!showInitialLoading) {
      setIsLoadingCountries(false);
      setCountriesRevealed(true);
      return undefined;
    }

    const loadingTimer = setTimeout(() => {
      setIsLoadingCountries(false);
      setCountriesRevealed(true);
      onInitialLoadingComplete();
    }, HOME_LOADING_DELAY_MS);

    return () => clearTimeout(loadingTimer);
  }, [onInitialLoadingComplete, showInitialLoading]);

  useEffect(() => {
    if (!upsellReturnFocus || !isContentReady || isLoadingCountries) {
      return undefined;
    }

    const timer = setTimeout(() => {
      if (upsellReturnFocus.type === 'button') {
        focusButton();
      } else {
        focusTile(upsellReturnFocus.row, upsellReturnFocus.col);
      }

      onUpsellReturnFocusHandled();
    }, 150);

    return () => clearTimeout(timer);
  }, [
    focusButton,
    focusTile,
    isContentReady,
    isLoadingCountries,
    onUpsellReturnFocusHandled,
    upsellReturnFocus,
  ]);

  useEffect(() => {
    if (!countriesRevealed) {
      return undefined;
    }

    const revealTimer = setTimeout(() => {
      setIsContentReady(true);
    }, getHomeRevealCompleteDelayMs());

    return () => clearTimeout(revealTimer);
  }, [countriesRevealed]);

  useEffect(() => () => clearConnectionTimeout(), [clearConnectionTimeout]);

  useEffect(() => {
    if (!isContentReady || isLoadingCountries || upsellReturnFocus) {
      return undefined;
    }

    const timer = setTimeout(() => {
      contentFocusRef.current?.focus?.({ preventScroll: true });
    }, 100);

    return () => clearTimeout(timer);
  }, [isContentReady, isLoadingCountries, upsellReturnFocus]);

  const clearEnterTimer = useCallback(() => {
    if (enterTimerRef.current) {
      clearTimeout(enterTimerRef.current);
      enterTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isContentReady || isLoadingCountries) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (contextMenu && !contextMenu.isClosing) {
        const { focusedIndex, items, row, col, isReady } = contextMenu;
        const maxCol = getRowItemCount(countryRows, row) - 1;

        if (event.key === 'Escape' || event.key === 'Backspace') {
          closeContextMenu();
          event.preventDefault();
          return;
        }

        if (event.key === 'ArrowDown' && isReady && focusedIndex < items.length - 1) {
          focusContextMenuItem(focusedIndex + 1);
          event.preventDefault();
          return;
        }

        if (event.key === 'ArrowUp' && isReady && focusedIndex > 0) {
          focusContextMenuItem(focusedIndex - 1);
          event.preventDefault();
          return;
        }

        if (event.key === 'ArrowRight') {
          const menuOnRight = col < 3;

          if (!menuOnRight) {
            closeContextMenu({ row, col });
          } else if (col < maxCol) {
            closeContextMenu({ row, col: col + 1 });
          } else {
            closeContextMenu({ row, col });
          }
          event.preventDefault();
          return;
        }

        if (event.key === 'ArrowLeft') {
          const menuOnRight = col < 3;

          if (menuOnRight) {
            closeContextMenu({ row, col });
          } else if (col > 0) {
            closeContextMenu({ row, col: col - 1 });
          } else {
            closeContextMenu({ row, col });
          }
          event.preventDefault();
          return;
        }

        if (
          event.key === 'Enter' &&
          isReady &&
          !awaitingEnterKeyUpRef.current
        ) {
          const item = items[focusedIndex];
          handleContextMenuSelect(focusedIndex, item);
          event.preventDefault();
          return;
        }

        if (event.key === 'Enter') {
          event.preventDefault();
        }

        return;
      }

      if (navExpanded) {
        return;
      }

      if (event.key === 'Enter' && lastContentFocus.current.type === 'button') {
        return;
      }

      const focusedTileState = focusedTileRef.current;
      const isButtonFocused = focusedTileState === null;
      const isTileFocused = focusedTileState !== null;

      if (event.key === 'Enter' && isTileFocused) {
        if (!enterTimerRef.current) {
          enterLongPressFired.current = false;
          const rowData = getCountryRowAt(countryRows, focusedTileState.row);
          const canOpenMenu =
            rowData?.kind === 'recents'
              ? true
              : shouldAllowCountryContextMenu(
                  rowData?.countries?.[focusedTileState.col],
                  userType,
                  rowData?.section,
                );

          if (canOpenMenu) {
            enterTimerRef.current = setTimeout(() => {
              enterLongPressFired.current = true;
              enterTimerRef.current = null;
              openContextMenu(
                focusedTileState.row,
                focusedTileState.col,
                { fromEnter: true },
              );
            }, ENTER_LONG_PRESS_MS);
          }
        }
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }

      if (event.key === 'ArrowDown' && isButtonFocused) {
        focusTile(0, 0);
        event.preventDefault();
        return;
      }

      if (event.key === 'ArrowUp' && isTileFocused && focusedTileState.row === 0) {
        focusButton();
        event.preventDefault();
        return;
      }

      if (isTileFocused) {
        const { row, col } = focusedTileState;

        if (event.key === 'ArrowDown' && row < totalRows - 1) {
          const nextRow = row + 1;
          focusTile(
            nextRow,
            getTargetColumn(col, nextRow, countryRows),
          );
          event.preventDefault();
          event.stopImmediatePropagation();
          return;
        }

        if (event.key === 'ArrowUp' && row > 0) {
          const prevRow = row - 1;
          focusTile(
            prevRow,
            getTargetColumn(col, prevRow, countryRows),
          );
          event.preventDefault();
          event.stopImmediatePropagation();
          return;
        }

        if (
          event.key === 'ArrowRight' &&
          col < getRowItemCount(countryRows, row) - 1
        ) {
          focusTile(row, col + 1);
          event.preventDefault();
          event.stopImmediatePropagation();
          return;
        }

        if (event.key === 'ArrowLeft' && col > 0) {
          focusTile(row, col - 1);
          event.preventDefault();
          event.stopImmediatePropagation();
          return;
        }

        if (event.key === 'ArrowLeft') {
          focusedTileRef.current = null;
        }
      }
    };

    const handleKeyUp = (event) => {
      if (event.key === 'Enter' && contextMenu && pendingMenuFocusRef.current) {
        pendingMenuFocusRef.current = false;
        awaitingEnterKeyUpRef.current = false;
        event.preventDefault();
        event.stopPropagation();
        requestAnimationFrame(() => {
          contextMenuItemRefs.current[0]?.focus?.({ preventScroll: true });
        });
        return;
      }

      if (event.key === 'Enter') {
        awaitingEnterKeyUpRef.current = false;
      }

      if (contextMenu || navExpanded) {
        if (event.key === 'Enter') {
          clearEnterTimer();
          enterLongPressFired.current = false;
        }
        return;
      }

      if (lastContentFocus.current.type === 'button') {
        if (event.key === 'Enter') {
          clearEnterTimer();
          enterLongPressFired.current = false;
          event.preventDefault();
        }
        return;
      }

      if (focusedTile == null) {
        return;
      }

      if (event.key === 'Enter') {
        const wasShortPress = !enterLongPressFired.current;
        clearEnterTimer();
        enterLongPressFired.current = false;

        if (wasShortPress) {
          handleTileShortPress(focusedTile.row, focusedTile.col);
        }

        event.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
      clearEnterTimer();
    };
  }, [
    clearEnterTimer,
    closeContextMenu,
    contextMenu,
    countryRows,
    focusButton,
    focusContextMenuItem,
    focusTile,
    focusedTile,
    handleContextMenuSelect,
    handleTileShortPress,
    navExpanded,
    openContextMenu,
    isContentReady,
    isLoadingCountries,
    totalRows,
    userType,
  ]);

  const menuSource =
    contextMenu && !contextMenu.isClosing
      ? { row: contextMenu.row, col: contextMenu.col }
      : null;

  const menuOpenRowIndex =
    contextMenu && !contextMenu.isClosing ? contextMenu.row : null;

  const activeTitleKey = getActiveTitleKey(
    entries,
    navExpanded ? null : focusedTile?.row ?? contextMenu?.row ?? null,
  );

  const showScrollFade = displayScrollOffset > 0;
  const scrollMask = showScrollFade
    ? `linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 1) ${SCROLL_FADE_RATIO * 100}%)`
    : undefined;

  return (
    <View style={styles.screen}>
      <View
        style={getHomeRevealStyle(
          countriesRevealed,
          getHomeStatusRevealDelayMs(),
        )}
        pointerEvents={countriesRevealed ? 'auto' : 'none'}
      >
        <SideNav
          activeSection={activeSection}
          onSectionChange={onSectionChange}
          onExpandedChange={setNavExpanded}
          onExitFocus={focusContent}
          tileFocusRef={focusedTileRef}
        />
      </View>
      <StatusGradient type={GRADIENT_STATE[connectionState]} />
      {isLoadingCountries && <HomeLoadingOverlay />}
      <View
        style={[
          styles.scrollLayer,
          {
            marginLeft: contentOffset,
            transitionProperty: 'margin-left',
            transitionDuration: `${SCROLL_DURATION}ms`,
            transitionTimingFunction: SCROLL_EASING,
          },
        ]}
        pointerEvents={countriesRevealed ? 'auto' : 'none'}
      >
        <View
          style={[
            styles.scrollViewport,
            scrollMask && {
              WebkitMaskImage: scrollMask,
              maskImage: scrollMask,
            },
          ]}
        >
          <View
            ref={scrollContentRef}
            style={[
              styles.scrollContent,
              {
                transform: [{ translateY: -displayScrollOffset }],
              },
            ]}
          >
            <View
              style={getHomeRevealStyle(
                countriesRevealed,
                getHomeStatusRevealDelayMs(),
              )}
            >
              <Status
                ref={contentFocusRef}
                state={connectionState}
                country={connectionTarget?.scrambleFrom ?? 'Norway'}
                protectedCountry={connectionTarget?.displayLabel ?? 'United Kingdom'}
                onQuickConnect={handleQuickConnect}
                onQuickConnectFocus={() => {
                  lastContentFocus.current = { type: 'button' };
                  focusedTileRef.current = null;
                  setFocusedTile(null);
                }}
                style={styles.statusBlock}
              />
            </View>
            <View style={styles.statusToTilesGap} />
            {showBanner && (
              <View
                style={[
                  styles.bannerContainer,
                  getHomeRevealStyle(
                    countriesRevealed,
                    getHomeStatusRevealDelayMs(),
                  ),
                ]}
              >
                <Image
                  source={freeUserBannerImage}
                  style={styles.bannerImage}
                  resizeMode="contain"
                  accessibilityRole="image"
                  accessibilityLabel="Access all countries with VPN Plus"
                />
              </View>
            )}
            <View style={styles.countrySection}>
              <View ref={gridContainerRef} style={styles.gridContainer}>
                {entries.map((entry) => {
                  if (entry.kind === 'title') {
                    return (
                      <View
                        key={entry.key}
                        style={[
                          styles.sectionTitle,
                          getHomeRevealStyle(
                            countriesRevealed,
                            getHomeTileRevealDelayMs(0, 0),
                          ),
                        ]}
                      >
                        <CountryGridTitle
                          label={entry.label}
                          selected={activeTitleKey === entry.key}
                        />
                      </View>
                    );
                  }

                  if (entry.kind === 'recents-row') {
                    return (
                      <View
                        key={entry.key}
                        data-logical-row={entry.logicalRowIndex}
                        style={getHomeRevealStyle(
                          countriesRevealed,
                          getHomeTileRevealDelayMs(entry.logicalRowIndex, 0),
                        )}
                      >
                        <CountryRow
                          rowIndex={entry.logicalRowIndex}
                          countries={recentsCountries}
                          countriesRevealed={countriesRevealed}
                          selected={
                            !navExpanded &&
                            (focusedTile?.row === entry.logicalRowIndex ||
                              contextMenu?.row === entry.logicalRowIndex)
                          }
                          activeTile={navExpanded ? null : activeTile}
                          connectionSourceTile={
                            connectionTarget?.sourceTile ?? null
                          }
                          connectionIntentKey={connectionIntentKey}
                          tileIntentKeys={recentsIntentKeys}
                          tileLabels={recentsLabels}
                          tileSubtitles={recentsSubtitles}
                          allowAllContextMenus
                          hideCityCount
                          connectionState={connectionState}
                          menuOpenOnRow={menuOpenRowIndex === entry.logicalRowIndex}
                          menuSourceCol={
                            menuOpenRowIndex === entry.logicalRowIndex
                              ? contextMenu?.col ?? null
                              : null
                          }
                          menuSource={menuSource}
                          shortPressPulse={shortPressPulse}
                          tileRefs={tileRefs}
                          onTileFocus={focusTile}
                          onTilePress={handleTileShortPress}
                          onTileLongPress={openContextMenu}
                        />
                      </View>
                    );
                  }

                  return (
                    <View
                      key={entry.key}
                      data-logical-row={entry.logicalRowIndex}
                      style={getHomeRevealStyle(
                        countriesRevealed,
                        getHomeTileRevealDelayMs(
                          entry.logicalRowIndex,
                          0,
                        ),
                      )}
                    >
                      <CountryRow
                        rowIndex={entry.logicalRowIndex}
                        countries={entry.countries}
                        countriesRevealed={countriesRevealed}
                        selected={
                          !navExpanded &&
                          (focusedTile?.row === entry.logicalRowIndex ||
                            contextMenu?.row === entry.logicalRowIndex)
                        }
                        activeTile={navExpanded ? null : activeTile}
                        connectionSourceTile={
                          connectionTarget?.sourceTile ?? null
                        }
                        connectionIntentKey={connectionIntentKey}
                        connectionState={connectionState}
                        menuOpenOnRow={
                          menuOpenRowIndex === entry.logicalRowIndex
                        }
                        menuSourceCol={
                          menuOpenRowIndex === entry.logicalRowIndex
                            ? contextMenu?.col ?? null
                            : null
                        }
                        menuSource={menuSource}
                        shortPressPulse={shortPressPulse}
                        hideCityCount={userType === USER_TYPES.FREE}
                        isPlusServerAtCol={(colIndex) =>
                          isPlusServerTile(
                            entry.countries[colIndex],
                            userType,
                            entry.section,
                          )
                        }
                        tileRefs={tileRefs}
                        onTileFocus={focusTile}
                        onTilePress={handleTileShortPress}
                        onTileLongPress={openContextMenu}
                      />
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        </View>
      </View>

      {contextMenu && !contextMenu.isClosing && (
        <Pressable
          style={styles.menuBackdrop}
          onPress={() => closeContextMenu()}
          accessibilityRole="button"
          accessibilityLabel="Close menu"
        />
      )}

      {contextMenu && contextMenuPosition && (
        <ContextMenu
          items={contextMenu.items}
          focusedIndex={contextMenu.focusedIndex}
          showItemFocus={contextMenu.showItemFocus}
          closing={contextMenu.isClosing}
          itemRefs={contextMenuItemRefs}
          onItemFocus={focusContextMenuItem}
          onItemSelect={handleContextMenuSelect}
          onOpenComplete={handleMenuOpenComplete}
          style={{
            position: 'absolute',
            left: contextMenuPosition.left,
            top: contextMenuPosition.top,
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    width: TV_WIDTH,
    height: TV_HEIGHT,
    backgroundColor: colors.backgroundDeep,
    overflow: 'visible',
  },
  scrollLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: TV_WIDTH,
    height: TV_HEIGHT,
    overflow: 'visible',
  },
  scrollViewport: {
    position: 'absolute',
    top: 0,
    left: -SHADOW_BLEED_LEFT,
    width: TV_WIDTH + SHADOW_BLEED_LEFT,
    height: TV_HEIGHT,
    overflow: 'hidden',
  },
  scrollContent: {
    position: 'relative',
    paddingLeft: SHADOW_BLEED_LEFT,
    overflow: 'visible',
  },
  statusBlock: {
    marginLeft: CONTENT_LEFT,
    marginTop: STATUS_TOP,
  },
  statusToTilesGap: {
    height: STATUS_TO_ROW_GAP,
  },
  bannerContainer: {
    marginLeft: CONTENT_LEFT,
    marginBottom: BANNER_BOTTOM_GAP,
    width: ROW_WIDTH,
    height: BANNER_HEIGHT,
  },
  bannerImage: {
    width: ROW_WIDTH,
    height: BANNER_HEIGHT,
  },
  countrySection: {
    marginLeft: CONTENT_LEFT,
    position: 'relative',
    overflow: 'visible',
  },
  gridContainer: {
    gap: ROW_GAP,
    overflow: 'visible',
  },
  sectionTitle: {
    height: GRID_TITLE_HEIGHT,
    justifyContent: 'center',
  },
  rows: {
    gap: ROW_GAP,
    overflow: 'visible',
  },
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
});

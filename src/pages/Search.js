import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../Styles/colors';
import { TV_HEIGHT, TV_WIDTH } from '../Styles/viewport';
import {
  CONTEXT_MENU_CLOSE_DURATION,
  SCROLL_DURATION,
  SCROLL_EASING,
} from '../Styles/motion';
import ContextMenu, { getContextMenuPosition } from '../components/ContextMenu';
import CountryRow, {
  ROW_GAP,
  ROW_WIDTH,
  TILE_GAP,
  TILE_HEIGHT,
  TILE_WIDTH,
} from '../components/CountryRow';
import CountryGridTitle, { GRID_TITLE_HEIGHT } from '../components/CountryGridTitle';
import SearchInput from '../components/SearchInput';
import SearchKeyboard, {
  SEARCH_BACKSPACE_INDEX,
  SEARCH_KEYBOARD_WIDTH,
  SEARCH_KEY_COUNT,
} from '../components/SearchKeyboard';
import SideNav, {
  NAV_COLLAPSED_WIDTH,
  NAV_EXPAND_DELTA,
} from '../components/SideNav';
import { getContextMenuItems } from '../data/cities';
import {
  buildIntentFromCountryTile,
  buildIntentFromMenuItem,
  buildMenuSelectionFromItem,
  isContextMenuItemActive,
  resolveMenuConnectionLabel,
  resolveTileConnectionLabel,
  withIntentKey,
} from '../utils/connection';
import {
  buildTileRefGrid,
  getCountryRowAt,
  getRowItemCount,
  getTargetColumn,
  isPlusServerTile,
  shouldAllowCountryContextMenu,
  shouldOpenUpsell,
} from '../utils/homeGrid';
import {
  buildSearchCountryRows,
  filterCountriesByPrefix,
} from '../utils/searchCountries';
import { shouldRecordRecentOnDisconnect, useRecents } from '../utils/recents';
import { USER_TYPES } from '../utils/userType';

const CONTENT_LEFT = 190;
const INPUT_TOP = 132;
const KEYBOARD_TOP = 227;
const TITLE_TOP = 366;
const RESULTS_TOP = 432;
const CONTENT_OFFSET_BASE = CONTENT_LEFT - NAV_COLLAPSED_WIDTH;
const SHADOW_BLEED_LEFT = 120;
const ENTER_LONG_PRESS_MS = 500;
const CONNECTION_DURATION_MS = 2000;

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function getSearchRowTops(totalRows) {
  return Array.from({ length: totalRows }, (_, index) =>
    RESULTS_TOP + index * (TILE_HEIGHT + ROW_GAP),
  );
}

function getSearchResultsScrollOffset(focusedRow, totalRows) {
  if (focusedRow == null || totalRows === 0) {
    return 0;
  }

  const rowStride = TILE_HEIGHT + ROW_GAP;
  const contentHeight = totalRows * rowStride - ROW_GAP;
  const viewportHeight = TV_HEIGHT - RESULTS_TOP;
  const maxScroll = Math.max(0, contentHeight - viewportHeight);

  if (maxScroll === 0) {
    return 0;
  }

  const rowTop = focusedRow * rowStride;
  const rowBottom = rowTop + TILE_HEIGHT;

  if (rowBottom > viewportHeight) {
    return Math.min(rowTop, maxScroll);
  }

  return 0;
}

export default function Search({
  activeSection = 'Search',
  onSectionChange = () => {},
  onNavigateToUpsell = () => {},
  upsellReturnFocus = null,
  onUpsellReturnFocusHandled = () => {},
  userType = USER_TYPES.PAID,
}) {
  const { recordDisconnect } = useRecents();

  const [navExpanded, setNavExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [focusZone, setFocusZone] = useState('keyboard');
  const [focusedKeyIndex, setFocusedKeyIndex] = useState(0);
  const [focusedTile, setFocusedTile] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [shortPressPulse, setShortPressPulse] = useState(null);
  const [connectionState, setConnectionState] = useState('unprotected');
  const [connectionTarget, setConnectionTarget] = useState(null);
  const [resultsScrollOffset, setResultsScrollOffset] = useState(0);

  const tileFocusRef = useRef(null);
  const focusedKeyIndexRef = useRef(0);
  const focusZoneRef = useRef('keyboard');
  const focusedTileRef = useRef(null);
  const keyRefs = useRef(Array(SEARCH_KEY_COUNT).fill(null));
  const tileRefs = useRef([]);
  const contextMenuItemRefs = useRef([]);
  const connectTimeoutRef = useRef(null);
  const connectionStateRef = useRef('unprotected');
  const connectionTargetRef = useRef(null);
  const lastTilePressAtRef = useRef(0);
  const enterLongPressFired = useRef(false);
  const enterTimerRef = useRef(null);
  const awaitingEnterKeyUpRef = useRef(false);
  const pendingMenuFocusRef = useRef(false);
  const queryRef = useRef('');

  const filteredCountries = useMemo(
    () => filterCountriesByPrefix(query),
    [query],
  );
  const countryRows = useMemo(
    () => buildSearchCountryRows(filteredCountries),
    [filteredCountries],
  );
  const totalRows = countryRows.length;
  const rowTops = useMemo(() => getSearchRowTops(totalRows), [totalRows]);
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

  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  useEffect(() => {
    focusZoneRef.current = focusZone;
  }, [focusZone]);

  useEffect(() => {
    focusedKeyIndexRef.current = focusedKeyIndex;
  }, [focusedKeyIndex]);

  useEffect(() => {
    tileFocusRef.current =
      focusZone === 'results' ? focusedTileRef.current : null;
  }, [focusZone, focusedTile]);

  const focusKeyboard = useCallback((index = 0) => {
    const nextIndex = Math.max(0, Math.min(SEARCH_KEY_COUNT - 1, index));
    focusedKeyIndexRef.current = nextIndex;
    focusZoneRef.current = 'keyboard';
    focusedTileRef.current = null;

    setFocusZone('keyboard');
    setFocusedKeyIndex(nextIndex);
    setFocusedTile(null);

    requestAnimationFrame(() => {
      keyRefs.current[nextIndex]?.focus?.({ preventScroll: true });
    });
  }, []);

  const focusTile = useCallback((rowIndex, colIndex) => {
    const next = { row: rowIndex, col: colIndex };
    focusedTileRef.current = next;
    focusZoneRef.current = 'results';

    setFocusZone('results');
    setFocusedTile(next);

    requestAnimationFrame(() => {
      tileRefs.current[rowIndex]?.[colIndex]?.focus?.({ preventScroll: true });
    });
  }, []);

  useEffect(() => {
    tileRefs.current = buildTileRefGrid(countryRows);

    const focused = focusedTileRef.current;
    if (!focused || focusZoneRef.current !== 'results') {
      return;
    }

    const maxCol = getRowItemCount(countryRows, focused.row) - 1;
    if (focused.row >= totalRows || focused.col > maxCol) {
      if (totalRows > 0) {
        focusTile(Math.min(focused.row, totalRows - 1), Math.min(focused.col, maxCol));
      } else {
        focusKeyboard(focusedKeyIndexRef.current);
      }
    }
  }, [countryRows, focusKeyboard, focusTile, totalRows]);

  const releaseContentFocus = useCallback(() => {
    if (focusZoneRef.current === 'keyboard') {
      keyRefs.current[focusedKeyIndexRef.current]?.blur?.();
      return;
    }

    tileRefs.current[focusedTileRef.current?.row ?? 0]?.[
      focusedTileRef.current?.col ?? 0
    ]?.blur?.();
    focusedTileRef.current = null;
    setFocusedTile(null);
  }, []);

  const handleExitNavFocus = useCallback(() => {
    if (focusZoneRef.current === 'results' && focusedTileRef.current) {
      focusTile(focusedTileRef.current.row, focusedTileRef.current.col);
      return;
    }

    focusKeyboard(focusedKeyIndexRef.current);
  }, [focusKeyboard, focusTile]);

  const appendLetter = useCallback((letter) => {
    setQuery((current) => current + letter);
  }, []);

  const deleteLastLetter = useCallback(() => {
    setQuery((current) => current.slice(0, -1));
  }, []);

  const handleKeyboardKeyPress = useCallback(
    (index) => {
      if (index === SEARCH_BACKSPACE_INDEX) {
        deleteLastLetter();
        return;
      }

      const letter = LETTERS[index];
      const nextLetter =
        queryRef.current.length >= 1 ? letter.toLowerCase() : letter;
      appendLetter(nextLetter);
    },
    [appendLetter, deleteLastLetter],
  );

  const closeContextMenu = useCallback((returnTo) => {
    setContextMenu((current) => {
      if (!current || current.isClosing) {
        return current;
      }

      const target = returnTo ?? { row: current.row, col: current.col };

      focusedTileRef.current = target;
      setFocusedTile(target);
      focusZoneRef.current = 'results';

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

      if (!rowData) {
        return;
      }

      const country = rowData.countries[colIndex];

      if (!shouldAllowCountryContextMenu(country, userType, rowData.section)) {
        return;
      }

      const baseItems = getContextMenuItems(country.name);
      const currentTarget = connectionTargetRef.current;
      const currentState = connectionStateRef.current;
      const items = baseItems.map((item) => ({
        ...item,
        isActive: isContextMenuItemActive(
          item,
          country,
          currentTarget,
          currentState,
        ),
      }));

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
    (displayLabel, sourceTile, intent, menuSelection = null) => {
      clearConnectionTimeout();

      const currentState = connectionStateRef.current;
      const currentTarget = connectionTargetRef.current;

      if (shouldRecordRecentOnDisconnect(currentState === 'protected', currentTarget)) {
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
        menuSelection,
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
    const currentTarget = connectionTargetRef.current;

    clearConnectionTimeout();
    connectionStateRef.current = 'unprotected';
    connectionTargetRef.current = null;
    setConnectionState('unprotected');
    setConnectionTarget(null);

    if (shouldRecordRecentOnDisconnect(wasProtected, currentTarget)) {
      recordDisconnect(currentTarget.intent);
    }
  }, [clearConnectionTimeout, recordDisconnect]);

  const getTileIntentKey = useCallback(
    (rowIndex, colIndex) => {
      const rowData = getCountryRowAt(countryRows, rowIndex);
      const country = rowData?.countries?.[colIndex];

      if (!country) {
        return null;
      }

      return withIntentKey(buildIntentFromCountryTile(country)).intentKey;
    },
    [countryRows],
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
      const country = rowData?.countries?.[colIndex];

      if (!country) {
        return;
      }

      if (shouldOpenUpsell(country, userType, rowData.section)) {
        onNavigateToUpsell({
          type: 'tile',
          row: rowIndex,
          col: colIndex,
          countryName: country.name,
          section: 'Search',
        });
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
      resetConnection,
      startConnection,
      triggerShortPress,
      userType,
    ],
  );

  const handleContextMenuSelect = useCallback(
    (index, item) => {
      if (!contextMenu || contextMenu.isClosing || !contextMenu.isReady) {
        return;
      }

      const { row, col } = contextMenu;
      const rowData = getCountryRowAt(countryRows, row);
      const country = rowData?.countries?.[col];

      const currentTarget = connectionTargetRef.current;
      const currentState = connectionStateRef.current;

      if (isContextMenuItemActive(item, country, currentTarget, currentState)) {
        closeContextMenu();
        resetConnection();
        return;
      }

      const intent = withIntentKey(buildIntentFromMenuItem(country, item));
      const displayLabel = resolveMenuConnectionLabel(country.name, item);
      const menuSelection = buildMenuSelectionFromItem(item);

      closeContextMenu();
      startConnection(displayLabel, { row, col }, intent, menuSelection);
    },
    [closeContextMenu, contextMenu, countryRows, resetConnection, startConnection],
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

  const clearEnterTimer = useCallback(() => {
    if (enterTimerRef.current) {
      clearTimeout(enterTimerRef.current);
      enterTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (query.length === 0 && focusZoneRef.current === 'results') {
      focusKeyboard(focusedKeyIndexRef.current);
    }
  }, [focusKeyboard, query.length]);

  useEffect(() => {
    if (focusZone === 'results' && focusedTile) {
      setResultsScrollOffset(
        getSearchResultsScrollOffset(focusedTile.row, totalRows),
      );
    }
  }, [focusZone, focusedTile, totalRows]);

  useEffect(() => {
    requestAnimationFrame(() => focusKeyboard(0));
  }, [focusKeyboard]);

  useEffect(() => {
    if (!upsellReturnFocus) {
      return undefined;
    }

    const timer = setTimeout(() => {
      focusTile(upsellReturnFocus.row, upsellReturnFocus.col);
      onUpsellReturnFocusHandled();
    }, 150);

    return () => clearTimeout(timer);
  }, [focusTile, onUpsellReturnFocusHandled, upsellReturnFocus]);

  useEffect(() => () => clearConnectionTimeout(), [clearConnectionTimeout]);

  useEffect(() => {
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

      if (event.key === 'Backspace') {
        if (queryRef.current.length > 0) {
          deleteLastLetter();
        } else {
          onSectionChange('Home');
        }
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }

      if (focusZoneRef.current === 'keyboard') {
        const keyIndex = focusedKeyIndexRef.current;

        if (event.key === 'ArrowLeft' && keyIndex > 0) {
          focusKeyboard(keyIndex - 1);
          event.preventDefault();
          return;
        }

        if (event.key === 'ArrowRight' && keyIndex < SEARCH_KEY_COUNT - 1) {
          focusKeyboard(keyIndex + 1);
          event.preventDefault();
          return;
        }

        if (event.key === 'ArrowDown' && queryRef.current.length > 0 && totalRows > 0) {
          focusTile(0, 0);
          event.preventDefault();
          return;
        }

        if (event.key === 'Enter') {
          handleKeyboardKeyPress(keyIndex);
          event.preventDefault();
          return;
        }

        if (/^[a-z]$/i.test(event.key)) {
          const letter =
            queryRef.current.length >= 1
              ? event.key.toLowerCase()
              : event.key.toUpperCase();
          appendLetter(letter);
          event.preventDefault();
          return;
        }

        return;
      }

      const focusedTileState = focusedTileRef.current;
      if (!focusedTileState) {
        return;
      }

      if (event.key === 'Enter') {
        if (!enterTimerRef.current) {
          enterLongPressFired.current = false;
          const rowData = getCountryRowAt(countryRows, focusedTileState.row);
          const canOpenMenu = shouldAllowCountryContextMenu(
            rowData?.countries?.[focusedTileState.col],
            userType,
            rowData?.section,
          );

          if (canOpenMenu) {
            enterTimerRef.current = setTimeout(() => {
              enterLongPressFired.current = true;
              enterTimerRef.current = null;
              openCountryContextMenu(
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

      if (event.key === 'ArrowUp' && focusedTileState.row === 0) {
        focusKeyboard(focusedKeyIndexRef.current);
        event.preventDefault();
        return;
      }

      if (event.key === 'ArrowDown' && focusedTileState.row < totalRows - 1) {
        const nextRow = focusedTileState.row + 1;
        focusTile(nextRow, getTargetColumn(focusedTileState.col, nextRow, countryRows));
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }

      if (event.key === 'ArrowUp' && focusedTileState.row > 0) {
        const prevRow = focusedTileState.row - 1;
        focusTile(prevRow, getTargetColumn(focusedTileState.col, prevRow, countryRows));
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }

      if (
        event.key === 'ArrowRight' &&
        focusedTileState.col < getRowItemCount(countryRows, focusedTileState.row) - 1
      ) {
        focusTile(focusedTileState.row, focusedTileState.col + 1);
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }

      if (event.key === 'ArrowLeft' && focusedTileState.col > 0) {
        focusTile(focusedTileState.row, focusedTileState.col - 1);
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }

      if (event.key === 'ArrowLeft') {
        focusedTileRef.current = null;
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

      if (focusZoneRef.current === 'keyboard') {
        if (event.key === 'Enter') {
          clearEnterTimer();
          enterLongPressFired.current = false;
        }
        return;
      }

      if (!focusedTileRef.current) {
        return;
      }

      if (event.key === 'Enter') {
        const wasShortPress = !enterLongPressFired.current;
        clearEnterTimer();
        enterLongPressFired.current = false;

        if (wasShortPress) {
          handleTileShortPress(
            focusedTileRef.current.row,
            focusedTileRef.current.col,
          );
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
    appendLetter,
    clearEnterTimer,
    closeContextMenu,
    contextMenu,
    countryRows,
    deleteLastLetter,
    focusContextMenuItem,
    focusKeyboard,
    focusTile,
    handleContextMenuSelect,
    handleKeyboardKeyPress,
    handleTileShortPress,
    navExpanded,
    onSectionChange,
    openCountryContextMenu,
    totalRows,
    userType,
  ]);

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
      contentLeft: CONTENT_OFFSET_BASE,
      scrollOffset: resultsScrollOffset,
      tileWidth: TILE_WIDTH,
      tileGap: TILE_GAP,
      rowTops,
    });
  }, [contextMenu, contentOffset, resultsScrollOffset, rowTops]);

  const menuSource =
    contextMenu && !contextMenu.isClosing
      ? { row: contextMenu.row, col: contextMenu.col }
      : null;

  const menuOpenRowIndex =
    contextMenu && !contextMenu.isClosing ? contextMenu.row : null;

  const resultsTitleLabel =
    totalRows > 0 ? 'Search results' : 'No results';

  return (
    <View style={styles.screen}>
      <SideNav
        activeSection={activeSection}
        onSectionChange={onSectionChange}
        onExpandedChange={setNavExpanded}
        onExitFocus={handleExitNavFocus}
        tileFocusRef={tileFocusRef}
      />

      <View
        style={[
          styles.contentLayer,
          {
            marginLeft: contentOffset,
            transitionProperty: 'margin-left',
            transitionDuration: `${SCROLL_DURATION}ms`,
            transitionTimingFunction: SCROLL_EASING,
          },
        ]}
      >
        <SearchInput query={query} style={styles.input} />

        <SearchKeyboard
          focusedIndex={focusedKeyIndex}
          useLowercase={query.length >= 1}
          selected={focusZone === 'keyboard'}
          keyRefs={keyRefs}
          onKeyPress={handleKeyboardKeyPress}
          onKeyFocus={(index) => {
            focusedKeyIndexRef.current = index;
            setFocusedKeyIndex(index);
            setFocusZone('keyboard');
          }}
          style={styles.keyboard}
        />

      </View>

      {query.length > 0 && (
        <View
          style={[
            styles.resultsLayer,
            {
              marginLeft: contentOffset,
              transitionProperty: 'margin-left',
              transitionDuration: `${SCROLL_DURATION}ms`,
              transitionTimingFunction: SCROLL_EASING,
            },
          ]}
          pointerEvents="box-none"
        >
          <View style={styles.resultsViewport}>
            <View
              style={[
                styles.resultsContent,
                {
                  transform: [{ translateY: -resultsScrollOffset }],
                },
              ]}
            >
              <CountryGridTitle
                label={resultsTitleLabel}
                selected={focusZone === 'results'}
                style={styles.resultsTitle}
              />
              <View style={styles.resultsRows}>
                {countryRows.map((row) => (
                  <View
                    key={row.logicalRowIndex}
                    data-logical-row={row.logicalRowIndex}
                    style={styles.resultRow}
                  >
                    <CountryRow
                      rowIndex={row.logicalRowIndex}
                      countries={row.countries}
                      selected={
                        !navExpanded &&
                        (focusedTile?.row === row.logicalRowIndex ||
                          contextMenu?.row === row.logicalRowIndex)
                      }
                      activeTile={navExpanded ? null : activeTile}
                      connectionSourceTile={connectionTarget?.sourceTile ?? null}
                      connectionIntentKey={connectionIntentKey}
                      connectionState={connectionState}
                      menuOpenOnRow={menuOpenRowIndex === row.logicalRowIndex}
                      menuSourceCol={
                        menuOpenRowIndex === row.logicalRowIndex
                          ? contextMenu?.col ?? null
                          : null
                      }
                      menuSource={menuSource}
                      shortPressPulse={shortPressPulse}
                      hideCityCount={userType === USER_TYPES.FREE}
                      isPlusServerAtCol={(colIndex) =>
                        isPlusServerTile(
                          row.countries[colIndex],
                          userType,
                          row.section,
                        )
                      }
                      tileRefs={tileRefs}
                      onTileFocus={focusTile}
                      onTilePress={handleTileShortPress}
                      onTileLongPress={openCountryContextMenu}
                    />
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>
      )}

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
          onItemFocus={focusContextMenuItem}
          onItemSelect={handleContextMenuSelect}
          onOpenComplete={handleMenuOpenComplete}
          itemRefs={contextMenuItemRefs}
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
  contentLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: TV_WIDTH,
    height: TV_HEIGHT,
    overflow: 'visible',
  },
  input: {
    position: 'absolute',
    left: CONTENT_OFFSET_BASE,
    top: INPUT_TOP,
  },
  keyboard: {
    position: 'absolute',
    left: (TV_WIDTH - SEARCH_KEYBOARD_WIDTH) / 2,
    top: KEYBOARD_TOP,
  },
  resultsLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: TV_WIDTH,
    height: TV_HEIGHT,
    overflow: 'visible',
  },
  resultsViewport: {
    position: 'absolute',
    top: TITLE_TOP,
    left: -SHADOW_BLEED_LEFT,
    width: TV_WIDTH + SHADOW_BLEED_LEFT,
    maxHeight: TV_HEIGHT - TITLE_TOP,
    overflow: 'hidden',
  },
  resultsContent: {
    paddingLeft: SHADOW_BLEED_LEFT,
    overflow: 'visible',
  },
  resultsTitle: {
    marginLeft: CONTENT_OFFSET_BASE,
    width: ROW_WIDTH,
    height: GRID_TITLE_HEIGHT,
  },
  resultsRows: {
    marginLeft: CONTENT_OFFSET_BASE,
    marginTop: RESULTS_TOP - TITLE_TOP - GRID_TITLE_HEIGHT,
    gap: ROW_GAP,
    overflow: 'visible',
  },
  resultRow: {
    width: ROW_WIDTH,
    overflow: 'visible',
  },
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
});

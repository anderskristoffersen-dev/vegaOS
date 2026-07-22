import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../Styles/colors';
import { TV_HEIGHT, TV_WIDTH } from '../Styles/viewport';
import {
  CONTEXT_MENU_CLOSE_DURATION,
  CONTEXT_MENU_EASING,
  CONTEXT_MENU_OPEN_DURATION,
} from '../Styles/motion';
import ContextMenuItem, {
  CONTEXT_MENU_ITEM_GAP,
  CONTEXT_MENU_ITEM_HEIGHT,
} from './ContextMenuItem';

export const CONTEXT_MENU_WIDTH = 400;
export const CONTEXT_MENU_PADDING = 12;
export const CONTEXT_MENU_MAX_HEIGHT = 660;
export const CONTEXT_MENU_TILE_GAP = 24;
export const CONTEXT_MENU_EDGE_MARGIN = 100;
export const CONTEXT_MENU_FADE_RATIO = 0.15;

const FLAG_CENTER_Y = 32 + 70;

export function getMenuListHeight(itemCount) {
  return (
    itemCount * CONTEXT_MENU_ITEM_HEIGHT +
    (itemCount - 1) * CONTEXT_MENU_ITEM_GAP
  );
}

export function getMenuMetrics(itemCount) {
  const listHeight = getMenuListHeight(itemCount);
  const totalHeight = listHeight + CONTEXT_MENU_PADDING * 2;
  const menuHeight = Math.min(totalHeight, CONTEXT_MENU_MAX_HEIGHT);
  const listViewportHeight = menuHeight - CONTEXT_MENU_PADDING * 2;
  const overflows = listHeight > listViewportHeight;
  const visibleCount = overflows
    ? Math.floor(
        (listViewportHeight + CONTEXT_MENU_ITEM_GAP) /
          (CONTEXT_MENU_ITEM_HEIGHT + CONTEXT_MENU_ITEM_GAP),
      )
    : itemCount;

  return {
    menuHeight,
    listHeight,
    listViewportHeight,
    overflows,
    visibleCount,
  };
}

export function getMenuScrollOffset(focusedIndex, itemCount) {
  const { listHeight, listViewportHeight, overflows, visibleCount } =
    getMenuMetrics(itemCount);

  if (!overflows) {
    return 0;
  }

  const maxScroll = listHeight - listViewportHeight;
  const itemStride = CONTEXT_MENU_ITEM_HEIGHT + CONTEXT_MENU_ITEM_GAP;

  if (focusedIndex === itemCount - 1) {
    return getMenuScrollOffset(itemCount - 2, itemCount);
  }

  if (focusedIndex <= visibleCount - 2) {
    return 0;
  }

  const targetScroll = (focusedIndex - (visibleCount - 2)) * itemStride;
  return Math.min(targetScroll, maxScroll);
}

export function getContextMenuPosition({
  row,
  col,
  itemCount,
  contentOffset,
  contentLeft,
  scrollOffset,
  tileWidth,
  tileGap,
  rowTops,
}) {
  const { menuHeight } = getMenuMetrics(itemCount);
  const tileX = contentOffset + contentLeft + col * (tileWidth + tileGap);
  const tileY = rowTops[row] - scrollOffset;
  const flagCenterY = tileY + FLAG_CENTER_Y;

  let left =
    col < 3
      ? tileX + tileWidth + CONTEXT_MENU_TILE_GAP
      : tileX - CONTEXT_MENU_WIDTH - CONTEXT_MENU_TILE_GAP;

  left = Math.max(
    CONTEXT_MENU_EDGE_MARGIN,
    Math.min(left, TV_WIDTH - CONTEXT_MENU_EDGE_MARGIN - CONTEXT_MENU_WIDTH),
  );

  let top = flagCenterY - menuHeight / 2;
  top = Math.max(
    CONTEXT_MENU_EDGE_MARGIN,
    Math.min(top, TV_HEIGHT - CONTEXT_MENU_EDGE_MARGIN - menuHeight),
  );

  return { left, top, menuHeight };
}

export default function ContextMenu({
  items = [],
  focusedIndex = -1,
  showItemFocus = false,
  closing = false,
  onItemFocus,
  onItemSelect,
  onOpenComplete,
  itemRefs,
  style,
}) {
  const [entered, setEntered] = useState(false);
  const enterTimeoutRef = useRef(null);

  const metrics = useMemo(() => getMenuMetrics(items.length), [items.length]);
  const fadeHeight = metrics.menuHeight * CONTEXT_MENU_FADE_RATIO;
  const effectiveFocusedIndex = showItemFocus ? focusedIndex : -1;
  const listScrollOffset = useMemo(
    () => getMenuScrollOffset(effectiveFocusedIndex, items.length),
    [effectiveFocusedIndex, items.length],
  );
  const maxScroll = Math.max(0, metrics.listHeight - metrics.listViewportHeight);

  useEffect(() => {
    enterTimeoutRef.current = requestAnimationFrame(() => setEntered(true));

    return () => {
      if (enterTimeoutRef.current) {
        cancelAnimationFrame(enterTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (closing) {
      setEntered(false);
    }
  }, [closing]);

  useEffect(() => {
    if (!entered || closing) {
      return undefined;
    }

    const timeout = setTimeout(() => {
      onOpenComplete?.();
    }, CONTEXT_MENU_OPEN_DURATION);

    return () => clearTimeout(timeout);
  }, [closing, entered, onOpenComplete]);

  const showTopFade = metrics.overflows && listScrollOffset > 0;
  const showBottomFade =
    metrics.overflows && listScrollOffset < maxScroll - 0.5;

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.container,
        {
          height: metrics.menuHeight,
          opacity: entered && !closing ? 1 : 0,
          transform: [{ scale: entered && !closing ? 1 : 0.9 }],
          transitionProperty: 'opacity, transform',
          transitionDuration: closing
            ? `${CONTEXT_MENU_CLOSE_DURATION}ms`
            : `${CONTEXT_MENU_OPEN_DURATION}ms`,
          transitionTimingFunction: CONTEXT_MENU_EASING,
        },
        style,
      ]}
    >
      <View style={[styles.listViewport, { height: metrics.listViewportHeight }]}>
        <View
          style={[
            styles.listContent,
            {
              transform: [{ translateY: -listScrollOffset }],
            },
          ]}
        >
          {items.map((item, index) => (
            <ContextMenuItem
              key={`${item.label}-${index}`}
              ref={(node) => {
                if (itemRefs?.current) {
                  itemRefs.current[index] = node;
                }
              }}
              label={item.label}
              icon={item.icon}
              index={index}
              focused={showItemFocus && focusedIndex === index}
              showActiveDot={item.isActive ?? false}
              animateIn={entered}
              closing={closing}
              hasTVPreferredFocus={false}
              onPress={() => onItemSelect?.(index, item)}
              onFocus={() => onItemFocus?.(index)}
            />
          ))}
        </View>

        {showTopFade && (
          <View
            pointerEvents="none"
            style={[
              styles.fadeOverlay,
              styles.fadeTop,
              {
                height: fadeHeight,
                backgroundImage: `linear-gradient(to top, rgba(59, 55, 71, 0) 0%, ${colors.backgroundNorm} 100%)`,
              },
            ]}
          />
        )}

        {showBottomFade && (
          <View
            pointerEvents="none"
            style={[
              styles.fadeOverlay,
              styles.fadeBottom,
              {
                height: fadeHeight,
                backgroundImage: `linear-gradient(to bottom, rgba(59, 55, 71, 0) 0%, ${colors.backgroundNorm} 100%)`,
              },
            ]}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CONTEXT_MENU_WIDTH,
    backgroundColor: colors.backgroundNorm,
    borderRadius: 46,
    padding: CONTEXT_MENU_PADDING,
    overflow: 'hidden',
    zIndex: 30,
  },
  listViewport: {
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  listContent: {
    gap: CONTEXT_MENU_ITEM_GAP,
    overflow: 'visible',
  },
  fadeOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 2,
  },
  fadeTop: {
    top: 0,
  },
  fadeBottom: {
    bottom: 0,
  },
});

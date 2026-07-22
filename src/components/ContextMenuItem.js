import { forwardRef } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../Styles/colors';
import {
  CONTEXT_MENU_CLOSE_DURATION,
  CONTEXT_MENU_EASING,
  CONTEXT_MENU_ITEM_BASE_DELAY,
  CONTEXT_MENU_ITEM_DRIFT,
  CONTEXT_MENU_ITEM_DURATION,
  CONTEXT_MENU_ITEM_STEP_DELAY,
} from '../Styles/motion';

import boltIcon from '../assets/context-menu/ic-bolt-filled.svg?raw';
import swapIcon from '../assets/context-menu/ic-arrows-swap-right.svg?raw';
import mapPinIcon from '../assets/context-menu/ic-map-pin.svg?raw';
import pinIcon from '../assets/context-menu/ic-pin-filled.svg?raw';
import pinSlashIcon from '../assets/context-menu/ic-pin-slash-filled.svg?raw';
import trashIcon from '../assets/context-menu/ic-trash-cross-filled.svg?raw';

const ICONS = {
  fastest: boltIcon,
  random: swapIcon,
  city: mapPinIcon,
  pin: pinIcon,
  'pin-slash': pinSlashIcon,
  trash: trashIcon,
};

export const CONTEXT_MENU_ITEM_HEIGHT = 76;
export const CONTEXT_MENU_ITEM_GAP = 8;

function MenuIcon({ icon, focused }) {
  const color = focused ? colors.textInvert : colors.textNorm;
  const svg = ICONS[icon].replaceAll('currentColor', color);

  return (
    <Image
      source={{
        uri: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
      }}
      style={styles.icon}
      resizeMode="contain"
      accessibilityRole="image"
    />
  );
}

export default forwardRef(function ContextMenuItem(
  {
    label = 'Menu item',
    icon = 'city',
    focused = false,
    index = 0,
    animateIn = false,
    closing = false,
    onPress,
    onFocus,
    onBlur,
    hasTVPreferredFocus = false,
  },
  ref,
) {
  const showEnterAnimation = animateIn && !closing;
  const itemDelay = CONTEXT_MENU_ITEM_BASE_DELAY + index * CONTEXT_MENU_ITEM_STEP_DELAY;

  return (
    <Pressable
      ref={ref}
      focusable
      hasTVPreferredFocus={hasTVPreferredFocus}
      onPress={onPress}
      onFocus={onFocus}
      onBlur={onBlur}
      style={styles.item}
    >
      {focused && <View pointerEvents="none" style={styles.focusBackground} />}
      <View
        style={[
          styles.content,
          {
            opacity: closing ? 0 : showEnterAnimation ? 1 : 0,
            transform: [
              {
                translateY: closing ? 0 : showEnterAnimation ? 0 : CONTEXT_MENU_ITEM_DRIFT,
              },
            ],
            transitionProperty: 'opacity, transform',
            transitionDuration: closing
              ? `${CONTEXT_MENU_CLOSE_DURATION}ms`
              : `${CONTEXT_MENU_ITEM_DURATION}ms`,
            transitionTimingFunction: CONTEXT_MENU_EASING,
            transitionDelay: closing ? '0ms' : `${itemDelay}ms`,
          },
        ]}
      >
        <MenuIcon icon={icon} focused={focused} />
        <Text
          style={[styles.label, { color: focused ? colors.textInvert : colors.textNorm }]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  item: {
    width: 376,
    minHeight: CONTEXT_MENU_ITEM_HEIGHT,
    borderRadius: 100,
    overflow: 'hidden',
    position: 'relative',
  },
  focusBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.backgroundSelected,
    mixBlendMode: 'lighten',
    borderRadius: 100,
  },
  content: {
    minHeight: CONTEXT_MENU_ITEM_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 32,
    paddingVertical: 20,
  },
  icon: {
    width: 32,
    height: 32,
    flexShrink: 0,
  },
  label: {
    flex: 1,
    fontSize: 29,
    fontWeight: '400',
    lineHeight: 36,
  },
});

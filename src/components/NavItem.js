import { createElement, forwardRef } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../Styles/colors';
import { selectionShadow } from '../Styles/selectionshadow';

import houseOutline from '../assets/icons/ic-house.svg?raw';
import houseFilled from '../assets/icons/ic-house-filled.svg?raw';
import magnifier from '../assets/icons/ic-magnifier.svg?raw';
import cogOutline from '../assets/icons/ic-cog-wheel.svg?raw';
import cogFilled from '../assets/icons/ic-cog-wheel-filled.svg?raw';

const SECTION_LABELS = {
  Home: 'Home',
  Search: 'Search',
  Settings: 'Settings',
};

const ACTIVE_BACKGROUND = 'rgba(216, 215, 223, 0.16)';

function getIconSvg(section, expanded, isPageActive) {
  if (section === 'Home') {
    return expanded || isPageActive ? houseFilled : houseOutline;
  }

  if (section === 'Search') {
    return magnifier;
  }

  return expanded ? cogOutline : isPageActive ? cogFilled : cogOutline;
}

function getIconColor(isFocused, isPageActive) {
  if (isFocused) {
    return colors.textInvert;
  }

  if (isPageActive) {
    return colors.textNorm;
  }

  return colors.textWeak;
}

function NavIcon({ section, expanded, isPageActive, isFocused }) {
  const iconColor = getIconColor(isFocused, isPageActive);
  const svg = getIconSvg(section, expanded, isPageActive).replaceAll(
    'currentColor',
    iconColor,
  );

  return createElement('img', {
    src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    width: 36,
    height: 36,
    alt: '',
    style: {
      display: 'block',
      flexShrink: 0,
    },
  });
}

export default forwardRef(function NavItem(
  {
    section,
    expanded = false,
    isPageActive = false,
    isFocused = false,
    onPress,
    onFocus,
    onBlur,
    hasTVPreferredFocus = false,
  },
  ref,
) {
  const showLabel = expanded;
  const labelColor = isFocused ? colors.textInvert : colors.textWeak;

  return (
    <Pressable
      ref={ref}
      focusable
      hasTVPreferredFocus={hasTVPreferredFocus}
      onPress={onPress}
      onFocus={onFocus}
      onBlur={onBlur}
      style={[
        styles.item,
        expanded ? styles.itemExpanded : styles.itemCollapsed,
        isPageActive && !isFocused && expanded && styles.itemActive,
        isFocused && expanded && styles.itemFocused,
        isFocused && expanded && selectionShadow,
      ]}
    >
      <NavIcon
        section={section}
        expanded={expanded}
        isPageActive={isPageActive}
        isFocused={isFocused}
      />
      {showLabel && (
        <Text style={[styles.label, { color: labelColor }]}>
          {SECTION_LABELS[section]}
        </Text>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  itemCollapsed: {
    padding: 24,
    borderRadius: 8,
  },
  itemExpanded: {
    paddingHorizontal: 32,
    paddingVertical: 24,
    borderRadius: 100,
    gap: 24,
  },
  itemActive: {
    backgroundColor: ACTIVE_BACKGROUND,
  },
  itemFocused: {
    backgroundColor: colors.backgroundSelected,
  },
  label: {
    fontSize: 29,
    fontWeight: '700',
    lineHeight: 36,
    width: 200,
  },
});

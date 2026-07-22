import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Button from '../components/Button';
import ContextMenuItem from '../components/ContextMenuItem';
import CountryTile from '../components/CountryTile';
import Menu from '../components/Menu';
import NavItem from '../components/NavItem';
import Status from '../components/Status';
import { COUNTRIES } from '../data/countries';
import ButtonComponentPage from './component-library/ButtonComponentPage';
import { colors } from '../Styles/colors';
import { TV_HEIGHT, TV_WIDTH } from '../Styles/viewport';

import menuIcon from '../assets/context-menu/ic-placeholder.svg?raw';

const COMPONENT_ENTRIES = [
  { id: 'button', label: 'Button' },
  { id: 'context-menu-item', label: 'ContextMenuItem' },
  { id: 'country-tile', label: 'CountryTile' },
  { id: 'menu', label: 'Menu' },
  { id: 'nav-item', label: 'NavItem' },
  { id: 'status', label: 'Status' },
].sort((a, b) => a.label.localeCompare(b.label));

const DEMO_COUNTRY = COUNTRIES.find((country) => country.name === 'Norway') ?? COUNTRIES[0];

function FocusableContextMenuItemDemo() {
  const [focused, setFocused] = useState(true);

  return (
    <ContextMenuItem
      label="Menu item"
      icon="city"
      focused={focused}
      animateIn
      hasTVPreferredFocus
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

function FocusableNavItemDemo() {
  const [focused, setFocused] = useState(true);

  return (
    <NavItem
      section="Home"
      expanded
      isPageActive
      isFocused={focused}
      hasTVPreferredFocus
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

function ComponentPreview({ componentId }) {
  switch (componentId) {
    case 'button':
      return <ButtonComponentPage />;
    case 'context-menu-item':
      return <FocusableContextMenuItemDemo />;
    case 'country-tile':
      return (
        <CountryTile
          label={DEMO_COUNTRY.name}
          flag={DEMO_COUNTRY.flag}
          cityCount={DEMO_COUNTRY.cities.length}
          isActiveTile
          hasTVPreferredFocus
        />
      );
    case 'menu':
      return (
        <Menu label="Menu item label" icon={menuIcon} hasTVPreferredFocus />
      );
    case 'nav-item':
      return <FocusableNavItemDemo />;
    case 'status':
      return <Status state="unprotected" />;
    default:
      return null;
  }
}

function ComponentDetailView({ componentId }) {
  return (
    <View style={styles.detailScreen}>
      <View style={styles.previewStage}>
        <ComponentPreview componentId={componentId} />
      </View>
    </View>
  );
}

export default function ComponentLibrary({ onBack }) {
  const [selectedComponentId, setSelectedComponentId] = useState(null);

  const handleOpenComponent = useCallback((componentId) => {
    setSelectedComponentId(componentId);
  }, []);

  const handleCloseComponent = useCallback(() => {
    setSelectedComponentId(null);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== 'Escape' && event.key !== 'Backspace') {
        return;
      }

      event.preventDefault();

      if (selectedComponentId) {
        handleCloseComponent();
        return;
      }

      onBack?.();
    };

    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [handleCloseComponent, onBack, selectedComponentId]);

  const selectedComponent = COMPONENT_ENTRIES.find(
    (entry) => entry.id === selectedComponentId,
  );

  if (selectedComponent) {
    return <ComponentDetailView componentId={selectedComponent.id} />;
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Component library</Text>

      <View style={styles.list}>
        {COMPONENT_ENTRIES.map((entry, index) => (
          <Button
            key={entry.id}
            buttonText={entry.label}
            hasTVPreferredFocus={index === 0}
            onPress={() => handleOpenComponent(entry.id)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    width: TV_WIDTH,
    height: TV_HEIGHT,
    backgroundColor: colors.backgroundDeep,
    paddingHorizontal: 120,
    paddingTop: 120,
    gap: 64,
  },
  title: {
    fontSize: 48,
    fontWeight: '700',
    lineHeight: 56,
    color: colors.textNorm,
  },
  list: {
    gap: 32,
    alignItems: 'flex-start',
  },
  detailScreen: {
    width: TV_WIDTH,
    height: TV_HEIGHT,
    backgroundColor: colors.backgroundDeep,
  },
  previewStage: {
    width: TV_WIDTH,
    height: TV_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
});

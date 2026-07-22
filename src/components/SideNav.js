import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SCROLL_DURATION, SCROLL_EASING } from '../Styles/motion';
import NavItem from './NavItem';

const SECTIONS = ['Home', 'Search', 'Settings'];

export const NAV_COLLAPSED_WIDTH = 144;
export const NAV_EXPANDED_WIDTH = 388;
export const NAV_EXPAND_DELTA = NAV_EXPANDED_WIDTH - NAV_COLLAPSED_WIDTH;

export default function SideNav({
  activeSection = 'Home',
  onSectionChange,
  onExpandedChange,
  onExitFocus,
  tileFocusRef,
  style,
}) {
  const [expanded, setExpanded] = useState(false);
  const [focusedSection, setFocusedSection] = useState(null);
  const itemRefs = useRef({});

  const setExpandedState = useCallback(
    (value) => {
      setExpanded(value);
      onExpandedChange?.(value);
    },
    [onExpandedChange],
  );

  const focusSection = useCallback((section) => {
    const node = itemRefs.current[section];

    if (node?.focus) {
      node.focus({ preventScroll: true });
    }
  }, []);

  const openAndFocusActive = useCallback(() => {
    setExpandedState(true);
    setFocusedSection(activeSection);
    requestAnimationFrame(() => focusSection(activeSection));
  }, [activeSection, focusSection, setExpandedState]);

  const moveFocus = useCallback(
    (direction) => {
      const currentIndex = SECTIONS.indexOf(focusedSection ?? activeSection);
      const nextIndex =
        direction === 'up'
          ? Math.max(0, currentIndex - 1)
          : Math.min(SECTIONS.length - 1, currentIndex + 1);
      const nextSection = SECTIONS[nextIndex];

      setExpandedState(true);
      setFocusedSection(nextSection);
      requestAnimationFrame(() => focusSection(nextSection));
    },
    [activeSection, focusedSection, focusSection, setExpandedState],
  );

  const exitToContent = useCallback(() => {
    setExpandedState(false);
    setFocusedSection(null);
    onExitFocus?.();
  }, [onExitFocus, setExpandedState]);

  const handleSelect = useCallback(
    (section) => {
      onSectionChange?.(section);
      setFocusedSection(section);
      exitToContent();
    },
    [exitToContent, onSectionChange],
  );

  useEffect(() => {
    const handleKeyDown = (event) => {
      const tileFocused = tileFocusRef?.current != null;

      if (
        event.key === 'ArrowLeft' &&
        !event.defaultPrevented &&
        !tileFocused
      ) {
        openAndFocusActive();
        event.preventDefault();
        return;
      }

      if (!expanded || focusedSection === null) {
        return;
      }

      if (event.key === 'ArrowUp') {
        moveFocus('up');
        event.preventDefault();
      }

      if (event.key === 'ArrowDown') {
        moveFocus('down');
        event.preventDefault();
      }

      if (event.key === 'ArrowRight') {
        exitToContent();
        event.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expanded, exitToContent, focusedSection, moveFocus, openAndFocusActive, tileFocusRef]);

  return (
    <View
      style={[
        styles.container,
        expanded ? styles.expanded : styles.collapsed,
        {
          transitionProperty: 'width',
          transitionDuration: `${SCROLL_DURATION}ms`,
          transitionTimingFunction: SCROLL_EASING,
        },
        style,
      ]}
    >
      {SECTIONS.map((section) => (
        <NavItem
          key={section}
          section={section}
          expanded={expanded}
          isPageActive={section === activeSection}
          isFocused={focusedSection === section}
          hasTVPreferredFocus={false}
          onPress={() => handleSelect(section)}
          onFocus={() => {
            setExpandedState(true);
            setFocusedSection(section);
          }}
          onBlur={() => {
            setFocusedSection((current) => (current === section ? null : current));
          }}
          ref={(node) => {
            itemRefs.current[section] = node;
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 1080,
    paddingHorizontal: 32,
    paddingVertical: 524,
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 48,
    zIndex: 10,
  },
  collapsed: {
    width: NAV_COLLAPSED_WIDTH,
  },
  expanded: {
    width: NAV_EXPANDED_WIDTH,
  },
});

import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../Styles/colors';
import { getFocusTransition, PRESS_PULSE_DURATION } from '../Styles/motion';
import { selectionShadow } from '../Styles/selectionshadow';

const FOCUS_SCALE = 1.1;
const PRESS_PULSE_SCALE = 0.92;
const ICON_SIZE = 48;

function MenuIcon({ iconSvg, focused }) {
  if (!iconSvg) {
    return null;
  }

  const color = focused ? colors.textInvert : colors.textNorm;
  const svg = iconSvg
    .replaceAll('currentColor', color)
    .replaceAll('#FAFAFB', color)
    .replaceAll('#191927', color);

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

export default forwardRef(function Menu(
  {
    label = 'Menu item label',
    icon,
    onPress,
    onFocus: onFocusProp,
    onBlur: onBlurProp,
    hasTVPreferredFocus = false,
    style,
  },
  ref,
) {
  const [isFocused, setIsFocused] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const transition = getFocusTransition(isFocused);
  const focusScale = isFocused ? FOCUS_SCALE : 1;
  const displayScale = isPulsing ? focusScale * PRESS_PULSE_SCALE : focusScale;
  const lastPressAtRef = useRef(0);
  const pressableRef = useRef(null);

  const handlePress = useCallback(() => {
    const now = Date.now();
    if (now - lastPressAtRef.current < 100) {
      return;
    }

    lastPressAtRef.current = now;
    setIsPulsing(true);
    setTimeout(() => setIsPulsing(false), PRESS_PULSE_DURATION);
    onPress?.();
  }, [onPress]);

  useImperativeHandle(
    ref,
    () => ({
      focus: (...args) => pressableRef.current?.focus?.(...args),
      blur: (...args) => pressableRef.current?.blur?.(...args),
      press: handlePress,
    }),
    [handlePress],
  );

  const handleKeyDown = (event) => {
    if (event.key === ' ') {
      event.preventDefault();
      handlePress();
    }
  };

  return (
    <View style={[styles.bounds, style]}>
      <Pressable
        ref={pressableRef}
        focusable
        hasTVPreferredFocus={hasTVPreferredFocus}
        onPress={handlePress}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          setIsFocused(true);
          onFocusProp?.();
        }}
        onBlur={() => {
          setIsFocused(false);
          onBlurProp?.();
        }}
        style={[
          styles.menu,
          isFocused && styles.menuFocused,
          isFocused && selectionShadow,
          {
            transform: [{ scale: displayScale }],
            transitionProperty: 'transform, background-color, box-shadow',
            ...transition,
          },
        ]}
      >
        {icon && <MenuIcon iconSvg={icon} focused={isFocused} />}
        <Text
          style={[
            styles.label,
            isFocused && styles.labelFocused,
            {
              transitionProperty: 'color',
              ...transition,
            },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  bounds: {
    overflow: 'visible',
    alignSelf: 'flex-start',
    width: 800,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menu: {
    width: 800,
    minHeight: 120,
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 32,
    backgroundColor: colors.backgroundNorm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 34,
  },
  menuFocused: {
    backgroundColor: colors.backgroundSelected,
  },
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    flexShrink: 0,
  },
  label: {
    flex: 1,
    fontSize: 29,
    fontWeight: '400',
    lineHeight: 36,
    color: colors.textNorm,
  },
  labelFocused: {
    color: colors.textInvert,
  },
});

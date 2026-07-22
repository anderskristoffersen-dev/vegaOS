import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../Styles/colors';
import { getFocusTransition, PRESS_PULSE_DURATION } from '../Styles/motion';
import { isActivationKey } from '../utils/dispatchKey';
import { selectionShadow } from '../Styles/selectionshadow';

const FOCUS_SCALE = 1.1;
const PRESS_PULSE_SCALE = 0.92;

export default forwardRef(function Button(
  {
    buttonText = 'Button',
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
    if (isActivationKey(event.key)) {
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
          styles.button,
          isFocused && styles.buttonFocused,
          isFocused && selectionShadow,
          {
            transform: [{ scale: displayScale }],
            transitionProperty: 'transform, background-color, box-shadow',
            ...transition,
          },
        ]}
      >
        <Text
          style={[
            styles.label,
            isFocused && styles.labelFocused,
            {
              transitionProperty: 'color',
              ...transition,
            },
          ]}
        >
          {buttonText}
        </Text>
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  bounds: {
    overflow: 'visible',
    alignSelf: 'flex-start',
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 24,
    borderRadius: 16,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonFocused: {
    backgroundColor: colors.backgroundSelected,
  },
  label: {
    fontSize: 29,
    fontWeight: '700',
    lineHeight: 36,
    color: colors.textNorm,
    textAlign: 'center',
  },
  labelFocused: {
    color: colors.textInvert,
  },
});

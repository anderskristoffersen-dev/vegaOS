import { forwardRef, useImperativeHandle, useRef } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../Styles/colors';
import { FOCUS_OUT_DURATION, FOCUS_OUT_EASING } from '../Styles/motion';

import backspaceIcon from '../assets/icons/ic-backspace.svg?raw';

export const SEARCH_KEYBOARD_WIDTH = 1540;
export const SEARCH_LETTER_COUNT = 26;
export const SEARCH_BACKSPACE_INDEX = 26;
export const SEARCH_KEY_COUNT = 27;

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function BackspaceIcon({ focused }) {
  const color = focused ? colors.textInvert : colors.textWeak;
  const svg = backspaceIcon
    .replaceAll('currentColor', color)
    .replaceAll('#A7A4B5', color);

  return (
    <Image
      source={{
        uri: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
      }}
      style={styles.backspaceIcon}
      resizeMode="contain"
      accessibilityRole="image"
      accessibilityLabel="Backspace"
    />
  );
}

const SearchKey = forwardRef(function SearchKey(
  {
    label,
    isBackspace = false,
    focused = false,
    onPress,
    onFocus,
    onBlur,
  },
  ref,
) {
  const pressableRef = useRef(null);

  useImperativeHandle(
    ref,
    () => ({
      focus: (...args) => pressableRef.current?.focus?.(...args),
      blur: (...args) => pressableRef.current?.blur?.(...args),
      press: () => onPress?.(),
    }),
    [onPress],
  );

  return (
    <Pressable
      ref={pressableRef}
      style={[styles.key, focused && styles.keyFocused]}
      onPress={onPress}
      onFocus={onFocus}
      onBlur={onBlur}
      accessibilityRole="button"
      accessibilityLabel={isBackspace ? 'Backspace' : label}
    >
      {isBackspace ? (
        <BackspaceIcon focused={focused} />
      ) : (
        <Text style={[styles.keyLabel, focused && styles.keyLabelFocused]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
});

export default function SearchKeyboard({
  focusedIndex = 0,
  useLowercase = false,
  selected = true,
  keyRefs,
  onKeyPress,
  onKeyFocus,
  style,
}) {
  return (
    <View
      style={[
        styles.row,
        {
          opacity: selected ? 1 : 0.5,
          transitionProperty: 'opacity',
          transitionDuration: `${FOCUS_OUT_DURATION}ms`,
          transitionTimingFunction: FOCUS_OUT_EASING,
        },
        style,
      ]}
    >
      {Array.from({ length: SEARCH_LETTER_COUNT }, (_, index) => {
        const letter = LETTERS[index];
        const label = useLowercase ? letter.toLowerCase() : letter;

        return (
          <SearchKey
            key={letter}
            ref={(node) => {
              if (keyRefs?.current) {
                keyRefs.current[index] = node;
              }
            }}
            label={label}
            focused={focusedIndex === index}
            onPress={() => onKeyPress?.(index)}
            onFocus={() => onKeyFocus?.(index)}
          />
        );
      })}
      <SearchKey
        ref={(node) => {
          if (keyRefs?.current) {
            keyRefs.current[SEARCH_BACKSPACE_INDEX] = node;
          }
        }}
        isBackspace
        focused={focusedIndex === SEARCH_BACKSPACE_INDEX}
        onPress={() => onKeyPress?.(SEARCH_BACKSPACE_INDEX)}
        onFocus={() => onKeyFocus?.(SEARCH_BACKSPACE_INDEX)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: SEARCH_KEYBOARD_WIDTH,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  key: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 4,
    minHeight: 62,
  },
  keyFocused: {
    backgroundColor: colors.backgroundSelected,
  },
  keyLabel: {
    fontSize: 38,
    fontWeight: '400',
    lineHeight: 46,
    textAlign: 'center',
    color: colors.textWeak,
  },
  keyLabelFocused: {
    color: colors.textInvert,
  },
  backspaceIcon: {
    width: 32,
    height: 32,
  },
});

import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { getFocusTransition } from '../Styles/motion';
import { isActivationKey } from '../utils/dispatchKey';

const FOCUS_SCALE = 1.1;

export default forwardRef(function AppTile(
  {
    source,
    placeholder = false,
    focused = false,
    focusable = true,
    hasTVPreferredFocus = false,
    onPress,
    onFocus,
    onBlur,
    style,
  },
  ref,
) {
  const pressableRef = useRef(null);
  const transition = getFocusTransition(focused);
  const scale = focused ? FOCUS_SCALE : 1;

  const handlePress = useCallback(() => {
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
    if (isActivationKey(event.key) && onPress) {
      event.preventDefault();
      handlePress();
    }
  };

  return (
    <View
      style={[
        styles.wrapper,
        focused && styles.wrapperFocused,
        style,
      ]}
    >
      <Pressable
        ref={pressableRef}
        focusable={focusable}
        hasTVPreferredFocus={hasTVPreferredFocus}
        onPress={handlePress}
        onKeyDown={handleKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
        style={styles.pressable}
      >
        <View style={styles.tileBounds}>
          <View
            style={[
              styles.tileScaler,
              placeholder && styles.placeholder,
              {
                transform: [{ scale }],
                transitionProperty: 'transform',
                ...transition,
              },
            ]}
          >
            {source && (
              <Image
                source={source}
                style={styles.image}
                resizeMode="cover"
                accessibilityIgnoresInvertColors
              />
            )}
          </View>
        </View>
      </Pressable>
    </View>
  );
});

const TILE_WIDTH = 300;
const TILE_HEIGHT = 168.75;

const styles = StyleSheet.create({
  wrapper: {
    width: TILE_WIDTH,
    height: TILE_HEIGHT,
    zIndex: 0,
    overflow: 'visible',
  },
  wrapperFocused: {
    zIndex: 1,
  },
  pressable: {
    width: TILE_WIDTH,
    height: TILE_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  tileBounds: {
    width: TILE_WIDTH,
    height: TILE_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  tileScaler: {
    width: TILE_WIDTH,
    height: TILE_HEIGHT,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#888888',
  },
  placeholder: {
    backgroundColor: '#888888',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

export { TILE_WIDTH, TILE_HEIGHT };

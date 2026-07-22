import { forwardRef, useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../Styles/colors';
import { getFocusTransition, LOADER_SPIN_ANIMATION } from '../Styles/motion';
import { selectionShadow } from '../Styles/selectionshadow';

import tileLoaderIcon from '../assets/country-tile/tile-loader.svg';
import activeDotIcon from '../assets/country-tile/active-dot.svg';
import plusBadgeImage from '../assets/country-tile/plus-badge.svg';

const FOCUS_SCALE = 1.2;
const MENU_SOURCE_SCALE = 1.1;
const PRESS_PULSE_SCALE = 0.90;
const BORDER_WIDTH = 4;
const BORDER_REST_SCALE = 0.8;
const BORDER_FOCUS_SCALE = 1;

const FLAG_WIDTH = 210;
const FLAG_HEIGHT = 140;
const FLAG_BORDER_RADIUS = 16;

export default forwardRef(function CountryTile(
  {
    label,
    flag,
    subtitle = null,
    cityCount = 0,
    tileConnectionState = null,
    isActiveTile = false,
    isMenuSource = false,
    dimmed = false,
    isPlusServer = false,
    shortPressPulse = 0,
    onPress,
    onLongPress,
    onFocus,
    onBlur,
    hasTVPreferredFocus = false,
    style,
  },
  ref,
) {
  const [isFocused, setIsFocused] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const transition = getFocusTransition(isActiveTile || isMenuSource);

  const focusScale = isMenuSource
    ? MENU_SOURCE_SCALE
    : isActiveTile
      ? FOCUS_SCALE
      : 1;
  const displayScale = isPulsing ? focusScale * PRESS_PULSE_SCALE : focusScale;
  const showBorder = isActiveTile && !isMenuSource;
  const showShadow = isActiveTile && !isPulsing;
  const isConnecting = tileConnectionState === 'connecting';
  const isConnected = tileConnectionState === 'connected';
  const showConnectionLabel = isConnecting || isConnected;
  const showCityCount =
    isActiveTile && cityCount > 1 && !showConnectionLabel && !isPlusServer;
  const showPlusBadge = isPlusServer && isActiveTile && !showConnectionLabel;

  useEffect(() => {
    if (!shortPressPulse) {
      return undefined;
    }

    setIsPulsing(true);
    const timeout = setTimeout(() => setIsPulsing(false), 180);

    return () => clearTimeout(timeout);
  }, [shortPressPulse]);

  const renderSublabel = () => {
    if (isConnecting) {
      return (
        <View style={[styles.connectionRow, styles.connectionRowConnecting]}>
          <Text style={styles.connectingLabel}>Connecting</Text>
          <View style={styles.connectionLoaderSpin}>
            <Image
              source={tileLoaderIcon}
              style={styles.connectionIcon}
              resizeMode="contain"
              accessibilityRole="image"
            />
          </View>
        </View>
      );
    }

    if (isConnected) {
      return (
        <View style={styles.connectionRow}>
          <Text style={styles.connectedLabel}>Connected</Text>
          <Image
            source={activeDotIcon}
            style={styles.connectionIcon}
            resizeMode="contain"
            accessibilityRole="image"
          />
        </View>
      );
    }

    if (showPlusBadge) {
      return (
        <View style={styles.plusBadgeWrap}>
          <Image
            source={plusBadgeImage}
            style={styles.plusBadgeImage}
            resizeMode="contain"
            accessibilityRole="image"
            accessibilityLabel="VPN Plus"
          />
        </View>
      );
    }

    if (subtitle) {
      return (
        <Text style={styles.cityCount} numberOfLines={1}>
          {subtitle}
        </Text>
      );
    }

    if (showCityCount) {
      return (
        <Text style={styles.cityCount} numberOfLines={1}>
          {cityCount} cities
        </Text>
      );
    }

    return null;
  };

  return (
    <View
      style={[
        styles.wrapper,
        isActiveTile && styles.wrapperFocused,
        {
          opacity: dimmed ? 0.5 : 1,
          transitionProperty: 'opacity',
          transitionDuration: `${transition.transitionDuration}`,
          transitionTimingFunction: transition.transitionTimingFunction,
        },
        style,
      ]}
    >
      <Pressable
        ref={ref}
        focusable
        hasTVPreferredFocus={hasTVPreferredFocus}
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={500}
        onFocus={() => {
          setIsFocused(true);
          onFocus?.();
        }}
        onBlur={() => {
          setIsFocused(false);
          onBlur?.();
        }}
        style={[
          styles.tile,
          { gap: isActiveTile ? 44 : 34 },
        ]}
      >
        <View style={styles.flagBounds}>
          <View
            style={[
              styles.flagScaler,
              {
                transform: [{ scale: displayScale }],
                transitionProperty: 'transform',
                ...transition,
              },
            ]}
          >
            <View
              pointerEvents="none"
              style={[
                styles.flagShadow,
                selectionShadow,
                {
                  opacity: showShadow ? 1 : 0,
                  transitionProperty: 'opacity',
                  ...transition,
                },
              ]}
            />
            <Image
              source={flag}
              style={[
                styles.flag,
                isPlusServer && styles.flagPlusServer,
              ]}
              resizeMode="cover"
              accessibilityRole="image"
            />
          </View>
          <View
            pointerEvents="none"
            style={[
              styles.flagBorder,
              {
                opacity: showBorder ? 1 : 0,
                transform: [
                  {
                    scale: showBorder ? BORDER_FOCUS_SCALE : BORDER_REST_SCALE,
                  },
                ],
                transitionProperty: 'opacity, transform',
                ...transition,
              },
            ]}
          />
        </View>

        <View
          style={[
            styles.labelBounds,
            {
              transform: [{ scale: displayScale }],
              transitionProperty: 'transform',
              ...transition,
            },
          ]}
        >
          <Text
            style={[styles.label, isPlusServer && styles.labelPlusServer]}
            numberOfLines={1}
          >
            {label}
          </Text>
          {renderSublabel()}
        </View>
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    width: 250,
    height: 327,
    position: 'relative',
    zIndex: 0,
  },
  wrapperFocused: {
    zIndex: 1,
  },
  tile: {
    width: 250,
    height: 327,
    paddingVertical: 32,
    borderRadius: 24,
    alignItems: 'center',
    overflow: 'visible',
  },
  flagBounds: {
    width: FLAG_WIDTH,
    height: FLAG_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  flagScaler: {
    width: FLAG_WIDTH,
    height: FLAG_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagShadow: {
    position: 'absolute',
    width: FLAG_WIDTH,
    height: FLAG_HEIGHT,
    borderRadius: FLAG_BORDER_RADIUS,
  },
  flag: {
    width: FLAG_WIDTH,
    height: FLAG_HEIGHT,
    borderRadius: FLAG_BORDER_RADIUS,
  },
  flagPlusServer: {
    opacity: 0.3,
  },
  flagBorder: {
    position: 'absolute',
    width: 276,
    height: 192,
    left: -33,
    top: -26,
    borderWidth: BORDER_WIDTH,
    borderColor: colors.backgroundSelected,
    borderRadius: 34,
  },
  labelBounds: {
    width: 250,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  label: {
    fontSize: 29,
    fontWeight: '400',
    lineHeight: 36,
    color: colors.textNorm,
    textAlign: 'center',
    maxWidth: 250,
  },
  labelPlusServer: {
    color: colors.textWeak,
  },
  plusBadgeWrap: {
    paddingTop: 10,
  },
  plusBadgeImage: {
    width: 57,
    height: 35,
  },
  cityCount: {
    fontSize: 25,
    fontWeight: '400',
    lineHeight: 32,
    color: colors.textWeak,
    textAlign: 'center',
    maxWidth: 250,
  },
  connectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  connectionRowConnecting: {
    paddingLeft: 12,
  },
  connectingLabel: {
    fontSize: 25,
    fontWeight: '400',
    lineHeight: 32,
    color: colors.textWeak,
    textAlign: 'center',
  },
  connectedLabel: {
    fontSize: 25,
    fontWeight: '400',
    lineHeight: 32,
    color: colors.protonAccent,
    textAlign: 'center',
  },
  connectionIcon: {
    width: 30,
    height: 30,
  },
  connectionLoaderSpin: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    ...LOADER_SPIN_ANIMATION,
  },
});

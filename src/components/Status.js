import { forwardRef, useEffect, useRef, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../Styles/colors';
import { SCRAMBLE_INTERVAL_MS } from '../Styles/motion';
import {
  getScramblableIndices,
  scrambleTextAtIndices,
} from '../utils/scrambleText';
import Button from './Button';
import Loader from './Loader';

import lockOpenIcon from '../assets/status/ic-lock-open-filled.svg';
import lockFilledIcon from '../assets/status/ic-lock-filled.svg';
import dotIcon from '../assets/status/dot.png';

const ICON_SIZE = 56;

const STATE_CONFIG = {
  unprotected: {
    title: 'Unprotected',
    titleColor: colors.negative,
    buttonText: 'Quick Connect',
  },
  connecting: {
    title: 'Connecting',
    titleColor: colors.neutral,
    buttonText: 'Cancel',
  },
  protected: {
    title: 'Protected',
    titleColor: colors.protonAccent,
    buttonText: 'Disconnect',
  },
};

function LocationChip({ country, ip }) {
  return (
    <View style={styles.location}>
      <View style={styles.locationContent}>
        <Text style={styles.country}>{country}</Text>
        <Image
          source={dotIcon}
          style={styles.dot}
          resizeMode="contain"
          accessibilityRole="image"
        />
        <Text style={styles.ip}>{ip}</Text>
      </View>
    </View>
  );
}

export default forwardRef(function Status(
  {
    state = 'unprotected',
    country = 'Norway',
    ip = '123.127.237.252',
    protectedCountry = 'United Kingdom',
    protectedIp = '154.47.24.201',
    onQuickConnect,
    onQuickConnectFocus,
    style,
  },
  ref,
) {
  const [scrambledCountryIndices, setScrambledCountryIndices] = useState([]);
  const [scrambledIpIndices, setScrambledIpIndices] = useState([]);
  const scrambleIntervalRef = useRef(null);
  const { title, titleColor, buttonText } = STATE_CONFIG[state];
  const isConnecting = state === 'connecting';
  const isProtected = state === 'protected';

  const displayCountry = isProtected ? protectedCountry : country;
  const displayIp = isProtected ? protectedIp : ip;
  const scrambledCountry = scrambleTextAtIndices(
    displayCountry,
    scrambledCountryIndices,
  );
  const scrambledIp = scrambleTextAtIndices(displayIp, scrambledIpIndices);
  const countryIndices = getScramblableIndices(displayCountry);
  const ipIndices = getScramblableIndices(displayIp);
  const locationCountry = isConnecting ? scrambledCountry : displayCountry;
  const locationIp = isConnecting ? scrambledIp : displayIp;

  useEffect(() => {
    if (state !== 'connecting') {
      setScrambledCountryIndices([]);
      setScrambledIpIndices([]);
      return undefined;
    }

    const usedCountry = new Set();
    const usedIp = new Set();

    scrambleIntervalRef.current = setInterval(() => {
      const remainingCountry = countryIndices.filter((index) => !usedCountry.has(index));
      const remainingIp = ipIndices.filter((index) => !usedIp.has(index));

      if (remainingCountry.length === 0 && remainingIp.length === 0) {
        clearInterval(scrambleIntervalRef.current);
        scrambleIntervalRef.current = null;
        return;
      }

      const pool = [
        ...remainingCountry.map((index) => ({ field: 'country', index })),
        ...remainingIp.map((index) => ({ field: 'ip', index })),
      ];
      const next = pool[Math.floor(Math.random() * pool.length)];

      if (next.field === 'country') {
        usedCountry.add(next.index);
        setScrambledCountryIndices(Array.from(usedCountry));
      } else {
        usedIp.add(next.index);
        setScrambledIpIndices(Array.from(usedIp));
      }
    }, SCRAMBLE_INTERVAL_MS);

    return () => {
      if (scrambleIntervalRef.current) {
        clearInterval(scrambleIntervalRef.current);
        scrambleIntervalRef.current = null;
      }
    };
  }, [state, displayCountry, displayIp, countryIndices.length, ipIndices.length]);

  const renderTitleIcon = () => {
    if (isConnecting) {
      return (
        <View style={styles.iconSlot}>
          <Loader size={ICON_SIZE} />
        </View>
      );
    }

    if (isProtected) {
      return (
        <View style={styles.iconSlot}>
          <Image
            source={lockFilledIcon}
            style={styles.icon}
            resizeMode="contain"
            accessibilityRole="image"
          />
        </View>
      );
    }

    return (
      <View style={styles.iconSlot}>
        <Image
          source={lockOpenIcon}
          style={styles.icon}
          resizeMode="contain"
          accessibilityRole="image"
        />
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          {renderTitleIcon()}
          <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
        </View>

        <LocationChip country={locationCountry} ip={locationIp} />

        <Button
          ref={ref}
          buttonText={buttonText}
          onPress={onQuickConnect}
          onFocus={onQuickConnectFocus}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    height: 300,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  content: {
    gap: 36,
    alignItems: 'flex-start',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 24,
  },
  iconSlot: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
  title: {
    fontSize: 48,
    fontWeight: '700',
    lineHeight: 56,
    textAlign: 'center',
  },
  location: {
    alignSelf: 'flex-start',
    paddingHorizontal: 32,
    paddingVertical: 24,
    borderRadius: 18,
    backgroundColor: colors.backgroundDeep,
  },
  locationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  country: {
    fontSize: 29,
    fontWeight: '400',
    lineHeight: 36,
    color: colors.textNorm,
  },
  dot: {
    width: 6,
    height: 6,
  },
  ip: {
    fontSize: 29,
    fontWeight: '400',
    lineHeight: 36,
    color: colors.textWeak,
  },
});

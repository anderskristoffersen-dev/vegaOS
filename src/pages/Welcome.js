import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import Button from '../components/Button';
import LogoIntro from '../components/LogoIntro';
import useActivationKey from '../hooks/useActivationKey';
import { colors } from '../Styles/colors';
import {
  WELCOME_BACKGROUND_FADE_DURATION_MS,
  WELCOME_INTRO_DELAY_MS,
  WELCOME_INTRO_DURATION_MS,
  WELCOME_INTRO_EASING,
} from '../Styles/motion';
import { TV_HEIGHT, TV_WIDTH } from '../Styles/viewport';

import backgroundImage from '../assets/welcome/background.png';

const LOGO_VISIBLE_HEIGHT = 336;
const CONTENT_GAP = 64;
const LOGO_FINAL_TOP = 204;
const TITLE_FINAL_TOP = 449;
const LOGO_INITIAL_TOP = (TV_HEIGHT - LOGO_VISIBLE_HEIGHT) / 2;
const CONTENT_LIFT = LOGO_INITIAL_TOP - LOGO_FINAL_TOP;
const DETAILS_INITIAL_TOP = TITLE_FINAL_TOP + CONTENT_LIFT;

const introTransition = {
  transitionDuration: `${WELCOME_INTRO_DURATION_MS}ms`,
  transitionTimingFunction: WELCOME_INTRO_EASING,
};

const backgroundTransition = {
  transitionDuration: `${WELCOME_BACKGROUND_FADE_DURATION_MS}ms`,
  transitionTimingFunction: WELCOME_INTRO_EASING,
};

export default function Welcome({ onSignIn }) {
  const buttonRef = useRef(null);
  const [backgroundVisible, setBackgroundVisible] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setBackgroundVisible(true));

    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const delayTimer = setTimeout(() => setRevealed(true), WELCOME_INTRO_DELAY_MS);

    return () => clearTimeout(delayTimer);
  }, []);

  useEffect(() => {
    if (!revealed) {
      return undefined;
    }

    const focusTimer = setTimeout(() => {
      buttonRef.current?.focus?.();
    }, WELCOME_INTRO_DURATION_MS);

    return () => clearTimeout(focusTimer);
  }, [revealed]);

  useActivationKey(buttonRef, revealed);

  return (
    <View style={styles.screen}>
      <Image
        source={backgroundImage}
        style={[
          styles.background,
          {
            opacity: backgroundVisible ? 1 : 0,
            transitionProperty: 'opacity',
            ...backgroundTransition,
          },
        ]}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />

      <View
        style={[
          styles.logoLayer,
          {
            top: revealed ? LOGO_FINAL_TOP : LOGO_INITIAL_TOP,
            transitionProperty: 'top',
            ...introTransition,
          },
        ]}
      >
        <LogoIntro />
      </View>

      <View
        style={[
          styles.details,
          {
            top: revealed ? TITLE_FINAL_TOP : DETAILS_INITIAL_TOP,
            opacity: revealed ? 1 : 0,
            transitionProperty: 'opacity, top',
            ...introTransition,
          },
        ]}
        pointerEvents={revealed ? 'auto' : 'none'}
      >
        <View style={styles.textBlock}>
          <Text style={styles.title}>Watch without being watched.</Text>
          <Text style={styles.body}>
            Connect to high-speed servers and stream with VPN protection. Proton
            VPN has a strict no-logs policy. We'll never track you online, log
            your IP address, or share your information with third parties.
          </Text>
        </View>

        <Button
          ref={buttonRef}
          buttonText="Sign in"
          onPress={onSignIn}
          style={styles.button}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    width: TV_WIDTH,
    height: TV_HEIGHT,
    backgroundColor: colors.backgroundDeep,
    overflow: 'hidden',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: TV_WIDTH,
    height: TV_HEIGHT,
  },
  logoLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  details: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: CONTENT_GAP,
    zIndex: 1,
  },
  textBlock: {
    width: 900,
    gap: 24,
    alignItems: 'center',
  },
  title: {
    width: '100%',
    fontSize: 57,
    fontWeight: '700',
    lineHeight: 66,
    color: colors.textNorm,
    textAlign: 'center',
  },
  body: {
    width: '100%',
    fontSize: 29,
    fontWeight: '400',
    lineHeight: 36,
    color: colors.textWeak,
    textAlign: 'center',
  },
  button: {
    alignSelf: 'center',
  },
});

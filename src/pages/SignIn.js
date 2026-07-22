import { useEffect, useRef } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Button from '../components/Button';
import StageBackground from '../components/StageBackground';
import useActivationKey from '../hooks/useActivationKey';
import { colors } from '../Styles/colors';
import { SIGN_IN_FOCUS_DELAY_MS } from '../Styles/motion';
import { TV_HEIGHT, TV_WIDTH } from '../Styles/viewport';

import logoImage from '../assets/sign-in/logo.png';
import qrcodeImage from '../assets/sign-in/qrcode.png';

export default function SignIn({ onQrScanned, onTroubleSigningIn }) {
  const buttonRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const focusTimer = setTimeout(() => {
      buttonRef.current?.focus?.();
    }, SIGN_IN_FOCUS_DELAY_MS);

    return () => {
      mountedRef.current = false;
      clearTimeout(focusTimer);
    };
  }, []);

  useActivationKey(buttonRef);

  const keepButtonFocused = () => {
    if (!mountedRef.current) {
      return;
    }

    requestAnimationFrame(() => buttonRef.current?.focus?.());
  };

  return (
    <View style={styles.screen} onMouseDown={keepButtonFocused}>
      <StageBackground />

      <Image
        source={logoImage}
        style={styles.logo}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />

      <View style={styles.content} pointerEvents="box-none">
        <Pressable
          focusable={false}
          onPress={onQrScanned}
          accessibilityRole="button"
          accessibilityLabel="Simulate QR code scan"
          style={styles.qrFrame}
        >
          <Image
            source={qrcodeImage}
            style={styles.qrCode}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
        </Pressable>

        <Text style={styles.headline}>
          Scan the QR code to sign in or create an account.
        </Text>
      </View>

      <View style={styles.buttonRow} pointerEvents="box-none">
        <Button
          ref={buttonRef}
          buttonText="Trouble signing in?"
          onPress={onTroubleSigningIn}
          onBlur={keepButtonFocused}
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
  logo: {
    position: 'absolute',
    top: 100,
    left: (TV_WIDTH - 384) / 2,
    width: 384,
    height: 100,
  },
  content: {
    position: 'absolute',
    top: TV_HEIGHT / 2 + 8 - 696 / 2,
    left: 0,
    right: 0,
    height: 696,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 100,
  },
  qrFrame: {
    width: 440,
    height: 440,
    padding: 11.579,
    borderRadius: 27.789,
    backgroundColor: colors.backgroundSelected,
    overflow: 'hidden',
  },
  qrCode: {
    width: 416.842,
    height: 416.842,
  },
  headline: {
    width: 720,
    fontSize: 76,
    fontWeight: '700',
    lineHeight: 96,
    color: colors.textNorm,
  },
  buttonRow: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  button: {
    alignSelf: 'center',
  },
});

import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Button from '../../components/Button';
import { colors } from '../../Styles/colors';
import { TV_HEIGHT, TV_WIDTH } from '../../Styles/viewport';

export default function SignOutModal({ onCancel, onSignOut }) {
  const cancelRef = useRef(null);
  const signOutRef = useRef(null);

  useEffect(() => {
    requestAnimationFrame(() => cancelRef.current?.focus?.());
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' || event.key === 'Backspace') {
        event.preventDefault();
        onCancel?.();
        return;
      }

      if (event.key === 'ArrowRight') {
        signOutRef.current?.focus?.({ preventScroll: true });
        event.preventDefault();
        return;
      }

      if (event.key === 'ArrowLeft') {
        cancelRef.current?.focus?.({ preventScroll: true });
        event.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [onCancel]);

  return (
    <View style={styles.overlay}>
      <View style={styles.scrim} />

      <View style={styles.modal}>
        <View style={styles.textBlock}>
          <Text style={styles.title}>Sign out</Text>
          <Text style={styles.body}>
            Are you sure you want to sign out of Proton VPN?
          </Text>
        </View>

        <View style={styles.buttons}>
          <Button
            ref={cancelRef}
            buttonText="Cancel"
            hasTVPreferredFocus
            onPress={onCancel}
          />
          <Button ref={signOutRef} buttonText="Sign out" onPress={onSignOut} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: TV_WIDTH,
    height: TV_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.scrimNorm,
    opacity: colors.scrimOpacity,
  },
  modal: {
    width: 800,
    backgroundColor: colors.backgroundNorm,
    borderRadius: 32,
    paddingHorizontal: 72,
    paddingVertical: 48,
    gap: 48,
    zIndex: 1,
  },
  textBlock: {
    gap: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: '700',
    lineHeight: 56,
    color: colors.textNorm,
  },
  body: {
    fontSize: 29,
    fontWeight: '400',
    lineHeight: 36,
    color: colors.textWeak,
  },
  buttons: {
    flexDirection: 'row',
    gap: 24,
  },
});

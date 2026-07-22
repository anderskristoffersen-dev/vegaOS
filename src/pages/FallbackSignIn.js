import { Image, StyleSheet, Text, View } from 'react-native';
import StageBackground from '../components/StageBackground';
import { colors } from '../Styles/colors';
import { TV_HEIGHT, TV_WIDTH } from '../Styles/viewport';

import stepBadgeImage from '../assets/sign-in/step-badge.png';
import copyIconImage from '../assets/sign-in/copy-icon.png';

const TITLE_TOP = 195;
const TITLE_HEIGHT = 66;
const FOOTER_BOTTOM = 136;
const FOOTER_HEIGHT = 36;
const CONTENT_LEFT = TV_WIDTH / 2 - 505;

function StepNumber({ value }) {
  return (
    <View style={styles.stepNumber}>
      <Image
        source={stepBadgeImage}
        style={styles.stepBadgeImage}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
      <Text style={styles.stepNumberLabel}>{value}</Text>
    </View>
  );
}

function CodePill({ children, trailingIcon = false }) {
  return (
    <View style={[styles.pill, trailingIcon && styles.pillWithIcon]}>
      <Text style={styles.pillText}>{children}</Text>
      {trailingIcon && (
        <Image
          source={copyIconImage}
          style={styles.copyIcon}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
      )}
    </View>
  );
}

export default function FallbackSignIn() {
  return (
    <View style={styles.screen}>
      <StageBackground />

      <Text style={styles.title}>Can&apos;t scan the code? Sign in manually</Text>

      <View style={styles.contentArea}>
        <View style={styles.steps}>
          <View style={styles.stepRow}>
            <StepNumber value="1" />
            <View style={styles.stepContent}>
              <Text style={styles.stepText}>Go to</Text>
              <CodePill>protonvpn.com/tv</CodePill>
            </View>
          </View>

          <View style={styles.stepRow}>
            <StepNumber value="2" />
            <Text style={styles.stepText}>Sign in or create an account</Text>
          </View>

          <View style={styles.stepRow}>
            <StepNumber value="3" />
            <View style={styles.stepContent}>
              <Text style={styles.stepText}>Enter the code:</Text>
              <CodePill trailingIcon>BU89 F4TJ</CodePill>
            </View>
          </View>
        </View>
      </View>

      <Text style={styles.footer}>
        <Text style={styles.footerWeak}>Still need help? Visit </Text>
        <Text style={styles.footerStrong}>protonvpn.com/support</Text>
      </Text>
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
  title: {
    position: 'absolute',
    top: TITLE_TOP,
    left: CONTENT_LEFT,
    fontSize: 57,
    fontWeight: '700',
    lineHeight: TITLE_HEIGHT,
    color: colors.textNorm,
  },
  contentArea: {
    position: 'absolute',
    top: TITLE_TOP + TITLE_HEIGHT,
    bottom: FOOTER_BOTTOM + FOOTER_HEIGHT,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  steps: {
    gap: 48,
    alignItems: 'flex-start',
    paddingRight: 32,
    alignSelf: 'center',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
  },
  stepContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  stepNumber: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeImage: {
    position: 'absolute',
    width: 72,
    height: 72,
  },
  stepNumberLabel: {
    fontSize: 48,
    fontWeight: '700',
    lineHeight: 56,
    color: colors.textInvert,
    textAlign: 'center',
  },
  stepText: {
    fontSize: 48,
    fontWeight: '400',
    lineHeight: 56,
    color: colors.textNorm,
  },
  pill: {
    backgroundColor: '#292733',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  pillWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    paddingLeft: 32,
    paddingRight: 24,
  },
  pillText: {
    fontSize: 48,
    fontWeight: '700',
    lineHeight: 56,
    color: colors.textNorm,
  },
  copyIcon: {
    width: 32,
    height: 32,
  },
  footer: {
    position: 'absolute',
    bottom: FOOTER_BOTTOM,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 29,
    lineHeight: FOOTER_HEIGHT,
  },
  footerWeak: {
    color: colors.textWeak,
    fontWeight: '400',
  },
  footerStrong: {
    color: colors.textWeak,
    fontWeight: '700',
  },
});

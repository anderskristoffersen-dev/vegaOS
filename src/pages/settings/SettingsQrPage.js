import { Image, StyleSheet, Text, View } from 'react-native';
import StageBackground from '../../components/StageBackground';
import { colors } from '../../Styles/colors';
import { TV_HEIGHT, TV_WIDTH } from '../../Styles/viewport';

import qrcodeImage from '../../assets/sign-in/qrcode.png';

export default function SettingsQrPage({ title, body, link }) {
  return (
    <View style={styles.screen}>
      <StageBackground />

      <View style={styles.content}>
        <View style={styles.textBlock}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>
            {body}
            <Text style={styles.link}>{link}</Text>
          </Text>
        </View>

        <View style={styles.qrFrame}>
          <Image
            source={qrcodeImage}
            style={styles.qrCode}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
        </View>
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
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 120,
  },
  textBlock: {
    width: 800,
    gap: 24,
  },
  title: {
    fontSize: 76,
    fontWeight: '700',
    lineHeight: 96,
    color: colors.textNorm,
  },
  body: {
    fontSize: 48,
    fontWeight: '400',
    lineHeight: 56,
    color: colors.textWeak,
  },
  link: {
    color: colors.textAccent,
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
});

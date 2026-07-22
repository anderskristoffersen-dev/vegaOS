import { Image, StyleSheet, View } from 'react-native';
import { colors } from '../Styles/colors';
import { TV_HEIGHT, TV_WIDTH } from '../Styles/viewport';

import stageBackground from '../assets/sign-in/stage-background.png';

export default function StageBackground() {
  return (
    <Image
      source={stageBackground}
      style={styles.background}
      resizeMode="cover"
      accessibilityIgnoresInvertColors
    />
  );
}

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: TV_WIDTH,
    height: TV_HEIGHT,
    backgroundColor: colors.backgroundDeep,
  },
});

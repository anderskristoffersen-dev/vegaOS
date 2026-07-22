import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../Styles/colors';
import { TV_HEIGHT, TV_WIDTH } from '../Styles/viewport';
import Loader from './Loader';

export default function HomeLoadingOverlay() {
  return (
    <View style={styles.overlay} pointerEvents="none">
      <View style={styles.content}>
        <Loader size={56} />
        <Text style={styles.title}>Loading countries</Text>
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
    zIndex: 10,
  },
  content: {
    alignItems: 'center',
    gap: 24,
  },
  title: {
    fontSize: 38,
    fontWeight: '400',
    lineHeight: 46,
    color: colors.textNorm,
    textAlign: 'center',
  },
});

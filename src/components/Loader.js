import { Image, StyleSheet, View } from 'react-native';
import { LOADER_SPIN_ANIMATION } from '../Styles/motion';

import loaderIcon from '../assets/status/loader.svg';

export default function Loader({ size = 56, style }) {
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <View style={[styles.spin, { width: size, height: size }]}>
        <Image
          source={loaderIcon}
          style={{ width: size, height: size }}
          resizeMode="contain"
          accessibilityRole="image"
          accessibilityLabel="Loading"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  spin: {
    alignItems: 'center',
    justifyContent: 'center',
    ...LOADER_SPIN_ANIMATION,
  },
});

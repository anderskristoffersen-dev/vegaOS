import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import lottie from 'lottie-web';

import logoIntroData from '../assets/welcome/logo-intro.json';

const LOGO_WIDTH = 800;
const LOGO_HEIGHT = 400;
const LOGO_VISIBLE_HEIGHT = 336;
const CROP_OFFSET = (LOGO_HEIGHT - LOGO_VISIBLE_HEIGHT) / 2;

export default function LogoIntro() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return undefined;
    }

    const animation = lottie.loadAnimation({
      container,
      renderer: 'svg',
      loop: false,
      autoplay: true,
      animationData: logoIntroData,
    });

    return () => {
      animation.destroy();
    };
  }, []);

  return (
    <View style={styles.clip}>
      <View ref={containerRef} style={styles.lottie} />
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    width: LOGO_WIDTH,
    height: LOGO_VISIBLE_HEIGHT,
    overflow: 'hidden',
  },
  lottie: {
    width: LOGO_WIDTH,
    height: LOGO_HEIGHT,
    marginTop: -CROP_OFFSET,
  },
});

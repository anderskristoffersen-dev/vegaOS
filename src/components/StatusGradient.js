import { useEffect, useRef, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import {
  GRADIENT_CROSSFADE_DURATION,
  GRADIENT_DISCONNECT_DURATION,
} from '../Styles/motion';

import unprotectedGradient from '../assets/status-gradient/unprotected.png';
import connectingGradient from '../assets/status-gradient/connecting.png';
import protectedGradient from '../assets/status-gradient/protected.png';

const GRADIENT_ASSETS = {
  Unprotected: unprotectedGradient,
  Connecting: connectingGradient,
  Protected: protectedGradient,
};

function getTransitionDuration(fromType, toType) {
  if (fromType === 'Protected' && toType === 'Unprotected') {
    return GRADIENT_DISCONNECT_DURATION;
  }

  return GRADIENT_CROSSFADE_DURATION;
}

function interpolate(start, end, progress) {
  return start + (end - start) * progress;
}

export default function StatusGradient({ type = 'Unprotected', style }) {
  const [layers, setLayers] = useState({
    fromType: type,
    toType: null,
    fromOpacity: 1,
    toOpacity: 0,
  });

  const committedTypeRef = useRef(type);
  const transitionRef = useRef({
    active: false,
    fromType: type,
    toType: null,
    startFromOpacity: 1,
    startToOpacity: 0,
    startTime: 0,
    duration: GRADIENT_CROSSFADE_DURATION,
  });
  const frameRef = useRef(null);

  const commitTransition = (nextType) => {
    committedTypeRef.current = nextType;
    transitionRef.current.active = false;
    setLayers({
      fromType: nextType,
      toType: null,
      fromOpacity: 1,
      toOpacity: 0,
    });
  };

  const tick = () => {
    const transition = transitionRef.current;

    if (!transition.active) {
      return;
    }

    const elapsed = performance.now() - transition.startTime;
    const progress = Math.min(elapsed / transition.duration, 1);
    const fromOpacity = interpolate(transition.startFromOpacity, 0, progress);
    const toOpacity = interpolate(transition.startToOpacity, 1, progress);

    setLayers({
      fromType: transition.fromType,
      toType: transition.toType,
      fromOpacity,
      toOpacity,
    });

    if (progress < 1) {
      frameRef.current = requestAnimationFrame(tick);
      return;
    }

    commitTransition(transition.toType);
  };

  const startTransition = (nextType) => {
    const transition = transitionRef.current;
    const currentCommitted = committedTypeRef.current;

    if (!transition.active && nextType === currentCommitted) {
      return;
    }

    if (transition.active && nextType === transition.toType) {
      return;
    }

    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    let outgoingType;
    let incomingType;
    let startFromOpacity;
    let startToOpacity;

    if (transition.active) {
      const elapsed = performance.now() - transition.startTime;
      const progress = Math.min(elapsed / transition.duration, 1);
      const currentFromOpacity = interpolate(transition.startFromOpacity, 0, progress);
      const currentToOpacity = interpolate(transition.startToOpacity, 1, progress);

      outgoingType = transition.toType;
      incomingType = nextType;
      startFromOpacity = currentToOpacity;
      startToOpacity = currentFromOpacity;
    } else {
      outgoingType = currentCommitted;
      incomingType = nextType;
      startFromOpacity = 1;
      startToOpacity = 0;
    }

    const duration = getTransitionDuration(outgoingType, incomingType);

    transition.active = true;
    transition.fromType = outgoingType;
    transition.toType = incomingType;
    transition.startFromOpacity = startFromOpacity;
    transition.startToOpacity = startToOpacity;
    transition.startTime = performance.now();
    transition.duration = duration;

    setLayers({
      fromType: outgoingType,
      toType: incomingType,
      fromOpacity: startFromOpacity,
      toOpacity: startToOpacity,
    });

    frameRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    if (type === committedTypeRef.current && !transitionRef.current.active) {
      return undefined;
    }

    startTransition(type);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [type]);

  const { fromType, toType, fromOpacity, toOpacity } = layers;

  return (
    <View style={[styles.container, style]} pointerEvents="none">
      <Image
        source={GRADIENT_ASSETS[fromType]}
        style={[styles.image, styles.layer, { opacity: fromOpacity }]}
        resizeMode="stretch"
      />
      {toType && (
        <Image
          source={GRADIENT_ASSETS[toType]}
          style={[styles.image, styles.layer, { opacity: toOpacity }]}
          resizeMode="stretch"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 700,
    backgroundColor: 'transparent',
    overflow: 'visible',
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

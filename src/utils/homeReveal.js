import {
  HOME_REVEAL_EASING,
  HOME_REVEAL_FADE_DURATION_MS,
  HOME_REVEAL_SHIFT_Y,
  HOME_REVEAL_STEP_MS,
  HOME_ROW1_REVEAL_OFFSET_MS,
} from '../Styles/motion';

export function getHomeStatusRevealDelayMs() {
  return 0;
}

export function getHomeTileRevealDelayMs(rowIndex, colIndex) {
  if (rowIndex === 0) {
    return (colIndex + 1) * HOME_REVEAL_STEP_MS;
  }

  if (rowIndex === 1) {
    return HOME_ROW1_REVEAL_OFFSET_MS + colIndex * HOME_REVEAL_STEP_MS;
  }

  return HOME_ROW1_REVEAL_OFFSET_MS + 5 * HOME_REVEAL_STEP_MS;
}

export function getHomeRevealCompleteDelayMs() {
  return (
    getHomeTileRevealDelayMs(1, 5) + HOME_REVEAL_FADE_DURATION_MS
  );
}

export function getHomeRevealStyle(revealed, delayMs) {
  return {
    opacity: revealed ? 1 : 0,
    transform: [{ translateY: revealed ? 0 : HOME_REVEAL_SHIFT_Y }],
    transitionProperty: 'opacity, transform',
    transitionDuration: `${HOME_REVEAL_FADE_DURATION_MS}ms`,
    transitionTimingFunction: HOME_REVEAL_EASING,
    transitionDelay: revealed ? `${delayMs}ms` : '0ms',
  };
}

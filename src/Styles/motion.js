export const FOCUS_IN_DURATION = 150;
export const FOCUS_OUT_DURATION = 200;
export const PRESS_PULSE_DURATION = 180;
export const GRADIENT_CROSSFADE_DURATION = 300;
export const GRADIENT_DISCONNECT_DURATION = 100;
export const SCRAMBLE_INTERVAL_MS = 50;
export const FOCUS_IN_EASING = 'cubic-bezier(0.2, 0.9, 0.4, 1.0)';
export const FOCUS_OUT_EASING = 'cubic-bezier(0.4, 0.0, 0.2, 1.0)';

export const SCROLL_DURATION = 450;
export const SCROLL_EASING = 'cubic-bezier(0.2, 0.9, 0.4, 1.0)';

export const CONTEXT_MENU_OPEN_DURATION = 320;
export const CONTEXT_MENU_CLOSE_DURATION = 200;
export const CONTEXT_MENU_EASING = 'cubic-bezier(0.25, 1.0, 0.5, 1.0)';
export const CONTEXT_MENU_ITEM_DURATION = 180;
export const CONTEXT_MENU_ITEM_BASE_DELAY = 80;
export const CONTEXT_MENU_ITEM_STEP_DELAY = 20;
export const CONTEXT_MENU_ITEM_DRIFT = -12;

export function getFocusTransition(isFocused) {
  return {
    transitionDuration: `${isFocused ? FOCUS_IN_DURATION : FOCUS_OUT_DURATION}ms`,
    transitionTimingFunction: isFocused ? FOCUS_IN_EASING : FOCUS_OUT_EASING,
  };
}

export const LOADER_SPIN_ANIMATION = {
  animationDuration: '1s',
  animationTimingFunction: 'linear',
  animationIterationCount: 'infinite',
  animationKeyframes: {
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(360deg)' },
  },
};

export const WELCOME_INTRO_DELAY_MS = 2000;
export const WELCOME_INTRO_DURATION_MS = 400;
export const WELCOME_INTRO_EASING = 'cubic-bezier(0.2, 1, 0.6, 1)';
export const WELCOME_BACKGROUND_FADE_DURATION_MS = 2000;
export const SIGN_IN_FOCUS_DELAY_MS = 500;

export const HOME_LOADING_DELAY_MS = 2000;
export const HOME_REVEAL_STEP_MS = 30;
export const HOME_ROW1_REVEAL_OFFSET_MS = 90;
export const HOME_REVEAL_FADE_DURATION_MS = 200;
export const HOME_REVEAL_SHIFT_Y = 40;
export const HOME_REVEAL_EASING = 'cubic-bezier(0.2, 1, 0.6, 1)';

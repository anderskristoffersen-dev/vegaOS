const KEY_CODES = {
  ArrowUp: 38,
  ArrowDown: 40,
  ArrowLeft: 37,
  ArrowRight: 39,
  Enter: 13,
  NumpadEnter: 13,
  Escape: 27,
  Backspace: 8,
  ' ': 32,
  Space: 32,
  Spacebar: 32,
};

function createKeyboardEvent(type, keyName, codeName) {
  const event = new KeyboardEvent(type, {
    key: keyName,
    code: codeName,
    bubbles: true,
    cancelable: true,
  });

  const keyCode = KEY_CODES[keyName] ?? 0;

  Object.defineProperty(event, 'keyCode', { get: () => keyCode });
  Object.defineProperty(event, 'which', { get: () => keyCode });

  return event;
}

function getKeyboardEventTarget(explicitTarget) {
  if (
    explicitTarget &&
    explicitTarget !== document.body &&
    explicitTarget !== document.documentElement
  ) {
    return explicitTarget;
  }

  const active = document.activeElement;

  if (active && active !== document.body && active !== document.documentElement) {
    return active;
  }

  return window;
}

export function isActivationKey(key) {
  return key === 'Enter' || key === 'NumpadEnter' || key === ' ' || key === 'Spacebar';
}

export function dispatchKeyDown(keyName, codeName = keyName, target) {
  getKeyboardEventTarget(target).dispatchEvent(
    createKeyboardEvent('keydown', keyName, codeName),
  );
}

export function dispatchKeyUp(keyName, codeName = keyName, target) {
  getKeyboardEventTarget(target).dispatchEvent(
    createKeyboardEvent('keyup', keyName, codeName),
  );
}

export function dispatchKeyPress(keyName, codeName = keyName, target) {
  dispatchKeyDown(keyName, codeName, target);
  dispatchKeyUp(keyName, codeName, target);
}

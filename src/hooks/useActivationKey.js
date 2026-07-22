import { useEffect, useRef } from 'react';
import { isActivationKey } from '../utils/dispatchKey';

export default function useActivationKey(actionRef, enabled = true) {
  const actionRefRef = useRef(actionRef);
  actionRefRef.current = actionRef;

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (!isActivationKey(event.key)) {
        return;
      }

      const action = actionRefRef.current?.current;

      if (!action?.press) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      action.press();
    };

    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [enabled]);
}

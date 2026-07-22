import { useCallback, useState } from 'react';

export const RECENTS_STORAGE_KEY = 'vega-recents';
export const RECENTS_MAX_ITEMS = 6;

export function getIntentKey(intent) {
  if (intent.type === 'fastest') {
    return 'fastest';
  }

  if (intent.type === 'city') {
    return `city:${intent.countrySlug}:${intent.city}`;
  }

  return `country:${intent.countrySlug}`;
}

export function createRecentItem(intent, { pinned = false } = {}) {
  return {
    intentKey: getIntentKey(intent),
    type: intent.type,
    countrySlug: intent.countrySlug ?? null,
    countryName: intent.countryName,
    city: intent.city ?? null,
    pinned,
  };
}

function getPinnedCount(items) {
  return items.filter((item) => item.pinned).length;
}

export function shouldRecordRecentOnDisconnect(wasProtected, connectionTarget) {
  if (!wasProtected || !connectionTarget?.intent) {
    return false;
  }

  // Status quick connect has no source tile — user doesn't need that country again.
  return connectionTarget.sourceTile != null;
}

export function addRecentOnDisconnect(items, intent) {
  const pinnedCount = getPinnedCount(items);

  if (pinnedCount >= RECENTS_MAX_ITEMS) {
    return items;
  }

  const intentKey = getIntentKey(intent);
  const existingIndex = items.findIndex((item) => item.intentKey === intentKey);
  const next = [...items];

  if (existingIndex >= 0) {
    const [existing] = next.splice(existingIndex, 1);
    next.splice(pinnedCount, 0, existing);
  } else {
    next.splice(pinnedCount, 0, createRecentItem(intent));
  }

  if (next.length > RECENTS_MAX_ITEMS) {
    return next.slice(0, RECENTS_MAX_ITEMS);
  }

  return next;
}

export function pinRecent(items, index) {
  const item = items[index];

  if (!item || item.pinned) {
    return items;
  }

  const next = [...items];
  next.splice(index, 1);

  const pinnedCount = getPinnedCount(next);
  next.splice(pinnedCount, 0, { ...item, pinned: true });

  return next;
}

export function unpinRecent(items, index) {
  const item = items[index];

  if (!item || !item.pinned) {
    return items;
  }

  const next = [...items];
  next.splice(index, 1);

  const pinnedCount = getPinnedCount(next);
  next.splice(pinnedCount, 0, { ...item, pinned: false });

  return next;
}

export function removeRecent(items, index) {
  if (index < 0 || index >= items.length) {
    return items;
  }

  return items.filter((_, itemIndex) => itemIndex !== index);
}

export function loadRecents() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(RECENTS_STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item) =>
        item &&
        typeof item.intentKey === 'string' &&
        typeof item.type === 'string' &&
        typeof item.countryName === 'string' &&
        typeof item.pinned === 'boolean',
    );
  } catch {
    return [];
  }
}

export function saveRecents(items) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  window.localStorage.setItem(RECENTS_STORAGE_KEY, JSON.stringify(items));
}

export const CLEAR_RECENTS_EVENT = 'vega:clear-recents';

export function clearAllRecents() {
  saveRecents([]);
}

export function useRecents() {
  const [recents, setRecentsState] = useState(() => loadRecents());

  const setRecents = useCallback((updater) => {
    setRecentsState((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater;
      saveRecents(next);
      return next;
    });
  }, []);

  const recordDisconnect = useCallback(
    (intent) => {
      setRecents((current) => addRecentOnDisconnect(current, intent));
    },
    [setRecents],
  );

  const pinAt = useCallback(
    (index) => {
      setRecents((current) => pinRecent(current, index));
    },
    [setRecents],
  );

  const unpinAt = useCallback(
    (index) => {
      setRecents((current) => unpinRecent(current, index));
    },
    [setRecents],
  );

  const removeAt = useCallback(
    (index) => {
      setRecents((current) => removeRecent(current, index));
    },
    [setRecents],
  );

  const clearAll = useCallback(() => {
    setRecents([]);
  }, [setRecents]);

  return {
    recents,
    setRecents,
    recordDisconnect,
    pinAt,
    unpinAt,
    removeAt,
    clearAll,
  };
}

export function getRecentsMenuItems(recent) {
  const items = [];

  if (recent.pinned) {
    items.push({ label: 'Unpin', icon: 'pin-slash', action: 'unpin' });
  } else {
    items.push({ label: 'Pin', icon: 'pin', action: 'pin' });
  }

  items.push({ label: 'Remove', icon: 'trash', action: 'remove' });

  return items;
}

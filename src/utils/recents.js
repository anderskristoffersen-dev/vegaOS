import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

export const RECENTS_STORAGE_KEY = 'vega-recents';
export const RECENTS_MAX_ITEMS = 6;

function slugifyCountryName(name) {
  if (!name) {
    return null;
  }

  return name.toLowerCase().replace(/\s+/g, '-');
}

export function resolveCountrySlug(intent) {
  if (intent.countrySlug) {
    return intent.countrySlug;
  }

  return slugifyCountryName(intent.countryName);
}

export function getIntentKey(intent) {
  if (intent.type === 'fastest') {
    return 'fastest';
  }

  const slug = resolveCountrySlug(intent);

  if (intent.type === 'city') {
    return `city:${slug}:${intent.city}`;
  }

  return `country:${slug}`;
}

export function createRecentItem(intent, { pinned = false } = {}) {
  const countrySlug = resolveCountrySlug(intent);
  const normalizedIntent = { ...intent, countrySlug };

  return {
    intentKey: getIntentKey(normalizedIntent),
    type: intent.type,
    countrySlug,
    countryName: intent.countryName,
    city: intent.city ?? null,
    pinned,
  };
}

function getPinnedCount(items) {
  return items.filter((item) => item.pinned).length;
}

function isValidRecentItem(item) {
  return (
    item &&
    typeof item.type === 'string' &&
    typeof item.countryName === 'string' &&
    typeof item.pinned === 'boolean'
  );
}

export function normalizeRecents(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  const seen = new Set();
  const pinned = [];
  const unpinned = [];

  items.forEach((item) => {
    if (!isValidRecentItem(item)) {
      return;
    }

    const normalized = createRecentItem(
      {
        type: item.type,
        countrySlug: item.countrySlug,
        countryName: item.countryName,
        city: item.city,
      },
      { pinned: item.pinned },
    );

    if (seen.has(normalized.intentKey)) {
      return;
    }

    seen.add(normalized.intentKey);

    if (normalized.pinned) {
      pinned.push(normalized);
    } else {
      unpinned.push(normalized);
    }
  });

  const pinnedSlice = pinned.slice(0, RECENTS_MAX_ITEMS);

  if (pinnedSlice.length >= RECENTS_MAX_ITEMS) {
    return pinnedSlice;
  }

  const remainingSlots = RECENTS_MAX_ITEMS - pinnedSlice.length;

  return [...pinnedSlice, ...unpinned.slice(0, remainingSlots)];
}

export function shouldRecordRecentOnDisconnect(wasProtected, connectionTarget) {
  if (!wasProtected || !connectionTarget?.intent) {
    return false;
  }

  // Status quick connect has no source tile — user doesn't need that country again.
  return connectionTarget.sourceTile != null;
}

export function addRecentOnDisconnect(items, intent) {
  const normalized = normalizeRecents(items);
  const pinnedCount = getPinnedCount(normalized);

  if (pinnedCount >= RECENTS_MAX_ITEMS) {
    return normalized;
  }

  const intentKey = getIntentKey(intent);
  const existing = normalized.find((item) => item.intentKey === intentKey);
  const next = normalized.filter((item) => item.intentKey !== intentKey);

  if (existing) {
    next.splice(pinnedCount, 0, existing);
  } else {
    next.splice(pinnedCount, 0, createRecentItem(intent));
  }

  return normalizeRecents(next);
}

export function pinRecent(items, index) {
  const normalized = normalizeRecents(items);
  const item = normalized[index];

  if (!item || item.pinned) {
    return normalized;
  }

  const next = [...normalized];
  next.splice(index, 1);

  const pinnedCount = getPinnedCount(next);
  next.splice(pinnedCount, 0, { ...item, pinned: true });

  return normalizeRecents(next);
}

export function unpinRecent(items, index) {
  const normalized = normalizeRecents(items);
  const item = normalized[index];

  if (!item || !item.pinned) {
    return normalized;
  }

  const next = [...normalized];
  next.splice(index, 1);

  const pinnedCount = getPinnedCount(next);
  next.splice(pinnedCount, 0, { ...item, pinned: false });

  return normalizeRecents(next);
}

export function removeRecent(items, index) {
  const normalized = normalizeRecents(items);

  if (index < 0 || index >= normalized.length) {
    return normalized;
  }

  return normalizeRecents(
    normalized.filter((_, itemIndex) => itemIndex !== index),
  );
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

    return normalizeRecents(parsed);
  } catch {
    return [];
  }
}

export function saveRecents(items) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  const normalized = normalizeRecents(items);
  window.localStorage.setItem(RECENTS_STORAGE_KEY, JSON.stringify(normalized));
}

export const CLEAR_RECENTS_EVENT = 'vega:clear-recents';

export function clearAllRecents() {
  saveRecents([]);
}

const RecentsContext = createContext(null);

export function RecentsProvider({ children }) {
  const [recents, setRecentsState] = useState(() => {
    const loaded = loadRecents();
    saveRecents(loaded);
    return loaded;
  });

  const setRecents = useCallback((updater) => {
    setRecentsState((current) => {
      const next =
        typeof updater === 'function'
          ? normalizeRecents(updater(current))
          : normalizeRecents(updater);
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

  useEffect(() => {
    const handleClearRecents = () => {
      clearAll();
    };

    window.addEventListener(CLEAR_RECENTS_EVENT, handleClearRecents);

    return () => {
      window.removeEventListener(CLEAR_RECENTS_EVENT, handleClearRecents);
    };
  }, [clearAll]);

  const value = {
    recents,
    setRecents,
    recordDisconnect,
    pinAt,
    unpinAt,
    removeAt,
    clearAll,
  };

  return (
    <RecentsContext.Provider value={value}>{children}</RecentsContext.Provider>
  );
}

export function useRecents() {
  const context = useContext(RecentsContext);

  if (!context) {
    throw new Error('useRecents must be used within a RecentsProvider');
  }

  return context;
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

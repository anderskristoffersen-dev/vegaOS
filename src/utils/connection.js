import { getIntentKey } from './recents';

import { FREE_COUNTRY_NAMES } from './userType';

const FASTEST_PICKS = ['United Kingdom', 'Ireland'];

export function pickFastestCountry(userType = 'paid') {
  if (userType === 'free') {
    const freeCountries = [...FREE_COUNTRY_NAMES];
    return freeCountries[Math.floor(Math.random() * freeCountries.length)];
  }

  return FASTEST_PICKS[Math.floor(Math.random() * FASTEST_PICKS.length)];
}

export function resolveTileConnectionLabel(country, userType = 'paid') {
  if (country.slug === 'fastest') {
    return pickFastestCountry(userType);
  }

  return country.name;
}

export function resolveMenuConnectionLabel(countryName, item) {
  if (item.type === 'city') {
    if (item.city) {
      return `${countryName} - ${item.city}`;
    }

    return `${countryName} - City name`;
  }

  return countryName;
}

export function buildIntentFromCountryTile(country) {
  if (country.slug === 'fastest') {
    return {
      type: 'fastest',
      countrySlug: null,
      countryName: 'Fastest',
      city: null,
    };
  }

  return {
    type: 'country',
    countrySlug: country.slug,
    countryName: country.name,
    city: null,
  };
}

export function getContextMenuCityName(item) {
  if (item.type !== 'city') {
    return null;
  }

  return item.city ?? 'City name';
}

export function buildIntentFromMenuItem(country, item) {
  if (item.type === 'city') {
    return {
      type: 'city',
      countrySlug: country.slug,
      countryName: country.name,
      city: getContextMenuCityName(item),
    };
  }

  return {
    type: 'country',
    countrySlug: country.slug,
    countryName: country.name,
    city: null,
  };
}

export function buildIntentFromRecentItem(recent) {
  return {
    type: recent.type,
    countrySlug: recent.countrySlug,
    countryName: recent.countryName,
    city: recent.city,
  };
}

export function resolveConnectionLabelFromIntent(intent, userType = 'paid') {
  if (intent.type === 'fastest') {
    return pickFastestCountry(userType);
  }

  if (intent.type === 'city') {
    return `${intent.countryName} - ${intent.city}`;
  }

  return intent.countryName;
}

export function withIntentKey(intent) {
  return {
    ...intent,
    intentKey: getIntentKey(intent),
  };
}

export function isConnectionActiveForCountry(
  connectionState,
  connectionTarget,
  country,
) {
  if (
    connectionState !== 'connecting' &&
    connectionState !== 'protected'
  ) {
    return false;
  }

  const intent = connectionTarget?.intent;

  if (!intent || intent.type === 'fastest' || !country) {
    return false;
  }

  return intent.countrySlug === country.slug;
}

export function isContextMenuItemActive(
  item,
  country,
  connectionTarget,
  connectionState,
) {
  if (!isConnectionActiveForCountry(connectionState, connectionTarget, country)) {
    return false;
  }

  const intent = connectionTarget.intent;
  const menuSelection = connectionTarget.menuSelection ?? null;

  if (item.type === 'city') {
    return intent.type === 'city' && intent.city === getContextMenuCityName(item);
  }

  if (item.type === 'random') {
    return menuSelection?.type === 'random' && intent.type === 'country';
  }

  if (item.type === 'fastest') {
    if (intent.type === 'city' || menuSelection?.type === 'random') {
      return false;
    }

    return intent.type === 'country';
  }

  return false;
}

export function buildMenuSelectionFromItem(item) {
  return {
    type: item.type,
    city: item.city ?? null,
  };
}

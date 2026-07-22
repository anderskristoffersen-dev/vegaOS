export const USER_TYPES = {
  FREE: 'free',
  PAID: 'paid',
};

const STORAGE_KEY = 'vega-user-type';

export const FREE_COUNTRY_NAMES = new Set([
  'United States',
  'Netherlands',
  'Singapore',
  'Switzerland',
  'Japan',
  'Romania',
  'Canada',
  'Poland',
  'Mexico',
  'Norway',
]);

export function loadUserType() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === USER_TYPES.FREE || stored === USER_TYPES.PAID) {
      return stored;
    }
  } catch {
    // Ignore storage errors in prototype environments.
  }

  return USER_TYPES.PAID;
}

export function saveUserType(userType) {
  try {
    localStorage.setItem(STORAGE_KEY, userType);
  } catch {
    // Ignore storage errors in prototype environments.
  }
}

export function isCountryAvailableForFreeUser(country) {
  if (!country) {
    return false;
  }

  if (country.slug === 'fastest') {
    return true;
  }

  return FREE_COUNTRY_NAMES.has(country.name);
}

export function isPlusServer(country, userType) {
  return userType === USER_TYPES.FREE && !isCountryAvailableForFreeUser(country);
}

import { COUNTRIES, ROW_CONFIGS } from '../data/countries';
import { FREE_COUNTRY_NAMES, USER_TYPES } from './userType';

export const FREE_COUNTRY_SORT = {
  ALPHABETICAL: 'alphabetical',
  FREE_ROW: 'free-row',
};

const SORT_STORAGE_KEY = 'vega-free-country-sort';
const TILES_PER_ROW = 6;

export function loadFreeCountrySort() {
  try {
    const stored = localStorage.getItem(SORT_STORAGE_KEY);
    if (
      stored === FREE_COUNTRY_SORT.ALPHABETICAL ||
      stored === FREE_COUNTRY_SORT.FREE_ROW
    ) {
      return stored;
    }
  } catch {
    // Ignore storage errors in prototype environments.
  }

  return FREE_COUNTRY_SORT.ALPHABETICAL;
}

export function saveFreeCountrySort(sort) {
  try {
    localStorage.setItem(SORT_STORAGE_KEY, sort);
  } catch {
    // Ignore storage errors in prototype environments.
  }
}

function chunkCountries(countries) {
  const rows = [];

  for (let index = 0; index < countries.length; index += TILES_PER_ROW) {
    rows.push(countries.slice(index, index + TILES_PER_ROW));
  }

  return rows;
}

export function buildHomeGridLayout({
  showRecents,
  recentsCount,
  userType,
  freeCountrySort,
}) {
  const entries = [];
  const countryRows = [];
  const useFreeRowLayout =
    userType === USER_TYPES.FREE &&
    freeCountrySort === FREE_COUNTRY_SORT.FREE_ROW;

  let nextLogicalRow = 0;

  if (showRecents) {
    entries.push({ kind: 'title', label: 'Recents', key: 'recents-title' });
    entries.push({
      kind: 'recents-row',
      logicalRowIndex: nextLogicalRow,
      itemCount: recentsCount,
      key: 'recents-row',
    });
    countryRows.push({
      kind: 'recents',
      logicalRowIndex: nextLogicalRow,
      itemCount: recentsCount,
    });
    nextLogicalRow += 1;
  }

  if (useFreeRowLayout) {
    entries.push({
      kind: 'title',
      label: 'Free countries',
      key: 'free-countries-title',
    });

    const fastest = COUNTRIES.find((country) => country.slug === 'fastest');
    const freeCountries = COUNTRIES.filter((country) =>
      FREE_COUNTRY_NAMES.has(country.name),
    );
    const freeSectionCountries = [fastest, ...freeCountries];

    chunkCountries(freeSectionCountries).forEach((countries, index) => {
      entries.push({
        kind: 'country-row',
        logicalRowIndex: nextLogicalRow,
        countries,
        section: 'free',
        key: `free-row-${index}`,
      });
      countryRows.push({
        kind: 'country',
        logicalRowIndex: nextLogicalRow,
        countries,
        section: 'free',
      });
      nextLogicalRow += 1;
    });

    entries.push({
      kind: 'title',
      label: 'Plus countries',
      key: 'plus-countries-title',
    });

    chunkCountries(COUNTRIES).forEach((countries, index) => {
      entries.push({
        kind: 'country-row',
        logicalRowIndex: nextLogicalRow,
        countries,
        section: 'plus',
        key: `plus-row-${index}`,
      });
      countryRows.push({
        kind: 'country',
        logicalRowIndex: nextLogicalRow,
        countries,
        section: 'plus',
      });
      nextLogicalRow += 1;
    });
  } else {
    entries.push({
      kind: 'title',
      label: 'All countries',
      key: 'all-countries-title',
    });

    ROW_CONFIGS.forEach((row, index) => {
      entries.push({
        kind: 'country-row',
        logicalRowIndex: nextLogicalRow,
        countries: row.countries,
        section: 'default',
        key: `alphabetical-row-${index}`,
      });
      countryRows.push({
        kind: 'country',
        logicalRowIndex: nextLogicalRow,
        countries: row.countries,
        section: 'default',
      });
      nextLogicalRow += 1;
    });
  }

  return {
    entries,
    countryRows,
    totalRows: nextLogicalRow,
    useFreeRowLayout,
  };
}

export function getCountryRowAt(countryRows, logicalRow) {
  return countryRows.find((row) => row.logicalRowIndex === logicalRow) ?? null;
}

export function getRowItemCount(countryRows, logicalRow) {
  const row = getCountryRowAt(countryRows, logicalRow);

  if (!row) {
    return 0;
  }

  if (row.kind === 'recents') {
    return row.itemCount;
  }

  return row.countries.length;
}

export function getTargetColumn(currentColumn, targetRowIndex, countryRows) {
  const maxColumn = getRowItemCount(countryRows, targetRowIndex) - 1;
  return Math.min(currentColumn, maxColumn);
}

export function buildTileRefGrid(countryRows) {
  const rows = [];

  countryRows.forEach((row) => {
    const itemCount =
      row.kind === 'recents' ? row.itemCount : row.countries.length;
    rows[row.logicalRowIndex] = Array(itemCount).fill(null);
  });

  return rows;
}

export function isPlusServerTile(country, userType, section) {
  if (userType !== USER_TYPES.FREE) {
    return false;
  }

  if (section === 'plus') {
    return true;
  }

  if (section === 'free') {
    return false;
  }

  return country.slug !== 'fastest' && !FREE_COUNTRY_NAMES.has(country.name);
}

export function shouldOpenUpsell(country, userType, section) {
  if (userType !== USER_TYPES.FREE) {
    return false;
  }

  if (section === 'plus') {
    return true;
  }

  return isPlusServerTile(country, userType, section);
}

export function shouldAllowCountryContextMenu(country, userType, section) {
  if (country.slug === 'fastest') {
    return false;
  }

  if (section === 'plus') {
    return false;
  }

  if (section === 'free') {
    return true;
  }

  return !isPlusServerTile(country, userType, section);
}

export function getTitleCount(entries) {
  return entries.filter((entry) => entry.kind === 'title').length;
}

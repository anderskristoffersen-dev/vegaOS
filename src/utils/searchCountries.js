import { COUNTRIES } from '../data/countries';

const TILES_PER_ROW = 6;

export function filterCountriesByPrefix(query) {
  if (!query) {
    return [];
  }

  const normalized = query.toLowerCase();

  return COUNTRIES.filter(
    (country) =>
      country.slug !== 'fastest' &&
      country.name.toLowerCase().startsWith(normalized),
  );
}

export function chunkIntoRows(countries, tilesPerRow = TILES_PER_ROW) {
  const rows = [];

  for (let index = 0; index < countries.length; index += tilesPerRow) {
    const slice = countries.slice(index, index + tilesPerRow);

    rows.push({
      logicalRowIndex: rows.length,
      countries: slice,
      itemCount: slice.length,
    });
  }

  return rows;
}

export function buildSearchCountryRows(countries) {
  return chunkIntoRows(countries).map((row) => ({
    kind: 'search',
    logicalRowIndex: row.logicalRowIndex,
    countries: row.countries,
  }));
}

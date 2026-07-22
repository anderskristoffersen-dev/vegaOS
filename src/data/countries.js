import { getCitiesForCountry } from './cities';

const flagModules = import.meta.glob('../assets/country-tile/flags/*.png', {
  eager: true,
  import: 'default',
});

function toSlug(name) {
  return name.toLowerCase().replace(/\s+/g, '-');
}

const COUNTRY_NAMES = [
  'Fastest',
  'Argentina',
  'Australia',
  'Austria',
  'Belgium',
  'Brasil',
  'Bulgaria',
  'Canada',
  'Chile',
  'Colombia',
  'Costa Rica',
  'Czechia',
  'Denmark',
  'Egypt',
  'Estonia',
  'Finland',
  'France',
  'Germany',
  'Greece',
  'Hong Kong',
  'Hungary',
  'Iceland',
  'India',
  'Ireland',
  'Israel',
  'Italy',
  'Japan',
  'Latvia',
  'Lithuania',
  'Luxembourg',
  'Malaysia',
  'Mexico',
  'Moldova',
  'Myanmar',
  'Netherlands',
  'New Zealand',
  'Nigeria',
  'Norway',
  'Peru',
  'Philippines',
  'Poland',
  'Portugal',
  'Romania',
  'Russia',
  'Serbia',
  'Singapore',
  'Slovakia',
  'Slovenia',
  'South Africa',
  'South Korea',
  'Spain',
  'Sweden',
  'Switzerland',
  'Taiwan',
  'Thailand',
  'Turkey',
  'Ukraine',
  'United Arab Emirates',
  'United Kingdom',
  'United States',
  'Vietnam',
];

export const COUNTRIES = COUNTRY_NAMES.map((name) => {
  const slug = toSlug(name);
  const flagPath = `../assets/country-tile/flags/${slug}.png`;
  const flag = flagModules[flagPath];

  if (!flag) {
    throw new Error(`Missing flag asset for ${name} at ${flagPath}`);
  }

  return { name, slug, flag, cities: getCitiesForCountry(name) };
});

const TILES_PER_ROW = 6;

export const ROW_CONFIGS = Array.from(
  { length: Math.ceil(COUNTRIES.length / TILES_PER_ROW) },
  (_, rowIndex) => {
    const start = rowIndex * TILES_PER_ROW;
    const end = Math.min(start + TILES_PER_ROW, COUNTRIES.length);

    return {
      itemCount: end - start,
      countries: COUNTRIES.slice(start, end),
    };
  },
);

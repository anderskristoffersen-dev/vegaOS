export const CITIES_BY_COUNTRY = {
  Australia: ['Adelaide', 'Brisbane', 'Melbourne', 'Perth', 'Sydney'],
  Canada: ['Montreal', 'Toronto', 'Vancouver'],
  France: ['Marseille', 'Paris'],
  Germany: ['Berlin', 'Frankfurt'],
  Italy: ['Milan', 'Palermo'],
  Japan: ['Osaka', 'Tokyo'],
  Lithuania: ['Siauliai', 'Vilnius'],
  Malaysia: ['Johor Bahru', 'Kuala Lumpur'],
  Mexico: ['Mexico City', 'Querétaro'],
  Nigeria: ['Abuja', 'Lagos'],
  Spain: ['Barcelona', 'Madrid'],
  Taiwan: ['Taichung', 'Taipei'],
  'United Arab Emirates': ['Dubai', 'Fujairah'],
  'United Kingdom': [
    'Belfast',
    'Cardiff',
    'Edinburgh',
    'Glasgow',
    'London',
    'Manchester',
  ],
  'United States': [
    'Ashburn',
    'Atlanta',
    'Boston',
    'Charlotte',
    'Chicago',
    'Columbus',
    'Dallas',
    'Denver',
    'Detroit',
    'Houston',
    'Los Angeles',
    'McAllen',
    'Memphis',
    'Miami',
    'New York',
    'Philadelphia',
    'Phoenix',
    'Salt Lake City',
    'San Jose',
    'Seattle',
    'Secaucus',
    'Washington',
  ],
};

export function getCitiesForCountry(countryName) {
  return CITIES_BY_COUNTRY[countryName] ?? [];
}

export function getContextMenuItems(countryName) {
  const items = [
    { label: 'Fastest', icon: 'fastest', type: 'fastest' },
    { label: 'Random', icon: 'random', type: 'random' },
  ];

  const cities = getCitiesForCountry(countryName);

  if (cities.length > 0) {
    cities.forEach((city) => {
      items.push({
        label: city,
        icon: 'city',
        type: 'city',
        city,
      });
    });
  } else {
    items.push({
      label: 'City name',
      icon: 'city',
      type: 'city',
      city: null,
    });
  }

  return items;
}

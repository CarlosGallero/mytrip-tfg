export async function searchCities(query: string): Promise<string[]> {
  const cleanQuery = query.trim();

  if (!cleanQuery || cleanQuery.length < 2) {
    return [];
  }

  try {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cleanQuery)}&count=5&language=es&format=json`
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const results = Array.isArray(data?.results) ? data.results : [];

    return results
      .map((item: any) => {
        const name = typeof item?.name === 'string' ? item.name.trim() : '';
        const admin1 = typeof item?.admin1 === 'string' ? item.admin1.trim() : '';
        const country = typeof item?.country === 'string' ? item.country.trim() : '';

        if (!name && !country) {
          return '';
        }

        const region = admin1 && admin1.toLowerCase() !== name.toLowerCase() ? admin1 : '';

        if (region && country) {
          return `${name}, ${region}, ${country}`;
        }

        if (country) {
          return `${name}, ${country}`;
        }

        return name;
      })
      .filter((value: string) => value.trim().length > 0)
      .slice(0, 5);
  } catch {
    return [];
  }
}

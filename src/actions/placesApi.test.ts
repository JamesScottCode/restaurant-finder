import { fsqFields } from '../consts/foursquare';
import { fakeApiResponse } from '../consts/fakeApiResponse';
import { safeFetchPlaces, resetRateLimiter } from './placesApi';
import { defaultCoordinates } from '../consts/map';

jest.mock('../utils/geo', () => ({
  createLL: (lat: number, lng: number) => `${lat},${lng}`,
}));

describe('fetchPlaces', () => {
  const coords = {
    latitude: defaultCoordinates.latitude,
    longitude: defaultCoordinates.longitude,
  };

  beforeEach(() => {
    // @ts-ignore
    global.fetch = jest.fn();
    resetRateLimiter();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns results and nextCursor when API call is successful and link header is provided', async () => {
    const fakeNextCursor = 'nextCursorValue';

    const fakeJson = Promise.resolve({
      results: fakeApiResponse.results,
    });

    // mock global.fetch to return a successful response with a link header.
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => fakeJson,
      headers: {
        get: (headerName: string) => {
          if (headerName === 'link') {
            return `<https://api.foursquare.com/v3/places/search?cursor=${fakeNextCursor}&fields=${fsqFields}>`;
          }
          return null;
        },
      },
    });

    const result = await safeFetchPlaces('food', undefined, coords);
    expect(global.fetch).toHaveBeenCalledTimes(1);

    expect(result).toEqual({
      results: fakeApiResponse.results,
      nextCursor: fakeNextCursor,
    });
  });

  it('returns results and undefined nextCursor when link header is missing', async () => {
    const fakeJson = Promise.resolve({
      results: fakeApiResponse.results,
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => fakeJson,
      headers: {
        get: () => null, // no link header
      },
    });

    const result = await safeFetchPlaces('food', undefined, coords);
    expect(result).toEqual({
      results: fakeApiResponse.results,
      nextCursor: undefined,
    });
  });

  it('throws an error when the response is not ok', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(safeFetchPlaces('food', undefined, coords)).rejects.toThrow(
      'Failed to fetch places',
    );
  });

  it('includes radius and sort parameters in the API call', async () => {
    const fakeJson = Promise.resolve({
      results: fakeApiResponse.results,
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => fakeJson,
      headers: {
        get: () => null,
      },
    });

    await safeFetchPlaces('coffee', 10, coords, 500, undefined, 'rating');

    const fetchUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(fetchUrl).toContain('radius=500');
    expect(fetchUrl).toContain('sort=rating');
  });
});

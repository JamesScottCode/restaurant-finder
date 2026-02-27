import { FoursquarePlacesResponse } from '../types/places';
import { createLL } from '../utils/geo';
import { useLayoutStore } from '../stores/layoutStore';

import { fsqFields } from '../consts/foursquare';

export async function rawFetchPlaces(
  query: string,
  limit = 10,
  coords: { latitude: number; longitude: number },
  radius?: number,
  cursor?: string,
  sort?: string,
): Promise<{
  results: FoursquarePlacesResponse['results'];
  nextCursor?: string;
}> {
  const API_KEY = process.env.REACT_APP_FOURSQUARE_API_KEY;
  if (!API_KEY) {
    const errorMsg =
      'Missing Foursquare API Key. Please set REACT_APP_FOURSQUARE_API_KEY in your environment.';
    useLayoutStore.getState().openToast({
      message: errorMsg,
      visible: true,
      isError: true,
    });
    throw new Error(errorMsg);
  }

  const { latitude, longitude } = coords;
  const ll = createLL(latitude, longitude);

  const searchParams = new URLSearchParams({
    query,
    ll,
    limit: String(limit),
  });

  if (radius) searchParams.set('radius', String(radius));
  if (cursor) searchParams.set('cursor', cursor);
  if (sort) searchParams.set('sort', sort);
  searchParams.set('fields', fsqFields);
  const API_URL = `http://localhost:8787/places/search?${searchParams.toString()}`;
  const response = await fetch(API_URL);

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    const errorMsg = `Failed to fetch places: ${response.status} ${response.statusText}${body ? ` — ${body}` : ''}`;
    useLayoutStore.getState().openToast({
      message: errorMsg,
      visible: true,
      isError: true,
    });
    throw new Error(errorMsg);
  }

  const data = (await response.json()) as any;

  let nextCursor: string | undefined;
  const linkHeader = response.headers.get('link');
  if (linkHeader) {
    const match = linkHeader.match(/cursor=([^&>]+)/);
    if (match) nextCursor = match[1];
  }

  const results = (data.results ?? []).map((r: any) => ({
    fsq_id: r.fsq_place_id ?? r.id ?? '',
    name: r.name ?? '',
    categories: r.categories ?? [],
    distance: r.distance ?? null,
    location: r.location ?? {},
    photos: r.photos ?? [],
    rating: r.rating ?? null,
    price: r.price ?? null,
    hours: r.hours ?? null,
    hours_popular: r.hours_popular ?? null,
    description: r.description ?? null,
    tel: r.tel ?? null,
    website: r.website ?? null,
    social_media: r.social_media ?? null,
    email: r.email ?? null,
    tips: r.tips ?? [],
    isOpenNow: r.hours?.open_now ?? null,

    geocodes: {
      main: {
        latitude: r.latitude ?? null,
        longitude: r.longitude ?? null,
      },
    },
  }));

  return { results, nextCursor };
}

let lastCall = 0;
let timestamps: number[] = [];

export async function safeFetchPlaces(
  query: string,
  limit = 10,
  coords: { latitude: number; longitude: number },
  radius?: number,
  cursor?: string,
  sort?: string,
) {
  const now = Date.now();
  if (now - lastCall < 800) {
    throw new Error('Please wait before making another request.');
  }
  timestamps = timestamps.filter((t) => t > now - 60_000);
  if (timestamps.length >= 30) {
    throw new Error('Rate limit exceeded. Try again later.');
  }
  lastCall = now;
  timestamps.push(now);
  return rawFetchPlaces(query, limit, coords, radius, cursor, sort);
}

export function resetRateLimiter() {
  lastCall = 0;
  timestamps = [];
}

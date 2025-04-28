import { create } from 'zustand';
import { safeFetchPlaces as apiFetchPlaces } from '../actions/placesApi';
import { Place } from '../types/places';
import { useLayoutStore } from './layoutStore';
import { defaultCoordinates } from '../consts/map';

interface CurrentSearch {
  query: string;
  radius: number;
  sort?: string;
  latitude: number;
  longitude: number;
}

interface PlacesStore {
  currentSearch: CurrentSearch;
  setCurrentSearch: (params: Partial<CurrentSearch>) => void;
  limit: number;
  restaurants: Place[];
  loading: boolean;
  error: string | null;
  nextCursor: string | null;
  getRandomRestaurant: () => Promise<Place | null>;
  fetchPlaces: (cursor?: string) => Promise<void>;
  hoveredRestaurantId: string;
  setHoveredRestaurantId: (hoveredRestaurantId: string) => void;
  selectedRestaurant: Place | null;
  setSelectedRestaurant: (id: string | null) => Promise<void>;
}

export const usePlacesStore = create<PlacesStore>((set, get) => ({
  currentSearch: {
    query: 'restaurant',
    radius: 1500,
    sort: 'relevance',
    latitude: defaultCoordinates.latitude,
    longitude: defaultCoordinates.longitude,
  },
  setCurrentSearch: (params) =>
    set((state) => ({
      currentSearch: {
        ...state.currentSearch,
        ...params,
      },
    })),
  limit: 10,
  restaurants: [],
  loading: false,
  error: null,
  nextCursor: null,

  getRandomRestaurant: async () => {
    set({ loading: true, error: null });
    try {
      const {
        currentSearch: { query, radius, sort, latitude, longitude },
      } = get();
      const { results } = await apiFetchPlaces(
        query,
        50,
        { latitude, longitude },
        radius,
        undefined,
        sort,
      );

      if (!results.length) {
        set({ loading: false });
        return null;
      }

      const random = results[Math.floor(Math.random() * results.length)];
      set({
        selectedRestaurant: random,
        loading: false,
      });
      return random;
    } catch (error: any) {
      set({ error: error.message || 'Error occurred', loading: false });
      useLayoutStore.getState().openToast({
        message:
          error.message || 'Error occurred while fetching a random restaurant',
        visible: true,
        isError: true,
      });
      return null;
    }
  },

  fetchPlaces: async (cursor?: string) => {
    set({ loading: true, error: null });
    try {
      const {
        currentSearch: { query, radius, sort, latitude, longitude },
        restaurants,
        limit,
      } = get();

      const { results, nextCursor } = await apiFetchPlaces(
        query,
        limit,
        { latitude, longitude },
        radius,
        cursor,
        sort,
      );

      const shouldAppend = Boolean(cursor);
      set({
        restaurants: shouldAppend ? [...restaurants, ...results] : results,
        loading: false,
        nextCursor: nextCursor ?? null,
      });
    } catch (error: any) {
      set({ error: error.message || 'Error occurred', loading: false });
      useLayoutStore.getState().openToast({
        message: error.message || 'Error occurred while fetching places',
        visible: true,
        isError: true,
      });
    }
  },

  selectedRestaurant: null,
  setSelectedRestaurant: async (id: string | null) => {
    const { restaurants } = get();
    const selected = restaurants.find((r) => r.fsq_id === id) || null;
    set({ selectedRestaurant: selected });
  },

  hoveredRestaurantId: '',
  setHoveredRestaurantId: (hoveredRestaurantId: string) =>
    set({ hoveredRestaurantId }),
}));

import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useScreenSize, ScreenSize } from '../../contexts/screenSizeContext';
import { usePlacesStore } from '../../stores/placesStore';
import ResultListItem from '../molecules/resultListItem';
import Spinner from '../atoms/spinner';
import { Place } from '../../types/places';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { useDelayedToggle } from '../../hooks/useDelayedToggle';

const Container = styled.div`
  border-radius: 8px;
  box-sizing: border-box;
  height: 100%;
  overflow-y: auto;
  padding: 1rem;
  width: 100%;
`;

const itemsContainerColumnNum = ($screenSize: ScreenSize) =>
  $screenSize === 'mobile'
    ? '1fr'
    : $screenSize === 'desktop'
      ? 'repeat(2, 1fr)'
      : $screenSize === 'desktop2k'
        ? 'repeat(3, 1fr)'
        : $screenSize === 'desktop4k'
          ? 'repeat(4, 1fr)'
          : 'repeat(2, 1fr)';

const ItemsContainer = styled.div<{ $screenSize: ScreenSize }>`
  display: grid;
  gap: 1rem;
  grid-template-columns: ${({ $screenSize }) =>
    itemsContainerColumnNum($screenSize)};
`;

const Sentinel = styled.div`
  height: 1px;
`;

const ResultsList: React.FC = React.memo(() => {
  const { screenSize } = useScreenSize();

  // subscribe only to each slice
  const restaurants = usePlacesStore((s) => s.restaurants);
  const loading = usePlacesStore((s) => s.loading);
  const error = usePlacesStore((s) => s.error);
  const nextCursor = usePlacesStore((s) => s.nextCursor);
  const fetchPlaces = usePlacesStore((s) => s.fetchPlaces);
  // const query = usePlacesStore((s) => s.currentSearch.query);
  // const radius = usePlacesStore((s) => s.currentSearch.radius);
  const selectedFsqId = usePlacesStore((s) => s.selectedRestaurant?.fsq_id);

  // lat/lng never changes
  // const ll = useMemo(() => createLL(latitude, longitude), []);

  const containerRef = useRef<HTMLDivElement>(null);

  // subscribe to query/radius changes for scroll-to-top, without re-render
  useEffect(() => {
    const store = usePlacesStore;
    const initial = store.getState().currentSearch;
    let prevQuery = initial.query;
    let prevRadius = initial.radius;

    const unsubscribe = store.subscribe((state) => {
      const { query: q, radius: r } = state.currentSearch;
      if (q !== prevQuery || r !== prevRadius) {
        containerRef.current?.scrollTo(0, 0);
        prevQuery = q;
        prevRadius = r;
      }
    });

    return unsubscribe;
  }, []);

  // 1) initial fetch
  useEffect(() => {
    if (restaurants.length === 0) {
      fetchPlaces();
    }
  }, [restaurants.length, fetchPlaces]);

  // 2) scroll to top on query/radius change
  // useEffect(() => {
  //   containerRef.current?.scrollTo(0, 0);
  // }, [query, radius]);

  // 3) scroll into view when selectedFsqId changes
  useEffect(() => {
    if (selectedFsqId) {
      document
        .getElementById(selectedFsqId)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedFsqId]);

  // 4) infinite scroll
  const infiniteScrollEnabled = useDelayedToggle(false, 2000);
  const sentinelRef = useInfiniteScroll(
    () => {
      if (nextCursor && !loading) {
        fetchPlaces(nextCursor);
      }
    },
    infiniteScrollEnabled,
    { delay: 2000, threshold: 0.1 },
  );

  if (restaurants.length === 0) return null;

  return (
    <Container ref={containerRef}>
      <ItemsContainer $screenSize={screenSize}>
        {restaurants?.map((restaurant: Place) => (
          <ResultListItem
            key={restaurant.fsq_id}
            id={restaurant.fsq_id}
            data={restaurant}
          />
        ))}
      </ItemsContainer>
      {loading && <Spinner />}
      {error && <div>Error loading restaurants: {error}</div>}
      <Sentinel ref={sentinelRef} data-testid="sentinel" />
    </Container>
  );
});

export default ResultsList;

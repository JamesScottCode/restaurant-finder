import { FC, useCallback } from 'react';
import styled from 'styled-components';
import { ScreenSize, useScreenSize } from '../../contexts/screenSizeContext';
import { usePlacesStore } from '../../stores/placesStore';
import Slider from '../atoms/slider';
import Search from '../atoms/search';
import SortOptions from '../atoms/sort';
import ThemedButton from '../atoms/button';
import { useLayoutStore } from '../../stores/layoutStore';
import ItemDetails from '../organisms/itemDetails';

const Container = styled.div<{ $screenSize: ScreenSize }>`
  display: flex;
  flex-direction: ${({ $screenSize }) =>
    $screenSize === 'mobile' || $screenSize === 'tablet' ? 'column' : 'row'};
  justify-content: space-evenly;
  height: ${({ $screenSize }) =>
    $screenSize === 'mobile' || $screenSize === 'tablet' ? '200px' : 'auto'};
  width: ${({ $screenSize }) =>
    $screenSize === 'mobile'
      ? '300px'
      : $screenSize === 'tablet'
        ? '400px'
        : 'auto'};
`;

const Filters: FC = () => {
  const getRandomRestaurant = usePlacesStore((s) => s.getRandomRestaurant);
  const fetchPlaces = usePlacesStore((s) => s.fetchPlaces);
  const currentSearch = usePlacesStore((s) => s.currentSearch);
  const setCurrentSearch = usePlacesStore((s) => s.setCurrentSearch);

  const { radius, query } = currentSearch;
  const { openModal } = useLayoutStore();
  const { screenSize } = useScreenSize();

  // SEARCH change
  const onSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setCurrentSearch({ query: e.target.value });
    },
    [setCurrentSearch],
  );

  // SEARCH submit (Enter or debounce)
  const onSearchSubmit = useCallback(() => {
    fetchPlaces();
  }, [fetchPlaces]);

  // SLIDER change & finish
  const onSliderChange = useCallback(
    (val: number) => {
      setCurrentSearch({ radius: val });
    },
    [setCurrentSearch],
  );
  const onSliderFinished = useCallback(() => {
    fetchPlaces();
  }, [fetchPlaces]);

  // RANDOM button
  const handleGetRandomRestaurant = useCallback(async () => {
    const r = await getRandomRestaurant();
    if (r) openModal(<ItemDetails />);
  }, [getRandomRestaurant, openModal]);

  return (
    <Container $screenSize={screenSize}>
      <Search
        value={query}
        onChange={onSearchChange}
        onSubmit={onSearchSubmit}
        placeholder="Search..."
      />
      <SortOptions />
      <ThemedButton onClick={handleGetRandomRestaurant} text="Random" />
      <Slider
        value={radius}
        onChange={onSliderChange}
        onFinished={onSliderFinished}
      />
    </Container>
  );
};

export default Filters;

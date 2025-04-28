import { FC, useMemo, useRef, useState } from 'react';
import Map, {
  NavigationControl,
  Source,
  Layer,
  Marker,
} from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as turf from '@turf/turf';
import styled, { useTheme } from 'styled-components';
import { usePlacesStore } from '../../stores/placesStore';
import { Place } from '../../types/places';
import HoverableMarker from '../atoms/hoverableMarker';
import ToggleSwitch from '../atoms/toggleSwitch';

const Container = styled.div`
  border-radius: 8px;
  height: 100%;
  overflow: hidden;
  position: relative;
  width: 100%;
`;
const ToggleContainer = styled.div`
  left: 15px;
  position: absolute;
  top: 15px;
  z-index: 10;
`;

const mapStyle = process.env.REACT_APP_MAPTILER_API_KEY
  ? `https://api.maptiler.com/maps/jp-mierune-gray/style.json?key=${process.env.REACT_APP_MAPTILER_API_KEY}`
  : 'https://demotiles.maplibre.org/style.json';

const InteractiveMap: FC = () => {
  const theme = useTheme();
  const mapRef = useRef<any>(null);

  const latitude = usePlacesStore((s) => s.currentSearch.latitude);
  const longitude = usePlacesStore((s) => s.currentSearch.longitude);
  const radius = usePlacesStore((s) => s.currentSearch.radius);
  const restaurants = usePlacesStore((s) => s.restaurants);

  const setCurrentSearch = usePlacesStore((s) => s.setCurrentSearch);
  const fetchPlaces = usePlacesStore((s) => s.fetchPlaces);

  // rebuild the circle only when [lng,lat,radius] change
  const circleGeoJson = useMemo(
    () =>
      turf.circle([longitude, latitude], radius / 1000, {
        steps: 64,
        units: 'kilometers',
      }),
    [longitude, latitude, radius],
  );

  const [showCategories, setShowCategories] = useState(false);
  const toggle = () => setShowCategories((v) => !v);

  return (
    <Container>
      <ToggleContainer>
        <ToggleSwitch checked={showCategories} onChange={toggle} />
      </ToggleContainer>

      <Map
        mapLib={import('maplibre-gl')}
        ref={mapRef}
        initialViewState={{ latitude, longitude, zoom: 15 }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={mapStyle}
        attributionControl={false}
      >
        <NavigationControl
          style={{ position: 'absolute', top: 10, right: 10 }}
        />

        <Marker
          latitude={latitude}
          longitude={longitude}
          draggable
          onDragEnd={async (evt) => {
            const [lng, lat] = evt.lngLat.toArray();
            setCurrentSearch({ latitude: lat, longitude: lng });
            await fetchPlaces();
          }}
        >
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: 'black',
              border: '2px solid white',
            }}
          />
        </Marker>

        <Source id="circle-source" type="geojson" data={circleGeoJson}>
          <Layer
            id="circle-fill-layer"
            type="fill"
            paint={{ 'fill-color': theme.highlight, 'fill-opacity': 0.15 }}
          />
          <Layer
            id="circle-border-layer"
            type="line"
            paint={{ 'line-color': theme.highlight, 'line-width': 2 }}
          />
        </Source>

        {restaurants.map((r: Place) => (
          <HoverableMarker
            key={r.fsq_id}
            mapRef={mapRef}
            restaurant={r}
            showCategory={showCategories}
          />
        ))}
      </Map>
    </Container>
  );
};

export default InteractiveMap;

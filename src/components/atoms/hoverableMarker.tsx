// src/components/atoms/HoverableMarker.tsx

import React, { FC, useEffect, useState, useCallback, useMemo } from 'react';
import { Marker } from 'react-map-gl/maplibre';
import styled from 'styled-components';
import ReactDOM from 'react-dom';
import ResultListItem from '../molecules/resultListItem';
import { useScreenSize } from '../../contexts/screenSizeContext';
import { usePlacesStore } from '../../stores/placesStore';
import { Category } from '../../types/places';

interface HoverableMarkerProps {
  restaurant: {
    fsq_id: string;
    geocodes: { main: { latitude: number; longitude: number } };
    categories: Category[];
    name: string;
  };
  mapRef: React.RefObject<any>;
  showCategory?: boolean;
}

const MarkerWrapper = styled.div<{
  $isHovered: boolean;
  $showCategory: boolean;
}>`
  background: ${({ theme, $isHovered }) =>
    $isHovered ? theme.highlight : 'grey'};
  border: 2px solid white;
  border-radius: ${({ $showCategory }) => ($showCategory ? '8px' : '50%')};
  color: white;
  cursor: pointer;
  height: 15px;
  padding: ${({ $showCategory }) => ($showCategory ? '2px 2px 6px 2px' : '0')};
  position: relative;
  width: ${({ $showCategory }) => ($showCategory ? 'auto' : '15px')};
  z-index: ${({ $isHovered }) => ($isHovered ? 2000 : 1001)};
`;

const Tooltip = styled.div<{ $showCategory: boolean }>`
  background: white;
  border-radius: 8px;
`;

const TooltipPortal: FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) =>
  ReactDOM.createPortal(
    <div style={{ position: 'absolute', ...style }}>{children}</div>,
    document.body,
  );

const HoverableMarker: FC<HoverableMarkerProps> = React.memo(
  ({ restaurant, mapRef, showCategory = false }) => {
    const { fsq_id, geocodes, categories, name } = restaurant;
    const { latitude, longitude } = geocodes.main;

    // per-field selectors
    const selectedRestaurant = usePlacesStore((s) => s.selectedRestaurant);
    const selectedId = selectedRestaurant?.fsq_id;
    // const hoveredId = usePlacesStore((s) => s.hoveredRestaurantId);
    const setHoveredId = usePlacesStore((s) => s.setHoveredRestaurantId);
    const setSelected = usePlacesStore((s) => s.setSelectedRestaurant);

    const { screenSize } = useScreenSize();

    // const isHovered = hoveredId === fsq_id;
    const isHovered = usePlacesStore(
      (s) => s.hoveredRestaurantId === restaurant.fsq_id,
    );
    const isSelected = selectedId === fsq_id;

    // local tooltip state
    const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number }>(
      {
        top: 0,
        left: 0,
      },
    );
    const [showTooltip, setShowTooltip] = useState(false);

    // compute tooltip position when selected
    useEffect(() => {
      if (isSelected && mapRef.current) {
        const point = mapRef.current.project({ lat: latitude, lon: longitude });
        const rect = mapRef.current.getContainer().getBoundingClientRect();
        setTooltipPos({
          top: point.y + rect.top,
          left: point.x + rect.left,
        });
      } else {
        setShowTooltip(false);
      }
    }, [isSelected, latitude, longitude, mapRef]);

    // category label memo
    const displayedCategory = useMemo(
      () => categories[0]?.short_name ?? '',
      [categories],
    );

    // handlers
    const handleMouseEnter = useCallback(() => {
      setHoveredId(fsq_id);
    }, [fsq_id, setHoveredId]);

    const handleMouseLeave = useCallback(() => {
      setHoveredId('');
      setShowTooltip(false);
    }, [setHoveredId]);

    const handleClick = useCallback(() => {
      setSelected(fsq_id);
      setShowTooltip(true);
    }, [fsq_id, setSelected]);

    return (
      <Marker latitude={latitude} longitude={longitude} anchor="center">
        <MarkerWrapper
          $isHovered={isHovered}
          $showCategory={showCategory}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
          aria-label={`View details for ${name}`}
          role="button"
        >
          {showCategory && displayedCategory}

          {showTooltip && isSelected && screenSize !== 'mobile' && (
            <TooltipPortal
              style={{
                top: tooltipPos.top,
                left: tooltipPos.left,
                transform: 'translate(-150px, -200px)',
                zIndex: 8000,
              }}
            >
              <Tooltip $showCategory={showCategory}>
                <ResultListItem
                  data={selectedRestaurant!}
                  isTooltip={true}
                  id={fsq_id}
                />
              </Tooltip>
            </TooltipPortal>
          )}
        </MarkerWrapper>
      </Marker>
    );
  },
);

export default HoverableMarker;

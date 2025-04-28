// src/components/molecules/ResultListItem.tsx

import React, { FC, useCallback } from 'react';
import styled from 'styled-components';
import { usePlacesStore } from '../../stores/placesStore';
import { useLayoutStore } from '../../stores/layoutStore';
import { Category, Place } from '../../types/places';
import Hours from '../atoms/hours';
import Tag from '../atoms/tag';
import StarRating from '../atoms/starRating';
import OpenStatus from '../atoms/openStatus';
import ItemDetails from '../organisms/itemDetails';

const OuterContainer = styled.div<{ $isToolTip?: boolean }>`
  box-sizing: border-box;
  height: 220px;
  position: relative;
  width: ${({ $isToolTip }) => ($isToolTip ? '300px' : '100%')};
  z-index: ${({ $isToolTip }) => ($isToolTip ? 8000 : 'auto')};
`;

const InnerContainer = styled.div<{ $isHovered: boolean }>`
  box-sizing: border-box;
  border: ${({ $isHovered, theme }) =>
    $isHovered
      ? `2px solid ${theme.highlight || '#000000'}`
      : '2px solid rgb(201, 201, 201)'};
  border-radius: 10px;
  box-shadow: ${({ $isHovered }) =>
    $isHovered ? '0 4px 8px rgba(0,0,0,0.15)' : '2px 2px 6px rgba(0,0,0,0.2)'};
  display: flex;
  flex-direction: column;
  height: 100%;
  left: 0;
  padding: 10px;
  position: absolute;
  top: 0;
  transition:
    transform 0.2s ease,
    border 0.2s ease,
    box-shadow 0.2s ease;
  width: 100%;

  &:hover {
    cursor: pointer;
    transform: scale(1.02);
    z-index: 2;
  }
`;

const TitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
`;

const Title = styled.span`
  color: ${({ theme }) => theme.highlight || '#000000'};
  font-size: 1rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Address = styled.span`
  color: ${({ theme }) => theme.font || '#000000'};
  font-size: 0.8rem;
  font-weight: 600;
`;

const Photo = styled.img`
  border-radius: 10px;
  height: 150px;
  width: 150px;
  margin-top: 10px;
  object-fit: cover;
`;

const Row = styled.div`
  display: flex;
`;

const Details = styled.div`
  display: flex;
  flex-direction: column;
  margin-left: 20px;
  max-width: 100%;
`;

const DetailText = styled.span`
  font-size: clamp(0.8em, 1em, 1.5em);
`;

const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 5px;
`;

const Column = styled.div`
  display: flex;
  flex-direction: column;
`;

const getPriceText = (price: number) => '\u00A5 '.repeat(Math.max(price, 0));

interface ResultListItemProps {
  data: Place;
  id: string;
  isTooltip?: boolean;
}

const ResultListItem: FC<ResultListItemProps> = React.memo(
  ({ data, isTooltip, id }) => {
    const openModal = useLayoutStore((s) => s.openModal);
    const setHoveredId = usePlacesStore((s) => s.setHoveredRestaurantId);
    const setSelected = usePlacesStore((s) => s.setSelectedRestaurant);

    const {
      fsq_id,
      name,
      location: { address },
      rating,
      price,
      distance,
      categories = [],
      hours,
      closed_bucket,
      photos,
    } = data;
    const isHovered = usePlacesStore((s) => s.hoveredRestaurantId === fsq_id);

    // const isHovered = hoveredId === fsq_id;
    const photo = photos?.[0];
    const photoSrc =
      photo?.prefix && photo?.suffix
        ? `${photo.prefix}150x150${photo.suffix}`
        : '/no_img_available.png';

    // memoize handlers so identities are stable
    const handleMouseEnter = useCallback(() => {
      setHoveredId(fsq_id);
    }, [fsq_id, setHoveredId]);

    const handleMouseLeave = useCallback(() => {
      setHoveredId('');
    }, [setHoveredId]);

    const handleClick = useCallback(() => {
      setSelected(fsq_id);
      openModal(<ItemDetails />);
    }, [fsq_id, setSelected, openModal]);

    return (
      <OuterContainer
        id={id}
        $isToolTip={isTooltip}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        data-testid="result-list-item"
      >
        <InnerContainer $isHovered={isHovered}>
          <TitleRow>
            <Title>{name ?? 'unnamed'}</Title>
            <OpenStatus closedBucket={closed_bucket} />
          </TitleRow>

          <TitleRow>
            {address && <Address>{address}</Address>}
            {rating != null && <StarRating rating={rating} />}
          </TitleRow>

          <Row>
            <Column>
              <Photo src={photoSrc} alt={`${name}-photo`} />
            </Column>
            <Column>
              <Details>
                {distance != null && <DetailText>{distance}m</DetailText>}
                {price != null && (
                  <DetailText>{getPriceText(price)}</DetailText>
                )}
                <TagRow>
                  {!isTooltip &&
                    categories.map((cat: Category, idx: number) => (
                      <Tag key={`${cat.id}-${idx}`} label={cat.short_name} />
                    ))}
                </TagRow>
                {hours && <Hours hours={hours} />}
              </Details>
            </Column>
          </Row>
        </InnerContainer>
      </OuterContainer>
    );
  },
);

export default ResultListItem;

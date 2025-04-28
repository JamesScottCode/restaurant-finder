import React, { FC } from 'react';
import styled from 'styled-components';
import { usePlacesStore } from '../../stores/placesStore';
import { Photo } from '../../types/places';
import Spinner from '../atoms/spinner';
import Hours from '../atoms/hours';
import Carousel from '../molecules/carousel';
import Reviews from '../molecules/reviews';
import Socials from '../molecules/socials';
import StaticMap from '../molecules/staticMap';
import StarRating from '../atoms/starRating';

const Container = styled.div`
  display: flex;
  flex-direction: column;
`;

const Row = styled.div<{ $align?: string }>`
  display: flex;
  flex-direction: row;
  margin-bottom: 10px;
  margin-top: 10px;
  width: 100%;
  justify-content: ${(props) => props.$align ?? 'left'};
  border: none;
  border-bottom: 1px solid #ccc;
  padding-bottom: 10px;
`;

const Title = styled.h2``;

const Label = styled.span<{ $fontWeight?: string }>`
  font-size: 12px;
  font-weight: ${(props) => props.$fontWeight ?? '400'};
  margin-right: 15px;
  text-align: left;
  min-width: 40px;
`;

const Link = styled.a<{ $fontWeight?: string }>`
  color: ${({ theme }) => theme.highlight || 'blue'};
  font-size: 12px;
  font-weight: ${(props) => props.$fontWeight ?? '400'};
  margin-right: 15px;
  text-align: left;
  white-space: normal;
  word-break: break-word;
  overflow-wrap: break-word;
  display: inline-block;
`;

const ItemDetails: FC = () => {
  const selectedRestaurant = usePlacesStore((s) => s.selectedRestaurant);

  if (!selectedRestaurant) return <Spinner />;

  const {
    distance,
    geocodes,
    hours,
    menu,
    name,
    tel,
    photos,
    rating,
    social_media,
    tips,
    website,
  } = selectedRestaurant;

  const { main } = geocodes;
  const { latitude, longitude } = main;

  const { facebook_id, instagram, twitter } = social_media;

  const { is_local_holiday, open_now } = hours;

  const displayablePhotos: Array<{ alt: string; src: string }> = photos?.map(
    (photoData: Photo) => {
      return {
        alt: photoData.id ?? '',
        src: `${photoData?.prefix ?? ''}800x600${photoData?.suffix ?? ''}`, //TODO: Display correct size based on screen size;
      };
    },
  );

  return (
    <Container>
      {rating && <StarRating rating={rating} />}
      <Row $align="center">
        <Title>{name}</Title>
      </Row>
      <Row>
        <StaticMap
          distance={distance}
          latitude={latitude}
          longitude={longitude}
        />
      </Row>
      {is_local_holiday ||
        (open_now && (
          <Row>
            <Label $fontWeight="600">Hours: </Label>
            <Hours hours={hours} />
          </Row>
        ))}
      {website && (
        <Row>
          <Label $fontWeight="600">Website: </Label>
          <Link href={website}>{website}</Link>
        </Row>
      )}
      {tel && (
        <Row>
          <Label $fontWeight="600">Tel: </Label>
          <Link href={`tel:${tel}`}>{tel}</Link>
        </Row>
      )}
      {menu && (
        <Row>
          <Label $fontWeight="600">Menu: </Label>
          <Link href={menu}>{menu}</Link>
        </Row>
      )}
      {(facebook_id || instagram || twitter) && (
        <Row>
          <Label $fontWeight="600">Social Media: </Label>
          <Socials />
        </Row>
      )}
      {displayablePhotos?.length > 0 && <Carousel images={displayablePhotos} />}
      {tips?.length > 0 && (
        <Row>
          <Reviews />
        </Row>
      )}
    </Container>
  );
};

export default ItemDetails;

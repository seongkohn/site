'use client';

import { useEffect, useRef } from 'react';

type MapStyle = { featureType?: string; elementType?: string; stylers: Record<string, unknown>[] };

const MAP_STYLES: MapStyle[] = [
  { featureType: 'administrative', elementType: 'labels.text.fill', stylers: [{ color: '#444444' }] },
  { featureType: 'landscape', elementType: 'all', stylers: [{ color: '#f2f2f2' }] },
  { featureType: 'poi', elementType: 'all', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'all', stylers: [{ saturation: -100 }, { lightness: 45 }] },
  { featureType: 'road.highway', elementType: 'all', stylers: [{ visibility: 'simplified' }] },
  { featureType: 'road.arterial', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'all', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'all', stylers: [{ color: '#a8cfd8' }, { visibility: 'on' }] },
];

// Seongkohn Traders Corp — 38, Hakdong-ro 50-gil, Gangnam-gu, Seoul
const LOCATION = { lat: 37.5185, lng: 127.0368 };

declare global {
  interface Window {
    initGoogleMap?: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    google?: any;
  }
}

export default function GoogleMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    function initMap() {
      if (!mapRef.current || mapInstanceRef.current) return;
      const map = new window.google!.maps.Map(mapRef.current, {
        center: LOCATION,
        zoom: 11,
        styles: MAP_STYLES,
        disableDefaultUI: true,
        zoomControl: true,
      });
      const marker = new window.google!.maps.Marker({
        position: LOCATION,
        map,
        title: '성곤무역(주)',
      });

      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=%EC%84%B1%EA%B3%A4%EB%AC%B4%EC%97%AD+%EA%B0%95%EB%82%A8%EA%B5%AC+%EC%84%9C%EC%9A%B8`;
      map.addListener('click', () => window.open(mapsUrl, '_blank'));
      marker.addListener('click', () => window.open(mapsUrl, '_blank'));

      mapInstanceRef.current = map;
    }

    if (window.google?.maps) {
      initMap();
      return;
    }

    window.initGoogleMap = initMap;

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;

    if (document.querySelector('script[data-gmaps]')) {
      return;
    }

    const script = document.createElement('script');
    script.setAttribute('data-gmaps', '1');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initGoogleMap`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      window.initGoogleMap = undefined;
    };
  }, []);

  return <div ref={mapRef} style={{ width: '100%', height: '250px', cursor: 'pointer' }} />;
}

// 네이버 지도(Dynamic Map)에 마커를 표시하는 공통 컴포넌트. VITE_NAVER_MAP_CLIENT_ID 필요.
import { useEffect, useRef, useState } from 'react';

export type MapMarkerItem = {
  id: string | number;
  latitude: number;
  longitude: number;
  title: string;
  description?: string;
};

type NaverLatLng = object;
type NaverLatLngBounds = { extend: (latLng: NaverLatLng) => void };
type NaverMarker = object;
type NaverInfoWindow = { open: (map: NaverMapInstance, marker: NaverMarker) => void; close: () => void };
type NaverMapInstance = { fitBounds: (bounds: NaverLatLngBounds) => void };

type NaverMapsNamespace = {
  maps: {
    Map: new (el: HTMLElement, options: { center: NaverLatLng; zoom: number }) => NaverMapInstance;
    LatLng: new (lat: number, lng: number) => NaverLatLng;
    LatLngBounds: new () => NaverLatLngBounds;
    Marker: new (options: { position: NaverLatLng; map: NaverMapInstance; title?: string }) => NaverMarker;
    InfoWindow: new (options: { content: string }) => NaverInfoWindow;
    Event: { addListener: (target: NaverMarker, eventName: string, handler: () => void) => void };
  };
};

declare global {
  interface Window {
    naver?: NaverMapsNamespace;
  }
}

const SCRIPT_ID = 'naver-maps-sdk';
let loadPromise: Promise<void> | null = null;

function loadNaverMapsSdk(clientId: string): Promise<void> {
  if (window.naver?.maps) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('네이버 지도 스크립트 로드 실패')));
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('네이버 지도 스크립트 로드 실패'));
    document.head.appendChild(script);
  });

  return loadPromise;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

type NaverMapProps = {
  markers: MapMarkerItem[];
  height?: number;
};

export function NaverMap({ markers, height = 360 }: NaverMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState('');
  const clientId = import.meta.env.VITE_NAVER_MAP_CLIENT_ID as string | undefined;

  useEffect(() => {
    if (!clientId) {
      setLoadError('지도 API 키가 설정되지 않았습니다.');
      return;
    }

    let ignore = false;

    loadNaverMapsSdk(clientId)
      .then(() => {
        if (!ignore) setIsReady(true);
      })
      .catch(() => {
        if (!ignore) setLoadError('지도를 불러오지 못했습니다.');
      });

    return () => {
      ignore = true;
    };
  }, [clientId]);

  useEffect(() => {
    if (!isReady || !containerRef.current || !window.naver) return;

    const validMarkers = markers.filter((marker) => Number.isFinite(marker.latitude) && Number.isFinite(marker.longitude));
    if (validMarkers.length === 0) return;

    const { maps } = window.naver;
    const center = new maps.LatLng(validMarkers[0].latitude, validMarkers[0].longitude);
    const map = new maps.Map(containerRef.current, { center, zoom: 12 });
    const bounds = new maps.LatLngBounds();
    let openInfoWindow: NaverInfoWindow | null = null;

    validMarkers.forEach((item) => {
      const position = new maps.LatLng(item.latitude, item.longitude);
      bounds.extend(position);

      const marker = new maps.Marker({ position, map, title: item.title });

      maps.Event.addListener(marker, 'click', () => {
        openInfoWindow?.close();
        const content = `<div style="padding:8px 12px;font-size:13px;line-height:1.5;">
          <strong>${escapeHtml(item.title)}</strong>
          ${item.description ? `<div style="color:#666;margin-top:2px;">${escapeHtml(item.description)}</div>` : ''}
        </div>`;
        openInfoWindow = new maps.InfoWindow({ content });
        openInfoWindow.open(map, marker);
      });
    });

    if (validMarkers.length > 1) {
      map.fitBounds(bounds);
    }
  }, [isReady, markers]);

  if (loadError) {
    return <div className="status-banner status-banner-error">{loadError}</div>;
  }

  return <div ref={containerRef} style={{ width: '100%', height, borderRadius: 12, overflow: 'hidden' }} aria-label="도서관 위치 지도" />;
}

// 네이버 지도(Dynamic Map)에 마커를 표시하는 공통 컴포넌트. VITE_NAVER_MAP_CLIENT_ID 필요.
import { useEffect, useRef, useState } from 'react';

export type MapMarkerItem = {
  id: string | number;
  latitude: number;
  longitude: number;
  title: string;
  address?: string;
  operationTime?: string;
  closedDays?: string;
  homepageUrl?: string;
};

type NaverLatLng = object;
type NaverLatLngBounds = { extend: (latLng: NaverLatLng) => void };
type NaverMarker = object;
type NaverInfoWindow = { open: (map: NaverMapInstance, marker: NaverMarker) => void; close: () => void };
type NaverMapInstance = {
  fitBounds: (bounds: NaverLatLngBounds) => void;
  setCenter: (latLng: NaverLatLng) => void;
  setZoom: (zoom: number) => void;
};
type NaverMarkerIcon = { content: string; anchor: unknown };

type NaverMapsNamespace = {
  maps: {
    Map: new (el: HTMLElement, options: { center: NaverLatLng; zoom: number }) => NaverMapInstance;
    LatLng: new (lat: number, lng: number) => NaverLatLng;
    LatLngBounds: new () => NaverLatLngBounds;
    Point: new (x: number, y: number) => unknown;
    Marker: new (options: { position: NaverLatLng; map: NaverMapInstance; title?: string; icon?: NaverMarkerIcon; zIndex?: number }) => NaverMarker;
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

function buildInfoWindowContent(item: MapMarkerItem) {
  const metaText = [item.operationTime ? `운영 ${item.operationTime}` : '', item.closedDays ? `휴관 ${item.closedDays}` : '']
    .filter(Boolean)
    .join(' · ');
  const safeHomepageUrl = item.homepageUrl && /^https?:\/\//.test(item.homepageUrl) ? item.homepageUrl : null;

  return `<div style="padding:10px 14px;font-size:13px;line-height:1.6;max-width:220px;">
    <strong style="display:block;margin-bottom:2px;">${escapeHtml(item.title)}</strong>
    ${item.address ? `<div style="color:#666;">${escapeHtml(item.address)}</div>` : ''}
    ${metaText ? `<div style="color:#888;margin-top:2px;">${escapeHtml(metaText)}</div>` : ''}
    ${safeHomepageUrl ? `<a href="${escapeHtml(safeHomepageUrl)}" target="_blank" rel="noreferrer" style="color:#2f6df6;display:inline-block;margin-top:4px;">홈페이지 ↗</a>` : ''}
  </div>`;
}

const USER_LOCATION_ICON_HTML =
  '<div style="width:16px;height:16px;border-radius:50%;background:#2f6df6;border:3px solid #fff;box-shadow:0 0 0 2px rgba(47,109,246,0.4);"></div>';

type NaverMapProps = {
  markers: MapMarkerItem[];
  userLocation?: { latitude: number; longitude: number } | null;
  height?: number | string;
  /** 외부에서 선택한 마커 id — 지정하면 해당 마커로 지도 중심 이동 + 정보창을 연다 */
  selectedId?: string | number | null;
  /** 마커 클릭 시 호출된다. 지도 중심 이동/정보창 오픈은 selectedId로 제어한다. */
  onMarkerClick?: (id: string | number) => void;
};

export function NaverMap({ markers, userLocation, height = 360, selectedId, onMarkerClick }: NaverMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<NaverMapInstance | null>(null);
  const markerEntriesRef = useRef<Map<string | number, { marker: NaverMarker; position: NaverLatLng; item: MapMarkerItem }>>(new Map());
  const infoWindowRef = useRef<NaverInfoWindow | null>(null);
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
    const hasUserLocation = !!userLocation && Number.isFinite(userLocation.latitude) && Number.isFinite(userLocation.longitude);

    if (validMarkers.length === 0 && !hasUserLocation) return;

    const { maps } = window.naver;
    const initialCenter = validMarkers[0]
      ? new maps.LatLng(validMarkers[0].latitude, validMarkers[0].longitude)
      : new maps.LatLng(userLocation!.latitude, userLocation!.longitude);
    const map = new maps.Map(containerRef.current, { center: initialCenter, zoom: 12 });
    mapRef.current = map;
    markerEntriesRef.current = new Map();

    const bounds = new maps.LatLngBounds();

    validMarkers.forEach((item) => {
      const position = new maps.LatLng(item.latitude, item.longitude);
      bounds.extend(position);

      const marker = new maps.Marker({ position, map, title: item.title });
      markerEntriesRef.current.set(item.id, { marker, position, item });

      maps.Event.addListener(marker, 'click', () => {
        onMarkerClick?.(item.id);
      });
    });

    if (hasUserLocation) {
      const userPosition = new maps.LatLng(userLocation!.latitude, userLocation!.longitude);
      bounds.extend(userPosition);
      new maps.Marker({
        position: userPosition,
        map,
        title: '내 위치',
        icon: { content: USER_LOCATION_ICON_HTML, anchor: new maps.Point(8, 8) },
        zIndex: 200,
      });
    }

    if (validMarkers.length + (hasUserLocation ? 1 : 0) > 1) {
      map.fitBounds(bounds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, markers, userLocation]);

  useEffect(() => {
    if (!isReady || selectedId == null || !window.naver || !mapRef.current) return;

    const entry = markerEntriesRef.current.get(selectedId);
    if (!entry) return;

    const { maps } = window.naver;
    mapRef.current.setCenter(entry.position);
    mapRef.current.setZoom(15);

    infoWindowRef.current?.close();
    const infoWindow = new maps.InfoWindow({ content: buildInfoWindowContent(entry.item) });
    infoWindow.open(mapRef.current, entry.marker);
    infoWindowRef.current = infoWindow;
  }, [selectedId, isReady]);

  function handleMoveToMyLocation() {
    if (!mapRef.current || !userLocation || !window.naver) return;
    const { maps } = window.naver;
    mapRef.current.setCenter(new maps.LatLng(userLocation.latitude, userLocation.longitude));
    mapRef.current.setZoom(15);
  }

  if (loadError) {
    return <div className="status-banner status-banner-error">{loadError}</div>;
  }

  return (
    <div style={{ position: 'relative', width: '100%', height, borderRadius: 12, overflow: 'hidden' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} aria-label="도서관 위치 지도" />
      {userLocation ? (
        <button
          type="button"
          onClick={handleMoveToMyLocation}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            border: '1px solid #d9dde3',
            borderRadius: 8,
            padding: '6px 10px',
            background: '#fff',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
          }}
        >
          📍 내 위치로 이동
        </button>
      ) : null}
    </div>
  );
}

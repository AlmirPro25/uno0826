/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║  🗺️ GEOLOCATION & MAPS SUPREME MASTER                                        ║
 * ║  Google Maps, Mapbox, Leaflet, Location Services                             ║
 * ║                                                                              ║
 * ║  "Localização é contexto. Contexto é valor."                                 ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

export const GEOLOCATION_MAPS_MANIFEST = `
# 🗺️ GEOLOCATION & MAPS SUPREME MASTER

> "Localização é contexto. Contexto é valor. O mundo é seu canvas."

## ATIVAÇÃO

Este manifesto é ativado quando o usuário menciona:
- Maps, Mapas, Geolocation, Localização, GPS
- Google Maps, Mapbox, Leaflet, OpenStreetMap, HERE
- Markers, Polylines, Polygons, Geofencing
- Routing, Directions, Distance, ETA
- Geocoding, Reverse Geocoding, Places
- Latitude, Longitude, Coordinates
- Heatmaps, Clustering, Layers
- Store Locator, Delivery Tracking

## FILOSOFIA

### Princípios Invioláveis
1. **Privacy First** - Localização é dado sensível, trate com cuidado
2. **Permission UX** - Peça permissão no momento certo, com contexto
3. **Graceful Degradation** - Funcione sem GPS quando possível
4. **Performance** - Lazy load SDKs, cluster markers
5. **Offline Support** - Cache tiles e dados quando possível
6. **Accessibility** - Mapas devem ser acessíveis

## ARQUITETURA

\`\`\`
┌─────────────────────────────────────────────────────────────────────────────┐
│                    GEOLOCATION ARCHITECTURE                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CLIENT                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  LOCATION SOURCES                                                   │   │
│  │  [GPS] [WiFi] [Cell Tower] [IP Geolocation]                        │   │
│  │     │      │        │            │                                  │   │
│  │     └──────┴────────┴────────────┘                                  │   │
│  │                    │                                                │   │
│  │                    ▼                                                │   │
│  │  GEOLOCATION API (Browser/Native)                                   │   │
│  │                    │                                                │   │
│  │                    ▼                                                │   │
│  │  MAP COMPONENT                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │  [Tiles] [Markers] [Polylines] [Polygons] [Controls]        │   │   │
│  │  │  [Clustering] [Heatmaps] [Custom Overlays]                  │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              │                                              │
│                              ▼                                              │
│  BACKEND SERVICES                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  [Geocoding API] [Directions API] [Places API] [Distance Matrix]   │   │
│  │         │              │               │              │             │   │
│  │         └──────────────┴───────────────┴──────────────┘             │   │
│  │                              │                                      │   │
│  │                              ▼                                      │   │
│  │  CACHE LAYER (Redis)                                                │   │
│  │  - Geocoding results (address → coords)                             │   │
│  │  - Reverse geocoding (coords → address)                             │   │
│  │  - Distance calculations                                            │   │
│  │                              │                                      │   │
│  │                              ▼                                      │   │
│  │  DATABASE (PostGIS)                                                 │   │
│  │  - Spatial queries                                                  │   │
│  │  - Geofences                                                        │   │
│  │  - Location history                                                 │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
\`\`\`

## COMPARATIVO DE PROVIDERS

| Provider | Preço | Melhor Para | Customização | Offline |
|----------|-------|-------------|--------------|---------|
| Google Maps | $$$ | Enterprise, Directions, Places | Média | Não |
| Mapbox | $$ | Customização visual, 3D | Alta | Sim |
| Leaflet | Free | Open source, leve | Alta | Sim* |
| HERE | $$ | Automotive, logistics | Média | Sim |
| OpenStreetMap | Free | Dados abertos | Alta | Sim |
| Apple Maps | $ | iOS apps | Baixa | Não |

### Pricing (aproximado)
\`\`\`yaml
Google Maps:
  - Maps SDK: $7/1000 loads
  - Geocoding: $5/1000 requests
  - Directions: $5-10/1000 requests
  - Places: $17-40/1000 requests
  - Free tier: $200/mês

Mapbox:
  - Maps SDK: Free até 50k loads/mês
  - Geocoding: $0.75/1000 requests
  - Directions: $1/1000 requests
  - Free tier: Generoso para startups

HERE:
  - Similar ao Google
  - Bom para volume alto
  - Forte em automotive
\`\`\`

## GOOGLE MAPS - IMPLEMENTAÇÃO COMPLETA

### Setup e Configuração

\`\`\`typescript
// lib/googleMaps.ts
import { Loader } from '@googlemaps/js-api-loader';

const loader = new Loader({
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!,
  version: 'weekly',
  libraries: ['places', 'geometry', 'drawing', 'visualization'],
});

let google: typeof globalThis.google;

export async function loadGoogleMaps() {
  if (!google) {
    google = await loader.load();
  }
  return google;
}
\`\`\`

### Componente de Mapa Completo

\`\`\`tsx
import { useEffect, useRef, useState, useCallback } from 'react';
import { loadGoogleMaps } from '@/lib/googleMaps';

interface Marker {
  id: string;
  position: google.maps.LatLngLiteral;
  title?: string;
  icon?: string;
  data?: any;
}

interface GoogleMapProps {
  center: google.maps.LatLngLiteral;
  zoom?: number;
  markers?: Marker[];
  onMarkerClick?: (marker: Marker) => void;
  onMapClick?: (position: google.maps.LatLngLiteral) => void;
  showUserLocation?: boolean;
  enableClustering?: boolean;
  style?: React.CSSProperties;
}

export function GoogleMap({
  center,
  zoom = 14,
  markers = [],
  onMarkerClick,
  onMapClick,
  showUserLocation = false,
  enableClustering = false,
  style = { width: '100%', height: '400px' },
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markerInstances, setMarkerInstances] = useState<google.maps.Marker[]>([]);
  const [userMarker, setUserMarker] = useState<google.maps.Marker | null>(null);

  // Inicializar mapa
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      const google = await loadGoogleMaps();
      
      if (!mapRef.current || !isMounted) return;

      const mapInstance = new google.maps.Map(mapRef.current, {
        center,
        zoom,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        styles: [
          // Custom styles para visual moderno
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }],
          },
        ],
      });

      // Click handler
      if (onMapClick) {
        mapInstance.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (e.latLng) {
            onMapClick({
              lat: e.latLng.lat(),
              lng: e.latLng.lng(),
            });
          }
        });
      }

      setMap(mapInstance);
    }

    initMap();

    return () => {
      isMounted = false;
    };
  }, []);

  // Atualizar centro
  useEffect(() => {
    if (map) {
      map.panTo(center);
    }
  }, [map, center]);

  // Gerenciar markers
  useEffect(() => {
    if (!map) return;

    // Limpar markers antigos
    markerInstances.forEach((m) => m.setMap(null));

    // Criar novos markers
    const newMarkers = markers.map((marker) => {
      const instance = new google.maps.Marker({
        position: marker.position,
        map,
        title: marker.title,
        icon: marker.icon,
        animation: google.maps.Animation.DROP,
      });

      if (onMarkerClick) {
        instance.addListener('click', () => onMarkerClick(marker));
      }

      return instance;
    });

    setMarkerInstances(newMarkers);

    // Fit bounds se múltiplos markers
    if (markers.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      markers.forEach((m) => bounds.extend(m.position));
      map.fitBounds(bounds, 50);
    }
  }, [map, markers, onMarkerClick]);

  // Localização do usuário
  useEffect(() => {
    if (!map || !showUserLocation) return;

    if ('geolocation' in navigator) {
      navigator.geolocation.watchPosition(
        (position) => {
          const userPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          if (userMarker) {
            userMarker.setPosition(userPos);
          } else {
            const marker = new google.maps.Marker({
              position: userPos,
              map,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: '#4285F4',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
              },
              title: 'Sua localização',
            });
            setUserMarker(marker);
          }
        },
        (error) => console.error('Geolocation error:', error),
        { enableHighAccuracy: true, maximumAge: 10000 }
      );
    }
  }, [map, showUserLocation]);

  return <div ref={mapRef} style={style} />;
}
\`\`\`
`;

export default GEOLOCATION_MAPS_MANIFEST;

// Continuation of GEOLOCATION_MAPS_MANIFEST - Part 2

export const GEOLOCATION_MAPS_MANIFEST_PART2 = `

## MAPBOX GL - IMPLEMENTAÇÃO COMPLETA

### Setup

\`\`\`typescript
// lib/mapbox.ts
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

export { mapboxgl };
\`\`\`

### Componente Mapbox Avançado

\`\`\`tsx
import { useEffect, useRef, useState } from 'react';
import { mapboxgl } from '@/lib/mapbox';

interface MapboxMapProps {
  center: [number, number]; // [lng, lat]
  zoom?: number;
  markers?: Array<{
    id: string;
    coordinates: [number, number];
    color?: string;
    popup?: string;
  }>;
  showTraffic?: boolean;
  show3D?: boolean;
  style?: 'streets' | 'satellite' | 'dark' | 'light';
  onMove?: (center: [number, number], zoom: number) => void;
}

const STYLES = {
  streets: 'mapbox://styles/mapbox/streets-v12',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
  dark: 'mapbox://styles/mapbox/dark-v11',
  light: 'mapbox://styles/mapbox/light-v11',
};

export function MapboxMap({
  center,
  zoom = 14,
  markers = [],
  showTraffic = false,
  show3D = false,
  style = 'streets',
  onMove,
}: MapboxMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: STYLES[style],
      center,
      zoom,
      pitch: show3D ? 45 : 0,
      bearing: show3D ? -17.6 : 0,
      antialias: true,
    });

    // Controles
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.addControl(new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserHeading: true,
    }));
    map.addControl(new mapboxgl.ScaleControl(), 'bottom-left');

    // 3D Buildings
    if (show3D) {
      map.on('load', () => {
        const layers = map.getStyle().layers;
        const labelLayerId = layers?.find(
          (layer) => layer.type === 'symbol' && layer.layout?.['text-field']
        )?.id;

        map.addLayer(
          {
            id: '3d-buildings',
            source: 'composite',
            'source-layer': 'building',
            filter: ['==', 'extrude', 'true'],
            type: 'fill-extrusion',
            minzoom: 15,
            paint: {
              'fill-extrusion-color': '#aaa',
              'fill-extrusion-height': ['get', 'height'],
              'fill-extrusion-base': ['get', 'min_height'],
              'fill-extrusion-opacity': 0.6,
            },
          },
          labelLayerId
        );
      });
    }

    // Traffic layer
    if (showTraffic) {
      map.on('load', () => {
        map.addSource('traffic', {
          type: 'vector',
          url: 'mapbox://mapbox.mapbox-traffic-v1',
        });
        map.addLayer({
          id: 'traffic',
          type: 'line',
          source: 'traffic',
          'source-layer': 'traffic',
          paint: {
            'line-color': [
              'match',
              ['get', 'congestion'],
              'low', '#4CAF50',
              'moderate', '#FFC107',
              'heavy', '#FF5722',
              'severe', '#F44336',
              '#000000',
            ],
            'line-width': 2,
          },
        });
      });
    }

    // Move handler
    if (onMove) {
      map.on('moveend', () => {
        const center = map.getCenter();
        onMove([center.lng, center.lat], map.getZoom());
      });
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Atualizar markers
  useEffect(() => {
    if (!mapRef.current) return;

    // Remover markers antigos
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Adicionar novos
    markers.forEach((marker) => {
      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.style.cssText = \`
        width: 30px;
        height: 30px;
        background-color: \${marker.color || '#3b82f6'};
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        cursor: pointer;
      \`;

      const instance = new mapboxgl.Marker(el)
        .setLngLat(marker.coordinates)
        .addTo(mapRef.current!);

      if (marker.popup) {
        instance.setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(marker.popup)
        );
      }

      markersRef.current.push(instance);
    });
  }, [markers]);

  return <div ref={containerRef} style={{ width: '100%', height: '400px' }} />;
}
\`\`\`

## LEAFLET - IMPLEMENTAÇÃO COMPLETA (FREE)

\`\`\`tsx
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { Icon, LatLngExpression } from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';

// Fix para ícones do Leaflet no Next.js
const customIcon = new Icon({
  iconUrl: '/marker-icon.png',
  iconRetinaUrl: '/marker-icon-2x.png',
  shadowUrl: '/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface LeafletMapProps {
  center: LatLngExpression;
  zoom?: number;
  markers?: Array<{
    id: string;
    position: LatLngExpression;
    title: string;
    description?: string;
  }>;
  enableClustering?: boolean;
  onClick?: (latlng: { lat: number; lng: number }) => void;
}

// Componente para eventos do mapa
function MapEvents({ onClick }: { onClick?: (latlng: { lat: number; lng: number }) => void }) {
  useMapEvents({
    click: (e) => {
      onClick?.({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

// Componente para centralizar no usuário
function LocationMarker() {
  const [position, setPosition] = useState<LatLngExpression | null>(null);
  const map = useMap();

  useEffect(() => {
    map.locate().on('locationfound', (e) => {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    });
  }, [map]);

  return position ? (
    <Marker position={position} icon={customIcon}>
      <Popup>Você está aqui</Popup>
    </Marker>
  ) : null;
}

export function LeafletMap({
  center,
  zoom = 14,
  markers = [],
  enableClustering = false,
  onClick,
}: LeafletMapProps) {
  const markerElements = markers.map((marker) => (
    <Marker key={marker.id} position={marker.position} icon={customIcon}>
      <Popup>
        <strong>{marker.title}</strong>
        {marker.description && <p>{marker.description}</p>}
      </Popup>
    </Marker>
  ));

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ width: '100%', height: '400px' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {onClick && <MapEvents onClick={onClick} />}
      <LocationMarker />
      
      {enableClustering ? (
        <MarkerClusterGroup chunkedLoading>
          {markerElements}
        </MarkerClusterGroup>
      ) : (
        markerElements
      )}
    </MapContainer>
  );
}
\`\`\`

## GEOLOCATION API - HOOK COMPLETO

\`\`\`typescript
import { useState, useEffect, useCallback } from 'react';

interface GeolocationState {
  loading: boolean;
  error: string | null;
  position: {
    lat: number;
    lng: number;
    accuracy: number;
    altitude?: number;
    heading?: number;
    speed?: number;
  } | null;
  timestamp: number | null;
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watch?: boolean;
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 0,
    watch = false,
  } = options;

  const [state, setState] = useState<GeolocationState>({
    loading: true,
    error: null,
    position: null,
    timestamp: null,
  });

  const handleSuccess = useCallback((position: GeolocationPosition) => {
    setState({
      loading: false,
      error: null,
      position: {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude ?? undefined,
        heading: position.coords.heading ?? undefined,
        speed: position.coords.speed ?? undefined,
      },
      timestamp: position.timestamp,
    });
  }, []);

  const handleError = useCallback((error: GeolocationPositionError) => {
    let errorMessage: string;
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Permissão de localização negada';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Localização indisponível';
        break;
      case error.TIMEOUT:
        errorMessage = 'Tempo esgotado ao obter localização';
        break;
      default:
        errorMessage = 'Erro desconhecido';
    }
    setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
  }, []);

  const refresh = useCallback(() => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy,
      timeout,
      maximumAge,
    });
  }, [enableHighAccuracy, timeout, maximumAge, handleSuccess, handleError]);

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: 'Geolocalização não suportada',
      }));
      return;
    }

    if (watch) {
      const watchId = navigator.geolocation.watchPosition(
        handleSuccess,
        handleError,
        { enableHighAccuracy, timeout, maximumAge }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
        enableHighAccuracy,
        timeout,
        maximumAge,
      });
    }
  }, [watch, enableHighAccuracy, timeout, maximumAge, handleSuccess, handleError]);

  return { ...state, refresh };
}
\`\`\`

## GEOCODING SERVICE

\`\`\`typescript
// services/geocoding.ts
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!);
const CACHE_TTL = 60 * 60 * 24 * 30; // 30 dias

interface GeocodingResult {
  lat: number;
  lng: number;
  formattedAddress: string;
  placeId?: string;
  components?: {
    street?: string;
    number?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
}

class GeocodingService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY!;
  }

  // Address → Coordinates
  async geocode(address: string): Promise<GeocodingResult | null> {
    // Check cache
    const cacheKey = \`geocode:\${address.toLowerCase().trim()}\`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Call API
    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.set('address', address);
    url.searchParams.set('key', this.apiKey);
    url.searchParams.set('language', 'pt-BR');

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== 'OK' || !data.results[0]) {
      return null;
    }

    const result = data.results[0];
    const geocoded: GeocodingResult = {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      formattedAddress: result.formatted_address,
      placeId: result.place_id,
      components: this.parseAddressComponents(result.address_components),
    };

    // Cache result
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(geocoded));

    return geocoded;
  }

  // Coordinates → Address
  async reverseGeocode(lat: number, lng: number): Promise<GeocodingResult | null> {
    const cacheKey = \`reverse:\${lat.toFixed(6)},\${lng.toFixed(6)}\`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.set('latlng', \`\${lat},\${lng}\`);
    url.searchParams.set('key', this.apiKey);
    url.searchParams.set('language', 'pt-BR');

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== 'OK' || !data.results[0]) {
      return null;
    }

    const result = data.results[0];
    const geocoded: GeocodingResult = {
      lat,
      lng,
      formattedAddress: result.formatted_address,
      placeId: result.place_id,
      components: this.parseAddressComponents(result.address_components),
    };

    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(geocoded));

    return geocoded;
  }

  private parseAddressComponents(components: any[]): GeocodingResult['components'] {
    const result: GeocodingResult['components'] = {};
    
    for (const component of components) {
      const types = component.types;
      if (types.includes('street_number')) result.number = component.long_name;
      if (types.includes('route')) result.street = component.long_name;
      if (types.includes('sublocality')) result.neighborhood = component.long_name;
      if (types.includes('administrative_area_level_2')) result.city = component.long_name;
      if (types.includes('administrative_area_level_1')) result.state = component.short_name;
      if (types.includes('country')) result.country = component.long_name;
      if (types.includes('postal_code')) result.postalCode = component.long_name;
    }

    return result;
  }
}

export const geocodingService = new GeocodingService();
\`\`\`
`;

// Continuation of GEOLOCATION_MAPS_MANIFEST - Part 3

export const GEOLOCATION_MAPS_MANIFEST_PART3 = `

## DIRECTIONS & ROUTING

\`\`\`typescript
// services/directions.ts
interface RouteResult {
  distance: number; // metros
  duration: number; // segundos
  polyline: string; // encoded polyline
  steps: Array<{
    instruction: string;
    distance: number;
    duration: number;
    maneuver?: string;
  }>;
  bounds: {
    northeast: { lat: number; lng: number };
    southwest: { lat: number; lng: number };
  };
}

class DirectionsService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY!;
  }

  async getRoute(
    origin: { lat: number; lng: number } | string,
    destination: { lat: number; lng: number } | string,
    options?: {
      mode?: 'driving' | 'walking' | 'bicycling' | 'transit';
      waypoints?: Array<{ lat: number; lng: number }>;
      avoidTolls?: boolean;
      avoidHighways?: boolean;
      departureTime?: Date;
    }
  ): Promise<RouteResult | null> {
    const url = new URL('https://maps.googleapis.com/maps/api/directions/json');
    
    const originStr = typeof origin === 'string' 
      ? origin 
      : \`\${origin.lat},\${origin.lng}\`;
    const destStr = typeof destination === 'string'
      ? destination
      : \`\${destination.lat},\${destination.lng}\`;

    url.searchParams.set('origin', originStr);
    url.searchParams.set('destination', destStr);
    url.searchParams.set('key', this.apiKey);
    url.searchParams.set('mode', options?.mode || 'driving');
    url.searchParams.set('language', 'pt-BR');

    if (options?.waypoints?.length) {
      const waypointsStr = options.waypoints
        .map((w) => \`\${w.lat},\${w.lng}\`)
        .join('|');
      url.searchParams.set('waypoints', waypointsStr);
    }

    if (options?.avoidTolls) url.searchParams.set('avoid', 'tolls');
    if (options?.avoidHighways) url.searchParams.append('avoid', 'highways');
    if (options?.departureTime) {
      url.searchParams.set('departure_time', String(Math.floor(options.departureTime.getTime() / 1000)));
    }

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== 'OK' || !data.routes[0]) {
      return null;
    }

    const route = data.routes[0];
    const leg = route.legs[0];

    return {
      distance: leg.distance.value,
      duration: leg.duration.value,
      polyline: route.overview_polyline.points,
      steps: leg.steps.map((step: any) => ({
        instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
        distance: step.distance.value,
        duration: step.duration.value,
        maneuver: step.maneuver,
      })),
      bounds: route.bounds,
    };
  }

  // Calcular distância entre múltiplos pontos
  async getDistanceMatrix(
    origins: Array<{ lat: number; lng: number }>,
    destinations: Array<{ lat: number; lng: number }>
  ): Promise<Array<Array<{ distance: number; duration: number }>>> {
    const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json');
    
    url.searchParams.set('origins', origins.map((o) => \`\${o.lat},\${o.lng}\`).join('|'));
    url.searchParams.set('destinations', destinations.map((d) => \`\${d.lat},\${d.lng}\`).join('|'));
    url.searchParams.set('key', this.apiKey);

    const response = await fetch(url.toString());
    const data = await response.json();

    return data.rows.map((row: any) =>
      row.elements.map((element: any) => ({
        distance: element.distance?.value || 0,
        duration: element.duration?.value || 0,
      }))
    );
  }
}

export const directionsService = new DirectionsService();
\`\`\`

## POSTGIS - SPATIAL QUERIES

\`\`\`sql
-- Habilitar extensão PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Tabela de locais com geometria
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  address TEXT,
  -- Ponto geográfico (longitude, latitude)
  coordinates GEOGRAPHY(POINT, 4326) NOT NULL,
  category VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índice espacial para queries rápidas
CREATE INDEX idx_locations_coordinates ON locations USING GIST (coordinates);

-- Inserir local
INSERT INTO locations (name, address, coordinates, category)
VALUES (
  'Restaurante XYZ',
  'Rua das Flores, 123',
  ST_SetSRID(ST_MakePoint(-46.6333, -23.5505), 4326)::geography,
  'restaurant'
);

-- Buscar locais em raio de 5km
SELECT 
  id, name, address, category,
  ST_Distance(coordinates, ST_SetSRID(ST_MakePoint(-46.6333, -23.5505), 4326)::geography) as distance_meters
FROM locations
WHERE ST_DWithin(
  coordinates,
  ST_SetSRID(ST_MakePoint(-46.6333, -23.5505), 4326)::geography,
  5000 -- 5km em metros
)
ORDER BY distance_meters;

-- Buscar N locais mais próximos
SELECT 
  id, name, address,
  ST_Distance(coordinates, ST_SetSRID(ST_MakePoint(-46.6333, -23.5505), 4326)::geography) as distance_meters
FROM locations
ORDER BY coordinates <-> ST_SetSRID(ST_MakePoint(-46.6333, -23.5505), 4326)::geography
LIMIT 10;

-- Verificar se ponto está dentro de polígono (geofence)
SELECT * FROM locations
WHERE ST_Within(
  coordinates::geometry,
  ST_GeomFromGeoJSON('{
    "type": "Polygon",
    "coordinates": [[[-46.7, -23.6], [-46.6, -23.6], [-46.6, -23.5], [-46.7, -23.5], [-46.7, -23.6]]]
  }')
);
\`\`\`

### Prisma com PostGIS

\`\`\`typescript
// prisma/schema.prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [postgis]
}

// Para queries espaciais, usar $queryRaw
const nearbyLocations = await prisma.$queryRaw\`
  SELECT 
    id, name, address,
    ST_Distance(
      coordinates,
      ST_SetSRID(ST_MakePoint(\${lng}, \${lat}), 4326)::geography
    ) as distance
  FROM locations
  WHERE ST_DWithin(
    coordinates,
    ST_SetSRID(ST_MakePoint(\${lng}, \${lat}), 4326)::geography,
    \${radiusMeters}
  )
  ORDER BY distance
  LIMIT \${limit}
\`;
\`\`\`

## STORE LOCATOR COMPLETO

\`\`\`tsx
import { useState, useEffect } from 'react';
import { useGeolocation } from '@/hooks/useGeolocation';

interface Store {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone?: string;
  hours?: string;
  distance?: number;
}

export function StoreLocator() {
  const { position, loading: geoLoading, error: geoError } = useGeolocation();
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [searchAddress, setSearchAddress] = useState('');
  const [loading, setLoading] = useState(false);

  // Buscar lojas próximas
  const fetchNearbyStores = async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const response = await fetch(
        \`/api/stores/nearby?lat=\${lat}&lng=\${lng}&radius=10000\`
      );
      const data = await response.json();
      setStores(data.stores);
    } catch (error) {
      console.error('Error fetching stores:', error);
    } finally {
      setLoading(false);
    }
  };

  // Buscar por endereço
  const searchByAddress = async () => {
    if (!searchAddress.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        \`/api/geocode?address=\${encodeURIComponent(searchAddress)}\`
      );
      const data = await response.json();
      
      if (data.lat && data.lng) {
        await fetchNearbyStores(data.lat, data.lng);
      }
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  // Usar localização do usuário
  useEffect(() => {
    if (position) {
      fetchNearbyStores(position.lat, position.lng);
    }
  }, [position]);

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-96 bg-white shadow-lg overflow-y-auto">
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-4">Encontre uma Loja</h1>
          
          {/* Search */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              placeholder="Digite um endereço..."
              className="flex-1 px-3 py-2 border rounded"
              onKeyDown={(e) => e.key === 'Enter' && searchByAddress()}
            />
            <button
              onClick={searchByAddress}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Buscar
            </button>
          </div>

          {/* Use my location */}
          <button
            onClick={() => position && fetchNearbyStores(position.lat, position.lng)}
            disabled={geoLoading || !position}
            className="w-full mb-4 px-4 py-2 border rounded flex items-center justify-center gap-2"
          >
            📍 Usar minha localização
          </button>

          {/* Store list */}
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8">Carregando...</div>
            ) : stores.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhuma loja encontrada
              </div>
            ) : (
              stores.map((store) => (
                <div
                  key={store.id}
                  onClick={() => setSelectedStore(store)}
                  className={\`p-4 border rounded cursor-pointer transition \${
                    selectedStore?.id === store.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'hover:bg-gray-50'
                  }\`}
                >
                  <h3 className="font-semibold">{store.name}</h3>
                  <p className="text-sm text-gray-600">{store.address}</p>
                  {store.distance && (
                    <p className="text-sm text-blue-600 mt-1">
                      {(store.distance / 1000).toFixed(1)} km
                    </p>
                  )}
                  {store.phone && (
                    <a
                      href={\`tel:\${store.phone}\`}
                      className="text-sm text-blue-600"
                    >
                      {store.phone}
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1">
        <GoogleMap
          center={
            selectedStore
              ? { lat: selectedStore.lat, lng: selectedStore.lng }
              : position
              ? { lat: position.lat, lng: position.lng }
              : { lat: -23.5505, lng: -46.6333 }
          }
          zoom={selectedStore ? 16 : 12}
          markers={stores.map((store) => ({
            id: store.id,
            position: { lat: store.lat, lng: store.lng },
            title: store.name,
          }))}
          onMarkerClick={(marker) => {
            const store = stores.find((s) => s.id === marker.id);
            if (store) setSelectedStore(store);
          }}
          showUserLocation
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
}
\`\`\`

## CHECKLIST COMPLETO

### Setup
- [ ] API keys configuradas e protegidas?
- [ ] Billing habilitado (Google Maps)?
- [ ] Domínios/IPs restritos nas keys?
- [ ] Rate limiting configurado?

### UX
- [ ] Permissão de localização pedida no momento certo?
- [ ] Fallback para quando GPS não disponível?
- [ ] Loading states implementados?
- [ ] Erro handling com mensagens claras?
- [ ] Mobile-friendly (touch, gestures)?

### Performance
- [ ] SDK carregado com lazy loading?
- [ ] Clustering para muitos markers?
- [ ] Geocoding com cache?
- [ ] Debounce em buscas?
- [ ] Tiles otimizados?

### Acessibilidade
- [ ] Alternativas textuais para mapas?
- [ ] Navegação por teclado?
- [ ] Screen reader support?

### Segurança
- [ ] API keys não expostas no frontend?
- [ ] Proxy para chamadas de API?
- [ ] Validação de inputs?
- [ ] Rate limiting por usuário?

## ANTI-PATTERNS

❌ **NUNCA** exponha API keys diretamente no frontend
❌ **NUNCA** faça geocoding em loop sem cache
❌ **NUNCA** renderize milhares de markers sem clustering
❌ **NUNCA** ignore erros de permissão de localização
❌ **NUNCA** peça permissão de GPS sem contexto
❌ **NUNCA** assuma que GPS está sempre disponível
❌ **NUNCA** faça requests de directions sem rate limiting
❌ **NUNCA** armazene histórico de localização sem consentimento
❌ **NUNCA** use polling para tracking (use watchPosition)
❌ **NUNCA** ignore a precisão da localização

## DICAS DE OTIMIZAÇÃO DE CUSTOS

\`\`\`yaml
Google Maps:
  - Use Static Maps API para previews (mais barato)
  - Cache agressivo de geocoding
  - Limite zoom máximo para reduzir tile loads
  - Use Places Autocomplete ao invés de Geocoding
  - Considere Mapbox para alto volume

Mapbox:
  - Use vector tiles (mais leves)
  - Implemente tile caching
  - Otimize zoom levels

Geral:
  - Batch requests quando possível
  - Use Distance Matrix ao invés de múltiplas Directions
  - Implemente debounce em autocomplete
  - Cache resultados no Redis
\`\`\`
`;


import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Asset } from '@/types';
import L from 'leaflet';
import { useTelemetryStore } from '@/store/telemetry.store';
import { useEffect } from 'react';

// Correção de ícones do Leaflet em React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom Icons
const createIcon = (color: string) => new L.DivIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px ${color};"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

export function TacticalMap() {
  const assets = useTelemetryStore(state => state.assets);
  const selectAsset = useTelemetryStore(state => state.selectAsset);

  // Re-center map if needed or just display global view
  
  return (
    <div className="h-full w-full bg-black relative border border-tactical-border overflow-hidden rounded-sm">
      <div className="absolute top-2 left-2 z-[400] bg-black/80 p-2 border border-tactical-border/50 backdrop-blur-sm">
        <p className="text-[10px] text-tactical-green font-mono">SATELLITE LINK: ACTIVE</p>
      </div>
      
      <MapContainer 
        center={[20, 0]} 
        zoom={2} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%', background: '#0F0F12' }}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        {assets.map(asset => (
          <Marker 
            key={asset.id} 
            position={[asset.latitude, asset.longitude]}
            icon={createIcon(asset.status === 'LOCKED_DOWN' ? '#EF4444' : '#39FF14')}
            eventHandlers={{
                click: () => selectAsset(asset.id),
            }}
          >
            <Popup className="tactical-popup">
               <div className="font-mono text-xs">
                 <strong>{asset.codename}</strong><br/>
                 Lat: {asset.latitude.toFixed(2)}<br/>
                 Lng: {asset.longitude.toFixed(2)}
               </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

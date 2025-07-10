'use client';

import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import L, { Layer } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';

// Declaración extendida para usar heatLayer con tipo Layer
declare module 'leaflet' {
  export function heatLayer(
    latlngs: Array<[number, number, number?]>,
    options?: {
      minOpacity?: number;
      maxZoom?: number;
      max?: number;
      radius?: number;
      blur?: number;
      gradient?: { [key: number]: string };
    }
  ): Layer;
}

const points: [number, number, number?][] = [
  [-12.0464, -77.0428, 0.8], // Lima
  [-12.0266, -77.1475, 0.7], // Callao
  [-12.0867, -77.0338, 0.6], // San Isidro
  [-12.1211, -77.0290, 0.9], // Miraflores
  [-12.0453, -77.0311, 0.5], // Cercado
];

function HeatmapLayerComponent({ points }: { points: [number, number, number?][] }) {
  const map = useMap();

  useEffect(() => {
    const heatLayer = L.heatLayer(points, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
    }).addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points]);

  return null;
}

const MapaCalor = () => {
  return (
    <div className="w-full h-full rounded-lg overflow-hidden shadow">
      <MapContainer
        center={[-12.0464, -77.0428]}
        zoom={12}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <HeatmapLayerComponent points={points} />
      </MapContainer>
    </div>
  );
};

export default MapaCalor;
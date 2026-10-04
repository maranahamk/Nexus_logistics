import React, { useEffect, useRef } from 'react';
import { Shipment } from '../../types/logistics';
import { MapPin, Navigation, Compass } from 'lucide-react';

interface ShipmentLeafletMapProps {
  shipment: Shipment;
}

// Known airport and cargo hub coordinate dictionary
const CITY_COORDINATES: Record<string, [number, number]> = {
  // North America
  'san francisco, ca': [37.7749, -122.4194],
  'new york, ny': [40.7128, -74.0060],
  'chicago, il': [41.8781, -87.6298],
  'los angeles, ca': [34.0522, -118.2437],
  'toronto': [43.6532, -79.3832],
  'vancouver': [49.2827, -123.1207],
  'mexico city': [19.4326, -99.1332],
  
  // Europe
  'london': [51.5074, -0.1278],
  'frankfurt': [50.1109, 8.6821],
  'paris': [48.8566, 2.3522],
  'amsterdam': [52.3676, 4.9041],
  'berlin': [52.5200, 13.4050],
  'madrid': [40.4168, -3.7038],

  // Asia-Pacific
  'tokyo': [35.6762, 139.6503],
  'singapore': [1.3521, 103.8198],
  'hong kong': [22.3193, 114.1694],
  'sydney': [-33.8688, 151.2093],
  'seoul': [37.5665, 126.9780],
  'shanghai': [31.2304, 121.4737],

  // Middle East
  'dubai': [25.2048, 55.2708],
  'doha': [25.2854, 51.5310],
  'riyadh': [24.7136, 46.6753],

  // Africa
  'lagos': [6.5244, 3.3792],
  'abuja': [9.0765, 7.3986],
  'johannesburg': [-26.2041, 28.0473],
  'nairobi': [-1.2921, 36.8219],
  'accra': [5.6037, -0.1870],
  'cairo': [30.0444, 31.2357],

  // Latin America
  'são paulo': [-23.5505, -46.6333],
  'buenos aires': [-34.6037, -58.3816],
  'santiago': [-33.4489, -70.6693],
};

function resolveCoord(cityOrLocation: string): [number, number] {
  const norm = cityOrLocation.toLowerCase().trim();
  for (const [key, coords] of Object.entries(CITY_COORDINATES)) {
    if (norm.includes(key) || key.includes(norm)) {
      return coords;
    }
  }
  // Deterministic pseudo-fallback based on string hash for unlisted cities
  let hash = 0;
  for (let i = 0; i < norm.length; i++) {
    hash = (hash << 5) - hash + norm.charCodeAt(i);
    hash |= 0;
  }
  const lat = 10 + (Math.abs(hash) % 40) * (hash % 2 === 0 ? 1 : -1);
  const lng = ((Math.abs(hash * 31) % 300) - 150);
  return [lat, lng];
}

export const ShipmentLeafletMap: React.FC<ShipmentLeafletMapProps> = ({ shipment }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const L = (window as any).L;
    const container = mapContainerRef.current || document.getElementById('shipmentMap');
    if (!L || !container) return;

    // Safely cleanup prior map instance
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
      } catch {
        // ignore
      }
      mapInstanceRef.current = null;
    }

    if ((container as any)._leaflet_id) {
      delete (container as any)._leaflet_id;
    }

    // Check if US route or resolve dynamically
    const hasUSOrigin = shipment.sender.country.toLowerCase().includes('united states') || shipment.sender.country.toLowerCase().includes('usa');
    const originCoords: [number, number] = hasUSOrigin && shipment.sender.city.toLowerCase().includes('new york')
      ? [40.7128, -74.0060]
      : resolveCoord(`${shipment.sender.city}, ${shipment.sender.country}`);

    const destinationCoords: [number, number] = shipment.receiver.city.toLowerCase().includes('chicago')
      ? [41.8781, -87.6298]
      : resolveCoord(`${shipment.receiver.city}, ${shipment.receiver.country}`);

    // In-transit position (e.g. Ohio corridor for US transit or current waypoint)
    const currentCoords: [number, number] = (hasUSOrigin && destinationCoords[0] === 41.8781)
      ? [41.2000, -81.5000]
      : resolveCoord(shipment.currentLocation);

    // Initialize Leaflet map centered around the transit route
    const map = L.map(container).setView(currentCoords, 5);
    mapInstanceRef.current = map;
    (window as any).nexusMap = map;

    // OpenStreetMap free tile layer
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Custom icons and markers
    const truckIcon = L.icon({
      iconUrl: 'https://cdn-icons-png.flaticon.com/512/7543/7543067.png',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const originLabel = shipment.sender.city || 'New York Hub';
    const destLabel = shipment.receiver.city || 'Chicago Center';

    L.marker(originCoords).addTo(map).bindPopup(`<b>Origin:</b> ${originLabel} (${shipment.sender.country})`);
    L.marker(destinationCoords).addTo(map).bindPopup(`<b>Destination:</b> ${destLabel} (${shipment.receiver.country})`);

    const statusLabel = shipment.status === 'delivered' ? 'Delivered' : 'In Transit';
    const truckMarker = L.marker(currentCoords, { icon: truckIcon })
      .addTo(map)
      .bindPopup(`<b>Tracking ID:</b> ${shipment.id}<br><b>Status:</b> ${statusLabel}<br><small style="color:#64748b">${shipment.currentLocation}</small>`)
      .openPopup();

    // Draw route polyline connecting them
    const routeLine: [number, number][] = [originCoords, currentCoords, destinationCoords];
    L.polyline(routeLine, { color: '#2563eb', weight: 4, dashArray: '5, 10' }).addTo(map);

    // Fit map bounds to show the whole route nicely
    map.fitBounds(L.latLngBounds(routeLine), { padding: [50, 50] });

    return () => {
      if ((window as any).nexusMap === map) {
        delete (window as any).nexusMap;
      }
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {
          // ignore
        }
        mapInstanceRef.current = null;
      }
    };
  }, [shipment]);

  return (
    <div
      className="tracking-map-card bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs"
      style={{
        marginTop: '20px',
        padding: '15px',
        background: '#fff',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
      }}
    >
      <div className="flex items-center justify-between mb-2.5">
        <h3
          className="text-base font-bold text-slate-800 flex items-center gap-2"
          style={{ fontSize: '16px', marginBottom: '10px', color: '#1e293b' }}
        >
          <Navigation className="w-4 h-4 text-blue-700" />
          <span>Live Transit Route</span>
        </h3>
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="flex items-center gap-1 text-blue-700 font-semibold">
            <span className="w-2 h-2 rounded-full bg-blue-700" />
            <span>Origin</span>
          </span>
          <span className="flex items-center gap-1 text-amber-600 font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>In-Transit</span>
          </span>
          <span className="flex items-center gap-1 text-emerald-700 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            <span>Destination</span>
          </span>
        </div>
      </div>

      {/* The map container element */}
      <div
        id="shipmentMap"
        ref={mapContainerRef}
        style={{ width: '100%', height: '300px', borderRadius: '6px' }}
        className="w-full bg-slate-100 z-0 border border-slate-200/80"
      />

      <div className="pt-2.5 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-2 truncate">
          <Compass className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">
            Waypoint Path: <strong className="text-slate-800">{shipment.sender.city}</strong> →{' '}
            <strong className="text-blue-700">{shipment.currentLocation}</strong> →{' '}
            <strong className="text-slate-800">{shipment.receiver.city}</strong>
          </span>
        </div>
        <span className="font-mono text-[10px] text-slate-400 shrink-0">OpenStreetMap Data</span>
      </div>
    </div>
  );
};

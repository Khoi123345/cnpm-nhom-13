'use client';

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom drone icon
const droneIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjRjU5RTBCIj48cGF0aCBkPSJNMTIgMkw0IDhsOCA2IDgtNnoiLz48cGF0aCBkPSJNMTIgMTR2OGwtOC02eiIgZmlsbD0iI0VGNEQxRCIvPjxwYXRoIGQ9Ik0xMiAxNHY4bDgtNnoiIGZpbGw9IiNFRjREMUQiLz48L3N2Zz4=',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

interface DroneTrackingMapProps {
  droneId: number;
  orderId: number;
  restaurantLat: number;
  restaurantLng: number;
  destinationLat: number;
  destinationLng: number;
}

interface GpsUpdate {
  lat: number;
  lng: number;
  batteryPercent: number;
  speedKmh: number;
  timestamp: string;
}

export default function DroneTrackingMap({
  droneId,
  orderId,
  restaurantLat,
  restaurantLng,
  destinationLat,
  destinationLng,
}: DroneTrackingMapProps) {
  const [mounted, setMounted] = useState(false);
  const [dronePosition, setDronePosition] = useState<[number, number]>([restaurantLat, restaurantLng]);
  const [routePath, setRoutePath] = useState<[number, number][]>([[restaurantLat, restaurantLng]]);
  const [battery, setBattery] = useState(100);
  const [speed, setSpeed] = useState(0);
  const [status, setStatus] = useState('PREPARING');
  const [connected, setConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    setMounted(true);

    // WebSocket connection
    const socket = new SockJS(`${process.env.NEXT_PUBLIC_API_URL}/ws`);
    const stompClient = new Client({
      webSocketFactory: () => socket as any,
      debug: (str) => console.log('STOMP:', str),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    stompClient.onConnect = () => {
      console.log('✅ WebSocket connected');
      setConnected(true);

      // Subscribe to drone GPS updates
      stompClient.subscribe(`/topic/drone/${droneId}`, (message) => {
        const update: GpsUpdate = JSON.parse(message.body);
        console.log('📡 GPS Update:', update);

        setDronePosition([update.lat, update.lng]);
        setRoutePath((prev) => [...prev, [update.lat, update.lng]]);
        setBattery(update.batteryPercent);
        setSpeed(update.speedKmh);
      });

      // Subscribe to delivery status updates
      stompClient.subscribe(`/topic/delivery/${orderId}`, (message) => {
        const statusUpdate = JSON.parse(message.body);
        console.log('📦 Status Update:', statusUpdate);
        setStatus(statusUpdate.status);
      });
    };

    stompClient.onStompError = (frame) => {
      console.error('❌ STOMP error:', frame);
      setConnected(false);
    };

    stompClient.activate();
    clientRef.current = stompClient;

    return () => {
      stompClient.deactivate();
    };
  }, [droneId, orderId]);

  if (!mounted) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Loading tracking map...</p>
      </div>
    );
  }

  const center: [number, number] = [
    (restaurantLat + destinationLat) / 2,
    (restaurantLng + destinationLng) / 2,
  ];

  return (
    <div className="space-y-4">
      {/* Status Bar */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-xs text-gray-500">Status</p>
          <p className="text-lg font-bold text-blue-600">{status}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-xs text-gray-500">Battery</p>
          <p className="text-lg font-bold text-green-600">{battery.toFixed(1)}%</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-xs text-gray-500">Speed</p>
          <p className="text-lg font-bold text-orange-600">{speed.toFixed(1)} km/h</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-xs text-gray-500">Connection</p>
          <p className={`text-lg font-bold ${connected ? 'text-green-600' : 'text-red-600'}`}>
            {connected ? '🟢 Live' : '🔴 Offline'}
          </p>
        </div>
      </div>

      {/* Map */}
      <div className="w-full h-[500px] rounded-lg overflow-hidden border-2 border-gray-200">
        <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Restaurant Marker */}
          <Marker position={[restaurantLat, restaurantLng]}>
            <Popup>🏪 Restaurant</Popup>
          </Marker>

          {/* Destination Marker */}
          <Marker position={[destinationLat, destinationLng]}>
            <Popup>📍 Delivery Destination</Popup>
          </Marker>

          {/* Drone Marker */}
          <Marker position={dronePosition} icon={droneIcon}>
            <Popup>
              <div className="text-center">
                <p className="font-bold">🚁 Drone #{droneId}</p>
                <p className="text-sm">Battery: {battery}%</p>
                <p className="text-sm">Speed: {speed} km/h</p>
              </div>
            </Popup>
          </Marker>

          {/* Flight Path */}
          <Polyline positions={routePath} color="#F59E0B" weight={3} opacity={0.7} />
        </MapContainer>
      </div>

      <p className="text-xs text-gray-500 text-center">
        🛰️ Real-time GPS tracking via WebSocket
      </p>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface DroneTrackingMapProps {
  droneId: number;
  orderId: number;
  restaurantLat: number;
  restaurantLng: number;
  destinationLat: number;
  destinationLng: number;
  onDeliveryCompleted?: () => void;
}

// ⭐️ CUSTOM DRONE ICON
const droneIcon = L.icon({
  iconUrl: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="%234CAF50"/><text x="50" y="60" font-size="40" text-anchor="middle" fill="white">🚁</text></svg>',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const restaurantIcon = L.icon({
  iconUrl: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="20" y="20" width="60" height="60" fill="%23FF6B6B" rx="5"/><text x="50" y="60" font-size="40" text-anchor="middle" fill="white">🍔</text></svg>',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const destinationIcon = L.icon({
  iconUrl: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="%234A90E2"/><text x="50" y="60" font-size="35" text-anchor="middle" fill="white">📍</text></svg>',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

export default function DroneTrackingMap({
  droneId,
  orderId,
  restaurantLat,
  restaurantLng,
  destinationLat,
  destinationLng,
  onDeliveryCompleted,
}: DroneTrackingMapProps) {
  const [dronePosition, setDronePosition] = useState<[number, number]>([restaurantLat, restaurantLng]);
  const [routePath, setRoutePath] = useState<[number, number][]>([[restaurantLat, restaurantLng]]);
  const [battery, setBattery] = useState(100);
  const [speed, setSpeed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [connected, setConnected] = useState(false);
  const [deliveryStatus, setDeliveryStatus] = useState('IN_FLIGHT');
  const [droneArrived, setDroneArrived] = useState(false);

  useEffect(() => {
    // ✅ MOCK: Simulate drone movement
    const interval = setInterval(() => {
      setDronePosition(prev => {
        const newLat = prev[0] + (destinationLat - restaurantLat) * 0.02;
        const newLng = prev[1] + (destinationLng - restaurantLng) * 0.02;
        
        // Check if arrived (within 50 meters)
        const arrived = calculateDistance(newLat, newLng, destinationLat, destinationLng) < 0.05;
        
        if (arrived) {
          setDroneArrived(true);
          setDeliveryStatus('ARRIVED');
          clearInterval(interval);
          return [destinationLat, destinationLng];
        }

        setRoutePath(prev => [...prev, [newLat, newLng]]);
        setBattery(b => Math.max(0, b - 1));
        setSpeed(30);
        
        return [newLat, newLng];
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [restaurantLat, restaurantLng, destinationLat, destinationLng]);

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.asin(Math.sqrt(a));
  };

  return (
    <div className="space-y-4">
      {/* ⭐️ STATS PANEL */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-xs text-gray-600">Pin Còn Lại</p>
          <p className="text-xl font-bold text-blue-600">{battery.toFixed(1)}%</p>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-xs text-gray-600">Tốc Độ</p>
          <p className="text-xl font-bold text-green-600">{speed} km/h</p>
        </div>
        <div className="bg-orange-50 p-3 rounded-lg">
          <p className="text-xs text-gray-600">Trạng Thái</p>
          <Badge className={droneArrived ? 'bg-green-500' : 'bg-orange-500'}>
            {deliveryStatus}
          </Badge>
        </div>
        <div className="bg-purple-50 p-3 rounded-lg">
          <p className="text-xs text-gray-600">Khoảng Cách</p>
          <p className="text-xl font-bold text-purple-600">
            {calculateDistance(dronePosition[0], dronePosition[1], destinationLat, destinationLng).toFixed(2)} km
          </p>
        </div>
      </div>

      {/* ⭐️ MAP */}
      <div className="rounded-lg overflow-hidden border border-gray-200 h-96">
        <MapContainer
          center={[restaurantLat, restaurantLng]}
          zoom={14}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {/* Restaurant Marker */}
          <Marker position={[restaurantLat, restaurantLng]} icon={restaurantIcon}>
            <Popup>🍔 Nhà Hàng</Popup>
          </Marker>

          {/* Destination Marker */}
          <Marker position={[destinationLat, destinationLng]} icon={destinationIcon}>
            <Popup>📍 Điểm Giao Hàng</Popup>
          </Marker>

          {/* ⭐️ DRONE MARKER (MOVING) */}
          <Marker position={dronePosition} icon={droneIcon}>
            <Popup>
              🚁 Drone #{droneId}<br />
              Pin: {battery.toFixed(1)}%<br />
              Tốc độ: {speed} km/h
            </Popup>
          </Marker>

          {/* Route Path */}
          <Polyline positions={routePath} color="blue" weight={2} opacity={0.7} />
        </MapContainer>
      </div>

      {/* ⭐️ CONFIRMATION BUTTON - Khi drone đến nơi */}
      {droneArrived && (
        <div className="bg-green-50 border-2 border-green-300 p-4 rounded-lg">
          <p className="text-sm font-semibold text-green-700 mb-3">
            ✅ Drone đã đến điểm giao hàng!
          </p>
          <Button
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={async () => {
              // Call API to confirm delivery
              const response = await fetch(`/api/orders/${orderId}/confirm-delivery`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
              });
              if (response.ok) {
                alert('✅ Đơn hàng đã được xác nhận! Trạng thái: COMPLETED');
                onDeliveryCompleted?.();
              }
            }}
          >
            🎉 Xác Nhận Đã Nhận Hàng
          </Button>
        </div>
      )}
    </div>
  );
}

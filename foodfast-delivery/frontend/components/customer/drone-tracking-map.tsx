'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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
  userRole?: string; // ⭐️ Thêm prop role
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
  userRole, // ⭐️ Nhận role từ props
}: DroneTrackingMapProps) {
  const [dronePosition, setDronePosition] = useState<[number, number]>([restaurantLat, restaurantLng]);
  const [routePath, setRoutePath] = useState<[number, number][]>([[restaurantLat, restaurantLng]]);
  const [battery, setBattery] = useState(100);
  const [speed, setSpeed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [connected, setConnected] = useState(false);
  const [deliveryStatus, setDeliveryStatus] = useState('IN_FLIGHT');
  const [droneArrived, setDroneArrived] = useState(false);
  const [isReturning, setIsReturning] = useState(false); // ⭐️ Theo dõi trạng thái drone bay về
  const [resolvedRole, setResolvedRole] = useState<string | null>(userRole || null); // ⭐️ Sử dụng role từ props

  useEffect(() => {
    // ⭐️ RESOLVE ROLE: Từ props hoặc từ localStorage
    if (userRole) {
      setResolvedRole(userRole);
    } else if (typeof window !== 'undefined') {
      // Nếu không có props, lấy từ localStorage
      const customerUser = localStorage.getItem('customer_user');
      const restaurantUser = localStorage.getItem('restaurant_user');
      const adminUser = localStorage.getItem('admin_user');
      
      if (customerUser) {
        try {
          const user = JSON.parse(customerUser);
          setResolvedRole(user.role || 'CUSTOMER');
        } catch (e) {
          setResolvedRole('CUSTOMER');
        }
      } else if (restaurantUser) {
        try {
          const user = JSON.parse(restaurantUser);
          setResolvedRole(user.role || 'RESTAURANT');
        } catch (e) {
          setResolvedRole('RESTAURANT');
        }
      } else if (adminUser) {
        try {
          const user = JSON.parse(adminUser);
          setResolvedRole(user.role || 'ADMIN');
        } catch (e) {
          setResolvedRole('ADMIN');
        }
      }
    }

  useEffect(() => {
    // ✅ MOCK: Simulate drone movement
    let interval: NodeJS.Timeout | null = null;
    
    const startDroneMovement = async () => {
      interval = setInterval(() => {
        setDronePosition(prev => {
          // ⭐️ DỪNG: Nếu drone đã đến nơi, không tiếp tục bay
          if (droneArrived) {
            return prev;
          }
          
          const newLat = prev[0] + (destinationLat - restaurantLat) * 0.05;
          const newLng = prev[1] + (destinationLng - restaurantLng) * 0.05;
          
          // Check if arrived (within 50 meters)
          const arrived = calculateDistance(newLat, newLng, destinationLat, destinationLng) < 0.05;
          
          if (arrived && !droneArrived) {
            setDroneArrived(true);
            setDeliveryStatus('ARRIVED');
            setSpeed(0); // ⭐️ Dừng tốc độ
            
            // ⭐️ THÊM: Gọi API để đánh dấu drone đã đến và cập nhật order status
            const apiUrl = typeof window !== "undefined" 
              ? (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080")
              : "http://localhost:8080";
            
            fetch(`${apiUrl}/api/v1/drones/internal/drones/${droneId}/arrived`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            })
            .then(res => {
              if (res.ok) {
                console.log('✅ Drone marked as arrived, waiting for customer confirmation...');
              } else {
                console.error('Failed to mark drone as arrived');
              }
            })
            .catch(err => console.error('Error marking drone arrived:', err));
            
            // ⭐️ DỪNG: Clear interval để drone không tiếp tục bay
            if (interval) clearInterval(interval);
            return [destinationLat, destinationLng];
          }

          setRoutePath(prev => [...prev, [newLat, newLng]]);
          setBattery(b => Math.max(0, b - 1));
          setSpeed(45);
          
          return [newLat, newLng];
        });
      }, 2000);
    };

    startDroneMovement();
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [restaurantLat, restaurantLng, destinationLat, destinationLng, droneId]);

  // ⭐️ EFFECT: Xử lý drone bay về nhà hàng
  useEffect(() => {
    if (!isReturning) return;

    let returnInterval: NodeJS.Timeout | null = null;

    returnInterval = setInterval(() => {
      setDronePosition(prev => {
        const distanceToRestaurant = calculateDistance(prev[0], prev[1], restaurantLat, restaurantLng);
        
        // Nếu drone đã về đến nhà hàng (trong 50 mét)
        if (distanceToRestaurant < 0.05) {
          setDeliveryStatus('IDLE');
          setSpeed(0);
          if (returnInterval) clearInterval(returnInterval);
          
          // ⭐️ Gọi API để cập nhật drone status thành IDLE
          const apiUrl = typeof window !== "undefined" 
            ? (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080")
            : "http://localhost:8080";
          
          fetch(`${apiUrl}/api/v1/drones/internal/drones/${droneId}/returned`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
          .then(res => {
            if (res.ok) {
              console.log('✅ Drone returned to base and is now IDLE');
              // Redirect về orders sau 2 giây
              setTimeout(() => {
                if (typeof window !== "undefined") {
                  window.location.href = '/customer/orders';
                }
              }, 2000);
            }
          })
          .catch(err => console.error('Error marking drone as returned:', err));
          
          return [restaurantLat, restaurantLng];
        }

        // Tính toán vị trí tiếp theo (bay về nhà hàng)
        const newLat = prev[0] + (restaurantLat - prev[0]) * 0.05;
        const newLng = prev[1] + (restaurantLng - prev[1]) * 0.05;

        setRoutePath(prev => [...prev, [newLat, newLng]]);
        setBattery(b => Math.max(0, b - 0.5)); // Tiêu pin ít hơn khi bay về
        setSpeed(45);

        return [newLat, newLng];
      });
    }, 2000);

    return () => {
      if (returnInterval) clearInterval(returnInterval);
    };
  }, [isReturning, restaurantLat, restaurantLng, droneId]);

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
          <p className="text-xl font-bold text-blue-600">{(battery ?? 100).toFixed(1)}%</p>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-xs text-gray-600">Tốc Độ</p>
          <p className="text-xl font-bold text-green-600">{speed ?? 0} km/h</p>
        </div>
        <div className="bg-orange-50 p-3 rounded-lg">
          <p className="text-xs text-gray-600">Trạng Thái</p>
          <Badge className={droneArrived ? 'bg-green-500' : isReturning ? 'bg-blue-500' : 'bg-orange-500'}>
            {deliveryStatus}
          </Badge>
        </div>
        <div className="bg-purple-50 p-3 rounded-lg">
          <p className="text-xs text-gray-600">Khoảng Cách</p>
          <p className="text-xl font-bold text-purple-600">
            {calculateDistance(dronePosition[0], dronePosition[1], isReturning ? restaurantLat : destinationLat, isReturning ? restaurantLng : destinationLng).toFixed(2)} km
          </p>
        </div>
      </div>

      {/* ⭐️ MAP */}
      <div className="rounded-lg overflow-hidden border border-gray-200 h-96">
        <MapContainer
          center={[restaurantLat, restaurantLng]}
          zoom={14}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
          zoomControl={true}
        >
          <TileLayer 
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            maxZoom={19}
            minZoom={3}
          />

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

      {/* ⭐️ CONFIRMATION BUTTON - Khi drone đến nơi, CHỈ CHO CUSTOMER */}
      {droneArrived && !isReturning && resolvedRole === 'CUSTOMER' && (
        <div className="bg-green-50 border-2 border-green-300 p-4 rounded-lg">
          <p className="text-sm font-semibold text-green-700 mb-3">
            ✅ Drone đã đến điểm giao hàng!
          </p>
          <Button
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={async () => {
              try {
                // ⭐️ Sử dụng NEXT_PUBLIC_API_URL từ environment, fallback sang localhost
                const apiUrl = typeof window !== "undefined" 
                  ? (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080")
                  : "http://localhost:8080"
                
                const response = await fetch(`${apiUrl}/api/v1/orders/${orderId}/confirm-delivery`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                });
                if (response.ok) {
                  alert('✅ Đơn hàng đã được xác nhận! Drone đang quay về nhà hàng...');
                  setIsReturning(true); // ⭐️ Bật chế độ quay về
                  setDeliveryStatus('RETURNING');
                } else {
                  const error = await response.json();
                  alert('Error: ' + error.message);
                }
              } catch (error) {
                console.error('Error confirming delivery:', error);
                alert('Error: ' + error);
              }
            }}
          >
            🎉 Xác Nhận Đã Nhận Hàng
          </Button>
        </div>
      )}

      {/* ⭐️ THÔNG BÁO - Khi drone đã đến nhưng user không phải customer */}
      {droneArrived && !isReturning && resolvedRole !== 'CUSTOMER' && (
        <div className="bg-blue-50 border-2 border-blue-300 p-4 rounded-lg">
          <p className="text-sm font-semibold text-blue-700 mb-3">
            ✅ Drone đã đến điểm giao hàng!
          </p>
          <p className="text-sm text-blue-600">
            Đang chờ khách hàng xác nhận đã nhận hàng...
          </p>
        </div>
      )}

      {/* ⭐️ RETURNING ANIMATION - Drone bay về nhà hàng */}
      {isReturning && (
        <div className="bg-blue-50 border-2 border-blue-300 p-4 rounded-lg">
          <p className="text-sm font-semibold text-blue-700 mb-3">
            🏠 Drone đang quay về nhà hàng...
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(calculateDistance(dronePosition[0], dronePosition[1], restaurantLat, restaurantLng) / 
                        calculateDistance(destinationLat, destinationLng, restaurantLat, restaurantLng)) * 100}%`
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import dynamic from 'next/dynamic';

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

// Dynamically import to avoid SSR issues with Leaflet
const DroneTrackingMap = dynamic<DroneTrackingMapProps>(
  () => import('./drone-tracking-map'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-[500px] bg-gray-100 flex items-center justify-center rounded-lg">
        <p className="text-gray-500">Loading tracking map...</p>
      </div>
    )
  }
);

export default DroneTrackingMap;

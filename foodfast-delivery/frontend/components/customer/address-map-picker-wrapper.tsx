'use client';

import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

interface AddressMapPickerProps {
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  initialLat?: number;
  initialLng?: number;
}

// Dynamically import to avoid SSR issues with Leaflet
const AddressMapPicker = dynamic<AddressMapPickerProps>(
  () => import('./address-map-picker'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-[400px] bg-gray-100 flex items-center justify-center rounded-lg">
        <p className="text-gray-500">Loading map...</p>
      </div>
    )
  }
);

export default AddressMapPicker;

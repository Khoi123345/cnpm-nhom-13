'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Fix Leaflet default icon issue in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface AddressMapPickerProps {
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  initialLat?: number;
  initialLng?: number;
}

export default function AddressMapPicker({ onLocationSelect, initialLat = 10.762622, initialLng = 106.660172 }: AddressMapPickerProps) {
  const [mounted, setMounted] = useState(false);
  const [address, setAddress] = useState('');
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleGeocode = async () => {
    if (!address.trim()) {
      setError('Vui lòng nhập địa chỉ');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Forward geocoding với Nominatim
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
      );
      const data = await response.json();

      if (data.length === 0) {
        setError('Không tìm thấy địa chỉ. Vui lòng thử lại với địa chỉ khác.');
        setLoading(false);
        return;
      }

      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      const fullAddress = data[0].display_name;

      setPosition([lat, lng]);
      onLocationSelect(lat, lng, fullAddress);
      setLoading(false);
    } catch (error) {
      console.error('Geocoding error:', error);
      setError('Lỗi khi tìm kiếm địa chỉ. Vui lòng thử lại.');
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleGeocode();
    }
  };

  if (!mounted) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Address Input */}
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Nhập địa chỉ giao hàng (vd: 123 Nguyễn Huệ, Quận 1, TP.HCM)"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1"
        />
        <Button 
          onClick={handleGeocode} 
          disabled={loading}
          className="whitespace-nowrap"
        >
          {loading ? 'Đang tìm...' : 'Tìm vị trí'}
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">⚠️ {error}</p>
        </div>
      )}

      {/* Map Display */}
      <div className="w-full h-96 rounded-lg overflow-hidden border-2 border-gray-200">
        <MapContainer
          center={position || [initialLat, initialLng]}
          zoom={position ? 15 : 13}
          key={position ? `${position[0]}-${position[1]}` : 'default'}
          style={{ height: '100%', width: '100%' }}
          dragging={true}
          scrollWheelZoom={false}
          doubleClickZoom={false}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {position && <Marker position={position} />}
        </MapContainer>
      </div>

      {position && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm font-medium text-green-900">📍 Địa chỉ đã chọn:</p>
          <p className="text-sm text-green-700 mt-1">{address}</p>
          <p className="text-xs text-gray-500 mt-1">
            Tọa độ: {position[0].toFixed(6)}, {position[1].toFixed(6)}
          </p>
        </div>
      )}

      <p className="text-xs text-gray-500">
        💡 Nhập địa chỉ đầy đủ (đường, quận/huyện, thành phố) để được định vị chính xác
      </p>
    </div>
  );
}

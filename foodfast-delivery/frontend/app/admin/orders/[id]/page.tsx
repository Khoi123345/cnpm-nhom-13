'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ApiClient } from '@/lib/api-client';
import DroneTrackingMap from '@/components/customer/drone-tracking-map-wrapper';
import Link from 'next/link';

interface Order {
  id: number;
  orderStatus: string;
  orderAmt: number;
  addressShip: string;
  destinationLat: number | null;
  destinationLng: number | null;
  placedOn: string;
  orderItems: any[];
  droneId: number | null;
  userName: string;
  restaurantName: string;
}

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [droneInfo, setDroneInfo] = useState<any>(null);

  useEffect(() => {
    loadOrderDetail();
  }, [orderId]);

  const loadOrderDetail = async () => {
    try {
      const response = await ApiClient.get<Order>(`/api/orders/get/byId?id=${orderId}`);
      if (response.data) {
        setOrder(response.data);

        // Nếu order đang SHIPPED, get drone info
        if (response.data.orderStatus === 'SHIPPED' || response.data.orderStatus === 'DELIVERED') {
          loadDroneInfo();
        }
      }
    } catch (error) {
      console.error('Error loading order:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDroneInfo = async () => {
    try {
      // Get delivery log for this order
      const response = await ApiClient.get<any>(`/api/v1/drones/internal/delivery-logs/order/${orderId}`);
      console.log('✈️ Drone info response:', response);
      if (response.success && response.data) {
        setDroneInfo(response.data);
        console.log('✅ Drone info loaded:', response.data);
      } else {
        console.warn('⚠️ No drone assigned to this order yet');
      }
    } catch (error: any) {
      console.error('❌ Error loading drone info:', error.message);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-500 text-white',
      CONFIRMED: 'bg-blue-500 text-white',
      PROCESSING: 'bg-purple-500 text-white',
      SHIPPED: 'bg-orange-500 text-white',
      DELIVERED: 'bg-green-500 text-white',
      COMPLETED: 'bg-green-700 text-white',
      CANCELLED: 'bg-red-500 text-white',
      CANCELLATION_REQUESTED: 'bg-orange-600 text-white',
    };
    return colors[status] || 'bg-gray-500 text-white';
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8">
          <p className="text-center text-gray-500">Order not found</p>
          <Button className="mt-4" onClick={() => router.push('/admin/dashboard')}>
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  const showDroneTracking = order.destinationLat && order.destinationLng && droneInfo && 
    (order.orderStatus === 'SHIPPED' || order.orderStatus === 'DELIVERED');

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <header className="max-w-6xl mx-auto mb-8">
        <Link href="/admin/dashboard" className="text-primary hover:underline">
          &larr; Back to Admin Dashboard
        </Link>
        <div className="flex justify-between items-center mt-4">
          <h1 className="text-3xl font-bold">Order #{order.id}</h1>
          <Badge className={getStatusColor(order.orderStatus)}>{order.orderStatus}</Badge>
        </div>
      </header>

      <main className="max-w-6xl mx-auto space-y-6">
        {/* Drone Tracking Map */}
        {showDroneTracking && (
          <Card>
            <CardHeader>
              <CardTitle>🚁 Live Drone Tracking</CardTitle>
              <p className="text-sm text-muted-foreground">Real-time delivery progress monitoring</p>
            </CardHeader>
            <CardContent>
              <DroneTrackingMap
                droneId={droneInfo.drone.id}
                orderId={order.id}
                restaurantLat={droneInfo.drone.homeLat}
                restaurantLng={droneInfo.drone.homeLng}
                destinationLat={order.destinationLat!}
                destinationLng={order.destinationLng!}
              />
            </CardContent>
          </Card>
        )}

        {/* Order Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>📦 Order Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Customer</p>
                <p className="font-semibold">{order.userName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Restaurant</p>
                <p className="font-semibold">{order.restaurantName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Order Date</p>
                <p className="font-semibold">{new Date(order.placedOn).toLocaleString('vi-VN')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Delivery Address</p>
                <p className="font-semibold">{order.addressShip}</p>
              </div>
              {order.destinationLat && order.destinationLng && (
                <div>
                  <p className="text-sm text-gray-500">GPS Coordinates</p>
                  <p className="text-xs font-mono">
                    {order.destinationLat.toFixed(6)}, {order.destinationLng.toFixed(6)}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="text-xl font-bold text-green-600">
                  {order.orderAmt.toLocaleString('vi-VN')}₫
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>🍔 Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.orderItems && order.orderItems.length > 0 ? (
                  order.orderItems.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center border-b pb-2">
                      <div>
                        <p className="font-semibold">{item.productName}</p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold">{(item.price * item.quantity).toLocaleString('vi-VN')}₫</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No items</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Drone Info */}
        {droneInfo && (
          <Card>
            <CardHeader>
              <CardTitle>🚁 Delivery Drone Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Drone Name</p>
                  <p className="font-semibold">{droneInfo.drone.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge>{droneInfo.status}</Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Estimated Distance</p>
                  <p className="font-semibold">{droneInfo.estimatedDistanceKm?.toFixed(2)} km</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Estimated Duration</p>
                  <p className="font-semibold">{droneInfo.estimatedDurationMinutes} min</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

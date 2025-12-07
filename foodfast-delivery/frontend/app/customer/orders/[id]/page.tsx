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
  totalPrice: number;
  addressShip: string;
  destinationLat: number | null;
  destinationLng: number | null;
  createdDate: string;
  orderItems: any[];
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [droneInfo, setDroneInfo] = useState<any>(null);
  const [orderStatus, setOrderStatus] = useState<string>('');

  useEffect(() => {
    loadOrderDetail();
  }, [orderId]);

  const loadOrderDetail = async () => {
    try {
      const response = await ApiClient.get<Order>(`/api/v1/orders/get/byId?id=${orderId}`);
      if (response.data) {
        setOrder(response.data);
        setOrderStatus(response.data.orderStatus);

        // Nếu order đang SHIPPED hoặc DELIVERED, get drone info
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
      console.log('Drone info response:', response);
      if (response.success && response.data) {
        setDroneInfo(response.data);
      } else {
        console.warn('No drone assigned to this order yet');
      }
    } catch (error: any) {
      console.error('Error loading drone info:', error.message);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-500',
      CONFIRMED: 'bg-blue-500',
      PROCESSING: 'bg-purple-500',
      SHIPPED: 'bg-orange-500',
      DELIVERED: 'bg-green-500',
      COMPLETED: 'bg-green-700',
      CANCELLED: 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const handleDeliveryConfirmed = async () => {
    // ⭐️ Refresh order detail
    await loadOrderDetail();
    setOrderStatus('COMPLETED');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8">
          <p className="text-center text-gray-500">Order not found</p>
          <Button className="mt-4" onClick={() => router.push('/customer/orders')}>
            Back to Orders
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
        <Link href="/customer/orders" className="text-primary hover:underline">
          &larr; Back to Orders
        </Link>
        <div className="flex justify-between items-center mt-4">
          <h1 className="text-3xl font-bold">Order #{order.id}</h1>
          <Badge className={getStatusColor(order.orderStatus)}>{order.orderStatus}</Badge>
        </div>
      </header>

      <main className="max-w-6xl mx-auto space-y-6">
        {/* STATUS DISPLAY */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Trạng thái đơn hàng</h2>
          <Badge className={getStatusColor(orderStatus)}>
            {orderStatus === 'COMPLETED' ? '✅ ĐÃ HOÀN THÀNH' : orderStatus}
          </Badge>
        </div>

        {/* Drone Tracking Map */}
        {showDroneTracking && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>🚁 Theo dõi Drone</CardTitle>
            </CardHeader>
            <CardContent>
              <DroneTrackingMap
                droneId={droneInfo.drone.id}
                orderId={order.id}
                restaurantLat={droneInfo.drone.homeLat}
                restaurantLng={droneInfo.drone.homeLng}
                destinationLat={order.destinationLat!}
                destinationLng={order.destinationLng!}
                onDeliveryCompleted={handleDeliveryConfirmed}
                userRole="CUSTOMER" // ⭐️ Pass role for customer
              />
            </CardContent>
          </Card>
        )}

        {/* Order Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Order Date</p>
                <p className="font-semibold">{new Date(order.createdDate).toLocaleString()}</p>
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
                  {order.totalPrice.toLocaleString('vi-VN')} VND
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.orderItems.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-center border-b pb-2">
                    <div>
                      <p className="font-semibold">{item.productName}</p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold">{item.subtotal.toLocaleString('vi-VN')} VND</p>
                  </div>
                ))}
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
                  <p className="font-semibold">{droneInfo.status}</p>
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

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ApiClient } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';
import DroneTrackingMap from '@/components/customer/drone-tracking-map-wrapper';

interface Order {
  id: number;
  orderStatus: string;
  orderAmt: number;
  addressShip: string;
  destinationLat: number | null;
  destinationLng: number | null;
  placedOn: string;
  droneId: number | null;
  restaurantName: string;
}

interface DeliveryLog {
  id: number;
  orderId: number;
  drone: {
    id: number;
    name: string;
    homeLat: number;
    homeLng: number;
    batteryPercent: number;
    status: string;
  };
  destinationLat: number;
  destinationLng: number;
  destinationAddress: string;
  estimatedDistanceKm: number;
  estimatedDurationMinutes: number;
  status: string;
}

export default function DroneTrackingPage() {
  const router = useRouter();
  const { getStorageKeys } = useAuth();
  const [activeDeliveries, setActiveDeliveries] = useState<Array<Order & { deliveryLog?: DeliveryLog }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<(Order & { deliveryLog?: DeliveryLog }) | null>(null);

  useEffect(() => {
    // Check authentication
    const keys = getStorageKeys('CUSTOMER');
    const token = localStorage.getItem(keys.tokenKey);
    if (!token) {
      router.push('/login');
      return;
    }

    loadActiveDeliveries();
    
    // ⭐️ Refresh every 5 seconds for real-time updates
    const interval = setInterval(loadActiveDeliveries, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadActiveDeliveries = async () => {
    try {
      // Get current user ID
      const keys = getStorageKeys('CUSTOMER');
      const userStr = localStorage.getItem(keys.userKey);
      if (!userStr) {
        console.error('User not found in localStorage');
        setLoading(false);
        return;
      }
      const user = JSON.parse(userStr);
      const userId = user.id;
      
      console.log('🔍 Loading orders for userId:', userId);

      // Get user's orders in SHIPPED status
      const ordersResponse = await ApiClient.get<Order[]>(`/api/orders/get/byUser?mockUserId=${userId}`);
      
      console.log('📦 Orders response:', ordersResponse);
      
      if (ordersResponse.success && ordersResponse.data) {
        console.log('📊 Total orders:', ordersResponse.data.length);
        console.log('📊 Orders data:', ordersResponse.data);
        
        const shippedOrders = ordersResponse.data.filter(
          (order) => order.orderStatus === 'SHIPPED' && order.droneId
        );
        
        console.log('🚁 Shipped orders with drone:', shippedOrders);

        // Load delivery log for each order
        const ordersWithLogs = await Promise.all(
          shippedOrders.map(async (order) => {
            try {
              const logResponse = await ApiClient.get<DeliveryLog>(
                `/api/drones/internal/delivery-logs/order/${order.id}`
              );
              return {
                ...order,
                deliveryLog: logResponse.data || undefined,
              };
            } catch (error) {
              console.error(`Error loading delivery log for order ${order.id}:`, error);
              return order;
            }
          })
        );

        setActiveDeliveries(ordersWithLogs);
        
        // Auto-select first order if none selected
        if (!selectedOrder && ordersWithLogs.length > 0) {
          setSelectedOrder(ordersWithLogs[0]);
        }
      }
    } catch (error) {
      console.error('Error loading active deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Đang tải thông tin giao hàng...</p>
      </div>
    );
  }

  if (activeDeliveries.length === 0) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">🚁 Theo dõi Drone giao hàng</h1>
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500 mb-4">Bạn chưa có đơn hàng nào đang được giao bởi drone</p>
              <Button onClick={() => router.push('/customer/orders')}>
                Xem đơn hàng của tôi
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">🚁 Theo dõi Drone giao hàng</h1>
          <Button variant="outline" onClick={() => router.push('/customer/dashboard')}>
            ← Về Dashboard
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left sidebar: List of active deliveries */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Đơn hàng đang giao ({activeDeliveries.length})</h2>
            {activeDeliveries.map((order) => (
              <Card
                key={order.id}
                className={`cursor-pointer transition-all ${
                  selectedOrder?.id === order.id ? 'ring-2 ring-primary' : 'hover:shadow-lg'
                }`}
                onClick={() => setSelectedOrder(order)}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base">Đơn hàng #{order.id}</CardTitle>
                      <p className="text-sm text-gray-500">{order.restaurantName}</p>
                    </div>
                    <Badge className="bg-blue-500">ĐANG GIAO</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {order.deliveryLog?.drone && (
                    <div className="space-y-1 text-sm">
                      <p>🚁 Drone: {order.deliveryLog.drone.name}</p>
                      <p>📍 {order.addressShip}</p>
                      <p>⏱️ Dự kiến: {order.deliveryLog.estimatedDurationMinutes} phút</p>
                      <p>📏 Khoảng cách: {order.deliveryLog.estimatedDistanceKm.toFixed(2)} km</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Right side: Live map tracking */}
          <div className="lg:col-span-2">
            {selectedOrder && selectedOrder.deliveryLog && selectedOrder.deliveryLog.drone && selectedOrder.destinationLat && selectedOrder.destinationLng ? (
              <Card>
                <CardHeader>
                  <CardTitle>🗺️ Theo dõi trực tiếp - Đơn hàng #{selectedOrder.id}</CardTitle>
                  <p className="text-sm text-gray-500">
                    Drone {selectedOrder.deliveryLog.drone?.name || 'Unknown'} đang giao hàng đến {selectedOrder.addressShip}
                  </p>
                </CardHeader>
                <CardContent>
                  <DroneTrackingMap
                    droneId={selectedOrder.deliveryLog.drone?.id || 0}
                    orderId={selectedOrder.id}
                    restaurantLat={selectedOrder.deliveryLog.drone?.homeLat || 0}
                    restaurantLng={selectedOrder.deliveryLog.drone?.homeLng || 0}
                    destinationLat={selectedOrder.destinationLat}
                    destinationLng={selectedOrder.destinationLng}
                    userRole="CUSTOMER" // ⭐️ Pass role for customer
                  />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500">Không thể hiển thị bản đồ (thiếu tọa độ GPS)</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

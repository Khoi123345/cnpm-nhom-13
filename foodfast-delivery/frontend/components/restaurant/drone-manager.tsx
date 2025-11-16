'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ApiClient } from '@/lib/api-client';

interface Drone {
  id: number;
  name: string;
  status: 'IDLE' | 'DELIVERING' | 'RETURNING' | 'CHARGING' | 'MAINTENANCE';
  batteryPercent: number;
  currentLat: number | null;
  currentLng: number | null;
  homeLat: number;
  homeLng: number;
  maxPayloadKg: number;
  maxSpeedKmh: number;
  totalDeliveries: number;
  isActive: boolean;
  currentOrderId: number | null;
  restaurantId: string;
}

interface RegistrationRequest {
  id: number;
  requestType: 'REGISTRATION' | 'DELETE';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  droneName: string;
  restaurantId: string;
  restaurantName: string;
  reason: string | null;
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
}

export default function RestaurantDroneManager() {
  const [drones, setDrones] = useState<Drone[]>([]);
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedDroneForDelete, setSelectedDroneForDelete] = useState<Drone | null>(null);
  
  // Form states
  const [newDrone, setNewDrone] = useState({
    name: '',
    model: 'DJI-M300',
    homeLat: 10.762622,
    homeLng: 106.660172,
    maxPayloadKg: 5.0,
    maxSpeedKmh: 30.0,
  });
  const [deleteReason, setDeleteReason] = useState('');

  useEffect(() => {
    loadDrones();
    loadRequests();
  }, []);

  const loadDrones = async () => {
    try {
      console.log('Loading drones...');
      const response = await ApiClient.get<Drone[]>('/api/drones/my-restaurant');
      console.log('Drones loaded:', response);
      setDrones(response.data || []);
    } catch (error: any) {
      console.error('Error loading drones:', error);
      console.error('Error details:', error.response?.data || error.message);
      alert('❌ Failed to load drones: ' + (error.response?.data?.message || error.message || 'Please login as RESTAURANT'));
    } finally {
      setLoading(false);
    }
  };

  const loadRequests = async () => {
    try {
      // Cần lấy restaurantId từ user context hoặc từ drone đầu tiên
      if (drones.length === 0) return;
      const restaurantId = drones[0]?.restaurantId || 'default-restaurant-id';
      
      const response = await ApiClient.get<RegistrationRequest[]>(
        `/api/drones/registration-requests/my-restaurant?restaurantId=${restaurantId}`
      );
      setRequests(response.data || []);
    } catch (error) {
      console.error('Error loading requests:', error);
    }
  };

  const handleAddDrone = async () => {
    try {
      // Cần lấy restaurantId và restaurantName từ user context
      const restaurantId = drones[0]?.restaurantId || 'default-restaurant-id';
      const restaurantName = 'My Restaurant'; // Nên lấy từ user profile
      
      await ApiClient.post(
        `/api/drones/registration-requests?restaurantId=${restaurantId}&restaurantName=${restaurantName}`,
        {
          droneName: newDrone.name,
          droneModel: newDrone.model || 'DJI-M300',
          homeLat: newDrone.homeLat,
          homeLng: newDrone.homeLng,
          maxPayloadKg: newDrone.maxPayloadKg,
          maxSpeedKmh: newDrone.maxSpeedKmh,
        }
      );
      
      alert('✅ Drone registration request submitted! Waiting for admin approval.');
      setShowAddDialog(false);
      setNewDrone({ name: '', model: 'DJI-M300', homeLat: 10.762622, homeLng: 106.660172, maxPayloadKg: 5.0, maxSpeedKmh: 30.0 });
      loadRequests();
    } catch (error: any) {
      alert('❌ Failed to submit request: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSetMaintenance = async (droneId: number) => {
    try {
      await ApiClient.put(`/api/drones/${droneId}/maintenance`, {});
      alert('✅ Drone marked as maintenance');
      loadDrones();
    } catch (error: any) {
      alert('❌ Failed: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleRequestDelete = async () => {
    if (!selectedDroneForDelete || !deleteReason.trim()) {
      alert('Please provide a reason for deletion');
      return;
    }

    try {
      await ApiClient.delete(
        `/api/drones/${selectedDroneForDelete.id}/request-delete?reason=${encodeURIComponent(deleteReason)}`
      );
      alert('✅ Delete request submitted! Waiting for admin approval.');
      setShowDeleteDialog(false);
      setSelectedDroneForDelete(null);
      setDeleteReason('');
      loadRequests();
    } catch (error: any) {
      alert('❌ Failed to submit delete request: ' + (error.response?.data?.message || error.message));
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      IDLE: 'bg-green-500',
      DELIVERING: 'bg-blue-500',
      RETURNING: 'bg-yellow-500',
      CHARGING: 'bg-orange-500',
      MAINTENANCE: 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const getBatteryColor = (battery: number) => {
    if (battery > 50) return 'text-green-600';
    if (battery > 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRequestStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
    };
    return variants[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div className="text-center p-8">Loading drones...</div>;
  }

  return (
    <Tabs defaultValue="drones" className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">🚁 Drone Fleet Management</h2>
          <p className="text-gray-600">Manage your drones and assign them to orders</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>➕ Request New Drone</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request New Drone Registration</DialogTitle>
              <DialogDescription>Submit a request to admin for approval</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Drone Name *</Label>
                <Input
                  id="name"
                  value={newDrone.name}
                  onChange={(e) => setNewDrone({ ...newDrone, name: e.target.value })}
                  placeholder="e.g., Drone-001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Drone Model *</Label>
                <Input
                  id="model"
                  value={newDrone.model}
                  onChange={(e) => setNewDrone({ ...newDrone, model: e.target.value })}
                  placeholder="e.g., DJI-M300, Parrot ANAFI"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="homeLat">Home Latitude *</Label>
                  <Input
                    id="homeLat"
                    type="number"
                    step="0.000001"
                    value={newDrone.homeLat}
                    onChange={(e) => setNewDrone({ ...newDrone, homeLat: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="homeLng">Home Longitude *</Label>
                  <Input
                    id="homeLng"
                    type="number"
                    step="0.000001"
                    value={newDrone.homeLng}
                    onChange={(e) => setNewDrone({ ...newDrone, homeLng: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="payload">Max Payload (kg) *</Label>
                  <Input
                    id="payload"
                    type="number"
                    step="0.1"
                    value={newDrone.maxPayloadKg}
                    onChange={(e) => setNewDrone({ ...newDrone, maxPayloadKg: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="speed">Max Speed (km/h) *</Label>
                  <Input
                    id="speed"
                    type="number"
                    step="1"
                    value={newDrone.maxSpeedKmh}
                    onChange={(e) => setNewDrone({ ...newDrone, maxSpeedKmh: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
              <Button onClick={handleAddDrone}>Submit Request</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <TabsList>
        <TabsTrigger value="drones">My Drones</TabsTrigger>
        <TabsTrigger value="requests">Registration Requests</TabsTrigger>
      </TabsList>

      <TabsContent value="drones" className="space-y-6">
        {/* Drones Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {drones.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">No drones available. Request a new drone from Admin.</p>
            </CardContent>
          </Card>
        ) : (
          drones.map((drone) => (
            <Card key={drone.id} className={!drone.isActive ? 'opacity-50' : ''}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{drone.name}</CardTitle>
                    <CardDescription>Drone #{drone.id}</CardDescription>
                  </div>
                  <Badge className={getStatusColor(drone.status)}>{drone.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-500">Battery</p>
                    <p className={`font-bold ${getBatteryColor(drone.batteryPercent)}`}>
                      {drone.batteryPercent}%
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Deliveries</p>
                    <p className="font-bold">{drone.totalDeliveries}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Max Payload</p>
                    <p className="font-bold">{drone.maxPayloadKg} kg</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Max Speed</p>
                    <p className="font-bold">{drone.maxSpeedKmh} km/h</p>
                  </div>
                </div>

                {drone.currentOrderId && (
                  <div className="bg-blue-50 p-2 rounded text-sm">
                    <p className="text-blue-700">Currently delivering order #{drone.currentOrderId}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                    ℹ️ Assign drones to orders from the <span className="font-semibold">Order Management</span> page
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={drone.status === 'MAINTENANCE'}
                      onClick={() => handleSetMaintenance(drone.id)}
                    >
                      🔧 Maintenance
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setSelectedDroneForDelete(drone);
                        setShowDeleteDialog(true);
                      }}
                    >
                      🗑️ Request Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </TabsContent>

    <TabsContent value="requests">
      <Card>
        <CardHeader>
          <CardTitle>Registration & Delete Requests</CardTitle>
          <CardDescription>Track your drone requests status</CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No requests found</p>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => (
                <div key={req.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">{req.droneName}</p>
                      <p className="text-sm text-gray-600">
                        {req.requestType === 'REGISTRATION' ? '➕ Registration' : '🗑️ Delete'} Request
                      </p>
                    </div>
                    <Badge className={getRequestStatusBadge(req.status)}>
                      {req.status}
                    </Badge>
                  </div>
                  {req.reason && (
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Reason:</span> {req.reason}
                    </p>
                  )}
                  <div className="text-xs text-gray-500">
                    <p>Submitted: {new Date(req.createdAt).toLocaleString()}</p>
                    {req.reviewedAt && (
                      <p>Reviewed: {new Date(req.reviewedAt).toLocaleString()}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>

    {/* Delete Confirmation Dialog */}
    <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Drone Deletion</DialogTitle>
          <DialogDescription>
            This will submit a request to admin. Drone: {selectedDroneForDelete?.name}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="deleteReason">Reason for deletion *</Label>
            <Input
              id="deleteReason"
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="e.g., Damaged beyond repair, End of lifecycle"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => {
            setShowDeleteDialog(false);
            setDeleteReason('');
            setSelectedDroneForDelete(null);
          }}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleRequestDelete}>
            Submit Delete Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </Tabs>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ApiClient } from '@/lib/api-client';

interface DroneRequest {
  id: number;
  restaurantId: string;
  ownerId: string;
  restaurantName: string;
  requestType: 'REGISTER_NEW' | 'DELETE_DRONE';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  droneName: string;
  droneModel: string;
  maxPayloadKg: number;
  maxSpeedKmh: number;
  homeLat: number;
  homeLng: number;
  droneId: number | null;
  reason: string | null;
  adminNote: string | null;
  createdAt: string;
  processedAt: string | null;
}

export default function AdminDroneApproval() {
  const [requests, setRequests] = useState<DroneRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminNotes, setAdminNotes] = useState<Record<number, string>>({});

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const response = await ApiClient.get<DroneRequest[]>('/api/admin/drones/requests');
      setRequests(response.data || []);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: number) => {
    try {
      await ApiClient.post(`/api/admin/drones/requests/${requestId}/approve`, {
        adminNote: adminNotes[requestId] || '',
      });
      alert('✅ Request approved successfully!');
      loadRequests();
    } catch (error: any) {
      alert('❌ Failed to approve: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleReject = async (requestId: number) => {
    const note = adminNotes[requestId];
    if (!note) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      await ApiClient.post(`/api/admin/drones/requests/${requestId}/reject`, {
        adminNote: note,
      });
      alert('✅ Request rejected');
      loadRequests();
    } catch (error: any) {
      alert('❌ Failed to reject: ' + (error.response?.data?.message || error.message));
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-500',
      APPROVED: 'bg-green-500',
      REJECTED: 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const getRequestTypeIcon = (type: string) => {
    return type === 'REGISTER_NEW' ? '➕ Register New Drone' : '❌ Delete Drone';
  };

  if (loading) {
    return <div className="text-center p-8">Loading requests...</div>;
  }

  const pendingRequests = requests.filter((r) => r.status === 'PENDING');
  const processedRequests = requests.filter((r) => r.status !== 'PENDING');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">🚁 Drone Registration Approval</h2>
        <p className="text-gray-600">Review and approve/reject drone registration requests from restaurants</p>
      </div>

      {/* Pending Requests */}
      <div>
        <h3 className="text-xl font-semibold mb-4">
          ⏳ Pending Requests ({pendingRequests.length})
        </h3>
        {pendingRequests.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">No pending requests</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{getRequestTypeIcon(request.requestType)}</CardTitle>
                      <CardDescription>
                        Request #{request.id} • {new Date(request.createdAt).toLocaleString()}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Restaurant</p>
                      <p className="font-semibold">{request.restaurantName}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Owner ID</p>
                      <p className="font-mono text-xs">{request.ownerId}</p>
                    </div>

                    {request.requestType === 'REGISTER_NEW' ? (
                      <>
                        <div>
                          <p className="text-gray-500">Drone Name</p>
                          <p className="font-semibold">{request.droneName}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Model</p>
                          <p className="font-semibold">{request.droneModel}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Max Payload</p>
                          <p className="font-semibold">{request.maxPayloadKg} kg</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Max Speed</p>
                          <p className="font-semibold">{request.maxSpeedKmh} km/h</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Home Location</p>
                          <p className="text-xs font-mono">
                            {request.homeLat.toFixed(6)}, {request.homeLng.toFixed(6)}
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="col-span-2">
                        <p className="text-gray-500">Drone to Delete</p>
                        <p className="font-semibold">Drone #{request.droneId}</p>
                      </div>
                    )}
                  </div>

                  {request.reason && (
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm text-gray-500">Request Reason:</p>
                      <p className="text-sm">{request.reason}</p>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium">Admin Note:</label>
                    <Textarea
                      placeholder="Add your note here..."
                      value={adminNotes[request.id] || ''}
                      onChange={(e) => setAdminNotes({ ...adminNotes, [request.id]: e.target.value })}
                      className="mt-2"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleApprove(request.id)}>
                      ✅ Approve
                    </Button>
                    <Button variant="destructive" className="flex-1" onClick={() => handleReject(request.id)}>
                      ❌ Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Processed Requests */}
      <div>
        <h3 className="text-xl font-semibold mb-4">
          📋 Processed Requests ({processedRequests.length})
        </h3>
        <div className="space-y-3">
          {processedRequests.slice(0, 10).map((request) => (
            <Card key={request.id} className="opacity-75">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{request.restaurantName}</p>
                    <p className="text-sm text-gray-600">
                      {getRequestTypeIcon(request.requestType)} • Request #{request.id}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      {request.processedAt ? new Date(request.processedAt).toLocaleDateString() : ''}
                    </p>
                  </div>
                </div>
                {request.adminNote && (
                  <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                    📝 {request.adminNote}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

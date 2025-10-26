import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Clock, AlertCircle, CheckCircle, XCircle, Eye } from "lucide-react";

interface Request {
  id: string;
  request_type: 'blood' | 'plasma';
  blood_group: string;
  quantity_ml: number;
  urgency: 'Low' | 'Medium' | 'High' | 'Emergency';
  patient_name: string;
  hospital: string;
  notes: string;
  status: 'Pending' | 'Accepted' | 'Ignored' | 'Scheduled';
  created_at: string;
}

interface RequestsListProps {
  onRequestUpdate: () => void;
}

export default function RequestsList({ onRequestUpdate }: RequestsListProps) {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchRequests();
  }, [user]);

  const fetchRequests = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Add status field if not present (for demo purposes)
      const requestsWithStatus = (data || []).map(request => ({
        ...request,
        status: request.status || 'Pending'
      }));

      setRequests(requestsWithStatus);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: "Error",
        description: "Failed to fetch requests. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId: string, status: 'Accepted' | 'Ignored' | 'Scheduled') => {
    try {
      const { error } = await supabase
        .from('requests')
        .update({ status })
        .eq('id', requestId);

      if (error) throw error;

      setRequests(prev => 
        prev.map(request => 
          request.id === requestId ? { ...request, status } : request
        )
      );

      toast({
        title: "Status Updated",
        description: `Request status updated to ${status}`,
        variant: "default",
      });

      onRequestUpdate();
    } catch (error) {
      console.error('Error updating request status:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update request status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'Emergency':
        return 'bg-red-500 text-white';
      case 'High':
        return 'bg-orange-500 text-white';
      case 'Medium':
        return 'bg-yellow-500 text-black';
      case 'Low':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Accepted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Ignored':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Clock className="h-4 w-4" />;
      case 'Accepted':
        return <CheckCircle className="h-4 w-4" />;
      case 'Scheduled':
        return <CheckCircle className="h-4 w-4" />;
      case 'Ignored':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const convertMlToUnits = (ml: number) => {
    return Math.round(ml / 450); // 1 unit = 450ml
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Requests List</CardTitle>
          <CardDescription>Loading requests...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Requests List
        </CardTitle>
        <CardDescription>
          View and manage all submitted donation requests
        </CardDescription>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No requests found. Submit a request to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Blood Group</TableHead>
                    <TableHead>Units</TableHead>
                    <TableHead>Urgency</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.patient_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {request.request_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-bold text-red-600">{request.blood_group}</TableCell>
                      <TableCell>{convertMlToUnits(request.quantity_ml)} units</TableCell>
                      <TableCell>
                        <Badge className={getUrgencyColor(request.urgency)}>
                          {request.urgency}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(request.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(request.status)}
                            {request.status}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatDate(request.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {request.status === 'Pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => updateRequestStatus(request.id, 'Accepted')}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateRequestStatus(request.id, 'Ignored')}
                              >
                                Ignore
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {requests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{request.patient_name}</h3>
                      <p className="text-sm text-gray-500">{formatDate(request.created_at)}</p>
                    </div>
                    <Badge className={getStatusColor(request.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(request.status)}
                        {request.status}
                      </div>
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Type:</span>
                      <Badge variant="outline" className="ml-1 capitalize">
                        {request.request_type}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-gray-500">Blood Group:</span>
                      <span className="ml-1 font-bold text-red-600">{request.blood_group}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Units:</span>
                      <span className="ml-1">{convertMlToUnits(request.quantity_ml)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Urgency:</span>
                      <Badge className={`ml-1 ${getUrgencyColor(request.urgency)}`}>
                        {request.urgency}
                      </Badge>
                    </div>
                  </div>

                  {request.notes && (
                    <div className="text-sm">
                      <span className="text-gray-500">Notes:</span>
                      <p className="text-gray-700 mt-1">{request.notes}</p>
                    </div>
                  )}

                  {request.status === 'Pending' && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => updateRequestStatus(request.id, 'Accepted')}
                        className="bg-green-600 hover:bg-green-700 flex-1"
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateRequestStatus(request.id, 'Ignored')}
                        className="flex-1"
                      >
                        Ignore
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Droplets, MapPin, Clock, User, Phone, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Request {
  id: string;
  request_id: string;
  hospital_id: string;
  type: 'blood' | 'plasma';
  blood_group: string;
  units: number;
  urgency: 'Low' | 'Medium' | 'High' | 'Emergency';
  patient_name: string;
  patient_age?: number;
  patient_gender?: string;
  medical_condition?: string;
  location: string;
  notes?: string;
  status: 'pending' | 'accepted' | 'ignored' | 'completed' | 'cancelled';
  created_at: string;
  hospital?: {
    name: string;
    contact_info?: {
      phone?: string;
      address?: string;
    };
  };
}

interface DonorRequestCardProps {
  request: Request;
  onRequestUpdate: () => void;
}

export default function DonorRequestCard({ request, onRequestUpdate }: DonorRequestCardProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'Emergency': return 'bg-red-500';
      case 'High': return 'bg-orange-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'Emergency': return <Clock className="h-4 w-4" />;
      case 'High': return <Clock className="h-4 w-4" />;
      case 'Medium': return <Clock className="h-4 w-4" />;
      case 'Low': return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const handleAccept = async () => {
    setLoading(true);
    try {
      // Get current donor from session
      const donorData = JSON.parse(sessionStorage.getItem('donor') || '{}');
      
      if (!donorData.id) {
        toast({
          title: "Authentication Error",
          description: "Please log in again.",
          variant: "destructive",
        });
        return;
      }

      // Update request status to accepted
      const { error } = await supabase
        .from('requests')
        .update({
          donor_id: donorData.id,
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', request.id);

      if (error) {
        toast({
          title: "Accept Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        // Create appointment
        const { error: appointmentError } = await supabase
          .from('appointments')
          .insert({
            request_id: request.id,
            hospital_id: request.hospital_id,
            donor_id: donorData.id,
            appointment_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
            appointment_time: "10:00 AM",
            status: 'scheduled'
          });

        if (appointmentError) {
          console.error('Appointment creation error:', appointmentError);
        }

        // Create notification for hospital
        await supabase
          .from('notifications')
          .insert({
            user_id: request.hospital_id,
            user_type: 'hospital',
            title: 'Request Accepted',
            message: `Your ${request.type} request for ${request.blood_group} has been accepted by a donor.`,
            type: 'request',
            data: {
              request_id: request.id,
              donor_id: donorData.id
            }
          });

        toast({
          title: "Request Accepted",
          description: "You have accepted this request. The hospital will contact you to schedule the donation.",
        });
        
        onRequestUpdate();
      }
    } catch (error) {
      console.error('Accept error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleIgnore = async () => {
    setLoading(true);
    try {
      // Get current donor from session
      const donorData = JSON.parse(sessionStorage.getItem('donor') || '{}');
      
      if (!donorData.id) {
        toast({
          title: "Authentication Error",
          description: "Please log in again.",
          variant: "destructive",
        });
        return;
      }

      // Update request status to ignored
      const { error } = await supabase
        .from('requests')
        .update({
          donor_id: donorData.id,
          status: 'ignored',
          updated_at: new Date().toISOString()
        })
        .eq('id', request.id);

      if (error) {
        toast({
          title: "Ignore Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Request Ignored",
          description: "This request has been marked as ignored.",
        });
        
        onRequestUpdate();
      }
    } catch (error) {
      console.error('Ignore error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

  return (
    <Card className={`${request.status === 'accepted' ? 'border-green-500 bg-green-50' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {request.type === 'blood' ? (
              <Heart className="h-5 w-5 text-red-500" />
            ) : (
              <Droplets className="h-5 w-5 text-blue-500" />
            )}
            <div>
              <CardTitle className="text-lg">
                {request.type === 'blood' ? 'Blood' : 'Plasma'} Request
              </CardTitle>
              <CardDescription>
                {request.hospital?.name || 'Hospital'} • {formatDate(request.created_at)}
              </CardDescription>
            </div>
          </div>
          <Badge className={`${getUrgencyColor(request.urgency)} text-white flex items-center gap-1`}>
            {getUrgencyIcon(request.urgency)}
            {request.urgency}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Blood Group and Units */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-medium">Blood Group:</span>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {request.blood_group}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Units:</span>
            <span className="text-lg font-bold text-red-600">{request.units}</span>
          </div>
        </div>

        {/* Patient Information */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-500" />
            <span className="font-medium">Patient: {request.patient_name}</span>
            {request.patient_age && (
              <span className="text-sm text-gray-500">({request.patient_age} years old)</span>
            )}
          </div>
          {request.patient_gender && (
            <div className="text-sm text-gray-600 ml-6">
              Gender: {request.patient_gender}
            </div>
          )}
          {request.medical_condition && (
            <div className="text-sm text-gray-600 ml-6">
              Condition: {request.medical_condition}
            </div>
          )}
        </div>

        {/* Location */}
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-gray-500" />
          <span className="text-sm">{request.location}</span>
        </div>

        {/* Hospital Contact */}
        {request.hospital?.contact_info?.phone && (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-gray-500" />
            <span className="text-sm">{request.hospital.contact_info.phone}</span>
          </div>
        )}

        {/* Notes */}
        {request.notes && (
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
            <strong>Notes:</strong> {request.notes}
          </div>
        )}

        {/* Status */}
        {request.status === 'accepted' && (
          <div className="flex items-center gap-2 text-green-600 bg-green-100 p-3 rounded-md">
            <CheckCircle className="h-4 w-4" />
            <span className="font-medium">You have accepted this request</span>
          </div>
        )}

        {/* Action Buttons */}
        {request.status === 'pending' && (
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleAccept}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {loading ? "Accepting..." : "Accept Request"}
            </Button>
            <Button
              onClick={handleIgnore}
              disabled={loading}
              variant="outline"
              className="flex-1"
            >
              <XCircle className="h-4 w-4 mr-2" />
              {loading ? "Ignoring..." : "Ignore"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

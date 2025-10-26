import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar, Clock, MapPin, Phone, X, Check } from "lucide-react";

interface Donor {
  id: string;
  first_name: string;
  last_name: string;
  blood_type: string;
  phone: string;
  location: string;
}

interface AppointmentFormProps {
  donor: Donor;
  requestId?: string;
  onClose: () => void;
  onAppointmentScheduled: () => void;
}

interface AppointmentData {
  date: string;
  time: string;
  hospitalContact: string;
  notes: string;
  donationType: 'blood' | 'plasma';
}

export default function AppointmentForm({ 
  donor, 
  requestId, 
  onClose, 
  onAppointmentScheduled 
}: AppointmentFormProps) {
  const [formData, setFormData] = useState<AppointmentData>({
    date: '',
    time: '',
    hospitalContact: '',
    notes: '',
    donationType: 'blood'
  });
  
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleInputChange = (field: keyof AppointmentData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast({
        title: "Authentication Required",
        description: "Please log in to schedule an appointment.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.date || !formData.time || !formData.hospitalContact) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Create appointment
      const { error: appointmentError } = await supabase
        .from('appointments')
        .insert([
          {
            donor_id: donor.id,
            hospital_id: user.id,
            request_id: requestId || null,
            donation_type: formData.donationType,
            status: 'pending',
            appointment_date: new Date(`${formData.date}T${formData.time}`).toISOString(),
            hospital_contact: formData.hospitalContact,
            notes: formData.notes,
          }
        ]);

      if (appointmentError) throw appointmentError;

      // Update request status to 'Scheduled' if requestId is provided
      if (requestId) {
        const { error: requestError } = await supabase
          .from('requests')
          .update({ status: 'Scheduled' })
          .eq('id', requestId);

        if (requestError) throw requestError;
      }

      // Send notification to donor (mock implementation)
      await sendNotificationToDonor();

      toast({
        title: "Appointment Scheduled",
        description: `Appointment scheduled with ${donor.first_name} ${donor.last_name} for ${formatDate(formData.date)} at ${formData.time}`,
        variant: "default",
      });

      onAppointmentScheduled();
    } catch (error) {
      console.error('Error scheduling appointment:', error);
      toast({
        title: "Scheduling Failed",
        description: "Failed to schedule appointment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendNotificationToDonor = async () => {
    // Mock notification - in a real app, this would send push notification, email, or SMS
    try {
      const { error } = await supabase
        .from('notifications')
        .insert([
          {
            user_id: donor.id,
            title: 'Appointment Confirmation',
            message: `Your donation appointment has been scheduled for ${formatDate(formData.date)} at ${formData.time}. Hospital Contact: ${formData.hospitalContact}`,
            type: 'appointment_confirmation',
            is_read: false,
          }
        ]);

      if (error) {
        console.log('Notification table might not exist, this is expected for demo');
      }
    } catch (error) {
      console.log('Notification system not fully implemented, this is expected for demo');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30); // 30 days from now
    return maxDate.toISOString().split('T')[0];
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Calendar className="h-8 w-8 text-blue-600 mr-2" />
            <Clock className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle>Schedule Appointment</CardTitle>
          <CardDescription>
            Schedule a donation appointment with {donor.first_name} {donor.last_name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Donor Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Donor Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Name:</span>
                  <p className="font-medium">{donor.first_name} {donor.last_name}</p>
                </div>
                <div>
                  <span className="text-gray-500">Blood Type:</span>
                  <p className="font-medium text-red-600">{donor.blood_type}</p>
                </div>
                <div>
                  <span className="text-gray-500">Phone:</span>
                  <p className="font-medium">{donor.phone || 'Not provided'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Location:</span>
                  <p className="font-medium">{donor.location}</p>
                </div>
              </div>
            </div>

            {/* Appointment Details */}
            <div className="space-y-4">
              <h3 className="font-semibold">Appointment Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Appointment Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    min={getMinDate()}
                    max={getMaxDate()}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Appointment Time *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => handleInputChange('time', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="donationType">Donation Type *</Label>
                <Select 
                  value={formData.donationType} 
                  onValueChange={(value: 'blood' | 'plasma') => handleInputChange('donationType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select donation type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blood">Blood</SelectItem>
                    <SelectItem value="plasma">Plasma</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hospitalContact">Hospital Contact *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input
                    id="hospitalContact"
                    value={formData.hospitalContact}
                    onChange={(e) => handleInputChange('hospitalContact', e.target.value)}
                    placeholder="Enter contact number or email"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Any special instructions or notes for the donor"
                  rows={3}
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  "Scheduling..."
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Schedule Appointment
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Users, Heart, Activity, Calendar, Phone, MapPin } from "lucide-react";
import AppointmentForm from "./AppointmentForm";

interface Donor {
  id: string;
  first_name: string;
  last_name: string;
  blood_type: string;
  is_available: boolean;
  last_donation_date: string;
  health_condition: string;
  recent_donations: Array<{
    date: string;
    type: 'blood' | 'plasma';
  }>;
  phone: string;
  location: string;
}

interface DonorProfilesProps {
  selectedRequestId?: string;
  onAppointmentScheduled: () => void;
}

export default function DonorProfiles({ selectedRequestId, onAppointmentScheduled }: DonorProfilesProps) {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDonor, setSelectedDonor] = useState<Donor | null>(null);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchDonors();
  }, []);

  const fetchDonors = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, blood_type, is_available, last_donation_date, phone, address')
        .eq('is_available', true);

      if (error) throw error;

      // Transform data and add mock health conditions and recent donations
      const donorsWithHealthData = (data || []).map(donor => ({
        ...donor,
        health_condition: getRandomHealthCondition(),
        recent_donations: getRandomRecentDonations(),
        location: 'Downtown Medical District' // Mock location
      }));

      setDonors(donorsWithHealthData);
    } catch (error) {
      console.error('Error fetching donors:', error);
      toast({
        title: "Error",
        description: "Failed to fetch donor profiles. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRandomHealthCondition = () => {
    const conditions = ['Healthy', 'Low Hemoglobin', 'Excellent Health', 'Good Condition', 'Minor Anemia'];
    return conditions[Math.floor(Math.random() * conditions.length)];
  };

  const getRandomRecentDonations = () => {
    const donations = [];
    const numDonations = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < numDonations; i++) {
      const daysAgo = Math.floor(Math.random() * 365) + 1;
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      
      donations.push({
        date: date.toISOString().split('T')[0],
        type: Math.random() > 0.5 ? 'blood' : 'plasma'
      });
    }
    
    return donations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const handleAcceptDonor = (donor: Donor) => {
    setSelectedDonor(donor);
    setShowAppointmentForm(true);
  };

  const handleIgnoreDonor = async (donorId: string) => {
    try {
      // Update donor availability status
      const { error } = await supabase
        .from('profiles')
        .update({ is_available: false })
        .eq('id', donorId);

      if (error) throw error;

      // Remove from local state
      setDonors(prev => prev.filter(donor => donor.id !== donorId));

      toast({
        title: "Donor Ignored",
        description: "Donor has been removed from the available list.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error ignoring donor:', error);
      toast({
        title: "Error",
        description: "Failed to ignore donor. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getHealthConditionColor = (condition: string) => {
    switch (condition) {
      case 'Healthy':
      case 'Excellent Health':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Good Condition':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Low Hemoglobin':
      case 'Minor Anemia':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Available Donors</CardTitle>
          <CardDescription>Loading donor profiles...</CardDescription>
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
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Available Donors
          </CardTitle>
          <CardDescription>
            View and manage available blood and plasma donors
          </CardDescription>
        </CardHeader>
        <CardContent>
          {donors.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No available donors found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {donors.map((donor) => (
                <div key={donor.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-red-100 text-red-600">
                          {getInitials(donor.first_name, donor.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">
                          {donor.first_name} {donor.last_name}
                        </h3>
                        <p className="text-sm text-gray-500">Donor ID: {donor.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                    <Badge className="bg-red-100 text-red-800 border-red-200">
                      {donor.blood_type}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-gray-500" />
                      <Badge className={getHealthConditionColor(donor.health_condition)}>
                        {donor.health_condition}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        Last donation: {donor.last_donation_date ? formatDate(donor.last_donation_date) : 'Never'}
                      </span>
                    </div>

                    {donor.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{donor.phone}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{donor.location}</span>
                    </div>
                  </div>

                  {donor.recent_donations.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-700">Recent Donations:</p>
                      <div className="space-y-1">
                        {donor.recent_donations.slice(0, 2).map((donation, index) => (
                          <div key={index} className="flex justify-between text-xs text-gray-600">
                            <span>{formatDate(donation.date)}</span>
                            <Badge variant="outline" className="text-xs">
                              {donation.type}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => handleAcceptDonor(donor)}
                      className="bg-green-600 hover:bg-green-700 flex-1"
                    >
                      <Heart className="h-4 w-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleIgnoreDonor(donor.id)}
                      className="flex-1"
                    >
                      Ignore
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showAppointmentForm && selectedDonor && (
        <AppointmentForm
          donor={selectedDonor}
          requestId={selectedRequestId}
          onClose={() => {
            setShowAppointmentForm(false);
            setSelectedDonor(null);
          }}
          onAppointmentScheduled={() => {
            setShowAppointmentForm(false);
            setSelectedDonor(null);
            onAppointmentScheduled();
          }}
        />
      )}
    </>
  );
}


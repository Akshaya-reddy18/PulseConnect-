import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Droplets, Heart } from "lucide-react";

interface RequestFormProps {
  onRequestSubmitted: () => void;
}

interface RequestData {
  patientName: string;
  requestType: 'blood' | 'plasma';
  bloodType: string;
  unitsRequired: number;
  urgency: 'Low' | 'Medium' | 'High' | 'Emergency';
  contactDetails: string;
  notes: string;
}

export default function RequestForm({ onRequestSubmitted }: RequestFormProps) {
  const [formData, setFormData] = useState<RequestData>({
    patientName: '',
    requestType: 'blood',
    bloodType: '',
    unitsRequired: 1,
    urgency: 'Medium',
    contactDetails: '',
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleInputChange = (field: keyof RequestData, value: string | number) => {
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
        description: "Please log in to submit a request.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.patientName || !formData.bloodType) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('requests')
        .insert([
          {
            request_type: formData.requestType,
            blood_group: formData.bloodType,
            quantity_ml: formData.unitsRequired * 450, // Convert units to ml (1 unit = 450ml)
            urgency: formData.urgency,
            patient_name: formData.patientName,
            hospital: 'Current Hospital', // This should be the actual hospital name
            hospital_id: user.id, // This should be the hospital ID
            location: 'Hospital Location', // This should be the actual location
            notes: formData.notes,
            created_by: user.id,
          }
        ]);

      if (error) throw error;

      toast({
        title: "Request Submitted",
        description: `${formData.requestType.charAt(0).toUpperCase() + formData.requestType.slice(1)} request submitted successfully.`,
        variant: "default",
      });

      // Reset form
      setFormData({
        patientName: '',
        requestType: 'blood',
        bloodType: '',
        unitsRequired: 1,
        urgency: 'Medium',
        contactDetails: '',
        notes: ''
      });

      onRequestSubmitted();
    } catch (error) {
      console.error('Error submitting request:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {formData.requestType === 'blood' ? (
            <Droplets className="h-5 w-5 text-red-500" />
          ) : (
            <Heart className="h-5 w-5 text-pink-500" />
          )}
          Request {formData.requestType.charAt(0).toUpperCase() + formData.requestType.slice(1)} Donation
        </CardTitle>
        <CardDescription>
          Submit a request for blood or plasma donation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="patientName">Patient Name *</Label>
              <Input
                id="patientName"
                value={formData.patientName}
                onChange={(e) => handleInputChange('patientName', e.target.value)}
                placeholder="Enter patient name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requestType">Donation Type *</Label>
              <Select 
                value={formData.requestType} 
                onValueChange={(value: 'blood' | 'plasma') => handleInputChange('requestType', value)}
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bloodType">Blood Type *</Label>
              <Select 
                value={formData.bloodType} 
                onValueChange={(value) => handleInputChange('bloodType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select blood type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A+">A+</SelectItem>
                  <SelectItem value="A-">A-</SelectItem>
                  <SelectItem value="B+">B+</SelectItem>
                  <SelectItem value="B-">B-</SelectItem>
                  <SelectItem value="AB+">AB+</SelectItem>
                  <SelectItem value="AB-">AB-</SelectItem>
                  <SelectItem value="O+">O+</SelectItem>
                  <SelectItem value="O-">O-</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unitsRequired">Units Required *</Label>
              <Input
                id="unitsRequired"
                type="number"
                min="1"
                max="10"
                value={formData.unitsRequired}
                onChange={(e) => handleInputChange('unitsRequired', parseInt(e.target.value) || 1)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="urgency">Urgency Level *</Label>
              <Select 
                value={formData.urgency} 
                onValueChange={(value: 'Low' | 'Medium' | 'High' | 'Emergency') => handleInputChange('urgency', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select urgency level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactDetails">Contact Details *</Label>
              <Input
                id="contactDetails"
                value={formData.contactDetails}
                onChange={(e) => handleInputChange('contactDetails', e.target.value)}
                placeholder="Phone number or email"
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
              placeholder="Any additional information about the request"
              rows={3}
            />
          </div>

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            {loading ? (
              "Submitting..."
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Submit Request
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}


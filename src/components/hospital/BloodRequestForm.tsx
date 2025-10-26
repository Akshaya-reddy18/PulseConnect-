import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Heart, Droplets, AlertTriangle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface BloodRequestFormProps {
  onRequestSubmitted: () => void;
}

export default function BloodRequestForm({ onRequestSubmitted }: BloodRequestFormProps) {
  const [formData, setFormData] = useState({
    type: 'blood',
    bloodGroup: '',
    units: '',
    urgency: 'Medium',
    patientName: '',
    patientAge: '',
    patientGender: '',
    medicalCondition: '',
    location: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const urgencyLevels = [
    { value: 'Low', label: 'Low', color: 'bg-green-500', icon: <Clock className="h-4 w-4" /> },
    { value: 'Medium', label: 'Medium', color: 'bg-yellow-500', icon: <Clock className="h-4 w-4" /> },
    { value: 'High', label: 'High', color: 'bg-orange-500', icon: <AlertTriangle className="h-4 w-4" /> },
    { value: 'Emergency', label: 'Emergency', color: 'bg-red-500', icon: <AlertTriangle className="h-4 w-4" /> }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = () => {
    return formData.bloodGroup && formData.units && formData.patientName && formData.location;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Get current hospital from session
      const hospitalData = JSON.parse(sessionStorage.getItem('hospital') || '{}');
      
      if (!hospitalData.id) {
        toast({
          title: "Authentication Error",
          description: "Please log in again.",
          variant: "destructive",
        });
        return;
      }

      // Create request
      const { error } = await supabase
        .from('requests')
        .insert({
          hospital_id: hospitalData.id,
          type: formData.type,
          blood_group: formData.bloodGroup,
          units: parseInt(formData.units),
          urgency: formData.urgency,
          patient_name: formData.patientName,
          patient_age: formData.patientAge ? parseInt(formData.patientAge) : null,
          patient_gender: formData.patientGender || null,
          medical_condition: formData.medicalCondition || null,
          location: formData.location,
          notes: formData.notes || null,
          status: 'pending'
        });

      if (error) {
        toast({
          title: "Request Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Request Submitted",
          description: "Your blood/plasma request has been submitted and will be visible to eligible donors.",
        });
        
        // Reset form
        setFormData({
          type: 'blood',
          bloodGroup: '',
          units: '',
          urgency: 'Medium',
          patientName: '',
          patientAge: '',
          patientGender: '',
          medicalCondition: '',
          location: '',
          notes: ''
        });
        
        onRequestSubmitted();
      }
    } catch (error) {
      console.error('Request submission error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
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
          {formData.type === 'blood' ? <Heart className="h-5 w-5 text-red-500" /> : <Droplets className="h-5 w-5 text-blue-500" />}
          Submit {formData.type === 'blood' ? 'Blood' : 'Plasma'} Request
        </CardTitle>
        <CardDescription>
          Submit a request for blood or plasma. This will be visible to eligible donors in your area.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Request Type */}
          <div className="space-y-2">
            <Label>Request Type *</Label>
            <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select request type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="blood">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-red-500" />
                    Blood
                  </div>
                </SelectItem>
                <SelectItem value="plasma">
                  <div className="flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-blue-500" />
                    Plasma
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Blood Group */}
            <div className="space-y-2">
              <Label>Blood Group *</Label>
              <Select value={formData.bloodGroup} onValueChange={(value) => handleInputChange('bloodGroup', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select blood group" />
                </SelectTrigger>
                <SelectContent>
                  {bloodGroups.map(group => (
                    <SelectItem key={group} value={group}>{group}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Units */}
            <div className="space-y-2">
              <Label>Units Required *</Label>
              <Input
                type="number"
                placeholder="Enter units"
                value={formData.units}
                onChange={(e) => handleInputChange('units', e.target.value)}
                min="1"
                max="10"
              />
            </div>
          </div>

          {/* Urgency Level */}
          <div className="space-y-2">
            <Label>Urgency Level *</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {urgencyLevels.map(level => (
                <Button
                  key={level.value}
                  type="button"
                  variant={formData.urgency === level.value ? "default" : "outline"}
                  className={`flex items-center gap-2 ${formData.urgency === level.value ? level.color : ''}`}
                  onClick={() => handleInputChange('urgency', level.value)}
                >
                  {level.icon}
                  {level.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Patient Information */}
          <div className="space-y-4">
            <h4 className="font-medium">Patient Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Patient Name *</Label>
                <Input
                  placeholder="Enter patient name"
                  value={formData.patientName}
                  onChange={(e) => handleInputChange('patientName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Patient Age</Label>
                <Input
                  type="number"
                  placeholder="Enter age"
                  value={formData.patientAge}
                  onChange={(e) => handleInputChange('patientAge', e.target.value)}
                  min="0"
                  max="120"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={formData.patientGender} onValueChange={(value) => handleInputChange('patientGender', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Medical Condition</Label>
                <Input
                  placeholder="Enter medical condition"
                  value={formData.medicalCondition}
                  onChange={(e) => handleInputChange('medicalCondition', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label>Location *</Label>
            <Input
              placeholder="Enter hospital location or address"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Additional Notes</Label>
            <Textarea
              placeholder="Enter any additional information or special requirements"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              className="medical-btn"
              disabled={loading || !isFormValid()}
            >
              {loading ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}


import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", 
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", 
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", 
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", 
  "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh"
];

const HOSPITAL_TYPES = [
  "Primary Health Centre", "Community Health Centre", "Sub District Hospital", 
  "District Hospital", "Medical College Hospital", "Super Specialty Hospital", 
  "Multi Specialty Hospital", "Specialty Hospital", "Private Hospital"
];

const GOVERNMENT_CATEGORIES = [
  "Central Government", "State Government", "Municipal Corporation", 
  "Panchayat Raj Institution", "Public Sector Undertaking"
];

export default function HospitalRegistration() {
  const [formData, setFormData] = useState({
    hospitalName: '',
    hospitalType: '',
    governmentCategory: '',
    hospitalAddress: '',
    state: '',
    district: '',
    website: '',
    mobileNumber: '+91',
    landlineNumber: '',
    email: '',
    hospitalHeadName: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleInputChange = (field: string, value: string | boolean) => {
    if (field === 'mobileNumber' && typeof value === 'string') {
      // Ensure +91 prefix and limit to 13 characters
      if (!value.startsWith('+91')) {
        value = '+91' + value.replace(/^\+91/, '');
      }
      if (value.length <= 13) {
        setFormData(prev => ({ ...prev, [field]: value }));
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const isFormValid = () => {
    const required = [
      'hospitalName', 'hospitalType', 'hospitalAddress', 'state', 
      'district', 'mobileNumber', 'email', 'hospitalHeadName'
    ];
    
    return required.every(field => formData[field as keyof typeof formData]) &&
           formData.mobileNumber.length === 13; // +91 + 10 digits
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields correctly.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // First, create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: 'temp_password_' + Math.random().toString(36).substring(7), // Temporary password
        options: {
          data: {
            user_type: 'hospital',
            hospital_name: formData.hospitalName
          }
        }
      });

      if (authError) {
        toast({
          title: "Registration Failed",
          description: authError.message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Insert hospital data with updated schema
      const { error: hospitalError } = await supabase
        .from('hospitals')
        .insert({
          id: authData.user?.id || '',
          name: formData.hospitalName,
          email: formData.email,
          password_hash: 'pending_verification',
          address: `${formData.hospitalAddress}, ${formData.district}, ${formData.state}`,
          contact: `${formData.mobileNumber}${formData.landlineNumber ? ', ' + formData.landlineNumber : ''}`,
          contact_info: {
            phone: formData.mobileNumber,
            landline: formData.landlineNumber,
            address: formData.hospitalAddress,
            website: formData.website
          },
          hospital_type: formData.hospitalType,
          government_category: formData.governmentCategory,
          hospital_address: formData.hospitalAddress,
          state: formData.state,
          district: formData.district,
          website: formData.website,
          mobile_number: formData.mobileNumber,
          landline_number: formData.landlineNumber,
          hospital_head_name: formData.hospitalHeadName,
          is_verified: false,
          is_active: true
        });

      if (hospitalError) {
        toast({
          title: "Registration Failed",
          description: hospitalError.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Registration Submitted",
          description: "Please check your email and click the verification link to complete your registration.",
        });
        navigate('/auth/hospital-login');
      }
    } catch (error) {
      console.error('Registration error:', error);
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
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Building className="h-8 w-8 text-medical" />
            <h1 className="text-3xl font-bold">Hospital Registration</h1>
          </div>
          <p className="text-gray-500">Online Registration System - Hospital On-boarding</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Hospital Details</CardTitle>
            <CardDescription>
              Please fill in all the required information to register your hospital
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hospitalName">Name of Hospital *</Label>
                <Input
                  id="hospitalName"
                  value={formData.hospitalName}
                  onChange={(e) => handleInputChange('hospitalName', e.target.value)}
                  placeholder="Enter hospital name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hospitalType">Hospital Type *</Label>
                <Select value={formData.hospitalType} onValueChange={(value) => handleInputChange('hospitalType', value)}>
                  <SelectTrigger id="hospitalType">
                    <SelectValue placeholder="Select Hospital Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {HOSPITAL_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="governmentCategory">Government Category</Label>
                <Select value={formData.governmentCategory} onValueChange={(value) => handleInputChange('governmentCategory', value)}>
                  <SelectTrigger id="governmentCategory">
                    <SelectValue placeholder="Select Category Of Hospital" />
                  </SelectTrigger>
                  <SelectContent>
                    {GOVERNMENT_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hospitalAddress">Hospital Address *</Label>
                <Input
                  id="hospitalAddress"
                  value={formData.hospitalAddress}
                  onChange={(e) => handleInputChange('hospitalAddress', e.target.value)}
                  placeholder="Enter complete hospital address"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Select value={formData.state} onValueChange={(value) => handleInputChange('state', value)}>
                    <SelectTrigger id="state">
                      <SelectValue placeholder="Select State" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATES.map((state) => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="district">District *</Label>
                  <Input
                    id="district"
                    value={formData.district}
                    onChange={(e) => handleInputChange('district', e.target.value)}
                    placeholder="Enter district name"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website Of Hospital</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="http://example.com/"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mobileNumber">Mobile Number *</Label>
                  <Input
                    id="mobileNumber"
                    value={formData.mobileNumber}
                    onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
                    placeholder="+91XXXXXXXXXX"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="landlineNumber">Land Line Number</Label>
                  <Input
                    id="landlineNumber"
                    value={formData.landlineNumber}
                    onChange={(e) => handleInputChange('landlineNumber', e.target.value)}
                    placeholder="e.g-0381-222-1234"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="example@domainname.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hospitalHeadName">Name of Hospital Head *</Label>
                <Input
                  id="hospitalHeadName"
                  value={formData.hospitalHeadName}
                  onChange={(e) => handleInputChange('hospitalHeadName', e.target.value)}
                  placeholder="Enter hospital head name"
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full medical-btn"
                disabled={loading || !isFormValid()}
              >
                {loading ? "Submitting..." : "Submit Registration"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

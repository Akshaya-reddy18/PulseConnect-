
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building, Edit, Save, X, Plus, Minus, Check, Droplets, Users, Bell, FileText, MapPin } from "lucide-react";
import { listHospitalAppointments, acceptAppointment } from "@/lib/appointments";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { sampleHospitals, sampleBloodInventory, sampleAppointments } from "@/data/sampleData";
import BloodRequestForm from "@/components/hospital/BloodRequestForm";
import RequestsList from "@/components/hospital/RequestsList";
import DonorProfiles from "@/components/hospital/DonorProfiles";
import NotificationSystem from "@/components/hospital/NotificationSystem";
import HospitalMap from "@/components/HospitalMap";

interface BloodType {
  type: string;
  units: number;
}

type DbHospital = { id: string; name: string; address: string | null; contact: string | null };

export default function HospitalDashboard() {
  const [hospital, setHospital] = useState<DbHospital | null>(null);
  const [loadingHospital, setLoadingHospital] = useState<boolean>(false);
  const [bloodInventory, setBloodInventory] = useState<BloodType[]>(sampleBloodInventory);
  const [selectedRequestId, setSelectedRequestId] = useState<string | undefined>(undefined);

  const [editingType, setEditingType] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<number>(0);
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState<boolean>(false);

  useEffect(() => {
    const loadHospital = async () => {
      setLoadingHospital(true);
      try {
        const { data } = await supabase.from("hospitals").select("id, name, address, contact").limit(1).maybeSingle();
        // Use sample data if no real data available
        setHospital((data as any) || sampleHospitals[0]);
      } catch (error) {
        console.error('Error loading hospital:', error);
        // Fallback to sample data
        setHospital(sampleHospitals[0]);
      } finally {
        setLoadingHospital(false);
      }
    };
    loadHospital();
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!hospital?.id) return;
      try {
        setLoadingAppointments(true);
        const data = await listHospitalAppointments(hospital.id);
        // Use sample data if no real data available
        setAppointments(data && data.length > 0 ? data : sampleAppointments);
      } catch (e) {
        console.error(e);
        // Fallback to sample data
        setAppointments(sampleAppointments);
      } finally {
        setLoadingAppointments(false);
      }
    };
    load();
  }, [hospital?.id]);

  const handleEditStart = (type: string, currentUnits: number) => {
    setEditingType(type);
    setTempValue(currentUnits);
  };

  const handleEditSave = (type: string) => {
    setBloodInventory(prev => 
      prev.map(blood => 
        blood.type === type ? { ...blood, units: tempValue } : blood
      )
    );
    setEditingType(null);
    toast({
      title: "Blood Inventory Updated",
      description: `${type} blood units updated to ${tempValue}`,
    });
  };

  const handleEditCancel = () => {
    setEditingType(null);
    setTempValue(0);
  };

  const handleQuickUpdate = (type: string, change: number) => {
    setBloodInventory(prev => 
      prev.map(blood => 
        blood.type === type 
          ? { ...blood, units: Math.max(0, blood.units + change) }
          : blood
      )
    );
    toast({
      title: "Quick Update",
      description: `${type} blood units ${change > 0 ? 'increased' : 'decreased'} by ${Math.abs(change)}`,
    });
  };

  const getTotalUnits = () => {
    return bloodInventory.reduce((total, blood) => total + blood.units, 0);
  };

  const getStatusColor = (units: number) => {
    if (units <= 5) return "bg-red-500";
    if (units <= 15) return "bg-yellow-500";
    return "bg-green-500";
  };

  const handleRequestSubmitted = () => {
    // Refresh requests list when a new request is submitted
    // This will be handled by the RequestsList component
  };

  const handleAppointmentScheduled = () => {
    // Refresh appointments when a new appointment is scheduled
    // This will be handled by the individual components
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building className="h-8 w-8 text-medical" />
            <div>
              <h1 className="text-3xl font-bold">PulseConnect+ Hospital Dashboard</h1>
              <p className="text-gray-500">{hospital?.name || (loadingHospital ? 'Loading...' : 'No hospital profile found')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const { verifyDonationOnChain } = await import("@/lib/blockchain");
                  const tx = await verifyDonationOnChain(
                    { donorId: null, hospitalId: hospital?.id || null, donationType: "plasma", status: "received" },
                    { rpcUrl: (import.meta as any).env.VITE_POLYGON_RPC_URL || "https://rpc-mumbai.maticvigil.com", privateKey: (import.meta as any).env.VITE_POLYGON_PRIVATE_KEY || "demo-key" }
                  );
                  
                  toast({
                    title: "Blockchain Verification Successful",
                    description: `Transaction Hash: ${tx}`,
                    variant: "default",
                  });
                  
                  navigator.clipboard.writeText(tx);
                  console.log("Recorded on Polygon:", tx);
                } catch (error) {
                  console.error("Blockchain verification failed:", error);
                  toast({
                    title: "Verification Failed",
                    description: "Failed to record on blockchain. Please try again.",
                    variant: "destructive",
                  });
                }
              }}
            >
              Verify on Blockchain
            </Button>
            <Button variant="outline" onClick={() => window.location.href = "/auth/hospital-login"}>
              Logout
            </Button>
          </div>
        </div>

        {/* Hospital Info */}
        <Card>
          <CardHeader>
            <CardTitle>Hospital Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Hospital Name</Label>
                <p className="text-lg font-semibold">{hospital?.name || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Hospital ID</Label>
                <p className="text-lg font-semibold">{hospital?.id || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Contact</Label>
                <p className="text-lg font-semibold">{hospital?.contact || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="requests" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Requests
            </TabsTrigger>
            <TabsTrigger value="donors" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Donors
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Nearby Donors
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <Droplets className="h-4 w-4" />
              Inventory
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          {/* Requests Tab */}
          <TabsContent value="requests" className="space-y-6">
            <BloodRequestForm onRequestSubmitted={handleRequestSubmitted} />
            <RequestsList onRequestUpdate={handleRequestSubmitted} />
          </TabsContent>

          {/* Donors Tab */}
          <TabsContent value="donors" className="space-y-6">
            <DonorProfiles 
              selectedRequestId={selectedRequestId}
              onAppointmentScheduled={handleAppointmentScheduled}
            />
          </TabsContent>

          {/* Map Tab - Nearby Donors */}
          <TabsContent value="map" className="space-y-6">
            <HospitalMap />
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-6">
            {/* Blood Inventory Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Blood Inventory Overview</CardTitle>
                <CardDescription>
                  Total Blood Units Available: <span className="font-bold text-medical">{getTotalUnits()}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {bloodInventory.map((blood) => (
                    <div key={blood.type} className="border rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-blood mb-2">{blood.type}</div>
                      <div className="flex items-center justify-center mb-2">
                        <Badge className={`${getStatusColor(blood.units)} text-white`}>
                          {blood.units} units
                        </Badge>
                      </div>
                      <div className="flex gap-1 justify-center">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => handleQuickUpdate(blood.type, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => handleQuickUpdate(blood.type, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Detailed Blood Management */}
            <Card>
              <CardHeader>
                <CardTitle>Blood Inventory Management</CardTitle>
                <CardDescription>
                  Update blood unit quantities for each blood type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bloodInventory.map((blood) => (
                    <div key={blood.type} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="text-xl font-bold text-blood w-12">{blood.type}</div>
                        <div className="text-sm text-gray-500">Blood Type</div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {editingType === blood.type ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={tempValue}
                              onChange={(e) => setTempValue(parseInt(e.target.value) || 0)}
                              className="w-20"
                              min="0"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleEditSave(blood.type)}
                              className="medical-btn"
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleEditCancel}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-4">
                            <div className="text-lg font-semibold">{blood.units} units</div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditStart(blood.type, blood.units)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Emergency Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>Low Stock Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {bloodInventory
                    .filter(blood => blood.units <= 5)
                    .map((blood) => (
                      <div key={blood.type} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span className="font-medium">Critical: {blood.type} blood type</span>
                        </div>
                        <Badge variant="destructive">{blood.units} units remaining</Badge>
                      </div>
                    ))}
                  {bloodInventory.filter(blood => blood.units <= 5).length === 0 && (
                    <p className="text-gray-500 text-center py-4">No critical stock alerts</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <NotificationSystem donorId={hospital?.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

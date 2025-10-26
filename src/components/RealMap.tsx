import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MapPin, Search, Phone, Building, Heart, Navigation, X, CheckCircle, XCircle } from "lucide-react";

// Declare Leaflet as global
declare global {
  interface Window {
    L: any;
  }
}

interface Donor {
  id: string;
  name: string;
  bloodType: string;
  contact: string;
  lat: number;
  lng: number;
  distance?: number;
  lastDonation?: string;
  availability: 'available' | 'busy' | 'unavailable';
}

interface Hospital {
  id: string;
  name: string;
  address: string;
  contact: string;
  lat: number;
  lng: number;
  type: 'hospital' | 'blood_bank' | 'donation_center';
  available_blood_types?: string[];
  hours?: string;
}

type RealMapProps = { containerId?: string };
export default function RealMap({ containerId = 'map' }: RealMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDonor, setSelectedDonor] = useState<Donor | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [showDonorPopup, setShowDonorPopup] = useState(false);

  // Sample donors data (replace with your backend data)
  const sampleDonors: Donor[] = [
    { id: 'donor-001', name: 'Krishna', bloodType: 'O+', contact: '+91-90000-0001', lat: 17.3870, lng: 78.4860, availability: 'available', lastDonation: '2025-09-20' },
    { id: 'donor-002', name: 'Aisha', bloodType: 'A+', contact: '+91-90000-0002', lat: 17.3890, lng: 78.4900, availability: 'available', lastDonation: '2025-09-28' },
    { id: 'donor-003', name: 'Rohit', bloodType: 'B+', contact: '+91-90000-0003', lat: 17.3825, lng: 78.4850, availability: 'busy', lastDonation: '2025-09-10' },
    { id: 'donor-004', name: 'Priya', bloodType: 'AB+', contact: '+91-90000-0004', lat: 17.3800, lng: 78.4805, availability: 'available', lastDonation: '2025-10-01' },
    { id: 'donor-005', name: 'Arjun', bloodType: 'O-', contact: '+91-90000-0005', lat: 17.3920, lng: 78.4920, availability: 'available', lastDonation: '2025-08-30' },
    { id: 'donor-006', name: 'Sneha', bloodType: 'A-', contact: '+91-90000-0006', lat: 17.3885, lng: 78.4810, availability: 'unavailable', lastDonation: '2025-07-15' },
    { id: 'donor-007', name: 'Vikram', bloodType: 'B-', contact: '+91-90000-0007', lat: 17.3840, lng: 78.4940, availability: 'available', lastDonation: '2025-09-05' },
    { id: 'donor-008', name: 'Meera', bloodType: 'AB-', contact: '+91-90000-0008', lat: 17.3860, lng: 78.4885, availability: 'busy', lastDonation: '2025-08-12' },
    // Duplicate/nearby points to visualize cluster around Hyderabad
    { id: 'donor-009', name: 'Krishna', bloodType: 'O+', contact: '+91-90000-0001', lat: 17.3875, lng: 78.4870, availability: 'available', lastDonation: '2025-09-20' },
    { id: 'donor-010', name: 'Aisha', bloodType: 'A+', contact: '+91-90000-0002', lat: 17.3888, lng: 78.4892, availability: 'available', lastDonation: '2025-09-28' }
  ];

  // Sample hospitals data
  const sampleHospitals: Hospital[] = [
    {
      id: 'hosp-001',
      name: 'Apollo Hospitals Hyderabad',
      address: 'Jubilee Hills, Hyderabad',
      contact: '+91-40-2360-7777',
      lat: 17.4275,
      lng: 78.4128,
      type: 'hospital',
      available_blood_types: ['A+', 'A-', 'B+', 'O+'],
      hours: '24/7 Emergency'
    },
    {
      id: 'hosp-002',
      name: 'Care Hospitals Banjara Hills',
      address: 'Banjara Hills, Hyderabad',
      contact: '+91-40-3041-8888',
      lat: 17.4156,
      lng: 78.4483,
      type: 'hospital',
      available_blood_types: ['O-', 'A+', 'B+'],
      hours: '24/7 Emergency'
    },
    {
      id: 'bb-001',
      name: 'Red Cross Blood Bank',
      address: 'Vidyanagar, Hyderabad',
      contact: '+91-40-2767-1234',
      lat: 17.4065,
      lng: 78.5011,
      type: 'blood_bank',
      available_blood_types: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      hours: '8 AM - 6 PM'
    },
    {
      id: 'dc-001',
      name: 'NTR Memorial Trust Blood Bank',
      address: 'Jubilee Hills, Hyderabad',
      contact: '+91-40-2354-1234',
      lat: 17.4302,
      lng: 78.4079,
      type: 'donation_center',
      available_blood_types: ['A+', 'B+', 'O+'],
      hours: '9 AM - 5 PM'
    },
    // Duplicate/nearby to ensure multiple markers around core city
    {
      id: 'hosp-003',
      name: 'Osmania General Hospital',
      address: 'Afzal Gunj, Hyderabad',
      contact: '+91-40-2460-0000',
      lat: 17.3713,
      lng: 78.4804,
      type: 'hospital',
      available_blood_types: ['AB+', 'O+'],
      hours: '24/7 Emergency'
    }
  ];

  useEffect(() => {
    setDonors(sampleDonors);
    setHospitals(sampleHospitals);
  }, []);

  // Initialize map (robust in hidden tabs)
  useEffect(() => {
    if (!window.L) return;

    const el = mapRef.current;
    if (!el || mapInstance.current) return;

    const isVisible = (node: HTMLElement) => {
      const rect = node.getBoundingClientRect();
      const style = window.getComputedStyle(node);
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
    };

    const init = () => {
      if (!mapRef.current || mapInstance.current) return;
      // Initialize map centered on Hyderabad
      mapInstance.current = window.L.map(mapRef.current).setView([17.3850, 78.4867], 13);

      // Add OSM tiles
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
      }).addTo(mapInstance.current);

      // Invalidate after mount (useful when inside hidden tabs)
      setTimeout(() => {
        try { mapInstance.current?.invalidateSize?.(); } catch {}
      }, 200);

      // Get user location
      mapInstance.current.locate({ setView: true, maxZoom: 16 });

      mapInstance.current.on('locationfound', function (e: any) {
        if (userMarkerRef.current) {
          mapInstance.current.removeLayer(userMarkerRef.current);
        }
        userMarkerRef.current = window.L.marker(e.latlng)
          .addTo(mapInstance.current)
          .bindPopup("You are here")
          .openPopup();
        window.L.circle(e.latlng, e.accuracy / 2).addTo(mapInstance.current);
        setUserLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
      });

      mapInstance.current.on('locationerror', function (e: any) {
        console.error('Location error:', e.message);
        // Set default location to Hyderabad
        setUserLocation({ lat: 17.3850, lng: 78.4867 });
      });
    };

    // If not visible yet (e.g., hidden tab), poll briefly until visible
    if (!isVisible(el)) {
      const start = performance.now();
      const interval = setInterval(() => {
        if (isVisible(el) || performance.now() - start > 4000) {
          clearInterval(interval);
          init();
        }
      }, 150);
      return () => clearInterval(interval);
    } else {
      init();
    }

    // Cleanup
    return () => {
      if (mapInstance.current) {
        try { mapInstance.current.remove(); } catch {}
        mapInstance.current = null;
      }
    };
  }, []);

  // Listen for size changes and invalidate map size
  useEffect(() => {
    if (!mapRef.current || !window.L) return;
    const el = mapRef.current;
    let ro: ResizeObserver | null = null;
    if ('ResizeObserver' in window) {
      ro = new ResizeObserver(() => {
        try { mapInstance.current?.invalidateSize?.(); } catch {}
      });
      ro.observe(el);
    }
    return () => {
      if (ro) ro.disconnect();
    };
  }, []);

  // Add markers to map
  useEffect(() => {
    if (mapInstance.current && window.L) {
      // Clear existing markers
      markersRef.current.forEach(marker => {
        mapInstance.current.removeLayer(marker);
      });
      markersRef.current = [];

      // Add donor markers
      donors.forEach(donor => {
        const getDonorIcon = (availability: string) => {
          switch (availability) {
            case 'available':
              return window.L.divIcon({
                className: 'custom-donor-icon available',
                html: `<div class="donor-marker available">${donor.bloodType}</div>`,
                iconSize: [30, 30],
                iconAnchor: [15, 15]
              });
            case 'busy':
              return window.L.divIcon({
                className: 'custom-donor-icon busy',
                html: `<div class="donor-marker busy">${donor.bloodType}</div>`,
                iconSize: [30, 30],
                iconAnchor: [15, 15]
              });
            default:
              return window.L.divIcon({
                className: 'custom-donor-icon unavailable',
                html: `<div class="donor-marker unavailable">${donor.bloodType}</div>`,
                iconSize: [30, 30],
                iconAnchor: [15, 15]
              });
          }
        };

        const marker = window.L.marker([donor.lat, donor.lng], { icon: getDonorIcon(donor.availability) })
          .addTo(mapInstance.current)
          .bindPopup(`
            <div class="donor-popup">
              <h3><strong>${donor.name}</strong></h3>
              <p>Blood Type: <strong>${donor.bloodType}</strong></p>
              <p>Contact: ${donor.contact}</p>
              <p>Status: <span class="status-${donor.availability}">${donor.availability}</span></p>
              <div class="popup-buttons">
                <button onclick="acceptDonation('${donor.id}')" class="accept-btn">Accept</button>
                <button onclick="ignoreDonation('${donor.id}')" class="ignore-btn">Ignore</button>
              </div>
            </div>
          `);

        marker.on('click', () => {
          setSelectedDonor(donor);
          setShowDonorPopup(true);
        });

        markersRef.current.push(marker);
      });

      // Add hospital markers
      hospitals.forEach(hospital => {
        const getHospitalIcon = (type: string) => {
          switch (type) {
            case 'hospital':
              return window.L.divIcon({
                className: 'custom-hospital-icon',
                html: `<div class="hospital-marker">🏥</div>`,
                iconSize: [25, 25],
                iconAnchor: [12, 12]
              });
            case 'blood_bank':
              return window.L.divIcon({
                className: 'custom-blood-bank-icon',
                html: `<div class="blood-bank-marker">🩸</div>`,
                iconSize: [25, 25],
                iconAnchor: [12, 12]
              });
            default:
              return window.L.divIcon({
                className: 'custom-donation-center-icon',
                html: `<div class="donation-center-marker">❤️</div>`,
                iconSize: [25, 25],
                iconAnchor: [12, 12]
              });
          }
        };

        const marker = window.L.marker([hospital.lat, hospital.lng], { icon: getHospitalIcon(hospital.type) })
          .addTo(mapInstance.current)
          .bindPopup(`
            <div class="hospital-popup">
              <h3><strong>${hospital.name}</strong></h3>
              <p>${hospital.address}</p>
              <p>Contact: ${hospital.contact}</p>
              <p>Type: ${hospital.type.replace('_', ' ').toUpperCase()}</p>
              ${hospital.available_blood_types ? `<p>Available: ${hospital.available_blood_types.join(', ')}</p>` : ''}
            </div>
          `);

        markersRef.current.push(marker);
      });
    }
  }, [donors, hospitals]);

  // Global functions for popup buttons
  useEffect(() => {
    (window as any).acceptDonation = (donorId: string) => {
      const donor = donors.find(d => d.id === donorId);
      if (donor) {
        setSelectedDonor(donor);
        setShowDonorPopup(true);
        // Here you would typically make an API call to accept the donation
        console.log('Accepting donation from:', donor.name);
      }
    };

    (window as any).ignoreDonation = (donorId: string) => {
      const donor = donors.find(d => d.id === donorId);
      if (donor) {
        console.log('Ignoring donation from:', donor.name);
        // Here you would typically make an API call to ignore the donation
      }
    };
  }, [donors]);

  const filteredDonors = donors.filter(donor =>
    donor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    donor.bloodType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return 'text-green-600';
      case 'busy': return 'text-yellow-600';
      case 'unavailable': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getAvailabilityIcon = (availability: string) => {
    switch (availability) {
      case 'available': return <CheckCircle className="h-4 w-4" />;
      case 'busy': return <XCircle className="h-4 w-4" />;
      case 'unavailable': return <XCircle className="h-4 w-4" />;
      default: return <XCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Real-Time Blood Donor Map</h1>
        <p className="text-gray-500">Find nearby blood donors and hospitals in real-time</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Search and Filters */}
        <div className="lg:col-span-1 space-y-4 relative z-10">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search & Filter
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Input
                  placeholder="Search donors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Donor Status</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Available ({donors.filter(d => d.availability === 'available').length})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm">Busy ({donors.filter(d => d.availability === 'busy').length})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm">Unavailable ({donors.filter(d => d.availability === 'unavailable').length})</span>
                  </div>
                </div>
              </div>

              <Button onClick={() => {
                if (mapInstance.current && userLocation) {
                  mapInstance.current.setView([userLocation.lat, userLocation.lng], 16);
                }
              }} className="w-full">
                <Navigation className="h-4 w-4 mr-2" />
                Center on My Location
              </Button>
            </CardContent>
          </Card>

          {/* Donor List */}
          <Card>
            <CardHeader>
              <CardTitle>Nearby Donors</CardTitle>
              <CardDescription>
                {filteredDonors.length} donors found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredDonors.map((donor) => (
                  <div
                    key={donor.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedDonor?.id === donor.id
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => {
                      setSelectedDonor(donor);
                      setShowDonorPopup(true);
                      if (mapInstance.current) {
                        mapInstance.current.setView([donor.lat, donor.lng], 16);
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                        donor.availability === 'available' ? 'bg-green-500' :
                        donor.availability === 'busy' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}>
                        {donor.bloodType}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{donor.name}</h4>
                        <p className="text-xs text-gray-500">Blood Type: {donor.bloodType}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Phone className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-600">{donor.contact}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          {getAvailabilityIcon(donor.availability)}
                          <span className={`text-xs ${getAvailabilityColor(donor.availability)}`}>
                            {donor.availability}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Real Map */}
        <div className="lg:col-span-3 relative z-0">
          <Card className="h-[600px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Live Blood Donor Map
              </CardTitle>
              <CardDescription>
                Real-time map showing nearby donors and hospitals
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 h-[500px] overflow-hidden rounded-md">
              <div id={containerId} ref={mapRef} className="w-full h-full"></div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Donor Details Popup */}
      {showDonorPopup && selectedDonor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  {selectedDonor.name}
                </CardTitle>
                <CardDescription>Blood Type: {selectedDonor.bloodType}</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDonorPopup(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Contact Information</h4>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span>{selectedDonor.contact}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Donor Status</h4>
                <div className="flex items-center gap-2">
                  {getAvailabilityIcon(selectedDonor.availability)}
                  <Badge className={selectedDonor.availability === 'available' ? 'bg-green-500' : 
                          selectedDonor.availability === 'busy' ? 'bg-yellow-500' : 'bg-red-500'}>
                    {selectedDonor.availability.toUpperCase()}
                  </Badge>
                </div>
                {selectedDonor.lastDonation && (
                  <p className="text-sm text-gray-500">
                    Last donation: {selectedDonor.lastDonation}
                  </p>
                )}
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700 flex-1"
                  onClick={() => {
                    console.log('Accepting donation from:', selectedDonor.name);
                    setShowDonorPopup(false);
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Accept Donation
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    console.log('Ignoring donation from:', selectedDonor.name);
                    setShowDonorPopup(false);
                  }}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Ignore
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Custom CSS for map markers */}
      <style jsx>{`
        .custom-donor-icon {
          background: transparent;
          border: none;
        }
        
        .donor-marker {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          border: 2px solid white;
        }
        
        .donor-marker.available {
          background-color: #10b981;
        }
        
        .donor-marker.busy {
          background-color: #f59e0b;
        }
        
        .donor-marker.unavailable {
          background-color: #ef4444;
        }
        
        .custom-hospital-icon,
        .custom-blood-bank-icon,
        .custom-donation-center-icon {
          background: transparent;
          border: none;
        }
        
        .hospital-marker,
        .blood-bank-marker,
        .donation-center-marker {
          width: 25px;
          height: 25px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #3b82f6;
          color: white;
          font-size: 14px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          border: 2px solid white;
        }
        
        .blood-bank-marker {
          background-color: #ef4444;
        }
        
        .donation-center-marker {
          background-color: #10b981;
        }
        
        .donor-popup,
        .hospital-popup {
          min-width: 200px;
        }
        
        .popup-buttons {
          display: flex;
          gap: 8px;
          margin-top: 10px;
        }
        
        .popup-buttons button {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }
        
        .accept-btn {
          background-color: #10b981;
          color: white;
        }
        
        .ignore-btn {
          background-color: #6b7280;
          color: white;
        }
        
        .status-available {
          color: #10b981;
          font-weight: bold;
        }
        
        .status-busy {
          color: #f59e0b;
          font-weight: bold;
        }
        
        .status-unavailable {
          color: #ef4444;
          font-weight: bold;
        }
        /* Ensure popups are clipped within card */
        .leaflet-container { position: relative; z-index: 0; }
      `}</style>
    </div>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MapPin, Search, Phone, Heart, Navigation, X, CheckCircle, XCircle, Users } from "lucide-react";

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
  age?: number;
  medicalHistory?: string;
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

export default function HospitalMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDonor, setSelectedDonor] = useState<Donor | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [showDonorPopup, setShowDonorPopup] = useState(false);
  const [filterBloodType, setFilterBloodType] = useState<string>('all');

  // Load donors from database
  useEffect(() => {
    const loadDonors = async () => {
      try {
        // TODO: Replace with actual API call to get nearby donors
        // For now, we'll use an empty array and show a message
        setDonors([]);
      } catch (error) {
        console.error('Error loading donors:', error);
      }
    };

    loadDonors();
  }, []);

  // Initialize map
  useEffect(() => {
    if (mapRef.current && !mapInstance.current && window.L) {
      // Initialize map centered on Delhi
      mapInstance.current = window.L.map('hospital-map').setView([28.6139, 77.2090], 13);

      // Add OSM tiles
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
      }).addTo(mapInstance.current);

      // Get user location
      mapInstance.current.locate({setView: true, maxZoom: 16});

      mapInstance.current.on('locationfound', function(e: any) {
        if (userMarkerRef.current) {
          mapInstance.current.removeLayer(userMarkerRef.current);
        }
        
        userMarkerRef.current = window.L.marker(e.latlng)
          .addTo(mapInstance.current)
          .bindPopup("Hospital Location")
          .openPopup();
        
        window.L.circle(e.latlng, e.accuracy / 2).addTo(mapInstance.current);
        
        setUserLocation({
          lat: e.latlng.lat,
          lng: e.latlng.lng
        });
      });

      mapInstance.current.on('locationerror', function(e: any) {
        console.error('Location error:', e.message);
        // Set default location to Delhi
        setUserLocation({ lat: 28.6139, lng: 77.2090 });
      });
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
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
              <p>Age: ${donor.age || 'N/A'}</p>
              <div class="popup-buttons">
                <button onclick="contactDonor('${donor.id}')" class="contact-btn">Contact</button>
                <button onclick="scheduleAppointment('${donor.id}')" class="schedule-btn">Schedule</button>
              </div>
            </div>
          `);

        marker.on('click', () => {
          setSelectedDonor(donor);
          setShowDonorPopup(true);
        });

        markersRef.current.push(marker);
      });
    }
  }, [donors]);

  // Global functions for popup buttons
  useEffect(() => {
    (window as any).contactDonor = (donorId: string) => {
      const donor = donors.find(d => d.id === donorId);
      if (donor) {
        setSelectedDonor(donor);
        setShowDonorPopup(true);
        console.log('Contacting donor:', donor.name);
      }
    };

    (window as any).scheduleAppointment = (donorId: string) => {
      const donor = donors.find(d => d.id === donorId);
      if (donor) {
        console.log('Scheduling appointment with:', donor.name);
        // Here you would typically open a scheduling modal or redirect to appointment page
      }
    };
  }, [donors]);

  const filteredDonors = donors.filter(donor => {
    const matchesSearch = donor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         donor.bloodType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBloodType = filterBloodType === 'all' || donor.bloodType === filterBloodType;
    return matchesSearch && matchesBloodType;
  });

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

  const bloodTypes = ['all', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Nearby Blood Donors</h2>
        <p className="text-gray-500">Find and contact available blood donors in your area</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Search and Filters */}
        <div className="lg:col-span-1 space-y-4">
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
                <h4 className="font-medium">Blood Type Filter</h4>
                <select
                  value={filterBloodType}
                  onChange={(e) => setFilterBloodType(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  {bloodTypes.map(type => (
                    <option key={type} value={type}>
                      {type === 'all' ? 'All Blood Types' : type}
                    </option>
                  ))}
                </select>
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
                Center on Hospital
              </Button>
            </CardContent>
          </Card>

          {/* Donor List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Nearby Donors
              </CardTitle>
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
        <div className="lg:col-span-3">
          <Card className="h-[600px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Donor Location Map
              </CardTitle>
              <CardDescription>
                Click on markers to view donor details and contact them
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 h-[500px]">
              <div id="hospital-map" ref={mapRef} className="w-full h-full"></div>
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
                {selectedDonor.age && (
                  <p className="text-sm text-gray-600">Age: {selectedDonor.age}</p>
                )}
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
                {selectedDonor.medicalHistory && (
                  <p className="text-sm text-gray-500">
                    Medical History: {selectedDonor.medicalHistory}
                  </p>
                )}
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700 flex-1"
                  onClick={() => {
                    console.log('Contacting donor:', selectedDonor.name);
                    setShowDonorPopup(false);
                  }}
                >
                  <Phone className="h-4 w-4 mr-1" />
                  Contact Donor
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    console.log('Scheduling appointment with:', selectedDonor.name);
                    setShowDonorPopup(false);
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Schedule Appointment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Custom CSS for map markers */}
      <style>{`
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
        
        .donor-popup {
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
        
        .contact-btn {
          background-color: #10b981;
          color: white;
        }
        
        .schedule-btn {
          background-color: #3b82f6;
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
      `}</style>
    </div>
  );
}

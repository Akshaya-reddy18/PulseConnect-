import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MapPin, Search, Phone, Building, Heart, Navigation, X, CheckCircle, XCircle, Map } from "lucide-react";

// Declare Leaflet as global
declare global {
  interface Window {
    L: any;
  }
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
  distance?: number;
  rating?: number;
  emergency_services?: boolean;
}

export default function DonorMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [showHospitalPopup, setShowHospitalPopup] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');

  // Load hospitals from database
  useEffect(() => {
    const loadHospitals = async () => {
      try {
        // TODO: Replace with actual API call to get nearby hospitals
        // For now, we'll use an empty array and show a message
        setHospitals([]);
      } catch (error) {
        console.error('Error loading hospitals:', error);
      }
    };

    loadHospitals();
  }, []);

  // Initialize map
  useEffect(() => {
    if (mapRef.current && !mapInstance.current && window.L) {
      // Initialize map centered on Delhi
      mapInstance.current = window.L.map('donor-map').setView([28.6139, 77.2090], 13);

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
          .bindPopup("Your Location")
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
              ${hospital.hours ? `<p>Hours: ${hospital.hours}</p>` : ''}
              ${hospital.rating ? `<p>Rating: ${hospital.rating}/5 ⭐</p>` : ''}
              <div class="popup-buttons">
                <button onclick="getDirections('${hospital.id}')" class="directions-btn">Directions</button>
                <button onclick="contactHospital('${hospital.id}')" class="contact-btn">Contact</button>
              </div>
            </div>
          `);

        marker.on('click', () => {
          setSelectedHospital(hospital);
          setShowHospitalPopup(true);
        });

        markersRef.current.push(marker);
      });
    }
  }, [hospitals]);

  // Global functions for popup buttons
  useEffect(() => {
    (window as any).getDirections = (hospitalId: string) => {
      const hospital = hospitals.find(h => h.id === hospitalId);
      if (hospital) {
        setSelectedHospital(hospital);
        setShowHospitalPopup(true);
        console.log('Getting directions to:', hospital.name);
      }
    };

    (window as any).contactHospital = (hospitalId: string) => {
      const hospital = hospitals.find(h => h.id === hospitalId);
      if (hospital) {
        console.log('Contacting hospital:', hospital.name);
        // Here you would typically open a contact modal or initiate a call
      }
    };
  }, [hospitals]);

  const filteredHospitals = hospitals.filter(hospital => {
    const matchesSearch = hospital.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         hospital.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         hospital.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || hospital.type === filterType;
    return matchesSearch && matchesType;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'hospital': return 'bg-blue-500';
      case 'blood_bank': return 'bg-red-500';
      case 'donation_center': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'hospital': return '🏥';
      case 'blood_bank': return '🩸';
      case 'donation_center': return '❤️';
      default: return '📍';
    }
  };

  const facilityTypes = [
    { value: 'all', label: 'All Facilities' },
    { value: 'hospital', label: 'Hospitals' },
    { value: 'blood_bank', label: 'Blood Banks' },
    { value: 'donation_center', label: 'Donation Centers' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Nearby Hospitals & Blood Centers</h2>
        <p className="text-gray-500">Find hospitals, blood banks, and donation centers near you</p>
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
                  placeholder="Search facilities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Facility Type</h4>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  {facilityTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Facility Types</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">Hospitals ({hospitals.filter(h => h.type === 'hospital').length})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm">Blood Banks ({hospitals.filter(h => h.type === 'blood_bank').length})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Donation Centers ({hospitals.filter(h => h.type === 'donation_center').length})</span>
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

          {/* Hospital List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Nearby Facilities
              </CardTitle>
              <CardDescription>
                {filteredHospitals.length} facilities found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredHospitals.map((hospital) => (
                  <div
                    key={hospital.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedHospital?.id === hospital.id
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => {
                      setSelectedHospital(hospital);
                      setShowHospitalPopup(true);
                      if (mapInstance.current) {
                        mapInstance.current.setView([hospital.lat, hospital.lng], 16);
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${getTypeColor(hospital.type)}`}>
                        {getTypeIcon(hospital.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{hospital.name}</h4>
                        <p className="text-xs text-gray-500 truncate">{hospital.address}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Phone className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-600">{hospital.contact}</span>
                        </div>
                        {hospital.hours && (
                          <p className="text-xs text-gray-500 mt-1">{hospital.hours}</p>
                        )}
                        {hospital.rating && (
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-xs text-yellow-600">⭐ {hospital.rating}</span>
                          </div>
                        )}
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
                Hospital Location Map
              </CardTitle>
              <CardDescription>
                Click on markers to view facility details and get directions
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 h-[500px]">
              <div id="donor-map" ref={mapRef} className="w-full h-full"></div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Hospital Details Popup */}
      {showHospitalPopup && selectedHospital && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  {selectedHospital.name}
                </CardTitle>
                <CardDescription>{selectedHospital.address}</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowHospitalPopup(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Contact Information</h4>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span>{selectedHospital.contact}</span>
                </div>
                {selectedHospital.hours && (
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{selectedHospital.hours}</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Facility Type</h4>
                <Badge className={getTypeColor(selectedHospital.type)}>
                  {selectedHospital.type.replace('_', ' ').toUpperCase()}
                </Badge>
                {selectedHospital.rating && (
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-yellow-600">⭐ {selectedHospital.rating}/5</span>
                  </div>
                )}
                {selectedHospital.emergency_services && (
                  <Badge variant="destructive" className="text-xs">
                    Emergency Services Available
                  </Badge>
                )}
                {selectedHospital.available_blood_types && (
                  <div>
                    <h5 className="text-sm font-medium mb-1">Available Blood Types:</h5>
                    <div className="flex flex-wrap gap-1">
                      {selectedHospital.available_blood_types.map((type) => (
                        <Badge key={type} variant="outline" className="text-xs">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    console.log('Getting directions to:', selectedHospital.name);
                    setShowHospitalPopup(false);
                  }}
                >
                  <MapPin className="h-4 w-4 mr-1" />
                  Get Directions
                </Button>
                <Button 
                  size="sm" 
                  className="bg-red-600 hover:bg-red-700 flex-1"
                  onClick={() => {
                    console.log('Contacting hospital:', selectedHospital.name);
                    setShowHospitalPopup(false);
                  }}
                >
                  <Heart className="h-4 w-4 mr-1" />
                  Contact
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Custom CSS for map markers */}
      <style>{`
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
        
        .directions-btn {
          background-color: #3b82f6;
          color: white;
        }
        
        .contact-btn {
          background-color: #10b981;
          color: white;
        }
      `}</style>
    </div>
  );
}

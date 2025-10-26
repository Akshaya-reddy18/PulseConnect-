import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MapPin, Search, Phone, Building, Heart, Navigation, X } from "lucide-react";

// Declare Leaflet as global
declare global {
  interface Window {
    L: any;
  }
}

interface MapMarker {
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

// Custom marker component
const MapMarker = ({ 
  marker, 
  onClick, 
  isSelected 
}: { 
  marker: MapMarker; 
  onClick: () => void; 
  isSelected: boolean;
}) => {
  const getMarkerColor = (type: string) => {
    switch (type) {
      case 'hospital': return 'bg-blue-500';
      case 'blood_bank': return 'bg-red-500';
      case 'donation_center': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getMarkerIcon = (type: string) => {
    switch (type) {
      case 'hospital': return '🏥';
      case 'blood_bank': return '🩸';
      case 'donation_center': return '❤️';
      default: return '📍';
    }
  };

  return (
    <div
      className={`absolute w-8 h-8 rounded-full flex items-center justify-center text-white text-sm cursor-pointer transform -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-all duration-200 shadow-lg ${
        isSelected ? 'ring-4 ring-yellow-300 scale-110' : ''
      } ${getMarkerColor(marker.type)}`}
      style={{
        left: `${marker.lat}%`,
        top: `${marker.lng}%`,
      }}
      onClick={onClick}
      title={marker.name}
    >
      {getMarkerIcon(marker.type)}
    </div>
  );
};

export default function InteractiveMap() {
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);

  // Load markers from database
  useEffect(() => {
    const loadMarkers = async () => {
      try {
        // TODO: Replace with actual API call to get hospitals and blood banks
        // For now, we'll use an empty array and show a message
        setMarkers([]);
      } catch (error) {
        console.error('Error loading markers:', error);
      }
    };

    loadMarkers();
  }, []);

  // Initialize map
  useEffect(() => {
    if (mapRef.current && !mapInstance.current && window.L) {
      // Initialize map centered on Delhi
      mapInstance.current = window.L.map('interactive-map').setView([28.6139, 77.2090], 13);

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
          .bindPopup("You are here")
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

      // Add markers
      markers.forEach(marker => {
        const getMarkerIcon = (type: string) => {
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

        const leafletMarker = window.L.marker([marker.lat, marker.lng], { icon: getMarkerIcon(marker.type) })
          .addTo(mapInstance.current)
          .bindPopup(`
            <div class="marker-popup">
              <h3><strong>${marker.name}</strong></h3>
              <p>${marker.address}</p>
              <p>Contact: ${marker.contact}</p>
              <p>Type: ${marker.type.replace('_', ' ').toUpperCase()}</p>
              ${marker.available_blood_types ? `<p>Available: ${marker.available_blood_types.join(', ')}</p>` : ''}
              ${marker.hours ? `<p>Hours: ${marker.hours}</p>` : ''}
            </div>
          `);

        leafletMarker.on('click', () => {
          setSelectedMarker(marker);
          setShowPopup(true);
        });

        markersRef.current.push(leafletMarker);
      });
    }
  }, [markers]);

  // Get user's current location
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          if (mapInstance.current) {
            mapInstance.current.setView([position.coords.latitude, position.coords.longitude], 16);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          // Default location
          setUserLocation({ lat: 28.6139, lng: 77.2090 });
        }
      );
    } else {
      // Default location
      setUserLocation({ lat: 28.6139, lng: 77.2090 });
    }
  };

  const filteredMarkers = markers.filter(marker =>
    marker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    marker.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    marker.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getMarkerColor = (type: string) => {
    switch (type) {
      case 'hospital':
        return 'bg-blue-500';
      case 'blood_bank':
        return 'bg-red-500';
      case 'donation_center':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleMarkerClick = (marker: MapMarker) => {
    setSelectedMarker(marker);
    setShowPopup(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Interactive Map</h1>
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
                  placeholder="Search locations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Location Types</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">Hospitals ({markers.filter(m => m.type === 'hospital').length})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm">Blood Banks ({markers.filter(m => m.type === 'blood_bank').length})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Donation Centers ({markers.filter(m => m.type === 'donation_center').length})</span>
                  </div>
                </div>
              </div>

              <Button onClick={getUserLocation} className="w-full">
                <Navigation className="h-4 w-4 mr-2" />
                Get My Location
              </Button>
            </CardContent>
          </Card>

          {/* Location List */}
          <Card>
            <CardHeader>
              <CardTitle>Nearby Locations</CardTitle>
              <CardDescription>
                {filteredMarkers.length} locations found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredMarkers.map((marker) => (
                  <div
                    key={marker.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedMarker?.id === marker.id
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleMarkerClick(marker)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${getMarkerColor(marker.type)}`}>
                        {marker.type === 'hospital' ? '🏥' : marker.type === 'blood_bank' ? '🩸' : '❤️'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{marker.name}</h4>
                        <p className="text-xs text-gray-500 truncate">{marker.address}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Phone className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-600">{marker.contact}</span>
                        </div>
                        {marker.hours && (
                          <p className="text-xs text-gray-500 mt-1">{marker.hours}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Real Leaflet Map */}
        <div className="lg:col-span-3">
          <Card className="h-[600px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Interactive Map
              </CardTitle>
              <CardDescription>
                Click on markers to view details
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 h-[500px]">
              <div id="interactive-map" ref={mapRef} className="w-full h-full"></div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Popup Modal for Marker Details */}
      {showPopup && selectedMarker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  {selectedMarker.name}
                </CardTitle>
                <CardDescription>{selectedMarker.address}</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowPopup(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Contact Information</h4>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span>{selectedMarker.contact}</span>
                </div>
                {selectedMarker.hours && (
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{selectedMarker.hours}</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Location Type</h4>
                <Badge className={getMarkerColor(selectedMarker.type)}>
                  {selectedMarker.type.replace('_', ' ').toUpperCase()}
                </Badge>
                {selectedMarker.available_blood_types && (
                  <div>
                    <h5 className="text-sm font-medium mb-1">Available Blood Types:</h5>
                    <div className="flex flex-wrap gap-1">
                      {selectedMarker.available_blood_types.map((type) => (
                        <Badge key={type} variant="outline" className="text-xs">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button size="sm" variant="outline" className="flex-1">
                  <MapPin className="h-4 w-4 mr-1" />
                  Directions
                </Button>
                <Button size="sm" className="bg-red-600 hover:bg-red-700 flex-1">
                  <Heart className="h-4 w-4 mr-1" />
                  Contact
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Selected Location Details */}
      {selectedMarker && !showPopup && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              {selectedMarker.name}
            </CardTitle>
            <CardDescription>{selectedMarker.address}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Contact Information</h4>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span>{selectedMarker.contact}</span>
                </div>
                {selectedMarker.hours && (
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{selectedMarker.hours}</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Location Type</h4>
                <Badge className={getMarkerColor(selectedMarker.type)}>
                  {selectedMarker.type.replace('_', ' ').toUpperCase()}
                </Badge>
                {selectedMarker.available_blood_types && (
                  <div>
                    <h5 className="text-sm font-medium mb-1">Available Blood Types:</h5>
                    <div className="flex flex-wrap gap-1">
                      {selectedMarker.available_blood_types.map((type) => (
                        <Badge key={type} variant="outline" className="text-xs">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Actions</h4>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <MapPin className="h-4 w-4 mr-1" />
                    Directions
                  </Button>
                  <Button size="sm" className="bg-red-600 hover:bg-red-700">
                    <Heart className="h-4 w-4 mr-1" />
                    Contact
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Custom CSS for map markers */}
      <style jsx>{`
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
        
        .marker-popup {
          min-width: 200px;
        }
      `}</style>
    </div>
  );
}

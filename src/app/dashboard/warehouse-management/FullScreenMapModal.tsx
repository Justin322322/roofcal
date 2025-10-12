"use client";

import { MapContainer, TileLayer, Marker, Popup, Polygon } from "react-leaflet";
import { Icon, LatLngTuple } from "leaflet";
import { Warehouse, WarehouseZone } from "./types";
import { Button } from "@/components/ui/button";
import { ZoomInIcon } from "lucide-react";
import { IconArrowsMinimize } from "@tabler/icons-react";

// Fix for default markers in react-leaflet
delete (Icon.Default.prototype as { _getIconUrl?: string })._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface FullScreenMapModalProps {
  warehouse: Warehouse | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function FullScreenMapModal({ warehouse, isOpen, onClose }: FullScreenMapModalProps) {
  if (!warehouse || !isOpen) return null;

  const position: LatLngTuple = [warehouse.latitude, warehouse.longitude];

  // Convert warehouse coordinates to lat/lng (simplified conversion)
  const warehouseToLatLng = (x: number, y: number): LatLngTuple => {
    const center: LatLngTuple = [warehouse.latitude, warehouse.longitude];
    const scale = 0.001; // Scale factor for warehouse dimensions
    
    return [
      center[0] + (y - 50) * scale,
      center[1] + (x - 50) * scale
    ] as LatLngTuple;
  };

  // Create zone polygon coordinates
  const createZonePolygon = (zone: WarehouseZone): LatLngTuple[] => {
    const x = zone.x;
    const y = zone.y;
    const width = zone.width;
    const height = zone.height;

    return [
      warehouseToLatLng(x, y),
      warehouseToLatLng(x + width, y),
      warehouseToLatLng(x + width, y + height),
      warehouseToLatLng(x, y + height),
      warehouseToLatLng(x, y)
    ];
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-white">
      {/* Header with close button */}
      <div className="absolute top-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-sm border-b border-gray-200">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <ZoomInIcon className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">{warehouse.name} - Location Map</h2>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="hover:bg-gray-100"
          >
            <IconArrowsMinimize className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Full-screen map */}
      <div className="h-full w-full pt-16">
        <MapContainer
          center={position}
          zoom={18}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Warehouse outline */}
          <Polygon
            positions={[
              warehouseToLatLng(0, 0),
              warehouseToLatLng(100, 0),
              warehouseToLatLng(100, 100),
              warehouseToLatLng(0, 100),
              warehouseToLatLng(0, 0)
            ]}
            color="#374151"
            weight={3}
            fillOpacity={0.1}
            fillColor="#6b7280"
          />

          {/* Zone polygons */}
          {warehouse.zones?.map((zone) => (
            <Polygon
              key={zone.id}
              positions={createZonePolygon(zone)}
              color="#374151"
              weight={1}
              fillOpacity={0.7}
              fillColor={zone.color}
            >
              <Popup>
                <div className="p-2">
                  <h4 className="font-semibold text-sm">{zone.name}</h4>
                  <p className="text-xs text-gray-600 mb-1">Type: {zone.type}</p>
                  <p className="text-xs text-gray-600">Capacity: {zone.usedCapacity}/{zone.capacity}</p>
                </div>
              </Popup>
            </Polygon>
          ))}

          {/* Zone labels as markers */}
          {warehouse.zones?.map((zone) => (
            <Marker
              key={`label-${zone.id}`}
              position={warehouseToLatLng(zone.x + zone.width / 2, zone.y + zone.height / 2)}
              icon={new Icon({
                iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjMwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMzAiIGZpbGw9IndoaXRlIiBzdHJva2U9ImJsYWNrIiBzdHJva2Utd2lkdGg9IjEiLz48dGV4dCB4PSI1MCIgeT0iMjAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iYmxhY2siIHRleHQtYW5jaG9yPSJtaWRkbGUiPnt6b25lLm5hbWV9PC90ZXh0Pjwvc3ZnPg=='.replace('{zone.name}', zone.name),
                iconSize: [100, 30],
                iconAnchor: [50, 15],
                className: 'zone-label'
              })}
            />
          ))}

          {/* Main warehouse marker */}
          <Marker position={position}>
            <Popup>
              <div className="p-2">
                <h4 className="font-semibold text-sm">{warehouse.name}</h4>
                <p className="text-xs text-gray-600 mb-1">
                  {warehouse.address}, {warehouse.city}, {warehouse.state} {warehouse.zipCode}
                </p>
                <p className="text-xs text-gray-600">
                  {warehouse.materials?.length || 0} materials available
                </p>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      {/* Legend overlay */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4 max-w-xs z-20">
        <h4 className="font-semibold text-sm mb-2">Map Legend</h4>
        <div className="grid grid-cols-1 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-600 border border-gray-800" style={{ opacity: 0.1 }}></div>
            <span>Warehouse Outline</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 border border-gray-800" style={{ opacity: 0.7 }}></div>
            <span>Storage Zones</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 border border-gray-800" style={{ opacity: 0.7 }}></div>
            <span>Shipping Zones</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 border border-gray-800" style={{ opacity: 0.7 }}></div>
            <span>Receiving Zones</span>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polygon } from "react-leaflet";
import { Icon, LatLngTuple } from "leaflet";
import { WarehouseZone, Warehouse } from "./types";

// Fix for default markers in react-leaflet
delete (Icon.Default.prototype as { _getIconUrl?: string })._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface WarehouseMapProps {
  warehouse: Warehouse;
  onZoneSelect?: (zone: WarehouseZone | null) => void;
}

export default function WarehouseMap({ warehouse, onZoneSelect }: WarehouseMapProps) {
  const [selectedZone, setSelectedZone] = useState<WarehouseZone | null>(null);
  const mapRef = useRef<L.Map | null>(null);


  // Convert warehouse coordinates to lat/lng
  const warehouseToLatLng = (x: number, y: number): LatLngTuple => {
    // Use actual warehouse coordinates as center
    const center: LatLngTuple = [warehouse.latitude, warehouse.longitude];
    const scale = 0.001; // Scale factor for warehouse dimensions
    
    return [
      center[0] + (y - 50) * scale, // Convert y to latitude
      center[1] + (x - 50) * scale  // Convert x to longitude
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
      warehouseToLatLng(x, y) // Close the polygon
    ];
  };

  const handleZoneClick = (zone: WarehouseZone) => {
    setSelectedZone(zone);
    onZoneSelect?.(zone);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">2D Warehouse Layout</h3>
        <div className="text-sm text-muted-foreground">
          Click on zones to view details
        </div>
      </div>
      
      <div className="border rounded-lg overflow-hidden bg-white">
        <MapContainer
          center={[warehouse.latitude, warehouse.longitude]}
          zoom={18}
          style={{ height: "400px", width: "100%" }}
          ref={mapRef}
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
              color={selectedZone?.id === zone.id ? "#ef4444" : "#374151"}
              weight={selectedZone?.id === zone.id ? 3 : 1}
              fillOpacity={0.7}
              fillColor={zone.color}
              eventHandlers={{
                click: () => handleZoneClick(zone)
              }}
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
        </MapContainer>
      </div>

      {selectedZone && (
        <div className="bg-white border rounded-lg p-4">
          <h4 className="font-semibold text-base mb-3">{selectedZone.name}</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Type:</span> {selectedZone.type}
            </div>
            <div>
              <span className="font-medium">Capacity:</span> {selectedZone.usedCapacity}/{selectedZone.capacity}
            </div>
            <div className="col-span-2">
              <span className="font-medium">Utilization:</span> 
              <div className="w-full bg-gray-200 h-2 mt-1">
                <div 
                  className="bg-blue-600 h-2" 
                  style={{ width: `${(selectedZone.usedCapacity / selectedZone.capacity) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

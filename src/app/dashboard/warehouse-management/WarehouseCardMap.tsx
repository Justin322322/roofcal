"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Icon, LatLngTuple } from "leaflet";
import { Warehouse } from "./types";
import { Button } from "@/components/ui/button";
import { IconArrowsMaximize } from "@tabler/icons-react";

// Fix for default markers in react-leaflet
delete (Icon.Default.prototype as { _getIconUrl?: string })._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface WarehouseCardMapProps {
  warehouse: Warehouse;
  onZoomClick?: () => void;
}

export default function WarehouseCardMap({ warehouse, onZoomClick }: WarehouseCardMapProps) {
  const position: LatLngTuple = [warehouse.latitude, warehouse.longitude];

  return (
    <div className="h-48 w-full rounded-lg overflow-hidden border relative z-0">
      <MapContainer
        center={position}
        zoom={15}
        style={{ height: "100%", width: "100%", zIndex: 1, position: "relative" }}
        zoomControl={false}
        dragging={false}
        touchZoom={false}
        doubleClickZoom={false}
        scrollWheelZoom={false}
        boxZoom={false}
        keyboard={false}
        attributionControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
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
      
      {/* Zoom icon in top-right corner */}
      {onZoomClick && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onZoomClick}
          className="absolute top-2 right-2 h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-md border z-[1000]"
        >
          <IconArrowsMaximize className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

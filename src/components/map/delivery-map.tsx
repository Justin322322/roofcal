"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { Coordinates, Route } from "@/types/location";

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), {
  ssr: false,
});

const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), {
  ssr: false,
});

const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), {
  ssr: false,
});

const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false,
});

const Polyline = dynamic(() => import("react-leaflet").then((mod) => mod.Polyline), {
  ssr: false,
});

// Fix for default markers in React Leaflet - only on client side
const setupLeafletIcons = async () => {
  if (typeof window !== "undefined") {
    const L = await import("leaflet");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    });
  }
};

interface DeliveryMapProps {
  origin?: Coordinates;
  destination?: Coordinates;
  route?: Route;
  height?: string;
  className?: string;
  showControls?: boolean;
  onMapClick?: (coordinates: Coordinates) => void;
}

export function DeliveryMap({
  origin,
  destination,
  route,
  height = "400px",
  className = "",
  showControls = true,
  onMapClick,
}: DeliveryMapProps) {
  const [isClient, setIsClient] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);

  useEffect(() => {
    setIsClient(true);
    setupLeafletIcons();
  }, []);

  // Default center (Manila, Philippines)
  const defaultCenter: [number, number] = [14.5995, 120.9842];

  // Calculate bounds if we have both origin and destination
  useEffect(() => {
    if (isClient && mapRef.current && origin && destination) {
      import("leaflet").then((L) => {
        const bounds = L.latLngBounds(
          [origin.latitude, origin.longitude],
          [destination.latitude, destination.longitude]
        );
        mapRef.current.fitBounds(bounds, { padding: [20, 20] });
      });
    }
  }, [isClient, origin, destination]);

  // Parse route geometry if available
  const routeCoordinates: [number, number][] = [];
  if (route?.geometry) {
    try {
      const geometry = JSON.parse(route.geometry);
      if (geometry.coordinates) {
        routeCoordinates.push(...geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]));
      }
    } catch (error) {
      console.warn("Failed to parse route geometry:", error);
    }
  }

  // Handle map click through event listener
  useEffect(() => {
    if (isClient && mapRef.current && onMapClick) {
      const map = mapRef.current;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handleClick = (e: any) => {
        onMapClick({
          latitude: e.latlng.lat,
          longitude: e.latlng.lng,
        });
      };
      
      map.on('click', handleClick);
      return () => {
        map.off('click', handleClick);
      };
    }
  }, [isClient, onMapClick]);

  if (!isClient) {
    return (
      <div className={`relative ${className}`} style={{ height }}>
        <div className="h-full w-full rounded-lg bg-gray-100 flex items-center justify-center">
          <div className="text-gray-500">Loading map...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ height }}>
      <MapContainer
        center={origin ? [origin.latitude, origin.longitude] : defaultCenter}
        zoom={origin && destination ? 10 : 8}
        className="h-full w-full rounded-lg"
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Origin Marker */}
        {origin && (
          <Marker position={[origin.latitude, origin.longitude]}>
            <Popup>
              <div className="text-sm">
                <div className="font-semibold text-blue-600">Origin</div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Destination Marker */}
        {destination && (
          <Marker position={[destination.latitude, destination.longitude]}>
            <Popup>
              <div className="text-sm">
                <div className="font-semibold text-green-600">Destination</div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Route Polyline */}
        {routeCoordinates.length > 0 && (
          <Polyline
            positions={routeCoordinates}
            color="#3b82f6"
            weight={4}
            opacity={0.8}
          />
        )}
      </MapContainer>

      {/* Route Information Overlay */}
      {route && showControls && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 text-sm">
          <div className="font-semibold text-gray-900">Route Details</div>
          <div className="text-gray-600">
            <div>Distance: {route.distance.toFixed(1)} km</div>
            <div>Duration: {Math.round(route.duration)} minutes</div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {!origin && !destination && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-gray-500 text-center">
            <div className="text-lg font-medium">Delivery Map</div>
            <div className="text-sm">Add origin and destination to view route</div>
          </div>
        </div>
      )}
    </div>
  );
}

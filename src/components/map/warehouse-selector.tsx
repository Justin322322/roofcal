"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Check } from "lucide-react";
import { DeliveryMap } from "./delivery-map";
import { findNearestWarehouse } from "@/lib/route-calculator";
import type { Warehouse, Coordinates } from "@/types/location";

interface WarehouseSelectorProps {
  warehouses: Warehouse[];
  selectedWarehouseId?: string;
  destination?: Coordinates;
  onWarehouseSelect: (warehouseId: string) => void;
  className?: string;
  showMap?: boolean;
}

export function WarehouseSelector({
  warehouses,
  selectedWarehouseId,
  destination,
  onWarehouseSelect,
  className = "",
  showMap = true,
}: WarehouseSelectorProps) {
  const [nearestWarehouseId, setNearestWarehouseId] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Find nearest warehouse when destination changes
  useEffect(() => {
    if (destination && warehouses.length > 0) {
      setIsCalculating(true);
      
      // Simulate async calculation
      setTimeout(async () => {
        const nearest = await findNearestWarehouse(
          destination,
          warehouses.map(w => ({
            id: w.id,
            latitude: w.latitude,
            longitude: w.longitude,
          }))
        );
        setNearestWarehouseId(nearest);
        setIsCalculating(false);
      }, 500);
    }
  }, [destination, warehouses]);

  // Auto-select nearest warehouse if no selection and destination is available
  useEffect(() => {
    if (nearestWarehouseId && !selectedWarehouseId && destination) {
      onWarehouseSelect(nearestWarehouseId);
    }
  }, [nearestWarehouseId, selectedWarehouseId, destination, onWarehouseSelect]);

  const selectedWarehouse = warehouses.find(w => w.id === selectedWarehouseId);

  // Calculate distance to destination for each warehouse
  const warehousesWithDistance = warehouses.map(warehouse => {
    let distance = 0;
    if (destination) {
      // Simple straight-line distance calculation
      const R = 3959; // Earth's radius in miles
      const dLat = (destination.latitude - warehouse.latitude) * (Math.PI / 180);
      const dLon = (destination.longitude - warehouse.longitude) * (Math.PI / 180);
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(warehouse.latitude * (Math.PI / 180)) *
        Math.cos(destination.latitude * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      distance = R * c;
    }
    return { ...warehouse, distance: Math.round(distance * 10) / 10 };
  });

  // Sort by distance
  warehousesWithDistance.sort((a, b) => a.distance - b.distance);

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Select Warehouse
            {isCalculating && (
              <Badge variant="secondary" className="ml-2">
                Finding nearest...
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {warehouses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No warehouses available</p>
              <p className="text-sm">Contact administrator to add warehouse locations</p>
            </div>
          ) : (
            <div className="space-y-3">
              {warehousesWithDistance.map((warehouse) => {
                const isSelected = warehouse.id === selectedWarehouseId;
                const isNearest = warehouse.id === nearestWarehouseId;
                const isDefault = warehouse.isDefault;

                return (
                  <div
                    key={warehouse.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? "border-primary bg-card shadow-sm"
                        : "border-border bg-card hover:border-primary/50 hover:shadow-sm"
                    }`}
                    onClick={() => onWarehouseSelect(warehouse.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-card-foreground">
                            {warehouse.name}
                          </h3>
                          {isDefault && (
                            <Badge variant="secondary" className="text-xs">
                              Default
                            </Badge>
                          )}
                          {isNearest && destination && (
                            <Badge variant="default" className="text-xs">
                              Nearest
                            </Badge>
                          )}
                        </div>
                        
                        <div className="text-sm text-muted-foreground mb-2">
                          <div>{warehouse.address}</div>
                          <div>{warehouse.city}, {warehouse.state} {warehouse.zipCode}</div>
                        </div>

                        {destination && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Navigation className="h-3 w-3" />
                            {warehouse.distance} km
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isSelected && (
                          <Check className="h-5 w-5 text-primary" />
                        )}
                        <Button
                          size="sm"
                          variant={isSelected ? "default" : "outline"}
                          onClick={(e) => {
                            e.stopPropagation();
                            onWarehouseSelect(warehouse.id);
                          }}
                        >
                          {isSelected ? "Selected" : "Select"}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Map showing selected warehouse and destination */}
      {showMap && selectedWarehouse && destination && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Route Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <DeliveryMap
              origin={{
                latitude: selectedWarehouse.latitude,
                longitude: selectedWarehouse.longitude,
              }}
              destination={destination}
              height="300px"
              showControls={true}
            />
          </CardContent>
        </Card>
      )}

      {/* Contractor Information */}
      {selectedWarehouse && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Selected Contractor Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium text-card-foreground">Name</div>
                <div className="text-muted-foreground">{selectedWarehouse.name}</div>
              </div>
              <div className="col-span-2">
                <div className="font-medium text-card-foreground">Address</div>
                <div className="text-muted-foreground">
                  {selectedWarehouse.address}<br />
                  {selectedWarehouse.city}, {selectedWarehouse.state} {selectedWarehouse.zipCode}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Coordinates, Warehouse, DeliveryCalculation } from "@/types/location";

// Dynamically import map components to avoid SSR issues
const AddressInput = dynamic(() => import("@/components/map/address-input").then((mod) => ({ default: mod.AddressInput })), {
  ssr: false,
  loading: () => <div className="p-4 text-center">Loading address input...</div>
});

const WarehouseSelector = dynamic(() => import("@/components/map/warehouse-selector").then((mod) => ({ default: mod.WarehouseSelector })), {
  ssr: false,
  loading: () => <div className="p-4 text-center">Loading warehouse selector...</div>
});

const DeliveryMap = dynamic(() => import("@/components/map/delivery-map").then((mod) => ({ default: mod.DeliveryMap })), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">Loading map...</div>
});

export default function DeliveryTestPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [projectAddress, setProjectAddress] = useState<Coordinates | null>(null);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("");
  const [deliveryCalculation, setDeliveryCalculation] = useState<DeliveryCalculation | null>(null);
  const [loading, setLoading] = useState(false);

  // Load warehouses on mount
  useEffect(() => {
    loadWarehouses();
  }, []);

  const loadWarehouses = async () => {
    try {
      const response = await fetch("/api/warehouses");
      const data = await response.json();
      if (data.success) {
        setWarehouses(data.data);
        // Auto-select default warehouse if available
        const defaultWarehouse = data.data.find((w: Warehouse) => w.isDefault);
        if (defaultWarehouse) {
          setSelectedWarehouseId(defaultWarehouse.id);
        }
      }
    } catch (error) {
      console.error("Error loading warehouses:", error);
    }
  };

  const calculateDelivery = async () => {
    if (!projectAddress || !selectedWarehouseId) {
      alert("Please select both project address and warehouse");
      return;
    }

    const selectedWarehouse = warehouses.find(w => w.id === selectedWarehouseId);
    if (!selectedWarehouse) return;

    setLoading(true);
    try {
      const response = await fetch("/api/delivery/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: {
            latitude: selectedWarehouse.latitude,
            longitude: selectedWarehouse.longitude,
          },
          destination: projectAddress,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setDeliveryCalculation(data.data.delivery);
      }
    } catch (error) {
      console.error("Error calculating delivery:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectedWarehouse = warehouses.find(w => w.id === selectedWarehouseId);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold">Delivery Calculator Test</h1>
        <Badge variant="outline">Testing</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Address</CardTitle>
            </CardHeader>
            <CardContent>
              <AddressInput
                onCoordinatesChange={(coords) => {
                  setProjectAddress(coords);
                  setDeliveryCalculation(null); // Reset calculation when address changes
                }}
                required
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Warehouse Selection</CardTitle>
            </CardHeader>
            <CardContent>
              <WarehouseSelector
                warehouses={warehouses}
                selectedWarehouseId={selectedWarehouseId}
                destination={projectAddress || undefined}
                onWarehouseSelect={(id) => {
                  setSelectedWarehouseId(id);
                  setDeliveryCalculation(null); // Reset calculation when warehouse changes
                }}
                showMap={false}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Calculate Delivery</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={calculateDelivery}
                disabled={!projectAddress || !selectedWarehouseId || loading}
                className="w-full"
              >
                {loading ? "Calculating..." : "Calculate Delivery Cost"}
              </Button>
            </CardContent>
          </Card>

          {/* Delivery Results */}
          {deliveryCalculation && (
            <Card>
              <CardHeader>
                <CardTitle>Delivery Calculation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Distance</div>
                    <div className="text-lg font-semibold">
                      {deliveryCalculation.distance} km
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Duration</div>
                    <div className="text-lg font-semibold">
                      {deliveryCalculation.duration} minutes
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="text-sm text-gray-600 mb-2">Cost Breakdown</div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Base Cost (Tier {deliveryCalculation.pricingBreakdown.tier}):</span>
                      <span>₱{deliveryCalculation.pricingBreakdown.baseCost}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mileage Cost:</span>
                      <span>₱{deliveryCalculation.pricingBreakdown.mileageCost}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg border-t pt-2">
                      <span>Total Delivery Cost:</span>
                      <span>₱{deliveryCalculation.pricingBreakdown.totalCost}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Map Section */}
        <div className="space-y-6">
          {projectAddress && selectedWarehouse && (
            <Card>
              <CardHeader>
                <CardTitle>Delivery Route Map</CardTitle>
              </CardHeader>
              <CardContent>
                <DeliveryMap
                  origin={{
                    latitude: selectedWarehouse.latitude,
                    longitude: selectedWarehouse.longitude,
                  }}
                  destination={projectAddress}
                  route={deliveryCalculation?.route}
                  height="500px"
                  showControls={true}
                />
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>1. Enter the project address and validate it</div>
              <div>2. Select a warehouse location</div>
              <div>3. Click &quot;Calculate Delivery Cost&quot; to see the route and pricing</div>
              <div className="pt-2 text-gray-600">
                <strong>Note:</strong> This is a test page to verify the delivery mapping functionality.
                Make sure you have configured at least one warehouse in the Delivery Settings.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

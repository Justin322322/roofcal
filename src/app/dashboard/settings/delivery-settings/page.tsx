"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Plus, Settings, MapPin, DollarSign } from "lucide-react";
import dynamic from "next/dynamic";
import type { Warehouse, DeliveryPricing, Coordinates } from "@/types/location";

// Dynamically import map components to avoid SSR issues
const AddressInput = dynamic(() => import("@/components/map/address-input").then((mod) => ({ default: mod.AddressInput })), {
  ssr: false,
  loading: () => <div className="p-4 text-center">Loading address input...</div>
});

export default function DeliverySettingsPage() {
  const { data: session } = useSession();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [pricing, setPricing] = useState<DeliveryPricing>({
    tier1: { maxDistance: 10, flatFee: 250 },
    tier2: { maxDistance: 30, flatFee: 250, perMileRate: 15 },
    tier3: { perMileRate: 20 },
  });
  const [loading, setLoading] = useState(true);
  const [newWarehouse, setNewWarehouse] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
  });
  const [newWarehouseCoords, setNewWarehouseCoords] = useState<Coordinates | null>(null);

  // Load warehouses and pricing when authenticated
  useEffect(() => {
    if (session?.user?.id && session.user.role === "ADMIN") {
      loadWarehouses();
      loadPricing();
    } else if (session === null) {
      setLoading(false);
    }
  }, [session?.user?.id, session?.user?.role, session]);

  const loadWarehouses = async () => {
    try {
      const response = await fetch("/api/warehouses");
      const data = await response.json();
      if (data.success) {
        setWarehouses(data.data);
      }
    } catch (error) {
      console.error("Error loading warehouses:", error);
    }
  };

  const loadPricing = async () => {
    // In a real app, this would come from an API
    // For now, we'll use the default pricing
    setLoading(false);
  };

  const handleAddWarehouse = async () => {
    if (!newWarehouseCoords) {
      alert("Please validate the address first");
      return;
    }

    if (!newWarehouse.name.trim()) {
      alert("Please enter a warehouse name");
      return;
    }

    try {
      const response = await fetch("/api/warehouses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newWarehouse,
          latitude: newWarehouseCoords.latitude,
          longitude: newWarehouseCoords.longitude,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setWarehouses([...warehouses, data.data]);
        setNewWarehouse({ name: "", address: "", city: "", state: "", zipCode: "" });
        setNewWarehouseCoords(null);
        alert("Warehouse added successfully!");
      } else {
        alert(`Failed to add warehouse: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error adding warehouse:", error);
      alert("Failed to add warehouse. Please try again.");
    }
  };

  const handleDeleteWarehouse = async (warehouseId: string) => {
    if (!confirm("Are you sure you want to delete this warehouse?")) return;

    try {
      const response = await fetch(`/api/warehouses/${warehouseId}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setWarehouses(warehouses.filter(w => w.id !== warehouseId));
        alert("Warehouse deleted successfully!");
      } else {
        alert(`Failed to delete warehouse: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error deleting warehouse:", error);
      alert("Failed to delete warehouse. Please try again.");
    }
  };

  const handleSetDefault = async (warehouseId: string) => {
    try {
      const response = await fetch(`/api/warehouses/${warehouseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setWarehouses(warehouses.map(w => ({
          ...w,
          isDefault: w.id === warehouseId,
        })));
        alert("Default warehouse updated successfully!");
      } else {
        alert(`Failed to set default warehouse: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error setting default warehouse:", error);
      alert("Failed to set default warehouse. Please try again.");
    }
  };

  const handleSavePricing = () => {
    // In a real app, this would save to an API
    alert("Pricing settings saved!");
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Delivery Settings</h1>
        </div>
        <p className="text-muted-foreground">
          Manage your warehouse locations and delivery pricing. Contractors can set up their own warehouses for accurate delivery cost calculations.
        </p>
      </div>

      <Tabs defaultValue="warehouses" className="space-y-6">
        <TabsList>
          <TabsTrigger value="warehouses" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Warehouses
          </TabsTrigger>
          <TabsTrigger value="pricing" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Pricing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="warehouses" className="space-y-6">
          {/* Add New Warehouse */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add New Warehouse
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="warehouseName">Warehouse Name</Label>
                  <Input
                    id="warehouseName"
                    placeholder="Warehouse Name"
                    value={newWarehouse.name}
                    onChange={(e) => setNewWarehouse({ ...newWarehouse, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="warehouseAddress">Street Address</Label>
                  <Input
                    id="warehouseAddress"
                    placeholder="Street Address"
                    value={newWarehouse.address}
                    onChange={(e) => setNewWarehouse({ ...newWarehouse, address: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="warehouseCity">City/Municipality</Label>
                  <Input
                    id="warehouseCity"
                    placeholder="City/Municipality"
                    value={newWarehouse.city}
                    onChange={(e) => setNewWarehouse({ ...newWarehouse, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="warehouseState">Province</Label>
                  <Input
                    id="warehouseState"
                    placeholder="Province"
                    value={newWarehouse.state}
                    onChange={(e) => setNewWarehouse({ ...newWarehouse, state: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="warehouseZip">Postal Code</Label>
                  <Input
                    id="warehouseZip"
                    placeholder="Postal Code"
                    value={newWarehouse.zipCode}
                    onChange={(e) => setNewWarehouse({ ...newWarehouse, zipCode: e.target.value })}
                  />
                </div>
              </div>

              <AddressInput
                initialAddress={newWarehouse}
                onAddressChange={(geocoded) => {
                  setNewWarehouse({
                    name: newWarehouse.name,
                    address: geocoded.street,
                    city: geocoded.city,
                    state: geocoded.state,
                    zipCode: geocoded.zipCode,
                  });
                }}
                onCoordinatesChange={setNewWarehouseCoords}
              />

              <Button onClick={handleAddWarehouse} disabled={!newWarehouseCoords}>
                Add Warehouse
              </Button>
            </CardContent>
          </Card>

          {/* Existing Warehouses */}
          <Card>
            <CardHeader>
              <CardTitle>Warehouse Locations</CardTitle>
            </CardHeader>
            <CardContent>
              {warehouses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No warehouses configured</p>
                  <p className="text-sm">Add your first warehouse location above</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {warehouses.map((warehouse) => (
                    <div
                      key={warehouse.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{warehouse.name}</h3>
                          {warehouse.isDefault && (
                            <Badge variant="default">Default</Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          <div>{warehouse.address}</div>
                          <div>{warehouse.city}, {warehouse.state} {warehouse.zipCode}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {warehouse.latitude.toFixed(6)}, {warehouse.longitude.toFixed(6)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!warehouse.isDefault && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSetDefault(warehouse.id)}
                          >
                            Set Default
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteWarehouse(warehouse.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Pricing Tiers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Tier 1 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="default">Tier 1</Badge>
                    <span className="text-sm text-gray-600">Local Delivery</span>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tier1MaxDistance">Max Distance (km)</Label>
                    <Input
                      id="tier1MaxDistance"
                      type="number"
                      value={pricing.tier1.maxDistance}
                      onChange={(e) => setPricing({
                        ...pricing,
                        tier1: { ...pricing.tier1, maxDistance: Number(e.target.value) }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tier1FlatFee">Flat Fee (₱)</Label>
                    <Input
                      id="tier1FlatFee"
                      type="number"
                      value={pricing.tier1.flatFee}
                      onChange={(e) => setPricing({
                        ...pricing,
                        tier1: { ...pricing.tier1, flatFee: Number(e.target.value) }
                      })}
                    />
                  </div>
                </div>

                {/* Tier 2 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Tier 2</Badge>
                    <span className="text-sm text-gray-600">Regional Delivery</span>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tier2MaxDistance">Max Distance (km)</Label>
                    <Input
                      id="tier2MaxDistance"
                      type="number"
                      value={pricing.tier2.maxDistance}
                      onChange={(e) => setPricing({
                        ...pricing,
                        tier2: { ...pricing.tier2, maxDistance: Number(e.target.value) }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tier2FlatFee">Base Fee (₱)</Label>
                    <Input
                      id="tier2FlatFee"
                      type="number"
                      value={pricing.tier2.flatFee}
                      onChange={(e) => setPricing({
                        ...pricing,
                        tier2: { ...pricing.tier2, flatFee: Number(e.target.value) }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tier2PerMile">Per KM Rate (₱)</Label>
                    <Input
                      id="tier2PerMile"
                      type="number"
                      step="0.1"
                      value={pricing.tier2.perMileRate}
                      onChange={(e) => setPricing({
                        ...pricing,
                        tier2: { ...pricing.tier2, perMileRate: Number(e.target.value) }
                      })}
                    />
                  </div>
                </div>

                {/* Tier 3 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Tier 3</Badge>
                    <span className="text-sm text-gray-600">Long Distance</span>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tier3PerMile">Per KM Rate (₱)</Label>
                    <Input
                      id="tier3PerMile"
                      type="number"
                      step="0.1"
                      value={pricing.tier3.perMileRate}
                      onChange={(e) => setPricing({
                        ...pricing,
                        tier3: { ...pricing.tier3, perMileRate: Number(e.target.value) }
                      })}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Pricing Summary</h4>
                  <div className="text-sm space-y-1">
                    <div><strong>Tier 1:</strong> 0-{pricing.tier1.maxDistance} km: ₱{pricing.tier1.flatFee} flat fee</div>
                    <div><strong>Tier 2:</strong> {pricing.tier1.maxDistance}-{pricing.tier2.maxDistance} km: ₱{pricing.tier2.flatFee} + ₱{pricing.tier2.perMileRate}/km</div>
                    <div><strong>Tier 3:</strong> {pricing.tier2.maxDistance}+ km: ₱{pricing.tier2.flatFee} + ₱{pricing.tier3.perMileRate}/km</div>
                  </div>
                </div>
              </div>

              <Button onClick={handleSavePricing} className="w-full">
                Save Pricing Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

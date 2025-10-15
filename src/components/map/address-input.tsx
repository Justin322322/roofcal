"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MapPin, CheckCircle, AlertCircle } from "lucide-react";
import { geocodeAddress } from "@/lib/geocoding";
import type { GeocodedAddress, Coordinates } from "@/types/location";

interface AddressInputProps {
  initialAddress?: string;
  initialCoordinates?: Coordinates;
  onAddressChange?: (address: GeocodedAddress) => void;
  onCoordinatesChange?: (coordinates: Coordinates) => void;
  className?: string;
  required?: boolean;
  placeholder?: string;
}

export function AddressInput({
  initialAddress = "",
  initialCoordinates,
  onAddressChange,
  onCoordinatesChange,
  className = "",
  required = false,
  placeholder = "Enter complete address (e.g., 123 Main St, Balanga, Bataan, 2100)",
}: AddressInputProps) {
  const [address, setAddress] = useState(initialAddress);

  const [coordinates, setCoordinates] = useState<Coordinates | null>(
    initialCoordinates || null
  );
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingError, setGeocodingError] = useState<string | null>(null);
  const [isValidated, setIsValidated] = useState(false);

  const handleAddressChange = (value: string) => {
    setAddress(value);
    setIsValidated(false);
    setGeocodingError(null);
  };

  const handleGeocode = async () => {
    const fullAddress = address.trim();
    
    if (!fullAddress) {
      setGeocodingError("Please enter an address");
      return;
    }

    setIsGeocoding(true);
    setGeocodingError(null);

    try {
      const result = await geocodeAddress(fullAddress, { country: 'ph' });
      
      if (result) {
        setCoordinates(result.coordinates);
        setIsValidated(true);
        onAddressChange?.(result);
        onCoordinatesChange?.(result.coordinates);
      } else {
        setGeocodingError("Address not found. Please check your input.");
        setIsValidated(false);
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      setGeocodingError("Failed to validate address. Please try again.");
      setIsValidated(false);
    } finally {
      setIsGeocoding(false);
    }
  };

  

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Address Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Single Address Input */}
          <div className="space-y-2">
            <Label htmlFor="address">
              Complete Address {required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id="address"
              placeholder={placeholder}
              value={address}
              onChange={(e) => handleAddressChange(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Geocode Button */}
          <Button
            onClick={handleGeocode}
            disabled={isGeocoding || !address.trim()}
            className="w-full"
            variant="outline"
          >
            {isGeocoding ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Validating Address...
              </>
            ) : (
              <>
                <MapPin className="mr-2 h-4 w-4" />
                Validate Address
              </>
            )}
          </Button>

          {/* Status Messages */}
          {geocodingError && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              {geocodingError}
            </div>
          )}

          {isValidated && coordinates && (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <CheckCircle className="h-4 w-4" />
              Address validated successfully
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

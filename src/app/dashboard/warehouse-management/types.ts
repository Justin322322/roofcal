// Types for warehouse management
export interface WarehouseZone {
  id: string;
  name: string;
  type: 'storage' | 'shipping' | 'receiving' | 'office';
  capacity: number;
  usedCapacity: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export interface WarehouseItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  zoneId: string;
  location: string;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
}

export interface Warehouse {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
  // Warehouse dimensions in meters
  length?: number;
  width?: number;
  height?: number;
  // Calculated capacity in cubic meters (Length × Width × Height)
  capacity?: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  creator?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  // Optional fields for warehouse management features
  zones?: WarehouseZone[];
  items?: WarehouseItem[];
  totalCapacity?: number;
  usedCapacity?: number;
  materials?: Array<{
    id: string;
    name: string;
    quantity: number;
    basePrice: number;
    locationAdjustment: number;
  }>;
}

export interface Material {
  id: string;
  name: string;
  label: string;
  description: string | null;
  price: number;
  unit: string;
  category: string;
  // Material dimensions in meters
  length?: number;
  width?: number;
  height?: number;
  // Calculated volume in cubic meters
  volume?: number;
}

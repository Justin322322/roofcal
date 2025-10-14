"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  MapPinIcon, 
  FileTextIcon,
  DollarSignIcon,
  RulerIcon,
  PackageIcon,
} from "lucide-react";

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

interface Project {
  id: string;
  projectName: string;
  status: string;
  proposalStatus: string | null;
  totalCost: number;
  area: number;
  material: string;
  address: string | null;
  city: string | null;
  state: string | null;
  createdAt: Date;
  proposalSent?: Date | null;
  notes?: string | null;
  // Additional fields for detailed view
  length?: number;
  width?: number;
  pitch?: number;
  materialCost?: number;
  gutterCost?: number;
  ridgeCost?: number;
  screwsCost?: number;
  insulationCost?: number;
  ventilationCost?: number;
  totalMaterialsCost?: number;
  laborCost?: number;
  removalCost?: number;
  deliveryCost?: number | null;
  deliveryDistance?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  gutterPieces?: number;
  ridgeLength?: number;
  ventilationPieces?: number;
  contractor?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

interface ProjectDetailsViewerProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
}

// Simple Location Map Component
function LocationMap({ latitude, longitude, address }: { latitude: number | null; longitude: number | null; address?: string | null }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setupLeafletIcons();
  }, []);

  if (!isClient || !latitude || !longitude) {
    return null;
  }

  return (
    <div className="mt-4 rounded-lg overflow-hidden border" style={{ height: "250px" }}>
      <MapContainer
        center={[latitude, longitude]}
        zoom={13}
        className="h-full w-full"
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[latitude, longitude]}>
          <Popup>
            <div className="text-sm">
              <div className="font-semibold">Project Location</div>
              {address && <div className="text-gray-600">{address}</div>}
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}

export function ProjectDetailsViewer({ project, isOpen, onClose }: ProjectDetailsViewerProps) {
  const getStatusBadge = (status: string, proposalStatus: string | null) => {
    if (proposalStatus === "SENT") {
      return <Badge variant="outline" className="bg-blue-100 text-blue-700">Proposal Sent</Badge>;
    }
    if (proposalStatus === "ACCEPTED") {
      return <Badge variant="outline" className="bg-green-100 text-green-700">Accepted</Badge>;
    }
    if (proposalStatus === "REJECTED") {
      return <Badge variant="outline" className="bg-red-100 text-red-700">Rejected</Badge>;
    }
    
    switch (status) {
      case "DRAFT":
        return <Badge variant="outline" className="bg-slate-100 text-slate-600">Draft</Badge>;
      case "CLIENT_PENDING":
        return <Badge variant="outline" className="bg-slate-100 text-slate-600">Pending Contractor</Badge>;
      case "CONTRACTOR_REVIEWING":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-700">Action Required</Badge>;
      case "ACCEPTED":
        return <Badge variant="outline" className="bg-green-100 text-green-700">Accepted</Badge>;
      case "IN_PROGRESS":
        return <Badge variant="outline" className="bg-blue-100 text-blue-700">In Progress</Badge>;
      case "COMPLETED":
        return <Badge variant="outline" className="bg-green-100 text-green-700">Completed</Badge>;
      case "REJECTED":
        return <Badge variant="outline" className="bg-red-100 text-red-700">Declined</Badge>;
      default:
        return <Badge variant="outline" className="bg-slate-100 text-slate-600">{status}</Badge>;
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{project.projectName}</SheetTitle>
          <SheetDescription>
            Complete project details and pricing breakdown
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          {/* Project Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FileTextIcon className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Project Information</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <p className="text-sm font-medium">{getStatusBadge(project.status, project.proposalStatus)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Material</p>
                <p className="text-sm font-medium capitalize">{project.material.replace(/-/g, ' ')}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Area</p>
                <p className="text-sm font-medium">{project.area.toLocaleString()} sq ft</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created</p>
                <p className="text-sm font-medium">{new Date(project.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Contractor Information */}
          {project.contractor && (
            <>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <PackageIcon className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Contractor Information</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Name</p>
                    <p className="text-sm font-medium">{project.contractor.firstName} {project.contractor.lastName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="text-sm font-medium">{project.contractor.email}</p>
                  </div>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Location */}
          {(project.address || project.city || project.state) && (
            <>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <MapPinIcon className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Location</h3>
                </div>
                <div className="space-y-2">
                  {project.address && (
                    <p className="text-sm"><span className="font-medium text-muted-foreground">Address:</span> {project.address}</p>
                  )}
                  {(project.city || project.state) && (
                    <p className="text-sm">
                      <span className="font-medium text-muted-foreground">City/State:</span> {project.city}, {project.state}
                    </p>
                  )}
                  {project.deliveryDistance !== null && project.deliveryDistance !== undefined && (
                    <p className="text-sm">
                      <span className="font-medium text-muted-foreground">Delivery Distance:</span> {project.deliveryDistance.toFixed(2)} miles
                    </p>
                  )}
                </div>
                {/* Location Map */}
                {project.latitude && project.longitude && (
                  <LocationMap
                    latitude={project.latitude}
                    longitude={project.longitude}
                    address={project.address}
                  />
                )}
              </div>
              <Separator />
            </>
          )}

          {/* Project Dimensions */}
          {(project.length || project.width || project.pitch) && (
            <>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <RulerIcon className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Dimensions</h3>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {project.length && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Length</p>
                      <p className="text-sm font-medium">{project.length} ft</p>
                    </div>
                  )}
                  {project.width && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Width</p>
                      <p className="text-sm font-medium">{project.width} ft</p>
                    </div>
                  )}
                  {project.pitch && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Pitch</p>
                      <p className="text-sm font-medium">{project.pitch}°</p>
                    </div>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Price Breakdown */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <DollarSignIcon className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Price Breakdown</h3>
            </div>
            
            <div className="space-y-3">
              {/* Material Costs */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Material Costs</p>
                <div className="ml-4 space-y-1">
                  {project.materialCost !== undefined && project.materialCost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>
                        Roofing Material
                        {project.area && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({project.area.toFixed(2)} sq ft)
                          </span>
                        )}
                      </span>
                      <span className="font-medium">₱{project.materialCost.toLocaleString()}</span>
                    </div>
                  )}
                  {project.gutterCost !== undefined && project.gutterCost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>
                        Gutter System
                        {project.gutterPieces && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({project.gutterPieces} pieces)
                          </span>
                        )}
                      </span>
                      <span className="font-medium">₱{project.gutterCost.toLocaleString()}</span>
                    </div>
                  )}
                  {project.ridgeCost !== undefined && project.ridgeCost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>
                        Ridge Cap
                        {project.ridgeLength && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({project.ridgeLength.toFixed(2)} ft)
                          </span>
                        )}
                      </span>
                      <span className="font-medium">₱{project.ridgeCost.toLocaleString()}</span>
                    </div>
                  )}
                  {project.screwsCost !== undefined && project.screwsCost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Screws & Fasteners</span>
                      <span className="font-medium">₱{project.screwsCost.toLocaleString()}</span>
                    </div>
                  )}
                  {project.insulationCost !== undefined && project.insulationCost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Insulation</span>
                      <span className="font-medium">₱{project.insulationCost.toLocaleString()}</span>
                    </div>
                  )}
                  {project.ventilationCost !== undefined && project.ventilationCost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>
                        Ventilation
                        {project.ventilationPieces && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({project.ventilationPieces} pieces)
                          </span>
                        )}
                      </span>
                      <span className="font-medium">₱{project.ventilationCost.toLocaleString()}</span>
                    </div>
                  )}
                </div>
                {project.totalMaterialsCost !== undefined && project.totalMaterialsCost > 0 && (
                  <div className="flex justify-between text-sm font-medium pt-1 border-t">
                    <span>Subtotal - Materials</span>
                    <span>₱{project.totalMaterialsCost.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Labor & Services */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Labor & Services</p>
                <div className="ml-4 space-y-1">
                  {project.laborCost !== undefined && project.laborCost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Labor</span>
                      <span className="font-medium">₱{project.laborCost.toLocaleString()}</span>
                    </div>
                  )}
                  {project.removalCost !== undefined && project.removalCost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Removal & Disposal</span>
                      <span className="font-medium">₱{project.removalCost.toLocaleString()}</span>
                    </div>
                  )}
                  {project.deliveryCost !== null && project.deliveryCost !== undefined && project.deliveryCost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Delivery</span>
                      <span className="font-medium">₱{project.deliveryCost.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Total */}
              <div className="pt-3 border-t-2">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Project Cost</span>
                  <span className="text-primary">₱{project.totalCost.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {project.notes && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Notes</p>
                <p className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap">{project.notes}</p>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}


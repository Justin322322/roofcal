"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { InsufficientMaterialsDialog } from "@/components/insufficient-materials-dialog";
import {
  Loader2Icon,
  FileTextIcon,
  MapPinIcon,
  CalendarIcon,
  CheckIcon,
  XIcon,
  CheckCircleIcon,
  FilterIcon,
  XCircleIcon,
  EyeIcon,
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

interface ProjectMaterial {
  id: string;
  quantity: number;
  WarehouseMaterial: {
    PricingConfig: {
      id: string;
      name: string;
      category: string;
      unit: string;
    };
  };
}

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
  client?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  ProjectMaterial?: ProjectMaterial[];
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
  notes?: string | null;
  gutterPieces?: number;
  ridgeLength?: number;
  ventilationPieces?: number;
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

export function ContractorProjectsContent() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [minCost, setMinCost] = useState<string>("");
  const [maxCost, setMaxCost] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  
  // Loading states for actions
  const [loadingProjectId, setLoadingProjectId] = useState<string | null>(null);
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [insufficientMaterialsDialogOpen, setInsufficientMaterialsDialogOpen] = useState(false);
  const [insufficientMaterials, setInsufficientMaterials] = useState<Array<{
    materialId: string;
    materialName: string;
    required: number;
    available: number;
    shortage: number;
  }>>([]);
  const [warehouseId, setWarehouseId] = useState<string | undefined>(undefined);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/contractor/projects');
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.projects) {
          setProjects(result.projects);
        }
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      toast.error("Failed to load projects");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewProject = (project: Project) => {
    setSelectedProject(project);
    setViewDialogOpen(true);
  };

  const handleDeclineProject = async (projectId: string) => {
    setSelectedProjectId(projectId);
    setDeclineDialogOpen(true);
  };

  const confirmDeclineProject = async () => {
    if (!selectedProjectId) return;

    setLoadingProjectId(selectedProjectId);
    try {
      const response = await fetch(`/api/projects/${selectedProjectId}/decline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: declineReason }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to decline project");
      }

      const result = await response.json();
      toast.success(result.message || "Project declined", {
        description: "The project has been marked as declined",
      });
      
      setDeclineDialogOpen(false);
      setSelectedProjectId(null);
      setDeclineReason("");
      await fetchProjects();
    } catch (error) {
      console.error("Failed to decline project:", error);
      toast.error("Failed to decline project", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setLoadingProjectId(null);
    }
  };

  const handleFinishProject = async (projectId: string) => {
    setLoadingProjectId(projectId);
    try {
      const response = await fetch(`/api/projects/${projectId}/finish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to finish project");
      }

      const result = await response.json();
      toast.success(result.message || "Project completed", {
        description: "The project has been marked as completed",
      });
      await fetchProjects();
    } catch (error) {
      console.error("Failed to finish project:", error);
      toast.error("Failed to finish project", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setLoadingProjectId(null);
    }
  };

  const handleAcceptProject = async (projectId: string) => {
    setLoadingProjectId(projectId);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACCEPTED" }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Check if it's an insufficient materials error
        if (errorData.errorCode === "INSUFFICIENT_MATERIALS" && errorData.insufficientMaterials) {
          setInsufficientMaterials(errorData.insufficientMaterials);
          setWarehouseId(errorData.warehouseId);
          setInsufficientMaterialsDialogOpen(true);
          return;
        }
        
        throw new Error(errorData.error || "Failed to accept project");
      }

      const result = await response.json();
      toast.success(result.message || "Project accepted", {
        description: "The project has been accepted and is ready to work on",
      });
      await fetchProjects();
    } catch (error) {
      console.error("Failed to accept project:", error);
      toast.error("Failed to accept project", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setLoadingProjectId(null);
    }
  };

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
      case "CONTRACTOR_REVIEWING":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-700">Action Required</Badge>;
      case "PROPOSAL_SENT":
        return <Badge variant="outline" className="bg-blue-100 text-blue-700">Proposal Sent</Badge>;
      case "ACCEPTED":
        return <Badge variant="outline" className="bg-green-100 text-green-700">Accepted</Badge>;
      case "COMPLETED":
        return <Badge variant="outline" className="bg-green-100 text-green-700">Completed</Badge>;
      case "REJECTED":
        return <Badge variant="outline" className="bg-red-100 text-red-700">Declined</Badge>;
      default:
        return <Badge variant="outline" className="bg-slate-100 text-slate-600">{status}</Badge>;
    }
  };

  const filteredProjects = projects.filter(project => {
    // Search filter
    const matchesSearch = project.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.client?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.client?.lastName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    // Status filter
    if (statusFilter !== "all") {
      const projectStatus = project.proposalStatus || project.status;
      if (statusFilter === "reviewing" && projectStatus !== "CONTRACTOR_REVIEWING") return false;
      if (statusFilter === "accepted" && projectStatus !== "ACCEPTED" && project.proposalStatus !== "ACCEPTED") return false;
      if (statusFilter === "completed" && projectStatus !== "COMPLETED") return false;
      if (statusFilter === "rejected" && projectStatus !== "REJECTED" && project.proposalStatus !== "REJECTED") return false;
    }

    // Cost filter
    if (minCost && project.totalCost < parseFloat(minCost)) return false;
    if (maxCost && project.totalCost > parseFloat(maxCost)) return false;

    // Date filter
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      const projectDate = new Date(project.createdAt);
      if (projectDate < fromDate) return false;
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999); // Include the entire end date
      const projectDate = new Date(project.createdAt);
      if (projectDate > toDate) return false;
    }

    return true;
  });

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setMinCost("");
    setMaxCost("");
    setDateFrom("");
    setDateTo("");
  };

  const hasActiveFilters = searchQuery || statusFilter !== "all" || minCost || maxCost || dateFrom || dateTo;

  if (isLoading) {
    return (
      <div className="px-4 lg:px-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Contractor Projects</h2>
          <p className="text-muted-foreground">
            Manage and track your assigned projects
          </p>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2Icon className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading projects...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Contractor Projects</h2>
        <p className="text-muted-foreground">
          Manage and track your assigned projects
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FilterIcon className="h-5 w-5" />
            <CardTitle className="text-lg">Filters</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search */}
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <Input
                placeholder="Search projects by name or client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Filters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    <SelectItem value="reviewing">Action Required</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="rejected">Declined</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Min Cost */}
              <div>
                <label className="text-sm font-medium mb-2 block">Min Cost</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={minCost}
                  onChange={(e) => setMinCost(e.target.value)}
                />
              </div>

              {/* Max Cost */}
              <div>
                <label className="text-sm font-medium mb-2 block">Max Cost</label>
                <Input
                  type="number"
                  placeholder="999999"
                  value={maxCost}
                  onChange={(e) => setMaxCost(e.target.value)}
                />
              </div>

              {/* Date From */}
              <div>
                <label className="text-sm font-medium mb-2 block">From Date</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
            </div>

            {/* Date To */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">To Date</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="flex items-center gap-2"
                >
                  <XCircleIcon className="h-4 w-4" />
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Projects Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Projects</CardTitle>
              <CardDescription>
                {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''} found
                {hasActiveFilters && (
                  <span className="ml-2 text-primary">
                    (filtered from {projects.length} total)
                  </span>
                )}
              </CardDescription>
            </div>
            {hasActiveFilters && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <FilterIcon className="h-3 w-3" />
                {[
                  searchQuery && "Search",
                  statusFilter !== "all" && "Status",
                  minCost && "Min Cost",
                  maxCost && "Max Cost",
                  dateFrom && "From Date",
                  dateTo && "To Date",
                ].filter(Boolean).length} active filter{[
                  searchQuery && "Search",
                  statusFilter !== "all" && "Status",
                  minCost && "Min Cost",
                  maxCost && "Max Cost",
                  dateFrom && "From Date",
                  dateTo && "To Date",
                ].filter(Boolean).length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileTextIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No projects found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? "No projects match your search." : "You don't have any assigned projects yet."}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project Name</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">{project.projectName}</TableCell>
                      <TableCell>
                        {project.client ? `${project.client.firstName} ${project.client.lastName}` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {project.address ? (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPinIcon className="h-3 w-3" />
                            <span className="truncate max-w-[200px]">
                              {project.city}, {project.state}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {project.totalCost.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(project.status, project.proposalStatus)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <CalendarIcon className="h-3 w-3" />
                          {new Date(project.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewProject(project)}
                          >
                            <EyeIcon className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          {project.status === "CONTRACTOR_REVIEWING" && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleAcceptProject(project.id)}
                                disabled={loadingProjectId === project.id}
                              >
                                {loadingProjectId === project.id ? (
                                  <>
                                    <Loader2Icon className="h-4 w-4 mr-1 animate-spin" />
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    <CheckIcon className="h-4 w-4 mr-1" />
                                    Accept
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeclineProject(project.id)}
                                disabled={loadingProjectId === project.id}
                              >
                                <XIcon className="h-4 w-4 mr-1" />
                                Decline
                              </Button>
                            </>
                          )}
                          {project.status === "ACCEPTED" && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleFinishProject(project.id)}
                              disabled={loadingProjectId === project.id}
                            >
                              {loadingProjectId === project.id ? (
                                <>
                                  <Loader2Icon className="h-4 w-4 mr-1 animate-spin" />
                                  Finishing...
                                </>
                              ) : (
                                <>
                                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                                  Finish
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Project Details View Sheet */}
      <Sheet open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{selectedProject?.projectName}</SheetTitle>
            <SheetDescription>
              Complete project details and pricing breakdown
            </SheetDescription>
          </SheetHeader>
          
          {selectedProject && (
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
                    <p className="text-sm font-medium">{getStatusBadge(selectedProject.status, selectedProject.proposalStatus)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Material</p>
                    <p className="text-sm font-medium">{selectedProject.material}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Area</p>
                    <p className="text-sm font-medium">{selectedProject.area.toLocaleString()} sq ft</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Created</p>
                    <p className="text-sm font-medium">{new Date(selectedProject.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Client Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <PackageIcon className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Client Information</h3>
                </div>
                {selectedProject.client ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Name</p>
                      <p className="text-sm font-medium">{selectedProject.client.firstName} {selectedProject.client.lastName}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Email</p>
                      <p className="text-sm font-medium">{selectedProject.client.email}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No client information available</p>
                )}
              </div>

              <Separator />

              {/* Location */}
              {(selectedProject.address || selectedProject.city || selectedProject.state) && (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <MapPinIcon className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">Location</h3>
                    </div>
                    <div className="space-y-2">
                      {selectedProject.address && (
                        <p className="text-sm"><span className="font-medium text-muted-foreground">Address:</span> {selectedProject.address}</p>
                      )}
                      {(selectedProject.city || selectedProject.state) && (
                        <p className="text-sm">
                          <span className="font-medium text-muted-foreground">City/State:</span> {selectedProject.city}, {selectedProject.state}
                        </p>
                      )}
                      {selectedProject.deliveryDistance !== null && selectedProject.deliveryDistance !== undefined && (
                        <p className="text-sm">
                          <span className="font-medium text-muted-foreground">Delivery Distance:</span> {selectedProject.deliveryDistance.toFixed(2)} miles
                        </p>
                      )}
                    </div>
                    {/* Location Map */}
                    {selectedProject.latitude && selectedProject.longitude && (
                      <LocationMap
                        latitude={selectedProject.latitude}
                        longitude={selectedProject.longitude}
                        address={selectedProject.address}
                      />
                    )}
                  </div>
                  <Separator />
                </>
              )}

              {/* Project Dimensions */}
              {(selectedProject.length || selectedProject.width || selectedProject.pitch) && (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <RulerIcon className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">Dimensions</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {selectedProject.length && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Length</p>
                          <p className="text-sm font-medium">{selectedProject.length} ft</p>
                        </div>
                      )}
                      {selectedProject.width && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Width</p>
                          <p className="text-sm font-medium">{selectedProject.width} ft</p>
                        </div>
                      )}
                      {selectedProject.pitch && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Pitch</p>
                          <p className="text-sm font-medium">{selectedProject.pitch}°</p>
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
                      {selectedProject.ProjectMaterial && selectedProject.ProjectMaterial.length > 0 ? (
                        selectedProject.ProjectMaterial.map((pm) => (
                          <div key={pm.id} className="flex justify-between text-sm">
                            <span>
                              {pm.WarehouseMaterial.PricingConfig.name}
                              <span className="text-xs text-muted-foreground ml-1">
                                ({pm.quantity} {pm.WarehouseMaterial.PricingConfig.unit})
                              </span>
                            </span>
                            <span className="font-medium">
                              {pm.WarehouseMaterial.PricingConfig.category}
                            </span>
                          </div>
                        ))
                      ) : (
                        <>
                          {selectedProject.materialCost !== undefined && selectedProject.materialCost > 0 && (
                            <div className="flex justify-between text-sm">
                              <span>
                                Roofing Material
                                {selectedProject.area && (
                                  <span className="text-xs text-muted-foreground ml-1">
                                    ({selectedProject.area.toFixed(2)} sq ft)
                                  </span>
                                )}
                              </span>
                              <span className="font-medium">₱{selectedProject.materialCost.toLocaleString()}</span>
                            </div>
                          )}
                          {selectedProject.gutterCost !== undefined && selectedProject.gutterCost > 0 && (
                            <div className="flex justify-between text-sm">
                              <span>
                                Gutter System
                                {selectedProject.gutterPieces && (
                                  <span className="text-xs text-muted-foreground ml-1">
                                    ({selectedProject.gutterPieces} pieces)
                                  </span>
                                )}
                              </span>
                              <span className="font-medium">₱{selectedProject.gutterCost.toLocaleString()}</span>
                            </div>
                          )}
                          {selectedProject.ridgeCost !== undefined && selectedProject.ridgeCost > 0 && (
                            <div className="flex justify-between text-sm">
                              <span>
                                Ridge Cap
                                {selectedProject.ridgeLength && (
                                  <span className="text-xs text-muted-foreground ml-1">
                                    ({selectedProject.ridgeLength.toFixed(2)} ft)
                                  </span>
                                )}
                              </span>
                              <span className="font-medium">₱{selectedProject.ridgeCost.toLocaleString()}</span>
                            </div>
                          )}
                          {selectedProject.screwsCost !== undefined && selectedProject.screwsCost > 0 && (
                            <div className="flex justify-between text-sm">
                              <span>Screws & Fasteners</span>
                              <span className="font-medium">₱{selectedProject.screwsCost.toLocaleString()}</span>
                            </div>
                          )}
                          {selectedProject.insulationCost !== undefined && selectedProject.insulationCost > 0 && (
                            <div className="flex justify-between text-sm">
                              <span>Insulation</span>
                              <span className="font-medium">₱{selectedProject.insulationCost.toLocaleString()}</span>
                            </div>
                          )}
                          {selectedProject.ventilationCost !== undefined && selectedProject.ventilationCost > 0 && (
                            <div className="flex justify-between text-sm">
                              <span>
                                Ventilation
                                {selectedProject.ventilationPieces && (
                                  <span className="text-xs text-muted-foreground ml-1">
                                    ({selectedProject.ventilationPieces} pieces)
                                  </span>
                                )}
                              </span>
                              <span className="font-medium">₱{selectedProject.ventilationCost.toLocaleString()}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    {selectedProject.totalMaterialsCost !== undefined && selectedProject.totalMaterialsCost > 0 && (
                      <div className="flex justify-between text-sm font-medium pt-1 border-t">
                        <span>Subtotal - Materials</span>
                        <span>₱{selectedProject.totalMaterialsCost.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Labor & Services */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Labor & Services</p>
                    <div className="ml-4 space-y-1">
                      {selectedProject.laborCost !== undefined && selectedProject.laborCost > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>Labor</span>
                          <span className="font-medium">₱{selectedProject.laborCost.toLocaleString()}</span>
                        </div>
                      )}
                      {selectedProject.removalCost !== undefined && selectedProject.removalCost > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>Removal & Disposal</span>
                          <span className="font-medium">₱{selectedProject.removalCost.toLocaleString()}</span>
                        </div>
                      )}
                      {selectedProject.deliveryCost !== null && selectedProject.deliveryCost !== undefined && selectedProject.deliveryCost > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>Delivery</span>
                          <span className="font-medium">₱{selectedProject.deliveryCost.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="pt-3 border-t-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total Project Cost</span>
                      <span className="text-primary">₱{selectedProject.totalCost.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedProject.notes && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Notes</p>
                    <p className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap">{selectedProject.notes}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Decline Dialog */}
      <Dialog open={declineDialogOpen} onOpenChange={setDeclineDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to decline this project? You can provide a reason below (optional).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="decline-reason">Reason for declining (optional)</Label>
              <Textarea
                id="decline-reason"
                placeholder="Please provide a reason for declining this project..."
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeclineDialogOpen(false);
                setSelectedProjectId(null);
                setDeclineReason("");
              }}
              disabled={loadingProjectId !== null}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeclineProject}
              disabled={loadingProjectId !== null}
            >
              {loadingProjectId ? (
                <>
                  <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                  Declining...
                </>
              ) : (
                "Decline Project"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Insufficient Materials Dialog */}
      <InsufficientMaterialsDialog
        open={insufficientMaterialsDialogOpen}
        onOpenChange={setInsufficientMaterialsDialogOpen}
        insufficientMaterials={insufficientMaterials}
        warehouseId={warehouseId}
      />
    </div>
  );
}

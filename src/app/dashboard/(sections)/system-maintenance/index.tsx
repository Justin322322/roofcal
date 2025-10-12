"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArchiveIcon,
  DollarSignIcon,
  SettingsIcon,
  TrashIcon,
  DownloadIcon,
  PlusIcon,
  MoreVerticalIcon,
  EditIcon,
  SaveIcon,
  XIcon,
  LoaderIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  type PricingConfig,
  type CreatePricingConfig,
  type UpdatePricingConfig,
  getPricingCategories,
  PRICING_UNITS,
} from "@/lib/pricing";

export default function SystemMaintenance() {
  const { data: session } = useSession();
  const [pricingData, setPricingData] = useState<PricingConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("materials");
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<UpdatePricingConfig>>({});
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newItemData, setNewItemData] = useState<Partial<CreatePricingConfig>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = getPricingCategories();

  // Load pricing data on mount - only if user is authenticated and is an admin
  useEffect(() => {
    if (session?.user?.id && session.user.role === "ADMIN") {
      loadPricingData();
    } else if (session === null) {
      // If session is explicitly null (logged out), stop loading
      setIsLoading(false);
    }
  }, [session]);

  // Check authentication and authorization
  if (session === null) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="text-gray-600 mt-2">Please log in to access this page.</p>
        </div>
      </div>
    );
  }

  if (session.user?.role !== "ADMIN") {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="text-gray-600 mt-2">Only administrators can access system maintenance.</p>
        </div>
      </div>
    );
  }

  const loadPricingData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/pricing');
      if (!response.ok) {
        throw new Error('Failed to fetch pricing data');
      }
      const result = await response.json();
      setPricingData(result.data);
    } catch (error) {
      console.error('Error loading pricing data:', error);
      toast.error('Failed to load pricing data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditItem = (item: PricingConfig) => {
    setEditingItem(item.id);
    setEditValues({
      label: item.label,
      description: item.description,
      price: Number(item.price),
      unit: item.unit,
      isActive: item.isActive,
    });
  };

  const handleSaveEdit = async (id: string) => {
    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/pricing/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editValues),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update pricing');
      }

      // Reload data
      await loadPricingData();
    setEditingItem(null);
    setEditValues({});
      toast.success('Pricing updated successfully');
    } catch (error) {
      console.error('Error updating pricing:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update pricing');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditValues({});
  };

  const handleAddItem = async () => {
    try {
      setIsSubmitting(true);
      const response = await fetch('/api/pricing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newItemData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create pricing');
      }

      // Reload data
      await loadPricingData();
      setIsAddDialogOpen(false);
      setNewItemData({});
      toast.success('Pricing item added successfully');
    } catch (error) {
      console.error('Error adding pricing:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add pricing');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this pricing item?')) {
      return;
    }

    try {
      const response = await fetch(`/api/pricing/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete pricing');
      }

      // Reload data
      await loadPricingData();
      toast.success('Pricing item deleted successfully');
    } catch (error) {
      console.error('Error deleting pricing:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete pricing');
    }
  };

  const exportToCSV = async () => {
    try {
      const csvContent = [
        ['Category', 'Name', 'Label', 'Description', 'Price', 'Unit', 'Status', 'Last Updated'],
        ...pricingData.map((item) => [
          item.category,
          item.name,
          item.label,
          item.description || '',
          item.price.toString(),
          item.unit,
          item.isActive ? 'Active' : 'Inactive',
          new Date(item.updated_at).toLocaleDateString(),
        ]),
      ]
        .map((row) => row.map((cell) => `"${cell}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `pricing-config-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Export completed', {
        description: 'Pricing configuration exported successfully',
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed', {
        description: 'Failed to export pricing configuration',
      });
    }
  };


  const filteredData = pricingData.filter((item) => item.category === activeTab);
  const totalItems = pricingData.length;
  const activeItems = pricingData.filter((item) => item.isActive).length;

  if (isLoading) {
    return (
      <>
        {/* Header Section */}
        <div className="px-4 lg:px-6 flex items-center justify-between mb-4">
          <p className="text-muted-foreground">
            Manage system costs, pricing, and archived items
          </p>
          <Skeleton className="h-9 w-32" />
        </div>

        {/* Stats Cards */}
        <div className="px-4 lg:px-6 mb-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-7 w-20 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 lg:px-6">
          <Skeleton className="h-96 w-full" />
        </div>
      </>
    );
  }

  return (
    <>
      {/* Header Section */}
      <div className="px-4 lg:px-6 flex items-center justify-between mb-4">
        <p className="text-muted-foreground">
          Manage system costs, pricing, and pricing configurations
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportToCSV}>
              <DownloadIcon className="h-4 w-4 mr-2" />
            Export CSV
            </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-4 lg:px-6 mb-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Items
              </CardTitle>
              <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalItems}</div>
              <p className="text-xs text-muted-foreground">
                All pricing items
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Items</CardTitle>
              <SettingsIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeItems}</div>
              <p className="text-xs text-muted-foreground">
                Currently active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <SettingsIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categories.length}</div>
              <p className="text-xs text-muted-foreground">Pricing categories</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Last Updated
              </CardTitle>
              <ArchiveIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {pricingData.length > 0 
                  ? new Date(Math.max(...pricingData.map(item => new Date(item.updated_at).getTime()))).toLocaleDateString()
                  : 'N/A'
                }
              </div>
              <p className="text-xs text-muted-foreground">Most recent change</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 lg:px-6">
        <Tabs
          defaultValue="materials"
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList className="grid w-full grid-cols-7">
            {categories.map((category) => (
            <TabsTrigger
                key={category.id}
                value={category.id}
                className="flex items-center gap-2 text-xs"
            >
                <DollarSignIcon className="h-3 w-3" />
                {category.label}
            </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category.id} value={category.id} className="space-y-4">
            <Card>
              <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5" />
                        {category.label} Pricing
                </CardTitle>
                <CardDescription>
                        Manage pricing for {category.label.toLowerCase()}
                </CardDescription>
                    </div>
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          onClick={() => setNewItemData({ category: category.id as CreatePricingConfig['category'], unit: category.unit as CreatePricingConfig['unit'] })}
                        >
                          <PlusIcon className="h-4 w-4 mr-2" />
                          Add Item
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Pricing Item</DialogTitle>
                          <DialogDescription>
                            Add a new {category.label.toLowerCase()} pricing item to the system.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="name">Name (Key)</Label>
                            <Input
                              id="name"
                              value={newItemData.name || ''}
                              onChange={(e) => setNewItemData(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="e.g., premium, standard"
                            />
                          </div>
                          <div>
                            <Label htmlFor="label">Display Label</Label>
                            <Input
                              id="label"
                              value={newItemData.label || ''}
                              onChange={(e) => setNewItemData(prev => ({ ...prev, label: e.target.value }))}
                              placeholder="e.g., Premium Material"
                            />
                          </div>
                          <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                              id="description"
                              value={newItemData.description || ''}
                              onChange={(e) => setNewItemData(prev => ({ ...prev, description: e.target.value }))}
                              placeholder="Optional description"
                            />
                          </div>
                          <div>
                            <Label htmlFor="price">Price</Label>
                            <Input
                              id="price"
                              type="number"
                              step="0.01"
                              min="0"
                              value={newItemData.price || ''}
                              onChange={(e) => setNewItemData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                              placeholder="0.00"
                            />
                          </div>
                          <div>
                            <Label htmlFor="unit">Unit</Label>
                            <Select
                              value={newItemData.unit || category.unit}
                              onValueChange={(value) => setNewItemData(prev => ({ ...prev, unit: value as typeof category.unit }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {PRICING_UNITS.map((unit) => (
                                  <SelectItem key={unit} value={unit}>
                                    {unit.replace('_', ' ')}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setIsAddDialogOpen(false);
                              setNewItemData({});
                            }}
                          >
                            Cancel
                          </Button>
                          <Button onClick={handleAddItem} disabled={isSubmitting}>
                            {isSubmitting ? (
                              <>
                                <LoaderIcon className="h-4 w-4 mr-2 animate-spin" />
                                Adding...
                              </>
                            ) : (
                              'Add Item'
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredData.length === 0 ? (
                    <div className="text-center py-12">
                      <DollarSignIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">
                        No {category.label} Items
                      </h3>
                      <p className="text-muted-foreground">
                        Add your first {category.label.toLowerCase()} pricing item to get started.
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Label</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Unit</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Last Updated</TableHead>
                          <TableHead className="w-[50px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredData.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>
                              {editingItem === item.id ? (
                                <Input
                                  value={editValues.label || ''}
                                  onChange={(e) => setEditValues(prev => ({ ...prev, label: e.target.value }))}
                                  className="h-8"
                                />
                              ) : (
                                item.label
                              )}
                            </TableCell>
                            <TableCell>
                        {editingItem === item.id ? (
                                <Input
                                  value={editValues.description || ''}
                                  onChange={(e) => setEditValues(prev => ({ ...prev, description: e.target.value }))}
                                  className="h-8"
                                />
                              ) : (
                                item.description || '-'
                              )}
                            </TableCell>
                            <TableCell>
                              {editingItem === item.id ? (
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={editValues.price || ''}
                                  onChange={(e) => setEditValues(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                                  className="h-8"
                                />
                              ) : (
                                `₱${Number(item.price).toLocaleString()}`
                              )}
                            </TableCell>
                            <TableCell>
                              {editingItem === item.id ? (
                                <Select
                                  value={editValues.unit || item.unit}
                                  onValueChange={(value) => setEditValues(prev => ({ ...prev, unit: value as typeof item.unit }))}
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {PRICING_UNITS.map((unit) => (
                                      <SelectItem key={unit} value={unit}>
                                        {unit.replace('_', ' ')}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                item.unit.replace('_', ' ')
                              )}
                            </TableCell>
                            <TableCell>
                              {editingItem === item.id ? (
                                <Select
                                  value={editValues.isActive !== undefined ? editValues.isActive.toString() : item.isActive.toString()}
                                  onValueChange={(value) => setEditValues(prev => ({ ...prev, isActive: value === 'true' }))}
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="true">Active</SelectItem>
                                    <SelectItem value="false">Inactive</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Badge variant={item.isActive ? "default" : "secondary"}>
                                  {item.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {new Date(item.updated_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {editingItem === item.id ? (
                                <div className="flex gap-1">
                              <Button
                                size="sm"
                                    onClick={() => handleSaveEdit(item.id)}
                                    disabled={isSubmitting}
                              >
                                    <SaveIcon className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelEdit}
                              >
                                    <XIcon className="h-3 w-3" />
                              </Button>
                          </div>
                        ) : (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreVerticalIcon className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEditItem(item)}>
                                      <EditIcon className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => handleDeleteItem(item.id)}
                                      className="text-red-600"
                                    >
                                      <TrashIcon className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          ))}
        </Tabs>
      </div>
    </>
  );
}
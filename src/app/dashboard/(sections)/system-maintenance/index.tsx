"use client";

import { useState } from "react";
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
  ArchiveIcon,
  DollarSignIcon,
  SettingsIcon,
  TrashIcon,
  DownloadIcon,
} from "lucide-react";
import { toast } from "sonner";

interface CostItem {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  currentCost: number;
  category: string;
  isActive: boolean;
  lastUpdated: string;
}

interface ArchivedItem {
  id: string;
  name: string;
  type: "cost" | "setting" | "feature";
  archivedAt: string;
  archivedBy: string;
  reason: string;
}

// Mock data
const mockCostItems: CostItem[] = [
  {
    id: "1",
    name: "Basic Roofing Materials",
    description: "Standard asphalt shingles and underlayment",
    baseCost: 7500,
    currentCost: 8250,
    category: "Materials",
    isActive: true,
    lastUpdated: "2024-01-15",
  },
  {
    id: "2",
    name: "Premium Roofing Materials",
    description: "High-quality metal or slate roofing materials",
    baseCost: 15000,
    currentCost: 16000,
    category: "Materials",
    isActive: true,
    lastUpdated: "2024-01-10",
  },
  {
    id: "3",
    name: "Labor Cost (per hour)",
    description: "Standard roofing contractor hourly rate",
    baseCost: 2250,
    currentCost: 2500,
    category: "Labor",
    isActive: true,
    lastUpdated: "2024-01-12",
  },
  {
    id: "4",
    name: "Permit Fees",
    description: "Local building permit costs",
    baseCost: 10000,
    currentCost: 10000,
    category: "Fees",
    isActive: true,
    lastUpdated: "2023-12-01",
  },
];

const mockArchivedItems: ArchivedItem[] = [
  {
    id: "1",
    name: "Legacy Material Calculator",
    type: "feature",
    archivedAt: "2023-11-15",
    archivedBy: "admin@roofcalc.com",
    reason: "Replaced with new calculation engine",
  },
  {
    id: "2",
    name: "Old Pricing Structure",
    type: "cost",
    archivedAt: "2023-10-20",
    archivedBy: "admin@roofcalc.com",
    reason: "Updated pricing model implemented",
  },
];

export default function SystemMaintenance() {
  const [costItems, setCostItems] = useState<CostItem[]>(mockCostItems);
  const [archivedItems] = useState<ArchivedItem[]>(mockArchivedItems);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<CostItem>>({});
  const [activeTab, setActiveTab] = useState<string>("cost-customization");

  const handleEditCost = (item: CostItem) => {
    setEditingItem(item.id);
    setEditValues({
      name: item.name,
      description: item.description,
      currentCost: item.currentCost,
    });
  };

  const handleSaveCost = (id: string) => {
    setCostItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              ...editValues,
              lastUpdated: new Date().toISOString().split("T")[0],
            }
          : item
      )
    );
    setEditingItem(null);
    setEditValues({});
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditValues({});
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Materials":
        return "bg-blue-100 text-blue-800";
      case "Labor":
        return "bg-green-100 text-green-800";
      case "Fees":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "cost":
        return "bg-red-100 text-red-800";
      case "setting":
        return "bg-yellow-100 text-yellow-800";
      case "feature":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const exportCostItems = async () => {
    try {
      const csvContent = [
        [
          "Name",
          "Description",
          "Category",
          "Base Cost (₱)",
          "Current Cost (₱)",
          "Status",
          "Last Updated",
        ],
        ...costItems.map((item) => [
          item.name,
          item.description,
          item.category,
          item.baseCost.toLocaleString(),
          item.currentCost.toLocaleString(),
          item.isActive ? "Active" : "Inactive",
          item.lastUpdated,
        ]),
      ]
        .map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `cost-items-${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Export completed", {
        description: "Cost items exported successfully",
        duration: 3000,
      });
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Export failed", {
        description: "Failed to export cost items",
        duration: 5000,
      });
    }
  };

  const exportArchivedItems = async () => {
    try {
      const csvContent = [
        ["Name", "Type", "Archived Date", "Archived By", "Reason"],
        ...archivedItems.map((item) => [
          item.name,
          item.type,
          item.archivedAt,
          item.archivedBy,
          item.reason,
        ]),
      ]
        .map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `archived-items-${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Export completed", {
        description: "Archived items exported successfully",
        duration: 3000,
      });
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Export failed", {
        description: "Failed to export archived items",
        duration: 5000,
      });
    }
  };

  return (
    <>
      {/* Header Section */}
      <div className="px-4 lg:px-6 flex items-center justify-between mb-4">
        <p className="text-muted-foreground">
          Manage system costs, pricing, and archived items
        </p>
        <div className="flex items-center gap-2">
          {activeTab === "cost-customization" && (
            <Button variant="outline" onClick={exportCostItems}>
              <DownloadIcon className="h-4 w-4 mr-2" />
              Export Costs
            </Button>
          )}
          {activeTab === "archive" && (
            <Button variant="outline" onClick={exportArchivedItems}>
              <DownloadIcon className="h-4 w-4 mr-2" />
              Export Archive
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-4 lg:px-6 mb-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Cost Items
              </CardTitle>
              <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{costItems.length}</div>
              <p className="text-xs text-muted-foreground">
                Active pricing items
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Materials</CardTitle>
              <SettingsIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  costItems.filter((item) => item.category === "Materials")
                    .length
                }
              </div>
              <p className="text-xs text-muted-foreground">
                Material categories
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Labor Items</CardTitle>
              <SettingsIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {costItems.filter((item) => item.category === "Labor").length}
              </div>
              <p className="text-xs text-muted-foreground">Labor categories</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Archived Items
              </CardTitle>
              <ArchiveIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{archivedItems.length}</div>
              <p className="text-xs text-muted-foreground">Items in archive</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 lg:px-6">
        <Tabs
          defaultValue="cost-customization"
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger
              value="cost-customization"
              className="flex items-center gap-2"
            >
              <DollarSignIcon className="h-4 w-4" />
              Cost Customization
            </TabsTrigger>
            <TabsTrigger value="archive" className="flex items-center gap-2">
              <ArchiveIcon className="h-4 w-4" />
              Archive
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cost-customization" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5" />
                  Cost Management
                </CardTitle>
                <CardDescription>
                  Configure and update pricing for materials, labor, and fees
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {costItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-base">
                            {item.name}
                          </h3>
                          <Badge className={getCategoryColor(item.category)}>
                            {item.category}
                          </Badge>
                          {item.isActive ? (
                            <Badge
                              variant="outline"
                              className="text-green-600 border-green-600"
                            >
                              Active
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-red-600 border-red-600"
                            >
                              Inactive
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {item.description}
                        </p>

                        {editingItem === item.id ? (
                          <div className="space-y-3 p-4 bg-muted/50 rounded-md border">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <Label htmlFor={`name-${item.id}`}>Name</Label>
                                <Input
                                  id={`name-${item.id}`}
                                  value={editValues.name || ""}
                                  onChange={(e) =>
                                    setEditValues((prev) => ({
                                      ...prev,
                                      name: e.target.value,
                                    }))
                                  }
                                />
                              </div>
                              <div>
                                <Label htmlFor={`cost-${item.id}`}>
                                  Current Cost (₱)
                                </Label>
                                <Input
                                  id={`cost-${item.id}`}
                                  type="number"
                                  value={editValues.currentCost || ""}
                                  onChange={(e) =>
                                    setEditValues((prev) => ({
                                      ...prev,
                                      currentCost: parseFloat(e.target.value),
                                    }))
                                  }
                                />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor={`desc-${item.id}`}>
                                Description
                              </Label>
                              <Input
                                id={`desc-${item.id}`}
                                value={editValues.description || ""}
                                onChange={(e) =>
                                  setEditValues((prev) => ({
                                    ...prev,
                                    description: e.target.value,
                                  }))
                                }
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleSaveCost(item.id)}
                              >
                                Save Changes
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelEdit}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">
                                Base Cost:
                              </span>
                              <p className="font-medium">
                                ₱{item.baseCost.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Current Cost:
                              </span>
                              <p className="font-medium text-primary">
                                ₱{item.currentCost.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Last Updated:
                              </span>
                              <p className="font-medium">{item.lastUpdated}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditCost(item)}
                          disabled={editingItem === item.id}
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="archive" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArchiveIcon className="h-5 w-5" />
                  Archived Items
                </CardTitle>
                <CardDescription>
                  View and manage archived system components and configurations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {archivedItems.length === 0 ? (
                  <div className="text-center py-12">
                    <ArchiveIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No Archived Items
                    </h3>
                    <p className="text-muted-foreground">
                      Archived items will appear here when they are moved to the
                      archive.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {archivedItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-base">
                              {item.name}
                            </h3>
                            <Badge className={getTypeColor(item.type)}>
                              {item.type.charAt(0).toUpperCase() +
                                item.type.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Archived by {item.archivedBy}
                          </p>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">
                                Archived Date:
                              </span>
                              <p className="font-medium">{item.archivedAt}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Reason:
                              </span>
                              <p className="font-medium">{item.reason}</p>
                            </div>
                          </div>
                        </div>

                        <div className="ml-4">
                          <Button variant="outline" size="sm">
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

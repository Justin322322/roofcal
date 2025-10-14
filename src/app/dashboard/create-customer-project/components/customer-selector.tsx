"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2Icon, SearchIcon, UserIcon, MailIcon, CalendarIcon, DollarSignIcon } from "lucide-react";
import { toast } from "sonner";

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  fullName: string;
  projectCount: number;
  totalSpent: number;
  avgProjectValue: number;
  joinedDate: Date;
  lastActive: Date;
}

interface CustomerSelectorProps {
  selectedCustomerId: string;
  onCustomerChange: (customerId: string) => void;
  onCustomerSelected: (customer: Client | null) => void;
}

export function CustomerSelector({ 
  selectedCustomerId, 
  onCustomerChange, 
  onCustomerSelected 
}: CustomerSelectorProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/clients');
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.clients) {
          setClients(result.clients);
        } else {
          toast.error("Failed to load clients");
        }
      } else {
        toast.error("Failed to load clients");
      }
    } catch (error) {
      console.error("Failed to fetch clients:", error);
      toast.error("Failed to load clients");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter clients based on search query
  const filteredClients = clients.filter((client) =>
    client.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedCustomer = clients.find(client => client.id === selectedCustomerId);

  const handleCustomerSelect = (customerId: string) => {
    onCustomerChange(customerId);
    const customer = clients.find(client => client.id === customerId);
    onCustomerSelected(customer || null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Select Customer
          </CardTitle>
          <CardDescription>
            Choose a customer to create a project for
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2Icon className="h-6 w-6 animate-spin mr-2" />
            <span>Loading customers...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Select Customer
          </CardTitle>
          <CardDescription>
            Choose a customer to create a project for. You can search by name or email.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="space-y-2">
            <Label htmlFor="search">Search Customers</Label>
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Customer Selection */}
          <div className="space-y-2">
            <Label htmlFor="customer">Customer</Label>
            <Select value={selectedCustomerId} onValueChange={handleCustomerSelect}>
              <SelectTrigger id="customer" className="w-full">
                <SelectValue placeholder="Select a customer..." />
              </SelectTrigger>
              <SelectContent>
                {filteredClients.length === 0 ? (
                  <SelectItem value="" disabled>
                    {searchQuery ? "No customers found matching your search" : "No customers available"}
                  </SelectItem>
                ) : (
                  filteredClients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      <div className="flex flex-col gap-1 py-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {client.fullName}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {client.projectCount} project{client.projectCount !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {client.email}
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Selected Customer Details */}
      {selectedCustomer && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Selected Customer</CardTitle>
            <CardDescription>
              Project will be created for this customer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{selectedCustomer.fullName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MailIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{selectedCustomer.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Joined {formatDate(selectedCustomer.joinedDate)}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Projects:</span>
                  <Badge variant="outline">{selectedCustomer.projectCount}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Spent:</span>
                  <span className="text-sm font-medium">
                    {selectedCustomer.totalSpent > 0 ? formatCurrency(selectedCustomer.totalSpent) : 'No projects'}
                  </span>
                </div>
                {selectedCustomer.avgProjectValue > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Avg Project Value:</span>
                    <span className="text-sm font-medium">
                      {formatCurrency(selectedCustomer.avgProjectValue)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

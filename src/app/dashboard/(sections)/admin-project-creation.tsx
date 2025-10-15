"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Calculator, UserPlus, AlertTriangle, Users, ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { UserRole } from "@/types/user-role";
import { RoofCalculatorContent } from "../roof-calculator";

interface Client {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
}

export default function AdminProjectCreationContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [isHelpRequest, setIsHelpRequest] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (session?.user?.role !== UserRole.ADMIN) {
      router.push("/dashboard");
      return;
    }
  }, [session, router]);

  // Fetch clients
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setClientsLoading(true);
        const response = await fetch("/api/clients");
        if (!response.ok) throw new Error("Failed to fetch clients");
        
        const result = await response.json();
        if (result.success) {
          setClients(result.clients || []);
        } else {
          throw new Error(result.error || "Failed to fetch clients");
        }
      } catch (err) {
        console.error("Error fetching clients:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch clients");
      } finally {
        setClientsLoading(false);
      }
    };

    fetchClients();
  }, []);

  // Handle URL parameters for help requests
  useEffect(() => {
    const helpRequest = searchParams.get('helpRequest');
    const clientId = searchParams.get('clientId');
    
    if (helpRequest === 'true' && clientId && clients.length > 0) {
      setIsHelpRequest(true);
      const client = clients.find(c => c.id === clientId);
      if (client) {
        setSelectedClient(client);
      }
    }
  }, [searchParams, clients]);

  const handleCreateProject = () => {
    if (!selectedClient) {
      toast.error("Please select a client first");
      return;
    }

    setShowCalculator(true);
    toast.success("Starting project creation", {
      description: `Creating project proposal for ${selectedClient.fullName}. The client will review and approve the proposal.`,
    });
  };

  const handleProjectCreated = () => {
    setShowCalculator(false);
    setSelectedClient(null);
    setIsHelpRequest(false);
    
    // Redirect away from help request mode
    router.push('/dashboard?tab=admin-project-creation');
    
    toast.success("Project proposal created successfully", {
      description: `Project proposal has been created for ${selectedClient?.fullName}. The client will receive a notification to review and approve the proposal.`,
    });
  };

  const handleBackToClientSelection = () => {
    setShowCalculator(false);
  };

  const handleSelectClient = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setSelectedClient(client);
      setClientDialogOpen(false);
    }
  };

  if (session?.user?.role !== UserRole.ADMIN) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2 px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Calculator className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {showCalculator ? "Create Project" : "Create Client Project"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {showCalculator 
                ? `Creating project for ${selectedClient?.fullName}`
                : "Create a new roofing project on behalf of a client"
              }
            </p>
          </div>
          {showCalculator && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBackToClientSelection}
              className="ml-auto"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Client Selection
            </Button>
          )}
        </div>
      </div>

      {/* Help Request Banner */}
      {isHelpRequest && selectedClient && !showCalculator && (
        <div className="px-4 lg:px-6">
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">!</span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Responding to Help Request
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Client <strong>{selectedClient.fullName}</strong> ({selectedClient.email}) has requested assistance with creating a project.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alerts */}
      <div className="px-4 lg:px-6">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Main Content */}
      <div className="px-4 lg:px-6">
        {showCalculator && selectedClient ? (
          <div className="space-y-4">
            {/* Calculator Banner for Admin Mode */}
            <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                    <Calculator className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-orange-900 dark:text-orange-100">
                    Admin Project Creation Mode
                  </h3>
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    You are creating a project proposal on behalf of <strong>{selectedClient.fullName}</strong>. The client will review and approve the proposal before work begins.
                  </p>
                </div>
              </div>
            </div>

            {/* Embedded Roof Calculator */}
            <div className="bg-background border rounded-lg">
              <RoofCalculatorContent 
                isAdminMode={true}
                selectedClientId={selectedClient.id}
                selectedClientName={selectedClient.fullName}
                onProjectCreated={handleProjectCreated}
              />
            </div>
          </div>
        ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Client Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Select Client
              </CardTitle>
              <CardDescription>
                Choose the client for whom you want to create a project
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {clientsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading clients...</span>
                </div>
              ) : selectedClient ? (
                <div className="space-y-3">
                  <div className="p-4 border rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{selectedClient.fullName}</h3>
                        <p className="text-sm text-muted-foreground">{selectedClient.email}</p>
                      </div>
                      <Badge variant="outline">Selected</Badge>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setClientDialogOpen(true)}
                    className="w-full"
                  >
                    Change Client
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-8 border-2 border-dashed rounded-lg text-center">
                    <UserPlus className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No client selected</p>
                  </div>
                  <Button
                    onClick={() => setClientDialogOpen(true)}
                    className="w-full"
                    disabled={clients.length === 0}
                  >
                    {clients.length === 0 ? "No clients available" : "Select Client"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Project Creation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Create Project
              </CardTitle>
              <CardDescription>
                Start the project creation process using the roof calculator
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedClient ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium">Ready to create project</span>
                    </div>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      You can now create a project for {selectedClient.fullName}
                    </p>
                  </div>
                  
                  <Button
                    onClick={handleCreateProject}
                    className="w-full"
                    size="lg"
                  >
                    Create Project
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              ) : (
                <div className="p-8 border-2 border-dashed rounded-lg text-center">
                  <Calculator className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Select a client first to create a project
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">How it works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-primary">1</span>
              </div>
              <div>
                <p className="font-medium text-foreground">Select a client</p>
                <p>Choose from your existing client list or create a new client account</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-primary">2</span>
              </div>
              <div>
                <p className="font-medium text-foreground">Create project</p>
                <p>Use the roof calculator to input measurements and specifications</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-primary">3</span>
              </div>
              <div>
                <p className="font-medium text-foreground">Client review</p>
                <p>The client reviews and approves the project proposal</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-primary">4</span>
              </div>
              <div>
                <p className="font-medium text-foreground">Project work</p>
                <p>Once approved, you can begin and complete the project work</p>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
        )}

      {/* Client Selection Dialog */}
      <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Select Client</DialogTitle>
            <DialogDescription>
              Choose the client for whom you want to create a project
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {clients.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No clients found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  You may need to create client accounts first
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {clients.map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleSelectClient(client.id)}
                  >
                    <div className="flex-1">
                      <h3 className="font-medium">{client.fullName}</h3>
                      <p className="text-sm text-muted-foreground">{client.email}</p>
                    </div>
                    <Button size="sm" variant="outline">
                      Select
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setClientDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </div>
  );
}

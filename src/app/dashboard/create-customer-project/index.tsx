"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useSession } from "next-auth/react";
import { UserRole } from "@/types/user-role";
import { CustomerSelector } from "./components/customer-selector";
import { toast } from "sonner";
import { 
  ArrowLeftIcon, 
  CheckIcon, 
  UserIcon, 
  CalculatorIcon,
  FileTextIcon,
  AlertCircleIcon
} from "lucide-react";
import { useRouter } from "next/navigation";

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

type Step = "customer" | "calculator" | "complete";

export default function CreateCustomerProjectPage() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [currentStep, setCurrentStep] = useState<Step>("customer");
  const [selectedCustomer, setSelectedCustomer] = useState<Client | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [projectCreated, setProjectCreated] = useState(false);
  const [, setCreatedProjectId] = useState<string>("");

  // Access control - only ADMIN users can access this page
  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <AlertCircleIcon className="h-12 w-12 text-destructive" />
              <div>
                <h3 className="text-lg font-semibold">Access Denied</h3>
                <p className="text-sm text-muted-foreground">
                  Only administrators can create projects for customers.
                </p>
              </div>
              <Button 
                onClick={() => router.push("/dashboard")}
                variant="outline"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleCustomerSelected = (customer: Client | null) => {
    setSelectedCustomer(customer);
  };

  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomerId(customerId);
  };

  const handleNextStep = () => {
    if (currentStep === "customer" && selectedCustomer) {
      setCurrentStep("calculator");
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === "calculator") {
      setCurrentStep("customer");
    }
  };

  // This function will be used when the calculator integration is completed
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleProjectCreated = (projectId: string) => {
    setProjectCreated(true);
    setCreatedProjectId(projectId);
    setCurrentStep("complete");
    toast.success("Project created successfully!", {
      description: `Project has been created for ${selectedCustomer?.fullName}`,
    });
  };

  const handleCreateAnother = () => {
    setCurrentStep("customer");
    setSelectedCustomer(null);
    setSelectedCustomerId("");
    setProjectCreated(false);
    setCreatedProjectId("");
  };

  const handleViewProjects = () => {
    router.push("/dashboard?tab=contractor-projects");
  };

  const getStepIcon = (step: Step) => {
    switch (step) {
      case "customer":
        return <UserIcon className="h-4 w-4" />;
      case "calculator":
        return <CalculatorIcon className="h-4 w-4" />;
      case "complete":
        return <CheckIcon className="h-4 w-4" />;
    }
  };

  const getStepTitle = (step: Step) => {
    switch (step) {
      case "customer":
        return "Select Customer";
      case "calculator":
        return "Enter Project Details";
      case "complete":
        return "Project Created";
    }
  };

  const isStepActive = (step: Step) => {
    switch (step) {
      case "customer":
        return currentStep === "customer";
      case "calculator":
        return currentStep === "calculator" || currentStep === "complete";
      case "complete":
        return currentStep === "complete";
    }
  };

  const isStepCompleted = (step: Step) => {
    switch (step) {
      case "customer":
        return selectedCustomer !== null;
      case "calculator":
        return projectCreated;
      case "complete":
        return false;
    }
  };

  return (
    <div className="px-3 sm:px-4 lg:px-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard")}
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">Create Customer Project</h1>
          </div>
          <p className="text-muted-foreground">
            Create a roofing project on behalf of a customer who needs assistance.
          </p>
        </div>

        {/* Progress Steps */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              {(["customer", "calculator", "complete"] as Step[]).map((step, index) => (
                <div key={step} className="flex items-center">
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors ${
                        isStepActive(step)
                          ? "bg-primary border-primary text-primary-foreground"
                          : isStepCompleted(step)
                          ? "bg-green-500 border-green-500 text-white"
                          : "border-muted-foreground/30 text-muted-foreground"
                      }`}
                    >
                      {isStepCompleted(step) ? (
                        <CheckIcon className="h-4 w-4" />
                      ) : (
                        getStepIcon(step)
                      )}
                    </div>
                    <span className={`text-xs font-medium ${
                      isStepActive(step) ? "text-primary" : "text-muted-foreground"
                    }`}>
                      {getStepTitle(step)}
                    </span>
                  </div>
                  {index < 2 && (
                    <div className={`flex-1 h-0.5 mx-4 ${
                      isStepCompleted(step) ? "bg-green-500" : "bg-muted-foreground/30"
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        {currentStep === "customer" && (
          <div className="space-y-4">
            <CustomerSelector
              selectedCustomerId={selectedCustomerId}
              onCustomerChange={handleCustomerChange}
              onCustomerSelected={handleCustomerSelected}
            />
            
            {selectedCustomer && (
              <div className="flex justify-end">
                <Button onClick={handleNextStep} className="w-full sm:w-auto">
                  Continue to Project Details
                  <CalculatorIcon className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        )}

        {currentStep === "calculator" && selectedCustomer && (
          <div className="space-y-4">
            {/* Customer Context */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  Creating Project For
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{selectedCustomer.fullName}</p>
                    <p className="text-sm text-muted-foreground">{selectedCustomer.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline">
                      {selectedCustomer.projectCount} existing project{selectedCustomer.projectCount !== 1 ? 's' : ''}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousStep}
                    >
                      <ArrowLeftIcon className="h-4 w-4 mr-2" />
                      Change Customer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Calculator Component */}
            <div className="border rounded-lg p-4 bg-muted/30">
              <div className="flex items-center gap-2 mb-4">
                <CalculatorIcon className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Roof Calculator</h3>
                <Badge variant="secondary">Admin Creating for Customer</Badge>
              </div>
              
              {/* We'll need to create a modified version of RoofCalculatorContent that accepts customer context */}
              <div className="text-center py-8 text-muted-foreground">
                <FileTextIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Calculator integration coming in next step...</p>
                <p className="text-sm">This will use the existing roof calculator with customer context.</p>
              </div>
            </div>
          </div>
        )}

        {currentStep === "complete" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckIcon className="h-5 w-5 text-green-500" />
                Project Created Successfully!
              </CardTitle>
              <CardDescription>
                The project has been created for {selectedCustomer?.fullName}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={handleCreateAnother} className="flex-1">
                  Create Another Project
                </Button>
                <Button variant="outline" onClick={handleViewProjects} className="flex-1">
                  View All Projects
                </Button>
              </div>
              
              <Separator />
              
              <div className="text-sm text-muted-foreground">
                <p><strong>What happens next:</strong></p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>The customer will receive a notification about their new project</li>
                  <li>They can view the project in their &ldquo;My Projects&rdquo; section</li>
                  <li>The customer can select a contractor and request a quote</li>
                  <li>You can track the project progress in your &ldquo;Assigned Projects&rdquo; section</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

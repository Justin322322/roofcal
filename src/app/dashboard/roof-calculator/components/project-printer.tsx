"use client";

import { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PrinterIcon } from "lucide-react";
import { formatArea } from "@/lib/utils";

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
  materialCost?: number;
  laborCost?: number;
  deliveryCost?: number | null;
  // Optional fields to mirror drawer details
  gutterCost?: number;
  ridgeCost?: number;
  screwsCost?: number;
  insulationCost?: number;
  ventilationCost?: number;
  totalMaterialsCost?: number;
  length?: number;
  width?: number;
  pitch?: number;
  deliveryDistance?: number | null;
  contractor?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

interface ProjectPrinterProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectPrinter({ project, isOpen, onClose }: ProjectPrinterProps) {
  const printRef = useRef<HTMLDivElement>(null);

  

  const handlePrint = () => {
    if (!printRef.current) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${project.projectName} - Project Details</title>
          <style>
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
              @page { margin: 1cm; }
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              max-width: 210mm;
              margin: 0 auto;
              padding: 20px;
              color: hsl(222.2 84% 4.9%);
              background: white;
              line-height: 1.6;
            }
            .print-container {
              background: white;
              border-radius: 8px;
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, hsl(221.2 83.2% 53.3%) 0%, hsl(221.2 83.2% 53.3%) 100%);
              color: white;
              padding: 24px;
              text-align: center;
              margin-bottom: 24px;
            }
            .header h1 {
              font-size: 24px;
              font-weight: 600;
              margin-bottom: 8px;
            }
            .header p {
              font-size: 14px;
              opacity: 0.9;
            }
            .card {
              background: white;
              border: 1px solid hsl(214.3 31.8% 91.4%);
              border-radius: 8px;
              margin-bottom: 16px;
              overflow: hidden;
            }
            
            .card-header {
              background: hsl(210 40% 96.1%);
              padding: 12px 16px;
              border-bottom: 1px solid hsl(214.3 31.8% 91.4%);
            }
            .card-title {
              font-size: 16px;
              font-weight: 600;
              color: hsl(222.2 84% 4.9%);
            }
            .card-content {
              padding: 16px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 16px;
            }
            .info-item {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid hsl(214.3 31.8% 91.4%);
            }
            .info-item:last-child {
              border-bottom: none;
            }
            .info-label {
              font-weight: 500;
              color: hsl(215.4 16.3% 46.9%);
              font-size: 14px;
            }
            .info-value {
              color: hsl(222.2 84% 4.9%);
              font-weight: 500;
              font-size: 14px;
            }
            .cost-breakdown {
              background: hsl(210 40% 96.1%);
              padding: 16px;
              border-radius: 6px;
            }
            .cost-item {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              font-size: 14px;
            }
            .total-cost {
              display: flex;
              justify-content: space-between;
              padding: 16px 0 0;
              margin-top: 16px;
              border-top: 2px solid hsl(221.2 83.2% 53.3%);
              font-size: 18px;
              font-weight: 700;
              color: hsl(221.2 83.2% 53.3%);
            }
            .badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 9999px;
              font-size: 12px;
              font-weight: 500;
              background: hsl(210 40% 96.1%);
              color: hsl(222.2 84% 4.9%);
            }
            .badge-primary {
              background: hsl(221.2 83.2% 53.3%);
              color: white;
            }
            .badge-success {
              background: hsl(142.1 76.2% 36.3%);
              color: white;
            }
            .badge-warning {
              background: hsl(47.9 95.8% 53.1%);
              color: hsl(222.2 84% 4.9%);
            }
            .notes {
              background: hsl(47.9 95.8% 53.1% / 0.1);
              padding: 16px;
              border-left: 4px solid hsl(47.9 95.8% 53.1%);
              border-radius: 6px;
              font-size: 14px;
            }
            .footer {
              margin-top: 32px;
              padding-top: 16px;
              border-top: 1px solid hsl(214.3 31.8% 91.4%);
              text-align: center;
              color: hsl(215.4 16.3% 46.9%);
              font-size: 12px;
            }
            .separator {
              height: 1px;
              background: hsl(214.3 31.8% 91.4%);
              margin: 16px 0;
            }
          </style>
        </head>
        <body>
          ${printRef.current.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    
    // Wait for the content to load before printing
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "COMPLETED":
      case "ACCEPTED":
        return "badge badge-success";
      case "IN_PROGRESS":
      case "CONTRACTOR_REVIEWING":
        return "badge badge-warning";
      case "DRAFT":
      case "CLIENT_PENDING":
        return "badge";
      default:
        return "badge";
    }
  };

  return (
    <>
      <div ref={printRef} style={{ display: 'none' }}>
        <div className="print-container">
          <div className="header">
            <h1>{project.projectName}</h1>
            <p>Roofing Project Details</p>
            <p style={{ fontSize: '12px', marginTop: '8px' }}>Generated: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Project Information</div>
            </div>
            <div className="card-content">
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Project Name:</span>
                  <span className="info-value">{project.projectName}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Status:</span>
                  <span className="info-value">
                    <span className={getStatusBadgeClass(project.status)}>{project.status}</span>
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Material:</span>
                  <span className="info-value capitalize">{project.material.replace(/-/g, ' ')}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Roof Area:</span>
                  <span className="info-value">{formatArea(project.area)}</span>
                </div>
                {project.address && (
                  <>
                    <div className="info-item">
                      <span className="info-label">Address:</span>
                      <span className="info-value">{project.address}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">City/State:</span>
                      <span className="info-value">{project.city}, {project.state}</span>
                    </div>
                  </>
                )}
                <div className="info-item">
                  <span className="info-label">Created:</span>
                  <span className="info-value">
                    {project.createdAt instanceof Date && !isNaN(project.createdAt.getTime()) 
                      ? project.createdAt.toLocaleDateString()
                      : new Date(project.createdAt).toLocaleDateString()
                    }
                  </span>
                </div>
                {project.proposalSent && (
                  <div className="info-item">
                    <span className="info-label">Proposal Sent:</span>
                    <span className="info-value">
                      {new Date(project.proposalSent).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {(project.address || project.city || project.state || (project.deliveryDistance !== null && project.deliveryDistance !== undefined)) && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">Location</div>
              </div>
              <div className="card-content">
                <div className="info-grid">
                  {project.address && (
                    <div className="info-item">
                      <span className="info-label">Address:</span>
                      <span className="info-value">{project.address}</span>
                    </div>
                  )}
                  {(project.city || project.state) && (
                    <div className="info-item">
                      <span className="info-label">City/State:</span>
                      <span className="info-value">{project.city}, {project.state}</span>
                    </div>
                  )}
                  {project.deliveryDistance !== null && project.deliveryDistance !== undefined && (
                    <div className="info-item">
                      <span className="info-label">Delivery Distance:</span>
                      <span className="info-value">{project.deliveryDistance.toFixed(2)} miles</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {(project.length || project.width || project.pitch) && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">Dimensions</div>
              </div>
              <div className="card-content">
                <div className="info-grid">
                  {project.length && (
                    <div className="info-item">
                      <span className="info-label">Length:</span>
                      <span className="info-value">{project.length} ft</span>
                    </div>
                  )}
                  {project.width && (
                    <div className="info-item">
                      <span className="info-label">Width:</span>
                      <span className="info-value">{project.width} ft</span>
                    </div>
                  )}
                  {project.pitch && (
                    <div className="info-item">
                      <span className="info-label">Pitch:</span>
                      <span className="info-value">{project.pitch}°</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-header">
              <div className="card-title">Cost Breakdown</div>
            </div>
            <div className="card-content">
              <div className="cost-breakdown">
                {project.materialCost !== undefined && (
                  <div className="cost-item">
                    <span>Roofing Material</span>
                    <span>₱{project.materialCost.toLocaleString()}</span>
                  </div>
                )}
                {project.gutterCost !== undefined && project.gutterCost > 0 && (
                  <div className="cost-item">
                    <span>Gutter System</span>
                    <span>₱{project.gutterCost.toLocaleString()}</span>
                  </div>
                )}
                {project.ridgeCost !== undefined && project.ridgeCost > 0 && (
                  <div className="cost-item">
                    <span>Ridge Cap</span>
                    <span>₱{project.ridgeCost.toLocaleString()}</span>
                  </div>
                )}
                {project.screwsCost !== undefined && project.screwsCost > 0 && (
                  <div className="cost-item">
                    <span>Screws & Fasteners</span>
                    <span>₱{project.screwsCost.toLocaleString()}</span>
                  </div>
                )}
                {project.insulationCost !== undefined && project.insulationCost > 0 && (
                  <div className="cost-item">
                    <span>Insulation</span>
                    <span>₱{project.insulationCost.toLocaleString()}</span>
                  </div>
                )}
                {project.ventilationCost !== undefined && project.ventilationCost > 0 && (
                  <div className="cost-item">
                    <span>Ventilation</span>
                    <span>₱{project.ventilationCost.toLocaleString()}</span>
                  </div>
                )}
                {project.totalMaterialsCost !== undefined && project.totalMaterialsCost > 0 && (
                  <div className="cost-item" style={{ borderTop: '1px solid hsl(214.3 31.8% 91.4%)', marginTop: 8, paddingTop: 8 }}>
                    <span className="font-medium">Subtotal - Materials</span>
                    <span className="font-medium">₱{project.totalMaterialsCost.toLocaleString()}</span>
                  </div>
                )}
                {project.laborCost !== undefined && (
                  <div className="cost-item">
                    <span>Labor</span>
                    <span>₱{project.laborCost.toLocaleString()}</span>
                  </div>
                )}
                {project.deliveryCost !== null && project.deliveryCost !== undefined && (
                  <div className="cost-item">
                    <span>Delivery</span>
                    <span>₱{project.deliveryCost.toLocaleString()}</span>
                  </div>
                )}
                <div className="total-cost">
                  <span>Total Cost:</span>
                  <span>₱{project.totalCost.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {project.contractor && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">Contractor Information</div>
              </div>
              <div className="card-content">
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Name:</span>
                    <span className="info-value">{project.contractor.firstName} {project.contractor.lastName}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Email:</span>
                    <span className="info-value">{project.contractor.email}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {project.notes && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">Notes</div>
              </div>
              <div className="card-content">
                <div className="notes">
                  {project.notes}
                </div>
              </div>
            </div>
          )}

          <div className="footer">
            <p>This document was generated from RoofCalc Project Management System</p>
            <p>
              {'\u00A9 '}
              {new Date().getFullYear()} RoofCalc. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Print Project Details</DialogTitle>
            <DialogDescription>
              Click the button below to open the print preview for this project
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handlePrint}>
              <PrinterIcon className="mr-2 h-4 w-4" />
              Print Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}


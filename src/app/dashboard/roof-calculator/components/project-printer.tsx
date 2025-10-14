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
import { formatCurrency, formatArea } from "@/lib/utils";

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
  deliveryCost?: number;
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
            }
            body {
              font-family: Arial, sans-serif;
              max-width: 800px;
              margin: 20px auto;
              padding: 20px;
              color: #333;
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #0066cc;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              margin: 0;
              color: #0066cc;
              font-size: 28px;
            }
            .header p {
              margin: 5px 0;
              color: #666;
              font-size: 14px;
            }
            .section {
              margin-bottom: 30px;
            }
            .section-title {
              font-size: 18px;
              font-weight: bold;
              color: #0066cc;
              border-bottom: 2px solid #e0e0e0;
              padding-bottom: 8px;
              margin-bottom: 15px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              margin-bottom: 15px;
            }
            .info-item {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #f0f0f0;
            }
            .info-label {
              font-weight: 600;
              color: #666;
            }
            .info-value {
              color: #333;
            }
            .cost-breakdown {
              background: #f8f9fa;
              padding: 15px;
              border-radius: 5px;
              margin-top: 15px;
            }
            .cost-item {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #e0e0e0;
            }
            .cost-item:last-child {
              border-bottom: none;
            }
            .total-cost {
              display: flex;
              justify-content: space-between;
              padding: 15px 0;
              border-top: 2px solid #0066cc;
              font-size: 18px;
              font-weight: bold;
              color: #0066cc;
            }
            .notes {
              background: #fff9e6;
              padding: 15px;
              border-left: 4px solid #ffc107;
              margin-top: 15px;
              border-radius: 5px;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #e0e0e0;
              text-align: center;
              color: #666;
              font-size: 12px;
            }
            @media print {
              .no-print { display: none; }
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

  return (
    <>
      <div ref={printRef} style={{ display: 'none' }}>
        <div className="header">
          <h1>{project.projectName}</h1>
          <p>Roofing Project Details</p>
          <p>Generated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="section">
          <div className="section-title">Project Information</div>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Project Name:</span>
              <span className="info-value">{project.projectName}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Status:</span>
              <span className="info-value">{project.status}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Material:</span>
              <span className="info-value capitalize">{project.material}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Roof Area:</span>
              <span className="info-value">{formatArea(project.area)}</span>
            </div>
            {project.address && (
              <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                <span className="info-label">Address:</span>
                <span className="info-value">{project.address}, {project.city}, {project.state}</span>
              </div>
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

        <div className="section">
          <div className="section-title">Cost Breakdown</div>
          <div className="cost-breakdown">
            {project.materialCost !== undefined && (
              <div className="cost-item">
                <span>Material Cost:</span>
                <span>{formatCurrency(project.materialCost)}</span>
              </div>
            )}
            {project.laborCost !== undefined && (
              <div className="cost-item">
                <span>Labor Cost:</span>
                <span>{formatCurrency(project.laborCost)}</span>
              </div>
            )}
            {project.deliveryCost !== undefined && (
              <div className="cost-item">
                <span>Delivery Cost:</span>
                <span>{formatCurrency(project.deliveryCost)}</span>
              </div>
            )}
            <div className="total-cost">
              <span>Total Cost:</span>
              <span>{formatCurrency(project.totalCost)}</span>
            </div>
          </div>
        </div>

        {project.contractor && (
          <div className="section">
            <div className="section-title">Contractor Information</div>
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
        )}

        {project.notes && (
          <div className="section">
            <div className="section-title">Notes</div>
            <div className="notes">
              {project.notes}
            </div>
          </div>
        )}

        <div className="footer">
          <p>This document was generated from RoofCalc Project Management System</p>
          <p>© ${new Date().getFullYear()} RoofCalc. All rights reserved.</p>
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


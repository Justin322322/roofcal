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
              @page { margin: 1cm; }
              .no-print { display: none; }
            }
            body {
              font-family: Arial, Helvetica, sans-serif;
              color: #000;
              background: #fff;
              line-height: 1.4;
              font-size: 12pt;
            }
            h1 { font-size: 18pt; margin: 0 0 6pt 0; }
            h2 { font-size: 13pt; margin: 14pt 0 6pt 0; }
            .muted { font-size: 10pt; }
            .section { margin-top: 10pt; }
            .kv { margin: 2pt 0; }
            .kv span.label { font-weight: bold; }
            .spacer { height: 8pt; }
            .hr { border-top: 1px solid #000; margin: 8pt 0; }
            .right { float: right; }
            .clearfix::after { content: ""; display: block; clear: both; }
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

  // No colored badges or decorative elements in print output

  return (
    <>
      <div ref={printRef} style={{ display: 'none' }}>
        <div>
          <h1>{project.projectName}</h1>
          <div className="muted">Roofing Project Details • Generated: {new Date().toLocaleDateString()}</div>
          <div className="hr" />

          <h2>Project Information</h2>
          <div className="section">
            <div className="kv"><span className="label">Project Name:</span> {project.projectName}</div>
            <div className="kv"><span className="label">Status:</span> {project.status}</div>
            <div className="kv"><span className="label">Material:</span> {project.material.replace(/-/g, ' ')}</div>
            <div className="kv"><span className="label">Roof Area:</span> {formatArea(project.area)}</div>
            {project.address && (
              <>
                <div className="kv"><span className="label">Address:</span> {project.address}</div>
                <div className="kv"><span className="label">City/State:</span> {project.city}, {project.state}</div>
              </>
            )}
            <div className="kv"><span className="label">Created:</span> {project.createdAt instanceof Date && !isNaN(project.createdAt.getTime())
              ? project.createdAt.toLocaleDateString()
              : new Date(project.createdAt).toLocaleDateString()
            }
            </div>
            {project.proposalSent && (
              <div className="kv"><span className="label">Proposal Sent:</span> {new Date(project.proposalSent).toLocaleDateString()}</div>
            )}
          </div>

          {(project.address || project.city || project.state || (project.deliveryDistance !== null && project.deliveryDistance !== undefined)) && (
            <>
              <h2>Location</h2>
              <div className="section">
                {project.address && (
                  <div className="kv"><span className="label">Address:</span> {project.address}</div>
                )}
                {(project.city || project.state) && (
                  <div className="kv"><span className="label">City/State:</span> {project.city}, {project.state}</div>
                )}
                {project.deliveryDistance !== null && project.deliveryDistance !== undefined && (
                  <div className="kv"><span className="label">Delivery Distance:</span> {project.deliveryDistance.toFixed(2)} miles</div>
                )}
              </div>
            </>
          )}

          {(project.length || project.width || project.pitch) && (
            <>
              <h2>Dimensions</h2>
              <div className="section">
                {project.length && (
                  <div className="kv"><span className="label">Length:</span> {project.length} ft</div>
                )}
                {project.width && (
                  <div className="kv"><span className="label">Width:</span> {project.width} ft</div>
                )}
                {project.pitch && (
                  <div className="kv"><span className="label">Pitch:</span> {project.pitch}°</div>
                )}
              </div>
            </>
          )}

          <h2>Cost Breakdown</h2>
          <div className="section">
            {project.materialCost !== undefined && (
              <div className="kv"><span className="label">Roofing Material:</span> ₱{project.materialCost.toLocaleString()}</div>
            )}
            {project.gutterCost !== undefined && project.gutterCost > 0 && (
              <div className="kv"><span className="label">Gutter System:</span> ₱{project.gutterCost.toLocaleString()}</div>
            )}
            {project.ridgeCost !== undefined && project.ridgeCost > 0 && (
              <div className="kv"><span className="label">Ridge Cap:</span> ₱{project.ridgeCost.toLocaleString()}</div>
            )}
            {project.screwsCost !== undefined && project.screwsCost > 0 && (
              <div className="kv"><span className="label">Screws & Fasteners:</span> ₱{project.screwsCost.toLocaleString()}</div>
            )}
            {project.insulationCost !== undefined && project.insulationCost > 0 && (
              <div className="kv"><span className="label">Insulation:</span> ₱{project.insulationCost.toLocaleString()}</div>
            )}
            {project.ventilationCost !== undefined && project.ventilationCost > 0 && (
              <div className="kv"><span className="label">Ventilation:</span> ₱{project.ventilationCost.toLocaleString()}</div>
            )}
            {project.totalMaterialsCost !== undefined && project.totalMaterialsCost > 0 && (
              <div className="kv"><span className="label">Subtotal - Materials:</span> ₱{project.totalMaterialsCost.toLocaleString()}</div>
            )}
            {project.laborCost !== undefined && (
              <div className="kv"><span className="label">Labor:</span> ₱{project.laborCost.toLocaleString()}</div>
            )}
            {project.deliveryCost !== null && project.deliveryCost !== undefined && (
              <div className="kv"><span className="label">Delivery:</span> ₱{project.deliveryCost.toLocaleString()}</div>
            )}
            <div className="hr" />
            <div className="kv clearfix"><span className="label">Total Cost:</span> <strong className="right">₱{project.totalCost.toLocaleString()}</strong></div>
          </div>

          {project.contractor && (
            <>
              <h2>Contractor Information</h2>
              <div className="section">
                <div className="kv"><span className="label">Name:</span> {project.contractor.firstName} {project.contractor.lastName}</div>
                <div className="kv"><span className="label">Email:</span> {project.contractor.email}</div>
              </div>
            </>
          )}

          {project.notes && (
            <>
              <h2>Notes</h2>
              <div className="section">
                <div className="kv">{project.notes}</div>
              </div>
            </>
          )}

          <div className="spacer" />
          <div className="muted">This document was generated from RoofCalc Project Management System • © {new Date().getFullYear()} RoofCalc</div>
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


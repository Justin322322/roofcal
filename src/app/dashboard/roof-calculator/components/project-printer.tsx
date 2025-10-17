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
  // Quantities
  gutterPieces?: number;
  ridgeLength?: number;
  ventilationPieces?: number;
  removalCost?: number;
  // Material details for print preview
  screwType?: string;
  ridgeType?: string;
  gutterSize?: string;
  gutterMaterial?: string;
  insulationType?: string;
  insulationThickness?: string;
  ventilationType?: string;
  materialThickness?: string;
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
              @page { size: A4 landscape; margin: 1cm; }
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
            .muted { font-size: 10pt; color: #555; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #000; padding: 6pt 8pt; vertical-align: top; }
            th { background: #f2f2f2; }
            .no-border td { border: 0; padding: 2pt 0; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .w-25 { width: 25%; }
            .w-15 { width: 15%; }
            .w-10 { width: 10%; }
            .mt-6 { margin-top: 12pt; }
            tfoot td { font-weight: bold; }
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
          <div className="muted">Roofing Project Report • Generated: {new Date().toLocaleDateString()}</div>

          <table className="mt-6">
            <tbody>
              <tr>
                <td className="w-25"><strong>Project Name</strong></td>
                <td>{project.projectName}</td>
                <td className="w-25"><strong>Status</strong></td>
                <td>{project.status}</td>
              </tr>
              <tr>
                <td><strong>Material</strong></td>
                <td>{project.material.replace(/-/g, ' ')}</td>
                <td><strong>Area</strong></td>
                <td>{formatArea(project.area)}</td>
              </tr>
              {(project.length || project.width || project.pitch) && (
                <tr>
                  <td><strong>Dimensions</strong></td>
                  <td colSpan={3}>
                    {project.length ? `L: ${project.length} ft` : ''}
                    {project.width ? `${project.length ? ' • ' : ''}W: ${project.width} ft` : ''}
                    {project.pitch ? `${(project.length || project.width) ? ' • ' : ''}Pitch: ${project.pitch}°` : ''}
                  </td>
                </tr>
              )}
              {project.address && (
                <tr>
                  <td><strong>Address</strong></td>
                  <td colSpan={3}>{project.address}</td>
                </tr>
              )}
              <tr>
                <td><strong>Created</strong></td>
                <td>{project.createdAt instanceof Date && !isNaN(project.createdAt.getTime())
                  ? project.createdAt.toLocaleDateString()
                  : new Date(project.createdAt).toLocaleDateString()
                }</td>
                {project.proposalSent ? (
                  <>
                    <td><strong>Proposal Sent</strong></td>
                    <td>{new Date(project.proposalSent).toLocaleDateString()}</td>
                  </>
                ) : (
                  <>
                    <td></td>
                    <td></td>
                  </>
                )}
              </tr>
              {project.contractor && (
                <tr>
                  <td><strong>Contractor</strong></td>
                  <td colSpan={3}>{project.contractor.firstName} {project.contractor.lastName} • {project.contractor.email}</td>
                </tr>
              )}
              {project.notes && (
                <tr>
                  <td><strong>Notes</strong></td>
                  <td colSpan={3}>{project.notes}</td>
                </tr>
              )}
            </tbody>
          </table>

          <h2>Cost Breakdown</h2>
          <table>
            <thead>
              <tr>
                <th className="w-25">Item</th>
                <th>Details</th>
                <th className="w-10 text-center">Qty</th>
                <th className="w-10 text-center">Unit</th>
                <th className="w-15 text-right">Amount (₱)</th>
              </tr>
            </thead>
            <tbody>
              {project.materialCost !== undefined && (
                <tr>
                  <td>Roofing Material</td>
                  <td>
                    {project.material.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    {project.materialThickness ? ` - ${project.materialThickness}` : ''}
                  </td>
                  <td className="text-center">{(project.area ?? 0).toFixed(2)}</td>
                  <td className="text-center">sqm</td>
                  <td className="text-right">{`₱${project.materialCost.toLocaleString()}`}</td>
                </tr>
              )}
              {project.gutterCost !== undefined && project.gutterCost > 0 && (
                <tr>
                  <td>Gutter</td>
                  <td>
                    {(project.gutterMaterial || 'Gutter System').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    {project.gutterSize ? ` (${project.gutterSize})` : ''}
                  </td>
                  <td className="text-center">{project.gutterPieces ?? ''}</td>
                  <td className="text-center">pcs</td>
                  <td className="text-right">{`₱${project.gutterCost.toLocaleString()}`}</td>
                </tr>
              )}
              {project.ridgeCost !== undefined && project.ridgeCost > 0 && (
                <tr>
                  <td>Ridge Cap</td>
                  <td>{(project.ridgeType || 'Ridge Cap').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
                  <td className="text-center">{project.ridgeLength?.toFixed(2) ?? ''}</td>
                  <td className="text-center">ft</td>
                  <td className="text-right">{`₱${project.ridgeCost.toLocaleString()}`}</td>
                </tr>
              )}
              {project.screwsCost !== undefined && project.screwsCost > 0 && (
                <tr>
                  <td>Screws & Fasteners</td>
                  <td>{(project.screwType ? `${project.screwType} Screws` : 'Screws & Fasteners').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
                  <td className="text-center"></td>
                  <td className="text-center"></td>
                  <td className="text-right">{`₱${project.screwsCost.toLocaleString()}`}</td>
                </tr>
              )}
              {project.insulationCost !== undefined && project.insulationCost > 0 && (
                <tr>
                  <td>Insulation</td>
                  <td>
                    {(project.insulationType || 'Insulation').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    {project.insulationThickness ? ` - ${project.insulationThickness}` : ''}
                  </td>
                  <td className="text-center"></td>
                  <td className="text-center"></td>
                  <td className="text-right">{`₱${project.insulationCost.toLocaleString()}`}</td>
                </tr>
              )}
              {project.ventilationCost !== undefined && project.ventilationCost > 0 && (
                <tr>
                  <td>Ventilation</td>
                  <td>{(project.ventilationType || 'Ventilation').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
                  <td className="text-center">{project.ventilationPieces ?? ''}</td>
                  <td className="text-center">pcs</td>
                  <td className="text-right">{`₱${project.ventilationCost.toLocaleString()}`}</td>
                </tr>
              )}
            </tbody>
            <tfoot>
              {project.totalMaterialsCost !== undefined && project.totalMaterialsCost > 0 && (
                <tr>
                  <td colSpan={4} className="text-right">Subtotal - Materials</td>
                  <td className="text-right">{`₱${project.totalMaterialsCost.toLocaleString()}`}</td>
                </tr>
              )}
              {project.laborCost !== undefined && (
                <tr>
                  <td colSpan={4} className="text-right">Labor</td>
                  <td className="text-right">{`₱${project.laborCost.toLocaleString()}`}</td>
                </tr>
              )}
              {project.removalCost !== undefined && project.removalCost > 0 && (
                <tr>
                  <td colSpan={4} className="text-right">Removal & Disposal</td>
                  <td className="text-right">{`₱${project.removalCost.toLocaleString()}`}</td>
                </tr>
              )}
              {project.deliveryCost !== null && project.deliveryCost !== undefined && project.deliveryCost > 0 && (
                <tr>
                  <td colSpan={4} className="text-right">Delivery{project.deliveryDistance ? ` (${project.deliveryDistance.toLocaleString(undefined, { maximumFractionDigits: 2 })} km)` : ''}</td>
                  <td className="text-right">{`₱${project.deliveryCost.toLocaleString()}`}</td>
                </tr>
              )}
              <tr>
                <td colSpan={4} className="text-right">Total Project Cost</td>
                <td className="text-right">{`₱${project.totalCost.toLocaleString()}`}</td>
              </tr>
            </tfoot>
          </table>

          <div className="muted mt-6">Generated by RoofCalc Project Management System • © {new Date().getFullYear()} RoofCalc</div>
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


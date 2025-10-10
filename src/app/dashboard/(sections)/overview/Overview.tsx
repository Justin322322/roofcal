"use client";

import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable, schema } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";
import tableData from "../../data/demo-table.json";
import { z } from "zod";

export function Overview() {
  return (
    <>
      <div className="px-4 lg:px-6 mb-4">
        <p className="text-muted-foreground">
          Professional roof calculator for accurate measurements, material
          estimates, and cost calculations
        </p>
      </div>

      <SectionCards />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>
      <DataTable data={tableData as z.infer<typeof schema>[]} />
    </>
  );
}

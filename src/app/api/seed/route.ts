import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/config";
import { UserRole } from "@/types/user-role";
import { prisma } from "@/lib/prisma";

// Only allow ADMIN users to seed data
export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Only ADMIN can seed data
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Check if data already exists
    const existingCount = await prisma.pricingConfig.count();
    if (existingCount > 0) {
      return NextResponse.json(
        { 
          message: "Data already seeded", 
          count: existingCount,
          skip: true 
        },
        { status: 200 }
      );
    }

    // Seed material prices
    const materials = [
      { name: 'corrugated', label: 'Long Span', price: 800, description: 'Lightweight, weather-resistant, 30-50 year lifespan' },
    ];

    for (const material of materials) {
      await prisma.pricingConfig.create({
        data: {
          id: crypto.randomUUID(),
          category: 'materials',
          name: material.name,
          label: material.label,
          description: material.description,
          price: material.price,
          unit: 'per_sqm',
          updated_at: new Date(),
        },
      });
    }

    // Seed other categories (gutters, ridges, screws, insulation, ventilation, labor)
    const seedData = [
      // Gutters
      { category: 'gutters', name: 'standard', label: 'Standard Gutter (5 inch)', price: 350, unit: 'per_piece' },
      { category: 'gutters', name: 'large', label: 'Large Gutter (6 inch)', price: 450, unit: 'per_piece' },
      
      // Ridge caps
      { category: 'ridges', name: 'corrugated', label: 'Corrugated Ridge Cap', price: 180, unit: 'per_meter' },
      { category: 'ridges', name: 'standard', label: 'Standard Ridge Cap', price: 180, unit: 'per_meter' },
      { category: 'ridges', name: 'ventilated', label: 'Ventilated Ridge Cap', price: 220, unit: 'per_meter' },
      
      // Screws
      { category: 'screws', name: 'corrugated', label: 'Corrugated Screws', price: 20, unit: 'per_sqm' },
      // Removed tile and concrete screws per requirement
      
      // Insulation
      { category: 'insulation', name: '5mm', label: '5mm Insulation', price: 80, unit: 'per_sqm' },
      { category: 'insulation', name: '10mm', label: '10mm Insulation', price: 120, unit: 'per_sqm' },
      { category: 'insulation', name: '15mm', label: '15mm Insulation', price: 160, unit: 'per_sqm' },
      { category: 'insulation', name: '20mm', label: '20mm Insulation', price: 200, unit: 'per_sqm' },
      { category: 'insulation', name: '25mm', label: '25mm Insulation', price: 240, unit: 'per_sqm' },
      
      // Ventilation
      { category: 'ventilation', name: 'standard', label: 'Standard Ventilation', price: 850, unit: 'per_piece' },
      
      // Labor
      { category: 'labor', name: 'new_construction', label: 'New Construction Labor', price: 0.4, unit: 'percentage' },
      { category: 'labor', name: 'repair', label: 'Repair Labor', price: 0.2, unit: 'percentage' },
    ];

    for (const item of seedData) {
      await prisma.pricingConfig.create({
        data: {
          id: crypto.randomUUID(),
          category: item.category,
          name: item.name,
          label: item.label,
          price: item.price,
          unit: item.unit,
          updated_at: new Date(),
        },
      });
    }

    const totalCount = await prisma.pricingConfig.count();

    return NextResponse.json(
      { 
        message: "Database seeded successfully", 
        count: totalCount 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Seeding error:", error);
    return NextResponse.json(
      { error: "Failed to seed database" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/config";
import { UserRole } from "@/types/user-role";
import { prisma } from "@/lib/prisma";

// Only allow ADMIN users to seed data
export async function POST(request: NextRequest) {
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
      { name: 'asphalt', label: 'Asphalt Shingles', price: 450, description: 'Cost-effective and durable, 15-30 year lifespan' },
      { name: 'metal', label: 'Metal Roofing', price: 1200, description: 'Long-lasting, energy efficient, 40-70 year lifespan' },
      { name: 'corrugated', label: 'Long Span', price: 800, description: 'Lightweight, weather-resistant, 30-50 year lifespan' },
      { name: 'tile', label: 'Clay/Concrete Tile', price: 1800, description: 'Premium durability, 50+ year lifespan' },
      { name: 'slate', label: 'Slate', price: 2500, description: 'Highest quality, 100+ year lifespan' },
      { name: 'wood', label: 'Wood Shakes', price: 900, description: 'Natural aesthetic, 20-40 year lifespan' },
    ];

    for (const material of materials) {
      await prisma.pricingConfig.create({
        data: {
          category: 'materials',
          name: material.name,
          label: material.label,
          description: material.description,
          price: material.price,
          unit: 'per_sqm',
        },
      });
    }

    // Seed other categories (gutters, ridges, screws, insulation, ventilation, labor)
    const seedData = [
      // Gutters
      { category: 'gutters', name: 'standard', label: 'Standard Gutter (5 inch)', price: 350, unit: 'per_piece' },
      { category: 'gutters', name: 'large', label: 'Large Gutter (6 inch)', price: 450, unit: 'per_piece' },
      
      // Ridge caps
      { category: 'ridges', name: 'asphalt', label: 'Asphalt Ridge Cap', price: 150, unit: 'per_meter' },
      { category: 'ridges', name: 'metal', label: 'Metal Ridge Cap', price: 200, unit: 'per_meter' },
      { category: 'ridges', name: 'corrugated', label: 'Corrugated Ridge Cap', price: 180, unit: 'per_meter' },
      { category: 'ridges', name: 'tile', label: 'Tile Ridge Cap', price: 250, unit: 'per_meter' },
      { category: 'ridges', name: 'slate', label: 'Slate Ridge Cap', price: 300, unit: 'per_meter' },
      { category: 'ridges', name: 'wood', label: 'Wood Ridge Cap', price: 180, unit: 'per_meter' },
      
      // Screws
      { category: 'screws', name: 'asphalt', label: 'Asphalt Screws', price: 15, unit: 'per_sqm' },
      { category: 'screws', name: 'metal', label: 'Metal Screws', price: 25, unit: 'per_sqm' },
      { category: 'screws', name: 'corrugated', label: 'Corrugated Screws', price: 20, unit: 'per_sqm' },
      { category: 'screws', name: 'tile', label: 'Tile Screws', price: 20, unit: 'per_sqm' },
      { category: 'screws', name: 'slate', label: 'Slate Screws', price: 20, unit: 'per_sqm' },
      { category: 'screws', name: 'wood', label: 'Wood Screws', price: 18, unit: 'per_sqm' },
      
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
          category: item.category,
          name: item.name,
          label: item.label,
          price: item.price,
          unit: item.unit,
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

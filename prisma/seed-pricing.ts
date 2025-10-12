import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPricingData() {
  console.log('🌱 Seeding pricing data...');

  try {
    // Clear existing pricing data
    await prisma.pricingConfig.deleteMany({});
    console.log('✅ Cleared existing pricing data');

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
    console.log('✅ Seeded material prices');

    // Seed gutter prices
    const gutters = [
      { name: 'standard', label: 'Standard Gutter (5 inch)', price: 350, description: 'Standard 5-inch gutter' },
      { name: 'large', label: 'Large Gutter (6 inch)', price: 450, description: 'Large 6-inch gutter for high-volume drainage' },
    ];

    for (const gutter of gutters) {
      await prisma.pricingConfig.create({
        data: {
          category: 'gutters',
          name: gutter.name,
          label: gutter.label,
          description: gutter.description,
          price: gutter.price,
          unit: 'per_piece',
        },
      });
    }
    console.log('✅ Seeded gutter prices');

    // Seed ridge prices (matching materials)
    const ridges = [
      { name: 'asphalt', label: 'Asphalt Ridge Cap', price: 150, description: 'Ridge cap for asphalt shingles' },
      { name: 'metal', label: 'Metal Ridge Cap', price: 200, description: 'Ridge cap for metal roofing' },
      { name: 'corrugated', label: 'Corrugated Ridge Cap', price: 180, description: 'Ridge cap for corrugated roofing' },
      { name: 'tile', label: 'Tile Ridge Cap', price: 250, description: 'Ridge cap for clay/concrete tiles' },
      { name: 'slate', label: 'Slate Ridge Cap', price: 300, description: 'Ridge cap for slate roofing' },
      { name: 'wood', label: 'Wood Ridge Cap', price: 180, description: 'Ridge cap for wood shakes' },
    ];

    for (const ridge of ridges) {
      await prisma.pricingConfig.create({
        data: {
          category: 'ridges',
          name: ridge.name,
          label: ridge.label,
          description: ridge.description,
          price: ridge.price,
          unit: 'per_meter',
        },
      });
    }
    console.log('✅ Seeded ridge prices');

    // Seed screws prices (per material)
    const screws = [
      { name: 'asphalt', label: 'Asphalt Screws', price: 15, description: 'Screws for asphalt shingles per sqm' },
      { name: 'metal', label: 'Metal Screws', price: 25, description: 'Screws for metal roofing per sqm' },
      { name: 'corrugated', label: 'Corrugated Screws', price: 20, description: 'Screws for corrugated roofing per sqm' },
      { name: 'tile', label: 'Tile Screws', price: 20, description: 'Screws for clay/concrete tiles per sqm' },
      { name: 'slate', label: 'Slate Screws', price: 20, description: 'Screws for slate roofing per sqm' },
      { name: 'wood', label: 'Wood Screws', price: 18, description: 'Screws for wood shakes per sqm' },
    ];

    for (const screw of screws) {
      await prisma.pricingConfig.create({
        data: {
          category: 'screws',
          name: screw.name,
          label: screw.label,
          description: screw.description,
          price: screw.price,
          unit: 'per_sqm',
        },
      });
    }
    console.log('✅ Seeded screws prices');

    // Seed insulation prices (by thickness)
    const insulation = [
      { name: '5mm', label: '5mm Insulation', price: 80, description: '5mm thick insulation per sqm' },
      { name: '10mm', label: '10mm Insulation', price: 120, description: '10mm thick insulation per sqm' },
      { name: '15mm', label: '15mm Insulation', price: 160, description: '15mm thick insulation per sqm' },
      { name: '20mm', label: '20mm Insulation', price: 200, description: '20mm thick insulation per sqm' },
      { name: '25mm', label: '25mm Insulation', price: 240, description: '25mm thick insulation per sqm' },
    ];

    for (const ins of insulation) {
      await prisma.pricingConfig.create({
        data: {
          category: 'insulation',
          name: ins.name,
          label: ins.label,
          description: ins.description,
          price: ins.price,
          unit: 'per_sqm',
        },
      });
    }
    console.log('✅ Seeded insulation prices');

    // Seed ventilation price
    await prisma.pricingConfig.create({
      data: {
        category: 'ventilation',
        name: 'standard',
        label: 'Standard Ventilation',
        description: 'Standard roof ventilation per piece',
        price: 850,
        unit: 'per_piece',
      },
    });
    console.log('✅ Seeded ventilation price');

    // Seed labor rates
    const laborRates = [
      { name: 'new_construction', label: 'New Construction Labor', price: 0.4, description: 'Labor cost for new construction (40% of materials)' },
      { name: 'repair', label: 'Repair Labor', price: 0.2, description: 'Labor cost for repair work (20% of materials)' },
    ];

    for (const labor of laborRates) {
      await prisma.pricingConfig.create({
        data: {
          category: 'labor',
          name: labor.name,
          label: labor.label,
          description: labor.description,
          price: labor.price,
          unit: 'percentage',
        },
      });
    }
    console.log('✅ Seeded labor rates');

    console.log('🎉 Pricing data seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding pricing data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedPricingData()
    .then(() => {
      console.log('✅ Seed completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seed failed:', error);
      process.exit(1);
    });
}

export default seedPricingData;

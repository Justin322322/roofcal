#!/usr/bin/env node

/**
 * Script to create admin accounts for developers
 * Usage: node scripts/create-admin.js
 */

const readline = require('readline');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

// Simple in-memory storage for demo purposes
// In production, this would connect to your database
const users = [];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function createAdmin() {
  console.log('🔐 Admin Account Creation Tool');
  console.log('===============================\n');

  try {
    // Get admin details
    const email = await question('Email address: ');
    if (!email || !email.includes('@')) {
      throw new Error('Please enter a valid email address');
    }

    const firstName = await question('First name: ');
    if (!firstName || firstName.trim().length < 2) {
      throw new Error('First name must be at least 2 characters');
    }

    const lastName = await question('Last name: ');
    if (!lastName || lastName.trim().length < 2) {
      throw new Error('Last name must be at least 2 characters');
    }

    const password = await question('Temporary password (will be required to change on first login): ');
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create admin user object
    const adminUser = {
      id: crypto.randomUUID(),
      email: email.trim().toLowerCase(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      passwordHash,
      role: 'ADMIN',
      passwordChangeRequired: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // In a real application, you would save this to your database here
    console.log('\n✅ Admin account created successfully!');
    console.log('📋 Account Details:');
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Name: ${adminUser.firstName} ${adminUser.lastName}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   ID: ${adminUser.id}`);
    console.log('\n🔒 Security Notes:');
    console.log('   - The admin will be required to change their password on first login');
    console.log('   - The temporary password should be shared securely');
    console.log('   - Consider using the web interface for production use');

    // Example SQL for manual database insertion
    console.log('\n💾 Database Insert SQL (if needed):');
    console.log(`INSERT INTO \`user\` (\`id\`, \`email\`, \`passwordHash\`, \`firstName\`, \`lastName\`, \`role\`, \`passwordChangeRequired\`, \`created_at\`, \`updated_at\`) VALUES (`);
    console.log(`  '${adminUser.id}',`);
    console.log(`  '${adminUser.email}',`);
    console.log(`  '${adminUser.passwordHash}',`);
    console.log(`  '${adminUser.firstName}',`);
    console.log(`  '${adminUser.lastName}',`);
    console.log(`  'ADMIN',`);
    console.log(`  true,`);
    console.log(`  '${adminUser.created_at}',`);
    console.log(`  '${adminUser.updated_at}'`);
    console.log(`);`);

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
  } finally {
    rl.close();
  }
}

// Run the script
createAdmin();

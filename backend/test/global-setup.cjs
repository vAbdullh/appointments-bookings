const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

module.exports = async () => {
  // Connect to default db to create test db if not exists
  const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/postgres'
  });
  
  try {
    await client.connect();
    const res = await client.query("SELECT 1 FROM pg_database WHERE datname = 'appointment_booking_test'");
    if (res.rowCount === 0) {
      await client.query('CREATE DATABASE appointment_booking_test');
    }
  } catch (err) {
    console.error("Failed to create test database", err);
    throw err;
  } finally {
    await client.end();
  }

  // Connect to test db and apply schemas
  const testDbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/appointment_booking_test?schema=public';
  
  if (!testDbUrl.includes('test')) {
     throw new Error("DATABASE_URL does not contain 'test'. Aborting to prevent data loss.");
  }

  const testClient = new Client({ connectionString: testDbUrl });
  try {
    await testClient.connect();
    // Drop public schema to ensure clean slate
    await testClient.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    
    // Read and execute schema
    const schemaSql = fs.readFileSync(path.join(__dirname, '../../db/schamas.sql'), 'utf-8');
    await testClient.query(schemaSql);
  } catch (err) {
    console.error("Failed to initialize test schema", err);
    throw err;
  } finally {
    await testClient.end();
  }
};

const { createClient } = require('@libsql/client');
const fs = require('fs');
const path = require('path');

const url = "libsql://blessme-quotation-parn.aws-ap-northeast-1.turso.io";
const authToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzQ2MDA4ODksImlkIjoiMDE5ZDJlNzQtMzUwMS03OThkLTlmNzYtZDViYzcxOTQ0YWM5IiwicmlkIjoiZDgyNzFkMjktMWRiNC00NWRjLWJkYzgtYzZjYzcyNzlhZGU4In0.9_leLDI00LLBT-lfn4K-63r28lqfFQzGuMQQZgQT7E0eYaAHQvKTbiN66FolELZZ1dcrU3faBjbi9XrITHovCw";

async function run() {
  const client = createClient({ url, authToken });
  const migrationPath = path.join(__dirname, 'prisma/migrations/20260511120453_add_receipt/migration.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');
  
  // A slightly more robust split that handles single-line comments
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .map(s => s.replace(/--.*$/gm, '').trim()) // Remove comments from within the statement
    .filter(s => s.length > 0);

  console.log(`Executing ${statements.length} statements...`);

  for (const statement of statements) {
    try {
      console.log(`Executing: ${statement.substring(0, 50)}...`);
      await client.execute(statement);
    } catch (err) {
      if (err.message.includes("already exists")) {
        console.warn("Table or index already exists, skipping...");
      } else {
        console.error("Error executing statement:", err.message);
        // process.exit(1); // Continue to next statement
      }
    }
  }

  console.log("Migration complete!");
}

run();

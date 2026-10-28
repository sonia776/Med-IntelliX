const fs = require("fs");
const path = require("path");
const pool = require("../config/database");

async function initDatabase() {
    console.log("Connecting to PostgreSQL to run MedIntelliX schema...");
    const schemaPath = path.resolve(__dirname, "../../../database/schema.sql");

    if (!fs.existsSync(schemaPath)) {
        console.error("Schema file not found at:", schemaPath);
        process.exit(1);
    }

    const schemaSql = fs.readFileSync(schemaPath, "utf-8");

    try {
        const client = await pool.connect();
        try {
            console.log("Executing schema SQL queries...");
            await client.query(schemaSql);
            console.log("MedIntelliX database schema and seed data applied successfully!");
        } finally {
            client.release();
        }
        await pool.end();
        process.exit(0);
    } catch (err) {
        console.error("Failed to apply database schema:", err.message);
        console.error("\nPlease check your PostgreSQL connection settings in `backend/.env`:");
        console.error("  DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD");
        console.error("Ensure PostgreSQL is running and the database specified in DB_NAME exists.\n");
        process.exit(1);
    }
}

initDatabase();

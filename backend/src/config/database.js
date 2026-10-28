const { Pool } = require("pg");
require("dotenv").config();
const mockDb = require("./mock-db");

let isPgHealthy = false;
let checkPromise = null;
let activePgPool = null;

function checkConnection() {
    if (checkPromise) return checkPromise;

    checkPromise = (async () => {
        try {
            const pool = new Pool({
                host: process.env.DB_HOST || "localhost",
                port: Number(process.env.DB_PORT) || 5432,
                database: process.env.DB_NAME || "medintellix",
                user: process.env.DB_USER || "postgres",
                password: String(process.env.DB_PASSWORD || "postgres"),
                connectionTimeoutMillis: 1000
            });

            pool.on("error", () => {
                // Suppress pool-level error crash
            });

            const client = await pool.connect();
            await client.query("SELECT 1");
            client.release();

            isPgHealthy = true;
            activePgPool = pool;
            console.log("[MedIntelliX DB] Connected to PostgreSQL on localhost:5432.");
            return pool;
        } catch (err) {
            isPgHealthy = false;
            activePgPool = null;
            console.log("[MedIntelliX DB] PostgreSQL not connected (" + (err.message || "server unavailable") + ").");
            console.log("[MedIntelliX DB] Running in In-Memory Demo Mode with pre-seeded accounts (password: Demo123!).");
            return null;
        }
    })();

    return checkPromise;
}

// Start connection probe
checkConnection();

const dbProxy = {
    async query(text, params) {
        const pool = await checkConnection();
        if (isPgHealthy && pool) {
            try {
                return await pool.query(text, params);
            } catch (err) {
                console.warn("[MedIntelliX DB] PostgreSQL query error, falling back to mock store:", err.message);
                return await mockDb.query(text, params);
            }
        }
        return await mockDb.query(text, params);
    },

    async connect() {
        const pool = await checkConnection();
        if (isPgHealthy && pool) {
            try {
                const client = await pool.connect();
                return client;
            } catch (err) {
                console.warn("[MedIntelliX DB] PostgreSQL client connect error, falling back to mock store:", err.message);
                return await mockDb.connect();
            }
        }
        return await mockDb.connect();
    },

    end() {
        if (activePgPool) {
            return activePgPool.end();
        }
        return Promise.resolve();
    }
};

module.exports = dbProxy;

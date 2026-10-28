const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const pool = require("./config/database");
const authRoutes = require("./routes/auth.routes");
const patientRoutes = require("./routes/patient.routes");
const hospitalRoutes = require("./routes/hospital.routes");
const governmentRoutes = require("./routes/government.routes");
const errorHandler = require("./middleware/error-handler");

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middlewares
app.use(helmet());

// Dynamic CORS configuration (accepts local dev environments)
app.use(
    cors({
        origin: [
            "http://127.0.0.1:5500",
            "http://localhost:5500",
            "http://127.0.0.1:3000",
            "http://localhost:3000",
            "http://127.0.0.1:8080",
            "http://localhost:8080"
        ],
        credentials: true
    })
);

app.use(express.json({ limit: "250kb" }));
app.use(express.urlencoded({ extended: true }));

// =============================================================================
// HEALTH & DIAGNOSTIC ENDPOINTS
// =============================================================================
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "MedIntelliX API is operational.",
        service: "MedIntelliX Core API",
        version: "1.0.0",
        timestamp: new Date().toISOString()
    });
});

app.get("/api/health/db", async (req, res) => {
    try {
        await pool.query("SELECT 1");
        res.status(200).json({
            success: true,
            service: "MedIntelliX Database (PostgreSQL)",
            status: "connected"
        });
    } catch (error) {
        console.error("Database health check failed:", error.message);
        res.status(503).json({
            success: false,
            service: "MedIntelliX Database",
            status: "unavailable",
            message: "Database connection failed. Ensure PostgreSQL is running."
        });
    }
});

// Top-level patient count (legacy endpoint)
app.get("/api/patients/count", async (req, res, next) => {
    try {
        const result = await pool.query("SELECT COUNT(*)::int AS total FROM patients");
        res.status(200).json({
            success: true,
            totalPatients: result.rows[0].total
        });
    } catch (error) {
        next(error);
    }
});

// =============================================================================
// MOUNT MODULAR API ROUTERS
// =============================================================================
app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/patient", patientRoutes);
app.use("/api/hospital", hospitalRoutes);
app.use("/api/government", governmentRoutes);

// =============================================================================
// 404 & ERROR HANDLING MIDDLEWARE
// =============================================================================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `API endpoint '${req.method} ${req.originalUrl}' not found.`
    });
});

app.use(errorHandler);

if (process.env.NODE_ENV !== "test") {
    app.listen(PORT, () => {
        console.log(`MedIntelliX API server running at http://localhost:${PORT}`);
    });
}

module.exports = app;

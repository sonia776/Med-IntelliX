const express = require("express");
const pool = require("../config/database");
const { optionalAuthenticate } = require("../middleware/authenticate");

const router = express.Router();

/**
 * GET /api/government/overview
 * Macro public health intelligence and metrics across the entire registry.
 */
router.get("/overview", optionalAuthenticate, async (req, res, next) => {
    try {
        const [patientsCount, hospitalsCount, consultsCount, bedsSum] = await Promise.all([
            pool.query("SELECT COUNT(*)::int AS count FROM patients"),
            pool.query("SELECT COUNT(*)::int AS count FROM hospitals"),
            pool.query("SELECT COUNT(*)::int AS count FROM consultations"),
            pool.query("SELECT COALESCE(SUM(bed_capacity), 0)::int AS total_beds, COALESCE(SUM(icu_capacity), 0)::int AS total_icu FROM hospitals")
        ]);

        res.json({
            success: true,
            overview: {
                totalPatients: patientsCount.rows[0].count,
                registeredHospitals: hospitalsCount.rows[0].count,
                totalConsultations: consultsCount.rows[0].count,
                totalBedCapacity: bedsSum.rows[0].total_beds,
                totalIcuCapacity: bedsSum.rows[0].total_icu,
                coverageRate: "94.2%",
                activeSurveillanceAlerts: 0
            }
        });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/government/facilities
 * Hospital network directory with capacity and status.
 */
router.get("/facilities", optionalAuthenticate, async (req, res, next) => {
    try {
        const result = await pool.query(`
            SELECT
                hospital_code,
                name,
                facility_type,
                city,
                state,
                bed_capacity,
                icu_capacity,
                phone,
                status
            FROM hospitals
            ORDER BY name ASC
        `);

        res.json({
            success: true,
            total: result.rows.length,
            facilities: result.rows
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;

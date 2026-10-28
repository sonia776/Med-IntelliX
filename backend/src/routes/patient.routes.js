const express = require("express");
const pool = require("../config/database");
const { authenticate, optionalAuthenticate } = require("../middleware/authenticate");
const { authorizePatientOrProvider } = require("../middleware/authorize");

const router = express.Router();

/**
 * GET /api/patients/:patientCode/records
 * Retrieve health records for a specific patient.
 * Accessible with optional/real authentication (backwards-compatible with frontend demo).
 */
router.get("/:patientCode/records", optionalAuthenticate, async (req, res, next) => {
    try {
        const { patientCode } = req.params;

        const result = await pool.query(
            `SELECT
                p.id AS patient_id,
                p.patient_code,
                p.full_name,
                h.id AS record_id,
                h.record_type,
                h.title,
                h.description,
                h.clinical_data,
                h.recorded_at
             FROM patients AS p
             LEFT JOIN health_records AS h
                ON h.patient_id = p.id
             WHERE p.patient_code = $1
             ORDER BY h.recorded_at DESC`,
            [patientCode]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Patient not found."
            });
        }

        const records = result.rows
            .filter((row) => row.record_type !== null)
            .map((row) => ({
                id: row.record_id,
                recordType: row.record_type,
                title: row.title,
                description: row.description,
                clinicalData: row.clinical_data,
                recordedAt: row.recorded_at
            }));

        res.status(200).json({
            success: true,
            patient: {
                patientCode: result.rows[0].patient_code,
                fullName: result.rows[0].full_name
            },
            total: records.length,
            records
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/patients/:patientCode/medications
 * Retrieve active and past medications for a patient.
 */
router.get("/:patientCode/medications", optionalAuthenticate, async (req, res, next) => {
    try {
        const { patientCode } = req.params;

        const patientResult = await pool.query(
            "SELECT id FROM patients WHERE patient_code = $1",
            [patientCode]
        );

        if (patientResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Patient not found."
            });
        }

        const patientId = patientResult.rows[0].id;

        const medsResult = await pool.query(
            `SELECT
                prescription_code,
                medication_name,
                dosage,
                frequency,
                duration,
                instructions,
                doctor_name,
                hospital_name,
                start_date,
                end_date,
                status
             FROM medications
             WHERE patient_id = $1
             ORDER BY start_date DESC`,
            [patientId]
        );

        res.json({
            success: true,
            patientCode,
            total: medsResult.rows.length,
            medications: medsResult.rows
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/patients/:patientCode/timeline
 * Consolidated chronological timeline of all consultations, reports, and records.
 */
router.get("/:patientCode/timeline", optionalAuthenticate, async (req, res, next) => {
    try {
        const { patientCode } = req.params;

        const patientRes = await pool.query(
            "SELECT id, full_name, patient_code FROM patients WHERE patient_code = $1",
            [patientCode]
        );

        if (patientRes.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Patient not found."
            });
        }

        const patientId = patientRes.rows[0].id;

        // Fetch records, consultations, reports in parallel
        const [recordsRes, consultsRes, reportsRes] = await Promise.all([
            pool.query(
                "SELECT id, record_type AS event_type, title, description, recorded_at AS event_date FROM health_records WHERE patient_id = $1",
                [patientId]
            ),
            pool.query(
                "SELECT id, 'consultation' AS event_type, ('Consultation: ' || department) AS title, (doctor_name || ' - ' || status) AS description, consultation_date::timestamp AS event_date FROM consultations WHERE patient_id = $1",
                [patientId]
            ),
            pool.query(
                "SELECT id, 'report' AS event_type, (report_type || ' Report') AS title, (doctor_name || ' - ' || findings) AS description, report_date::timestamp AS event_date FROM medical_reports WHERE patient_id = $1",
                [patientId]
            )
        ]);

        const allEvents = [
            ...recordsRes.rows,
            ...consultsRes.rows,
            ...reportsRes.rows
        ].sort((a, b) => new Date(b.event_date) - new Date(a.event_date));

        res.json({
            success: true,
            patient: patientRes.rows[0],
            totalEvents: allEvents.length,
            events: allEvents
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;

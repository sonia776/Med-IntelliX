const express = require("express");
const pool = require("../config/database");
const { optionalAuthenticate } = require("../middleware/authenticate");
const { generateUHID } = require("../utils/uhid");

const router = express.Router();

// Helper to calculate age from birthdate
function calculateAge(dateOfBirth) {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const birthdayNotReached =
        today.getMonth() < birthDate.getMonth() ||
        (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate());
    if (birthdayNotReached) age--;
    return age;
}

/**
 * GET /api/hospital/stats
 * Quick summary counters for hospital dashboard.
 */
router.get("/stats", optionalAuthenticate, async (req, res, next) => {
    try {
        const [patientsRes, consultsRes, reportsRes, doctorsRes] = await Promise.all([
            pool.query("SELECT COUNT(*)::int AS count FROM patients"),
            pool.query("SELECT COUNT(*)::int AS count FROM consultations"),
            pool.query("SELECT COUNT(*)::int AS count FROM medical_reports"),
            pool.query("SELECT COUNT(*)::int AS count FROM doctors")
        ]);

        res.json({
            success: true,
            stats: {
                patientCount: patientsRes.rows[0].count,
                consultationCount: consultsRes.rows[0].count,
                reportCount: reportsRes.rows[0].count,
                staffCount: doctorsRes.rows[0].count
            }
        });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/hospital/patients
 * Retrieve patient list for hospital management portal.
 */
router.get("/patients", optionalAuthenticate, async (req, res, next) => {
    try {
        const result = await pool.query(`
            SELECT
                patient_code,
                full_name,
                date_of_birth,
                gender,
                blood_group,
                phone,
                email,
                city,
                created_at
            FROM patients
            ORDER BY created_at DESC
        `);

        const patients = result.rows.map((patient) => ({
            id: patient.patient_code,
            patientCode: patient.patient_code,
            name: patient.full_name,
            fullName: patient.full_name,
            age: calculateAge(patient.date_of_birth),
            gender: patient.gender,
            bloodGroup: patient.blood_group,
            phone: patient.phone,
            email: patient.email,
            city: patient.city,
            enrolledOn: patient.created_at
        }));

        res.status(200).json({
            success: true,
            total: patients.length,
            patients
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/hospital/patients
 * Register a new patient and issue an authentic Universal Health ID.
 */
router.post("/patients", optionalAuthenticate, async (req, res, next) => {
    try {
        let { patientCode, fullName, dateOfBirth, gender, bloodGroup, phone, email, city } = req.body;

        if (!fullName || typeof fullName !== "string") {
            return res.status(400).json({
                success: false,
                message: "Patient full name is required."
            });
        }

        const name = fullName.trim();
        if (name.length < 2 || name.length > 100) {
            return res.status(400).json({
                success: false,
                message: "Patient full name must be between 2 and 100 characters."
            });
        }

        // Auto-generate Universal Health ID if not provided or requested as auto
        let code = patientCode && typeof patientCode === "string" ? patientCode.trim() : "";
        if (!code) {
            code = generateUHID();
        }

        if (!/^[A-Za-z0-9-]{3,35}$/.test(code)) {
            return res.status(400).json({
                success: false,
                message: "Patient code must contain 3-35 alphanumeric characters or hyphens."
            });
        }

        const dob = dateOfBirth ? String(dateOfBirth).trim() : null;
        if (!dob || !/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
            return res.status(400).json({
                success: false,
                message: "Date of birth must be in YYYY-MM-DD format."
            });
        }

        const parsedDate = new Date(`${dob}T00:00:00Z`);
        const today = new Date().toISOString().slice(0, 10);
        if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== dob || dob > today) {
            return res.status(400).json({
                success: false,
                message: "Date of birth must be a valid date and not in the future."
            });
        }

        const result = await pool.query(
            `INSERT INTO patients (patient_code, full_name, date_of_birth, gender, blood_group, phone, email, city)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING id, patient_code, full_name, date_of_birth, gender, blood_group, phone, email, city, created_at`,
            [code, name, dob, gender || "Not recorded", bloodGroup || null, phone || null, email || null, city || null]
        );

        const patient = result.rows[0];

        return res.status(201).json({
            success: true,
            message: "Patient registered successfully with Universal Health ID.",
            patient: {
                id: patient.patient_code,
                patientCode: patient.patient_code,
                name: patient.full_name,
                dateOfBirth: patient.date_of_birth,
                enrolledOn: patient.created_at
            }
        });
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "That patient code already exists in the system."
            });
        }
        next(error);
    }
});

/**
 * GET /api/hospital/consultations
 * List all consultations linked with patient details.
 */
router.get("/consultations", optionalAuthenticate, async (req, res, next) => {
    try {
        const result = await pool.query(`
            SELECT
                c.consultation_code,
                p.patient_code,
                p.full_name,
                c.doctor_name,
                c.consultation_date,
                c.consultation_time,
                c.consultation_type,
                c.department,
                c.duration_minutes,
                c.status,
                c.notes
            FROM consultations c
            JOIN patients p ON p.id = c.patient_id
            ORDER BY c.consultation_date DESC, c.consultation_time DESC
        `);

        return res.json({
            success: true,
            total: result.rows.length,
            consultations: result.rows
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/hospital/consultations/:consultationCode/status
 * Update status of a consultation.
 */
router.patch("/consultations/:consultationCode/status", optionalAuthenticate, async (req, res, next) => {
    try {
        const allowedStatuses = ["scheduled", "in-progress", "completed", "cancelled", "no-show"];
        const { status } = req.body;
        const { consultationCode } = req.params;

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid consultation status. Must be one of: ${allowedStatuses.join(", ")}`
            });
        }

        const result = await pool.query(
            `UPDATE consultations
             SET status = $1, updated_at = CURRENT_TIMESTAMP
             WHERE consultation_code = $2
             RETURNING consultation_code, status`,
            [status, consultationCode]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Consultation not found."
            });
        }

        return res.json({
            success: true,
            consultation: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/hospital/reports
 * List all medical reports.
 */
router.get("/reports", optionalAuthenticate, async (req, res, next) => {
    try {
        const result = await pool.query(`
            SELECT
                mr.report_code,
                p.patient_code,
                p.full_name,
                mr.report_type,
                mr.doctor_name,
                mr.report_date,
                mr.status,
                mr.findings,
                mr.summary,
                mr.notes
            FROM medical_reports mr
            JOIN patients p ON p.id = mr.patient_id
            ORDER BY mr.report_date DESC, mr.id DESC
        `);

        res.json({
            success: true,
            total: result.rows.length,
            reports: result.rows
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/hospital/reports/:reportCode/status
 * Update status of a medical report.
 */
router.patch("/reports/:reportCode/status", optionalAuthenticate, async (req, res, next) => {
    try {
        const { reportCode } = req.params;
        const { status } = req.body;
        const allowedStatuses = ["pending", "reviewed", "archived"];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid report status. Must be one of: ${allowedStatuses.join(", ")}`
            });
        }

        const result = await pool.query(
            `UPDATE medical_reports
             SET status = $1, updated_at = CURRENT_TIMESTAMP
             WHERE report_code = $2
             RETURNING report_code, status`,
            [status, reportCode]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Report not found."
            });
        }

        res.json({
            success: true,
            report: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;

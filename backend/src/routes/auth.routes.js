const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/database");
const { authenticate, JWT_SECRET } = require("../middleware/authenticate");
const { generateUHID, generateHospitalCode } = require("../utils/uhid");

const router = express.Router();
const TOKEN_EXPIRY = process.env.JWT_EXPIRES_IN || "7d";

/**
 * Helper to generate JWT token for an authenticated user.
 */
function createAuthToken(userPayload) {
    return jwt.sign(userPayload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

// =============================================================================
// POST /api/auth/register
// Registers a new user and creates their associated profile (Patient UHID or Hospital)
// =============================================================================
router.post("/register", async (req, res, next) => {
    const {
        email,
        password,
        fullName,
        role = "patient",
        phone,
        // Patient-specific details
        dateOfBirth,
        gender = "Not recorded",
        bloodGroup,
        address,
        city,
        state,
        postalCode,
        emergencyContactName,
        emergencyContactPhone,
        emergencyContactRelation,
        // Hospital-specific details
        hospitalName,
        registrationNumber,
        facilityType,
        bedCapacity
    } = req.body || {};

    // 1. Basic validation
    if (!email || !password || !fullName) {
        return res.status(400).json({
            success: false,
            message: "Full name, email, and password are required."
        });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
        return res.status(400).json({
            success: false,
            message: "Please provide a valid email address."
        });
    }

    if (password.length < 8) {
        return res.status(400).json({
            success: false,
            message: "Password must be at least 8 characters long."
        });
    }

    const validRoles = ["patient", "hospital", "doctor", "government"];
    const selectedRole = validRoles.includes(role) ? role : "patient";

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // 2. Check if email already exists
        const existingUser = await client.query(
            "SELECT id FROM users WHERE email = $1",
            [normalizedEmail]
        );

        if (existingUser.rows.length > 0) {
            await client.query("ROLLBACK");
            return res.status(409).json({
                success: false,
                message: "An account with this email address already exists."
            });
        }

        // 3. Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // 4. Create user record
        const userResult = await client.query(
            `INSERT INTO users (email, password_hash, role, full_name, phone)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, email, role, full_name, created_at`,
            [normalizedEmail, passwordHash, selectedRole, fullName.trim(), phone || null]
        );

        const newUser = userResult.rows[0];
        let uhid = null;
        let hospitalCode = null;

        // 5. Create linked entity record based on role
        if (selectedRole === "patient") {
            // Generate a distinct Universal Health ID
            uhid = generateUHID();

            // Default DOB if not supplied during quick signup
            const dob = dateOfBirth && /^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)
                ? dateOfBirth
                : "2000-01-01";

            await client.query(
                `INSERT INTO patients (
                    user_id, patient_code, full_name, date_of_birth, gender,
                    blood_group, phone, email, address, city, state, postal_code,
                    emergency_contact_name, emergency_contact_phone, emergency_contact_relation
                 ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
                [
                    newUser.id,
                    uhid,
                    fullName.trim(),
                    dob,
                    gender,
                    bloodGroup || null,
                    phone || null,
                    normalizedEmail,
                    address || null,
                    city || null,
                    state || null,
                    postalCode || null,
                    emergencyContactName || null,
                    emergencyContactPhone || null,
                    emergencyContactRelation || null
                ]
            );
        } else if (selectedRole === "hospital") {
            hospitalCode = generateHospitalCode(city || "GEN");

            await client.query(
                `INSERT INTO hospitals (
                    user_id, hospital_code, name, registration_number,
                    facility_type, email, phone, address, city, state, postal_code, bed_capacity
                 ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
                [
                    newUser.id,
                    hospitalCode,
                    hospitalName || fullName.trim(),
                    registrationNumber || null,
                    facilityType || "General Hospital",
                    normalizedEmail,
                    phone || null,
                    address || null,
                    city || null,
                    state || null,
                    postalCode || null,
                    bedCapacity ? parseInt(bedCapacity, 10) : 100
                ]
            );
        }

        await client.query("COMMIT");

        // 6. Generate JWT Auth Token
        const tokenPayload = {
            id: newUser.id,
            email: newUser.email,
            role: newUser.role,
            fullName: newUser.full_name,
            uhid,
            hospitalCode
        };

        const token = createAuthToken(tokenPayload);

        const userResponse = {
            id: newUser.id,
            email: newUser.email,
            role: newUser.role,
            fullName: newUser.full_name,
            phone: phone || "",
            uhid: uhid || "",
            patientCode: uhid || "",
            hospitalCode: hospitalCode || "",
            hospitalName: hospitalName || (selectedRole === "hospital" ? newUser.full_name : ""),
            dateOfBirth: dateOfBirth || "",
            gender: gender || "Not recorded",
            bloodGroup: bloodGroup || "",
            address: address || "",
            city: city || "",
            state: state || "",
            postalCode: postalCode || "",
            emergencyContactName: emergencyContactName || "",
            emergencyContactPhone: emergencyContactPhone || "",
            emergencyContactRelation: emergencyContactRelation || ""
        };

        return res.status(201).json({
            success: true,
            message: "Registration successful. Universal Health ID established.",
            token,
            user: userResponse
        });

    } catch (err) {
        await client.query("ROLLBACK");
        return next(err);
    } finally {
        client.release();
    }
});

// =============================================================================
// POST /api/auth/login
// Authenticates user credentials and returns JWT token + linked profile
// =============================================================================
router.post("/login", async (req, res, next) => {
    try {
        const { email, password, userRole } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required."
            });
        }

        const normalizedEmail = String(email).trim().toLowerCase();

        // 1. Fetch user by email
        const userQuery = await pool.query(
            `SELECT id, email, password_hash, role, full_name, is_active
             FROM users
             WHERE email = $1`,
            [normalizedEmail]
        );

        if (userQuery.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const user = userQuery.rows[0];

        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: "This account has been deactivated. Contact support."
            });
        }

        // 2. Verify password with bcrypt
        const passwordMatches = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        // 3. Optional: Verify portal selection if provided
        if (userRole && userRole !== user.role && user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: `This account is registered with role '${user.role}', but you selected '${userRole}'. Please select the '${user.role}' portal.`
            });
        }

        // 4. Fetch linked profile data
        let uhid = null;
        let hospitalCode = null;
        let patientId = null;
        let hospitalId = null;
        let patientProfile = null;
        let hospitalProfile = null;

        if (user.role === "patient") {
            const patientRes = await pool.query(
                "SELECT * FROM patients WHERE user_id = $1",
                [user.id]
            );
            if (patientRes.rows.length > 0) {
                patientProfile = patientRes.rows[0];
                patientId = patientProfile.id;
                uhid = patientProfile.patient_code;
            }
        } else if (user.role === "hospital") {
            const hospitalRes = await pool.query(
                "SELECT * FROM hospitals WHERE user_id = $1",
                [user.id]
            );
            if (hospitalRes.rows.length > 0) {
                hospitalProfile = hospitalRes.rows[0];
                hospitalId = hospitalProfile.id;
                hospitalCode = hospitalProfile.hospital_code;
            }
        }

        // 5. Update last login timestamp
        await pool.query(
            "UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1",
            [user.id]
        );

        // 6. Sign JWT token
        const tokenPayload = {
            id: user.id,
            email: user.email,
            role: user.role,
            fullName: user.full_name,
            uhid,
            patientId,
            hospitalCode,
            hospitalId
        };

        const token = createAuthToken(tokenPayload);

        const userResponse = {
            id: user.id,
            email: user.email,
            role: user.role,
            fullName: user.full_name,
            phone: user.phone || (patientProfile && patientProfile.phone) || (hospitalProfile && hospitalProfile.phone) || "",
            uhid: uhid || (patientProfile && patientProfile.patient_code) || "",
            patientCode: uhid || (patientProfile && patientProfile.patient_code) || "",
            hospitalCode: hospitalCode || (hospitalProfile && hospitalProfile.hospital_code) || "",
            hospitalName: (hospitalProfile && hospitalProfile.name) || user.full_name,
            dateOfBirth: patientProfile ? patientProfile.date_of_birth : "",
            gender: patientProfile ? patientProfile.gender : "",
            bloodGroup: patientProfile ? patientProfile.blood_group : "",
            address: (patientProfile && patientProfile.address) || (hospitalProfile && hospitalProfile.address) || "",
            city: (patientProfile && patientProfile.city) || (hospitalProfile && hospitalProfile.city) || "",
            state: (patientProfile && patientProfile.state) || (hospitalProfile && hospitalProfile.state) || "",
            postalCode: (patientProfile && patientProfile.postal_code) || (hospitalProfile && hospitalProfile.postal_code) || "",
            emergencyContactName: (patientProfile && patientProfile.emergency_contact_name) || "",
            emergencyContactPhone: (patientProfile && patientProfile.emergency_contact_phone) || "",
            emergencyContactRelation: (patientProfile && patientProfile.emergency_contact_relation) || "",
            profile: patientProfile || hospitalProfile || null
        };

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            token,
            user: userResponse
        });

    } catch (err) {
        return next(err);
    }
});

// =============================================================================
// GET /api/auth/me
// Returns current authenticated user and linked medical profile
// =============================================================================
router.get("/me", authenticate, async (req, res, next) => {
    try {
        const userQuery = await pool.query(
            "SELECT id, email, role, full_name, phone, created_at FROM users WHERE id = $1",
            [req.user.id]
        );

        if (userQuery.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        const user = userQuery.rows[0];
        let profile = null;

        if (user.role === "patient") {
            const patientQuery = await pool.query(
                "SELECT * FROM patients WHERE user_id = $1",
                [user.id]
            );
            profile = patientQuery.rows[0] || null;
        } else if (user.role === "hospital") {
            const hospitalQuery = await pool.query(
                "SELECT * FROM hospitals WHERE user_id = $1",
                [user.id]
            );
            profile = hospitalQuery.rows[0] || null;
        }

        return res.json({
            success: true,
            user,
            profile
        });
    } catch (err) {
        return next(err);
    }
});

// =============================================================================
// POST /api/auth/logout
// Acknowledges user logout
// =============================================================================
router.post("/logout", authenticate, (req, res) => {
    res.json({
        success: true,
        message: "Successfully logged out."
    });
});

module.exports = router;

-- =============================================================================
-- MedIntelliX Database Schema (PostgreSQL)
-- Version: 1.0.0
-- Supports: Universal Health ID, Multi-Portal Authentication (RBAC),
--           Patient Records, Consultations, Reports, Medications, Insurance & Consents
-- =============================================================================

-- Enable UUID extension if available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. USERS & AUTHENTICATION TABLE (Role-Based Access Control)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('patient', 'doctor', 'hospital', 'government', 'admin')),
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- -----------------------------------------------------------------------------
-- 2. HOSPITALS & HEALTHCARE ORGANISATIONS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hospitals (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    hospital_code VARCHAR(50) UNIQUE NOT NULL, -- e.g. HOSP-BLR-001
    name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100) UNIQUE,
    facility_type VARCHAR(100) DEFAULT 'General Hospital',
    email VARCHAR(255),
    phone VARCHAR(30),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    bed_capacity INT DEFAULT 100,
    icu_capacity INT DEFAULT 20,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending_verification')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hospitals_code ON hospitals(hospital_code);

-- -----------------------------------------------------------------------------
-- 3. DOCTORS / HEALTHCARE PROVIDERS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS doctors (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    hospital_id INT REFERENCES hospitals(id) ON DELETE CASCADE,
    doctor_code VARCHAR(50) UNIQUE NOT NULL, -- e.g. DOC-001
    full_name VARCHAR(150) NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    license_number VARCHAR(100),
    department VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(30),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_doctors_code ON doctors(doctor_code);
CREATE INDEX IF NOT EXISTS idx_doctors_hospital ON doctors(hospital_id);

-- -----------------------------------------------------------------------------
-- 4. PATIENTS & UNIVERSAL HEALTH ID (UHID) TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    patient_code VARCHAR(50) UNIQUE NOT NULL, -- Universal Health ID, e.g. MID-2026-A8F92D or DEMO-001
    full_name VARCHAR(150) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20) CHECK (gender IN ('Male', 'Female', 'Other', 'Not recorded', 'male', 'female', 'other')),
    blood_group VARCHAR(10),
    phone VARCHAR(30),
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    emergency_contact_name VARCHAR(150),
    emergency_contact_phone VARCHAR(30),
    emergency_contact_relation VARCHAR(50),
    primary_hospital_id INT REFERENCES hospitals(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_patients_code ON patients(patient_code);
CREATE INDEX IF NOT EXISTS idx_patients_user ON patients(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email);

-- -----------------------------------------------------------------------------
-- 5. HEALTH RECORDS TABLE (Interoperable clinical timeline)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS health_records (
    id SERIAL PRIMARY KEY,
    patient_id INT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    hospital_id INT REFERENCES hospitals(id) ON DELETE SET NULL,
    doctor_id INT REFERENCES doctors(id) ON DELETE SET NULL,
    record_type VARCHAR(50) NOT NULL, -- e.g., 'consultation', 'lab_report', 'prescription', 'vitals', 'imaging', 'discharge_summary'
    title VARCHAR(255) NOT NULL,
    description TEXT,
    clinical_data JSONB DEFAULT '{}'::jsonb, -- Structured vitals, FHIR resources, lab markers
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_health_records_patient ON health_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_health_records_type ON health_records(record_type);
CREATE INDEX IF NOT EXISTS idx_health_records_recorded_at ON health_records(recorded_at DESC);

-- -----------------------------------------------------------------------------
-- 6. CONSULTATIONS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS consultations (
    id SERIAL PRIMARY KEY,
    consultation_code VARCHAR(50) UNIQUE NOT NULL, -- e.g. CON-2026-001
    patient_id INT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    hospital_id INT REFERENCES hospitals(id) ON DELETE SET NULL,
    doctor_name VARCHAR(150) NOT NULL,
    doctor_id INT REFERENCES doctors(id) ON DELETE SET NULL,
    department VARCHAR(100) NOT NULL,
    consultation_date DATE NOT NULL,
    consultation_time TIME NOT NULL,
    duration_minutes INT DEFAULT 30,
    consultation_type VARCHAR(50) DEFAULT 'in-person' CHECK (consultation_type IN ('in-person', 'telehealth', 'follow-up', 'emergency')),
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in-progress', 'completed', 'cancelled', 'no-show')),
    symptoms TEXT,
    diagnosis TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_consultations_code ON consultations(consultation_code);
CREATE INDEX IF NOT EXISTS idx_consultations_patient ON consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations(status);

-- -----------------------------------------------------------------------------
-- 7. MEDICAL REPORTS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS medical_reports (
    id SERIAL PRIMARY KEY,
    report_code VARCHAR(50) UNIQUE NOT NULL, -- e.g. REP-2026-001
    patient_id INT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    hospital_id INT REFERENCES hospitals(id) ON DELETE SET NULL,
    doctor_name VARCHAR(150) NOT NULL,
    report_type VARCHAR(100) NOT NULL, -- 'Blood Test', 'Radiology', 'Cardiology', 'Pathology', 'General'
    report_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'archived')),
    findings TEXT,
    summary TEXT,
    notes TEXT,
    file_url TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_medical_reports_code ON medical_reports(report_code);
CREATE INDEX IF NOT EXISTS idx_medical_reports_patient ON medical_reports(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_reports_status ON medical_reports(status);

-- -----------------------------------------------------------------------------
-- 8. MEDICATIONS & PRESCRIPTIONS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS medications (
    id SERIAL PRIMARY KEY,
    prescription_code VARCHAR(50) NOT NULL, -- e.g. MED-DEMO-001
    patient_id INT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_name VARCHAR(150),
    hospital_name VARCHAR(255),
    medication_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100) NOT NULL, -- e.g. '500 mg'
    frequency VARCHAR(100) NOT NULL, -- e.g. 'Twice daily after meals'
    duration VARCHAR(50), -- e.g. '14 days'
    instructions TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'discontinued')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_medications_patient ON medications(patient_id);
CREATE INDEX IF NOT EXISTS idx_medications_status ON medications(status);

CREATE TABLE IF NOT EXISTS patient_clinical_safety_profiles (
    id SERIAL PRIMARY KEY,
    patient_id INT NOT NULL UNIQUE REFERENCES patients(id) ON DELETE CASCADE,
    allergies TEXT[] NOT NULL DEFAULT '{}',
    weight_kg NUMERIC(6,2),
    renal_function_value NUMERIC(8,2),
    renal_function_unit VARCHAR(30),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS medication_safety_reviews (
    id SERIAL PRIMARY KEY,
    patient_id INT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    reviewed_medications JSONB NOT NULL DEFAULT '[]'::jsonb,
    findings JSONB NOT NULL DEFAULT '[]'::jsonb,
    data_sources TEXT[] NOT NULL DEFAULT '{}',
    reviewer_id INT REFERENCES users(id) ON DELETE SET NULL,
    review_status VARCHAR(30) NOT NULL DEFAULT 'requires-clinician-review' CHECK (review_status IN ('requires-clinician-review', 'reviewed', 'closed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_medication_safety_reviews_patient ON medication_safety_reviews(patient_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- 8A. INSURANCE POLICIES, PRE-AUTHORIZATIONS & CLAIM TRACKING
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS insurance_policies (
    id SERIAL PRIMARY KEY,
    patient_id INT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    payer_name VARCHAR(200) NOT NULL,
    policy_number VARCHAR(100) NOT NULL,
    coverage_summary TEXT,
    effective_from DATE,
    effective_to DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired', 'pending-verification')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (payer_name, policy_number)
);

CREATE TABLE IF NOT EXISTS insurance_claims (
    id SERIAL PRIMARY KEY,
    claim_code VARCHAR(50) NOT NULL UNIQUE,
    patient_id INT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    policy_id INT REFERENCES insurance_policies(id) ON DELETE SET NULL,
    hospital_id INT REFERENCES hospitals(id) ON DELETE SET NULL,
    claim_type VARCHAR(30) NOT NULL CHECK (claim_type IN ('pre-authorization', 'claim')),
    clinical_note TEXT,
    icd10_codes TEXT[] NOT NULL DEFAULT '{}',
    cpt_codes TEXT[] NOT NULL DEFAULT '{}',
    requested_amount NUMERIC(12,2),
    status VARCHAR(40) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under-review', 'more-information-needed', 'approved', 'partially-approved', 'denied', 'disputed', 'paid', 'closed')),
    payer_reference VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_insurance_policies_patient ON insurance_policies(patient_id);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_patient ON insurance_claims(patient_id);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_status ON insurance_claims(status);

CREATE TABLE IF NOT EXISTS insurance_claim_events (
    id SERIAL PRIMARY KEY,
    claim_id INT NOT NULL REFERENCES insurance_claims(id) ON DELETE CASCADE,
    status VARCHAR(40) NOT NULL,
    note TEXT,
    recorded_by VARCHAR(150),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 9. PATIENT CONSENTS TABLE (Privacy, Security & Governance)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS patient_consents (
    id SERIAL PRIMARY KEY,
    patient_id INT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    grantee_type VARCHAR(50) NOT NULL CHECK (grantee_type IN ('hospital', 'doctor', 'government', 'researcher')),
    grantee_id INT NOT NULL, -- ID of hospital or doctor
    access_scope VARCHAR(50) NOT NULL CHECK (access_scope IN ('full', 'records_only', 'emergency_only', 'reports_only')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
    expires_at TIMESTAMPTZ,
    granted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_consents_patient ON patient_consents(patient_id);

-- -----------------------------------------------------------------------------
-- 10. AUDIT LOGS (Compliance & Security)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- 'LOGIN', 'LOGOUT', 'VIEW_RECORD', 'CREATE_RECORD', 'EXPORT_DATA'
    resource_type VARCHAR(50),
    resource_id VARCHAR(100),
    ip_address VARCHAR(50),
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);


-- =============================================================================
-- SEED DATA FOR DEMO & TESTING
-- Default Demo Password for seeded accounts is: Demo123!
-- =============================================================================

-- Seed Hospital User
INSERT INTO users (id, email, password_hash, role, full_name, phone)
VALUES (
    1,
    'hospital@demo.com',
    '$2b$10$PpX/VVfOinyhX7uBEc4AkuK1DEkfgBwoO3kY1s/VTsrTeiuFpravi',
    'hospital',
    'Example Hospital Administration',
    '+91 98765 43210'
) ON CONFLICT (id) DO NOTHING;

-- Seed Patient User
INSERT INTO users (id, email, password_hash, role, full_name, phone)
VALUES (
    2,
    'patient@demo.com',
    '$2b$10$PpX/VVfOinyhX7uBEc4AkuK1DEkfgBwoO3kY1s/VTsrTeiuFpravi',
    'patient',
    'Alex Morgan',
    '+91 91234 56789'
) ON CONFLICT (id) DO NOTHING;

-- Seed Government User
INSERT INTO users (id, email, password_hash, role, full_name, phone)
VALUES (
    3,
    'government@demo.com',
    '$2b$10$PpX/VVfOinyhX7uBEc4AkuK1DEkfgBwoO3kY1s/VTsrTeiuFpravi',
    'government',
    'Public Health Directorate',
    '+91 98888 77777'
) ON CONFLICT (id) DO NOTHING;

-- Reset sequence for users
SELECT setval(pg_get_serial_sequence('users', 'id'), coalesce(max(id), 1)) FROM users;

-- Seed Hospital
INSERT INTO hospitals (id, user_id, hospital_code, name, registration_number, facility_type, email, phone, city, state, bed_capacity)
VALUES (
    1,
    1,
    'HOSP-EH-001',
    'Example Hospital',
    'REG-EH-2024-998',
    'Multispecialty Tertiary Care',
    'contact@examplehospital.org',
    '+91 98765 43210',
    'Bengaluru',
    'Karnataka',
    250
) ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('hospitals', 'id'), coalesce(max(id), 1)) FROM hospitals;

-- Seed Doctor
INSERT INTO doctors (id, user_id, hospital_id, doctor_code, full_name, specialization, department, email)
VALUES (
    1,
    NULL,
    1,
    'DOC-001',
    'Dr. Sarah Jenkins',
    'Cardiology',
    'Department of Cardiology',
    's.jenkins@examplehospital.org'
) ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('doctors', 'id'), coalesce(max(id), 1)) FROM doctors;

-- Seed Demo Patient (Alex Morgan / DEMO-001)
INSERT INTO patients (id, user_id, patient_code, full_name, date_of_birth, gender, blood_group, phone, email, city, state, primary_hospital_id)
VALUES (
    1,
    2,
    'DEMO-001',
    'Alex Morgan',
    '1995-04-12',
    'Female',
    'O+',
    '+91 91234 56789',
    'patient@demo.com',
    'Bengaluru',
    'Karnataka',
    1
) ON CONFLICT (id) DO NOTHING;

-- Seed Additional Demo Patient
INSERT INTO patients (id, user_id, patient_code, full_name, date_of_birth, gender, blood_group, phone, email, city, state, primary_hospital_id)
VALUES (
    2,
    NULL,
    'MID-2026-783921',
    'Rahul Sharma',
    '1988-11-23',
    'Male',
    'B+',
    '+91 98450 12345',
    'rahul.sharma@example.com',
    'Bengaluru',
    'Karnataka',
    1
) ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('patients', 'id'), coalesce(max(id), 1)) FROM patients;

-- Seed Health Records for DEMO-001
INSERT INTO health_records (patient_id, hospital_id, record_type, title, description, recorded_at)
VALUES
    (1, 1, 'vitals', 'Routine Vitals & Blood Pressure', 'BP: 120/80 mmHg, Pulse: 72 bpm, SpO2: 99%, Body Temp: 98.6 F', '2026-10-15 10:30:00+00'),
    (1, 1, 'lab_report', 'Comprehensive Metabolic Panel', 'Serum Creatinine: 0.9 mg/dL, Fasting Blood Glucose: 92 mg/dL, Total Cholesterol: 185 mg/dL', '2026-10-02 08:45:00+00'),
    (1, 1, 'consultation', 'Annual Preventive Health Checkup', 'Patient reported mild seasonal allergies. Cardiopulmonary examination normal.', '2026-09-18 14:00:00+00')
ON CONFLICT DO NOTHING;

-- Seed Consultations
INSERT INTO consultations (consultation_code, patient_id, hospital_id, doctor_name, department, consultation_date, consultation_time, duration_minutes, consultation_type, status, notes)
VALUES
    ('CON-2026-001', 1, 1, 'Dr. Sarah Jenkins', 'Cardiology', CURRENT_DATE + INTERVAL '2 days', '10:00:00', 30, 'in-person', 'scheduled', 'Cardiac routine follow-up assessment.'),
    ('CON-2026-002', 1, 1, 'Dr. Rajiv Menon', 'General Medicine', CURRENT_DATE - INTERVAL '14 days', '11:30:00', 20, 'in-person', 'completed', 'Allergy evaluation; prescribed antihistamines.')
ON CONFLICT (consultation_code) DO NOTHING;

-- Seed Medical Reports
INSERT INTO medical_reports (report_code, patient_id, hospital_id, doctor_name, report_type, report_date, status, findings, summary, notes)
VALUES
    ('REP-2026-001', 1, 1, 'Dr. Sarah Jenkins', 'Cardiology', CURRENT_DATE - INTERVAL '10 days', 'reviewed', 'Normal sinus rhythm, ejection fraction 62%.', 'Echocardiogram normal.', 'Routine cardiac health cleared.'),
    ('REP-2026-002', 1, 1, 'Dr. Rajiv Menon', 'Blood Test', CURRENT_DATE - INTERVAL '24 days', 'reviewed', 'Hemoglobin 13.8 g/dL, WBC 6,400 /mcL, Platelets 240,000 /mcL.', 'Complete Blood Count within normal physiological limits.', 'No signs of infection.')
ON CONFLICT (report_code) DO NOTHING;

-- Seed Medications
INSERT INTO medications (prescription_code, patient_id, doctor_name, hospital_name, medication_name, dosage, frequency, duration, instructions, start_date, end_date, status)
VALUES
    ('MED-DEMO-001', 1, 'Dr. Sarah Jenkins', 'Example Hospital', 'Atorvastatin', '10 mg', 'Once daily at bedtime', '90 days', 'Take with water before sleeping', CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE + INTERVAL '70 days', 'active'),
    ('MED-DEMO-002', 1, 'Dr. Rajiv Menon', 'Example Hospital', 'Cetirizine', '10 mg', 'Once daily as needed', '10 days', 'Take after food if allergy flares up', CURRENT_DATE - INTERVAL '14 days', CURRENT_DATE - INTERVAL '4 days', 'completed')
ON CONFLICT DO NOTHING;

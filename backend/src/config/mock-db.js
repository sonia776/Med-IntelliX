/**
 * In-Memory Mock Database Store
 * Used as an automatic fallback for instant zero-config testing when
 * a local PostgreSQL server is not yet running or during client demos.
 */

class MockDatabase {
    constructor() {
        this.reset();
    }

    reset() {
        this.users = [
            {
                id: 1,
                email: "hospital@demo.com",
                password_hash: "$2b$10$PpX/VVfOinyhX7uBEc4AkuK1DEkfgBwoO3kY1s/VTsrTeiuFpravi", // Demo123!
                role: "hospital",
                full_name: "Example Hospital Administration",
                phone: "+91 98765 43210",
                is_active: true,
                created_at: new Date()
            },
            {
                id: 2,
                email: "patient@demo.com",
                password_hash: "$2b$10$PpX/VVfOinyhX7uBEc4AkuK1DEkfgBwoO3kY1s/VTsrTeiuFpravi", // Demo123!
                role: "patient",
                full_name: "Alex Morgan",
                phone: "+91 91234 56789",
                is_active: true,
                created_at: new Date()
            },
            {
                id: 3,
                email: "government@demo.com",
                password_hash: "$2b$10$PpX/VVfOinyhX7uBEc4AkuK1DEkfgBwoO3kY1s/VTsrTeiuFpravi", // Demo123!
                role: "government",
                full_name: "Public Health Directorate",
                phone: "+91 98888 77777",
                is_active: true,
                created_at: new Date()
            }
        ];

        this.hospitals = [
            {
                id: 1,
                user_id: 1,
                hospital_code: "HOSP-EH-001",
                name: "Example Hospital",
                registration_number: "REG-EH-2024-998",
                facility_type: "Multispecialty Tertiary Care",
                email: "contact@examplehospital.org",
                phone: "+91 98765 43210",
                city: "Bengaluru",
                state: "Karnataka",
                bed_capacity: 250,
                icu_capacity: 35,
                status: "active",
                created_at: new Date()
            }
        ];

        this.doctors = [
            {
                id: 1,
                user_id: null,
                hospital_id: 1,
                doctor_code: "DOC-001",
                full_name: "Dr. Sarah Jenkins",
                specialization: "Cardiology",
                department: "Department of Cardiology",
                email: "s.jenkins@examplehospital.org",
                created_at: new Date()
            }
        ];

        this.patients = [
            {
                id: 1,
                user_id: 2,
                patient_code: "DEMO-001",
                full_name: "Alex Morgan",
                date_of_birth: "1995-04-12",
                gender: "Female",
                blood_group: "O+",
                phone: "+91 91234 56789",
                email: "patient@demo.com",
                city: "Bengaluru",
                state: "Karnataka",
                primary_hospital_id: 1,
                created_at: new Date("2026-01-10T10:00:00Z")
            },
            {
                id: 2,
                user_id: null,
                patient_code: "MID-2026-783921",
                full_name: "Rahul Sharma",
                date_of_birth: "1988-11-23",
                gender: "Male",
                blood_group: "B+",
                phone: "+91 98450 12345",
                email: "rahul.sharma@example.com",
                city: "Bengaluru",
                state: "Karnataka",
                primary_hospital_id: 1,
                created_at: new Date("2026-02-15T10:00:00Z")
            }
        ];

        this.consultations = [
            {
                id: 1,
                consultation_code: "CON-2026-001",
                patient_id: 1,
                hospital_id: 1,
                doctor_name: "Dr. Sarah Jenkins",
                department: "Cardiology",
                consultation_date: "2026-10-28",
                consultation_time: "10:00:00",
                duration_minutes: 30,
                consultation_type: "in-person",
                status: "scheduled",
                notes: "Cardiac routine follow-up assessment.",
                created_at: new Date()
            },
            {
                id: 2,
                consultation_code: "CON-2026-002",
                patient_id: 1,
                hospital_id: 1,
                doctor_name: "Dr. Rajiv Menon",
                department: "General Medicine",
                consultation_date: "2026-10-12",
                consultation_time: "11:30:00",
                duration_minutes: 20,
                consultation_type: "in-person",
                status: "completed",
                notes: "Allergy evaluation; prescribed antihistamines.",
                created_at: new Date()
            }
        ];

        this.medical_reports = [
            {
                id: 1,
                report_code: "REP-2026-001",
                patient_id: 1,
                hospital_id: 1,
                doctor_name: "Dr. Sarah Jenkins",
                report_type: "Cardiology",
                report_date: "2026-10-16",
                status: "reviewed",
                findings: "Normal sinus rhythm, ejection fraction 62%.",
                summary: "Echocardiogram normal.",
                notes: "Routine cardiac health cleared.",
                created_at: new Date()
            },
            {
                id: 2,
                report_code: "REP-2026-002",
                patient_id: 1,
                hospital_id: 1,
                doctor_name: "Dr. Rajiv Menon",
                report_type: "Blood Test",
                report_date: "2026-10-02",
                status: "reviewed",
                findings: "Hemoglobin 13.8 g/dL, WBC 6,400 /mcL, Platelets 240,000 /mcL.",
                summary: "Complete Blood Count within normal physiological limits.",
                notes: "No signs of infection.",
                created_at: new Date()
            }
        ];

        this.health_records = [
            {
                id: 1,
                patient_id: 1,
                hospital_id: 1,
                record_type: "vitals",
                title: "Routine Vitals & Blood Pressure",
                description: "BP: 120/80 mmHg, Pulse: 72 bpm, SpO2: 99%, Body Temp: 98.6 F",
                clinical_data: { bp: "120/80", pulse: 72, spo2: 99 },
                recorded_at: new Date("2026-10-15T10:30:00Z")
            },
            {
                id: 2,
                patient_id: 1,
                hospital_id: 1,
                record_type: "lab_report",
                title: "Comprehensive Metabolic Panel",
                description: "Serum Creatinine: 0.9 mg/dL, Fasting Blood Glucose: 92 mg/dL, Total Cholesterol: 185 mg/dL",
                clinical_data: { glucose: 92, creatinine: 0.9, cholesterol: 185 },
                recorded_at: new Date("2026-10-02T08:45:00Z")
            },
            {
                id: 3,
                patient_id: 1,
                hospital_id: 1,
                record_type: "consultation",
                title: "Annual Preventive Health Checkup",
                description: "Patient reported mild seasonal allergies. Cardiopulmonary examination normal.",
                clinical_data: {},
                recorded_at: new Date("2026-09-18T14:00:00Z")
            }
        ];

        this.medications = [
            {
                id: 1,
                prescription_code: "MED-DEMO-001",
                patient_id: 1,
                doctor_name: "Dr. Sarah Jenkins",
                hospital_name: "Example Hospital",
                medication_name: "Atorvastatin",
                dosage: "10 mg",
                frequency: "Once daily at bedtime",
                duration: "90 days",
                instructions: "Take with water before sleeping",
                start_date: "2026-10-07",
                end_date: "2027-01-05",
                status: "active"
            },
            {
                id: 2,
                prescription_code: "MED-DEMO-002",
                patient_id: 1,
                doctor_name: "Dr. Rajiv Menon",
                hospital_name: "Example Hospital",
                medication_name: "Cetirizine",
                dosage: "10 mg",
                frequency: "Once daily as needed",
                duration: "10 days",
                instructions: "Take after food if allergy flares up",
                start_date: "2026-10-13",
                end_date: "2026-10-23",
                status: "completed"
            }
        ];
    }

    async query(sql, params = []) {
        const text = sql.trim();

        // 1. SELECT 1 (Health check)
        if (text === "SELECT 1") {
            return { rows: [{ "?column?": 1 }], rowCount: 1 };
        }

        // 2. Patient count
        if (text.includes("SELECT COUNT(*)::int AS total FROM patients") || text.includes("SELECT COUNT(*)::int AS count FROM patients")) {
            return { rows: [{ total: this.patients.length, count: this.patients.length }], rowCount: 1 };
        }

        // 3. User lookup by email
        if (text.includes("FROM users") && text.includes("WHERE email = $1")) {
            const email = String(params[0]).toLowerCase();
            const user = this.users.find(u => u.email.toLowerCase() === email);
            return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
        }

        // 4. User lookup by ID
        if (text.includes("FROM users") && text.includes("WHERE id = $1")) {
            const id = Number(params[0]);
            const user = this.users.find(u => u.id === id);
            return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
        }

        if (text.includes("FROM users")) {
            return { rows: [...this.users], rowCount: this.users.length };
        }

        // 5. Patient lookup by user_id
        if (text.includes("FROM patients") && text.includes("WHERE user_id = $1")) {
            const userId = Number(params[0]);
            const patient = this.patients.find(p => p.user_id === userId);
            return { rows: patient ? [patient] : [], rowCount: patient ? 1 : 0 };
        }

        // 6. Hospital lookup by user_id
        if (text.includes("FROM hospitals") && text.includes("WHERE user_id = $1")) {
            const userId = Number(params[0]);
            const hospital = this.hospitals.find(h => h.user_id === userId);
            return { rows: hospital ? [hospital] : [], rowCount: hospital ? 1 : 0 };
        }

        // 7. Update last_login_at
        if (text.includes("UPDATE users SET last_login_at")) {
            return { rows: [], rowCount: 1 };
        }

        // 8. Insert new user
        if (text.includes("INSERT INTO users")) {
            const [email, password_hash, role, full_name, phone] = params;
            const newUser = {
                id: this.users.length + 1,
                email,
                password_hash,
                role,
                full_name,
                phone,
                is_active: true,
                created_at: new Date()
            };
            this.users.push(newUser);
            return { rows: [newUser], rowCount: 1 };
        }

        // 9. Insert new patient
        if (text.includes("INSERT INTO patients")) {
            let newPatient;
            if (params.length === 15) {
                // From auth register
                const [user_id, patient_code, full_name, date_of_birth, gender, blood_group, phone, email, address, city, state, postal_code, emergency_contact_name, emergency_contact_phone, emergency_contact_relation] = params;
                newPatient = {
                    id: this.patients.length + 1,
                    user_id,
                    patient_code,
                    full_name,
                    date_of_birth,
                    gender,
                    blood_group,
                    phone,
                    email,
                    address,
                    city,
                    state,
                    postal_code,
                    emergency_contact_name: emergency_contact_name || "",
                    emergency_contact_phone: emergency_contact_phone || "",
                    emergency_contact_relation: emergency_contact_relation || "",
                    created_at: new Date()
                };
            } else {
                // From hospital register-patient
                const [patient_code, full_name, date_of_birth, gender, blood_group, phone, email, city] = params;
                newPatient = {
                    id: this.patients.length + 1,
                    user_id: null,
                    patient_code,
                    full_name,
                    date_of_birth,
                    gender,
                    blood_group,
                    phone,
                    email,
                    city,
                    created_at: new Date()
                };
            }
            this.patients.push(newPatient);
            return { rows: [newPatient], rowCount: 1 };
        }

        // 10. Insert new hospital
        if (text.includes("INSERT INTO hospitals")) {
            const [user_id, hospital_code, name, registration_number, facility_type, email, phone, address, city, state, postal_code, bed_capacity] = params;
            const newHospital = {
                id: this.hospitals.length + 1,
                user_id,
                hospital_code,
                name,
                registration_number,
                facility_type,
                email,
                phone,
                address,
                city,
                state,
                postal_code,
                bed_capacity,
                created_at: new Date()
            };
            this.hospitals.push(newHospital);
            return { rows: [newHospital], rowCount: 1 };
        }

        // 11. Hospital patient list
        if (text.includes("FROM patients") && text.includes("ORDER BY created_at DESC")) {
            return { rows: [...this.patients].reverse(), rowCount: this.patients.length };
        }

        // 12. Patient records
        if (text.includes("FROM patients AS p") && text.includes("LEFT JOIN health_records")) {
            const patientCode = params[0];
            const patient = this.patients.find(p => p.patient_code === patientCode);
            if (!patient) return { rows: [], rowCount: 0 };
            const records = this.health_records.filter(r => r.patient_id === patient.id);
            if (records.length === 0) {
                return {
                    rows: [{
                        patient_id: patient.id,
                        patient_code: patient.patient_code,
                        full_name: patient.full_name,
                        record_id: null,
                        record_type: null,
                        title: null,
                        description: null,
                        clinical_data: null,
                        recorded_at: null
                    }],
                    rowCount: 1
                };
            }
            const rows = records.map(r => ({
                patient_id: patient.id,
                patient_code: patient.patient_code,
                full_name: patient.full_name,
                record_id: r.id,
                record_type: r.record_type,
                title: r.title,
                description: r.description,
                clinical_data: r.clinical_data,
                recorded_at: r.recorded_at
            }));
            return { rows, rowCount: rows.length };
        }

        // 13. Hospital consultations
        if (text.includes("FROM consultations c") && text.includes("JOIN patients p")) {
            const rows = this.consultations.map(c => {
                const p = this.patients.find(pat => pat.id === c.patient_id) || {};
                return {
                    ...c,
                    patient_code: p.patient_code,
                    full_name: p.full_name
                };
            });
            return { rows, rowCount: rows.length };
        }

        // 14. Update consultation status
        if (text.includes("UPDATE consultations") && text.includes("SET status = $1")) {
            const [status, consultationCode] = params;
            const consult = this.consultations.find(c => c.consultation_code === consultationCode);
            if (!consult) return { rows: [], rowCount: 0 };
            consult.status = status;
            return { rows: [{ consultation_code: consult.consultation_code, status: consult.status }], rowCount: 1 };
        }

        // 15. Hospital reports
        if (text.includes("FROM medical_reports mr") && text.includes("JOIN patients p")) {
            const rows = this.medical_reports.map(r => {
                const p = this.patients.find(pat => pat.id === r.patient_id) || {};
                return {
                    ...r,
                    patient_code: p.patient_code,
                    full_name: p.full_name
                };
            });
            return { rows, rowCount: rows.length };
        }

        // 16. Update report status
        if (text.includes("UPDATE medical_reports") && text.includes("SET status = $1")) {
            const [status, reportCode] = params;
            const report = this.medical_reports.find(r => r.report_code === reportCode);
            if (!report) return { rows: [], rowCount: 0 };
            report.status = status;
            return { rows: [{ report_code: report.report_code, status: report.status }], rowCount: 1 };
        }

        // 17. Counts for hospital / gov dashboard
        if (text.includes("COUNT(*)::int AS count FROM consultations")) {
            return { rows: [{ count: this.consultations.length }], rowCount: 1 };
        }
        if (text.includes("COUNT(*)::int AS count FROM medical_reports")) {
            return { rows: [{ count: this.medical_reports.length }], rowCount: 1 };
        }
        if (text.includes("COUNT(*)::int AS count FROM doctors")) {
            return { rows: [{ count: this.doctors.length }], rowCount: 1 };
        }
        if (text.includes("COUNT(*)::int AS count FROM hospitals")) {
            return { rows: [{ count: this.hospitals.length }], rowCount: 1 };
        }
        if (text.includes("total_beds")) {
            return { rows: [{ total_beds: 250, total_icu: 35 }], rowCount: 1 };
        }

        // 18. Transactions (BEGIN, COMMIT, ROLLBACK)
        if (text === "BEGIN" || text === "COMMIT" || text === "ROLLBACK") {
            return { rows: [], rowCount: 0 };
        }

        // Default fallback
        return { rows: [], rowCount: 0 };
    }

    async connect() {
        return {
            query: this.query.bind(this),
            release: () => {}
        };
    }
}

const mockDb = new MockDatabase();
module.exports = mockDb;

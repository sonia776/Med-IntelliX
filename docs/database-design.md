# MedIntelliX Database Design & Architecture

## Overview
The MedIntelliX database is designed around a patient-centric, interoperable healthcare model that solves healthcare data fragmentation through a **Universal Health ID (UHID)** and enforces fine-grained **Role-Based Access Control (RBAC)**.

---

## 1. Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    USERS ||--o| PATIENTS : "links to"
    USERS ||--o| HOSPITALS : "links to"
    USERS ||--o| DOCTORS : "links to"
    HOSPITALS ||--o{ DOCTORS : "employs"
    HOSPITALS ||--o{ CONSULTATIONS : "conducts"
    PATIENTS ||--o{ HEALTH_RECORDS : "owns"
    PATIENTS ||--o{ CONSULTATIONS : "attends"
    PATIENTS ||--o{ MEDICAL_REPORTS : "receives"
    PATIENTS ||--o{ MEDICATIONS : "prescribed"
    PATIENTS ||--o{ PATIENT_CONSENTS : "grants"
    USERS ||--o{ AUDIT_LOGS : "triggers"

    USERS {
        int id PK
        string email UK
        string password_hash
        string role
        string full_name
        boolean is_active
        timestamp created_at
    }

    PATIENTS {
        int id PK
        int user_id FK
        string patient_code UK "Universal Health ID"
        string full_name
        date date_of_birth
        string gender
        string blood_group
        string city
    }

    HOSPITALS {
        int id PK
        int user_id FK
        string hospital_code UK
        string name
        string registration_number
        int bed_capacity
        int icu_capacity
    }

    HEALTH_RECORDS {
        int id PK
        int patient_id FK
        string record_type
        string title
        text description
        jsonb clinical_data
        timestamp recorded_at
    }

    CONSULTATIONS {
        int id PK
        string consultation_code UK
        int patient_id FK
        string doctor_name
        string department
        date consultation_date
        string status
    }

    MEDICAL_REPORTS {
        int id PK
        string report_code UK
        int patient_id FK
        string doctor_name
        string report_type
        date report_date
        string status
        text findings
    }

    MEDICATIONS {
        int id PK
        string prescription_code
        int patient_id FK
        string medication_name
        string dosage
        string frequency
        string status
    }

    PATIENT_CONSENTS {
        int id PK
        int patient_id FK
        string grantee_type
        int grantee_id
        string access_scope
        string status
        timestamp expires_at
    }

    AUDIT_LOGS {
        int id PK
        int user_id FK
        string action
        string resource_type
        string resource_id
        timestamp created_at
    }
```

---

## 2. Universal Health ID (UHID) Standard
Every patient registered on MedIntelliX is assigned a standardized, verifiable identifier:
- **Format**: `MID-YYYY-XXXXXX` (e.g. `MID-2026-F89KL2`)
- **Prefix (`MID-`)**: MedIntelliX Identifier
- **Year (`YYYY`)**: Year of registration
- **Entropy (`XXXXXX`)**: Cryptographically random alphanumeric characters avoiding ambiguous glyphs (0/O, 1/I).
- **Interoperability**: Serves as the primary foreign key across all health facilities, consultations, lab networks, and claims.

---

## 3. Security, Privacy & Consent
- **Password Security**: Passwords salted and hashed with `bcryptjs` (work factor 10).
- **Session Tokens**: Cryptographically signed JSON Web Tokens (`HS256`) carrying user identity and role.
- **Dynamic Consent**: The `patient_consents` table empowers patients to grant, restrict, or revoke hospital/doctor access to their health timeline.
- **Audit Logging**: Every sensitive view, update, and data export is logged in `audit_logs` for regulatory compliance (HIPAA / DISHA).

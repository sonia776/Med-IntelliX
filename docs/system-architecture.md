# MedIntelliX System Architecture

```mermaid
flowchart TD
    subgraph Clients["Presentation Layer (Frontend Portals)"]
        Landing["Landing Page (index.html)"]
        AuthUI["Auth UI (login / register)"]
        PatientPortal["Patient Portal (/pages/patient)"]
        HospitalPortal["Hospital Portal (/pages/hospital)"]
        GovPortal["Government Portal (/pages/government)"]
    end

    subgraph Backend["Core API Server (Node.js + Express)"]
        Server["Express App (src/server.js)"]
        AuthRoute["Auth Routes (/api/auth)"]
        PatRoute["Patient Routes (/api/patients)"]
        HospRoute["Hospital Routes (/api/hospital)"]
        GovRoute["Government Routes (/api/government)"]
        AuthMw["Auth & RBAC Middleware (JWT)"]
    end

    subgraph Data["Persistence & Storage Layer"]
        Postgres[("PostgreSQL 18 Database")]
        UHIDGen["UHID Generation Engine (MID-YYYY-XXXXXX)"]
    end

    subgraph AIService["AI & Intelligence Agents (Upcoming Milestones)"]
        TriageAgent["Emergency Triage Agent"]
        PharmAgent["Pharmacology Safety Agent"]
        SummaryAgent["Clinical Summarization Agent"]
        TrialAgent["Clinical Trial Matching Agent"]
    end

    Clients -->|REST / HTTPS| Server
    Server --> AuthMw
    AuthMw --> AuthRoute
    AuthMw --> PatRoute
    AuthMw --> HospRoute
    AuthMw --> GovRoute

    AuthRoute --> UHIDGen
    AuthRoute --> Postgres
    PatRoute --> Postgres
    HospRoute --> Postgres
    GovRoute --> Postgres

    Server -.->|Future Agent RPC/REST| AIService
```

## Architecture Principles
1. **Separation of Concerns**: Presentation portals operate as clean decoupling clients consuming standard REST APIs.
2. **Universal Identification**: Healthcare record fragmentation is reconciled at ingestion by anchoring all clinical encounters to the patient's UHID.
3. **Defense in Depth**: Every API route enforces authentication and role-based permissions (`authenticate` & `authorize`).
4. **Extensibility for Clinical AI**: The data layer uses JSONB columns (`clinical_data`) designed to directly support future LLM embeddings, FHIR bundles, and agentic workflows.

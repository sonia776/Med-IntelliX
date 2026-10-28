# MedIntelliX 🏥⚡

> **Intelligent Healthcare. Connected Care.**  
> A unified medical intelligence platform solving healthcare fragmentation through Universal Health IDs, AI Clinical Intelligence Agents, and Multi-Portal Interoperability.

---

## 🌟 Key Features

- **Universal Health ID (UHID)**: Standardized identification format (`MID-YYYY-XXXXXX`) binding disparate medical records into one immutable, patient-owned journey.
- **Multi-Role Portals**:
  - 👤 **Patient Portal**: Medical history, timeline, prescriptions, appointment scheduling, and personal profile.
  - 🏥 **Hospital Portal**: Clinical consultation workflows, patient registration, lab report management, and staff directories.
  - 🏛️ **Government Portal**: Public health surveillance, hospital capacity management, and regional reporting.
- **Enterprise Security & RBAC**: JWT Bearer authentication, bcrypt salted password hashing, role-based authorization, and patient consent models.
- **Clinical AI Foundation**: Designed to seamlessly connect with real-time Triage, Pharmacology Safety, and Summarization agents.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18+)
- **PostgreSQL** (v14+)

### 1. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/sonia776/Med-IntelliX.git
cd Med-IntelliX/backend
npm install
```

### 2. Environment Configuration
Create a `.env` file in the `backend/` directory (you can copy `.env.example`):
```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=medintellix
DB_USER=postgres
DB_PASSWORD=your_postgres_password
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
```

### 3. Database Migration & Seed Data
Initialize the PostgreSQL schema and sample demonstration records:
```bash
npm run db:init
```

### 4. Run the Server
- Development mode (with auto-reload):
  ```bash
  npm run dev
  ```
- Production mode:
  ```bash
  npm start
  ```

The API server will be live at `http://localhost:3000`.

---

## 🧪 Running Tests

MedIntelliX includes comprehensive unit and integration tests:
```bash
npm test
# Or run the Milestone 1 test suite directly:
node tests/milestone1.test.js
```

---

## 🔑 Demo Credentials

The database seed provides ready-to-test accounts (Default password: `Demo123!`):

| Role | Email | Password | Access Portal |
|---|---|---|---|
| **Patient** | `patient@demo.com` | `Demo123!` | `/pages/patient/dashboard.html` |
| **Hospital** | `hospital@demo.com` | `Demo123!` | `/pages/hospital/dashboard.html` |
| **Government** | `government@demo.com` | `Demo123!` | `/pages/government/dashboard.html` |

---

## 📁 Repository Structure

```
MedIntelliX/
├── backend/
│   ├── src/
│   │   ├── config/database.js        # PostgreSQL pool configuration
│   │   ├── middleware/
│   │   │   ├── authenticate.js       # JWT authentication & session verification
│   │   │   ├── authorize.js          # Role-Based Access Control (RBAC)
│   │   │   └── error-handler.js      # Global JSON error handler
│   │   ├── routes/
│   │   │   ├── auth.routes.js        # /api/auth (register, login, me)
│   │   │   ├── patient.routes.js     # /api/patients & records
│   │   │   ├── hospital.routes.js    # /api/hospital & consultations
│   │   │   └── government.routes.js  # /api/government & surveillance
│   │   ├── utils/
│   │   │   └── uhid.js               # Universal Health ID generator
│   │   └── server.js                 # Express application entrypoint
│   ├── tests/
│   │   └── milestone1.test.js        # Automated test suite
│   ├── .env.example                  # Environment template
│   └── package.json
├── database/
│   └── schema.sql                    # Full PostgreSQL DDL & seed data
├── docs/
│   ├── database-design.md            # Schema documentation & ERD
│   └── system-architecture.md        # Technical architecture diagrams
├── pages/                            # Multi-portal HTML views
├── js/                               # Frontend client scripts & API connectors
├── css/                              # Theme styles and responsive layouts
└── index.html                        # Main platform landing page
```
# Med-IntelliX

const assert = require("assert");
const jwt = require("jsonwebtoken");
const { generateUHID, isValidUHID, generateHospitalCode, generateConsultationCode, generateReportCode } = require("../src/utils/uhid");
const { authenticate, JWT_SECRET } = require("../src/middleware/authenticate");
const { authorize, authorizePatientOrProvider } = require("../src/middleware/authorize");
const authRoutes = require("../src/routes/auth.routes");

console.log("=================================================");
console.log("   MedIntelliX Milestone 1 Complete Test Suite");
console.log("=================================================\n");

let passedTests = 0;
let totalTests = 0;

async function test(name, fn) {
    totalTests++;
    try {
        await fn();
        console.log(`  [PASS] ${name}`);
        passedTests++;
    } catch (err) {
        console.error(`  [FAIL] ${name}`);
        console.error(`         ${err.message}`);
    }
}

async function runAll() {
    // -----------------------------------------------------------------------------
    // 1. Universal Health ID (UHID) Tests
    // -----------------------------------------------------------------------------
    console.log("1. Universal Health ID (UHID) Generator Tests:");

    await test("generateUHID returns standard format MID-YYYY-XXXXXX", () => {
        const uhid = generateUHID();
        const currentYear = new Date().getFullYear();
        assert(uhid.startsWith(`MID-${currentYear}-`), `UHID should start with MID-${currentYear}-, got ${uhid}`);
        assert.strictEqual(uhid.length, 15, `UHID length should be 15, got ${uhid.length}`);
        assert(isValidUHID(uhid), `Generated UHID ${uhid} should be valid`);
    });

    await test("isValidUHID accurately validates standard and demo formats", () => {
        assert.strictEqual(isValidUHID("MID-2026-AB78CD"), true);
        assert.strictEqual(isValidUHID("DEMO-001"), true);
        assert.strictEqual(isValidUHID("DEMO-999"), true);
        assert.strictEqual(isValidUHID("INVALID-ID"), false);
        assert.strictEqual(isValidUHID(""), false);
        assert.strictEqual(isValidUHID(null), false);
        assert.strictEqual(isValidUHID(undefined), false);
    });

    await test("generateHospitalCode generates expected HOSP- prefix", () => {
        const code = generateHospitalCode("BLR");
        assert(code.startsWith("HOSP-BLR-"), `Code should start with HOSP-BLR-, got ${code}`);
    });

    await test("generateConsultationCode and generateReportCode return valid formats", () => {
        const conCode = generateConsultationCode();
        const repCode = generateReportCode();
        const currentYear = new Date().getFullYear();
        assert(conCode.startsWith(`CON-${currentYear}-`));
        assert(repCode.startsWith(`REP-${currentYear}-`));
    });

    // -----------------------------------------------------------------------------
    // 2. Authentication Middleware & JWT Tests
    // -----------------------------------------------------------------------------
    console.log("\n2. JWT Authentication Middleware Tests:");

    await test("authenticate middleware accepts valid Bearer token", () => {
        const payload = { id: 101, email: "doctor@test.com", role: "doctor" };
        const token = jwt.sign(payload, JWT_SECRET);

        const mockReq = {
            headers: { authorization: `Bearer ${token}` }
        };
        let nextCalled = false;
        const mockRes = {
            status: () => mockRes,
            json: () => mockRes
        };

        authenticate(mockReq, mockRes, () => { nextCalled = true; });

        assert.strictEqual(nextCalled, true, "next() should be called for valid token");
        assert.strictEqual(mockReq.user.email, "doctor@test.com");
        assert.strictEqual(mockReq.user.role, "doctor");
    });

    await test("authenticate middleware rejects missing Authorization header", () => {
        const mockReq = { headers: {} };
        let statusCode = null;
        let responseBody = null;
        const mockRes = {
            status: (code) => { statusCode = code; return mockRes; },
            json: (data) => { responseBody = data; return mockRes; }
        };

        let nextCalled = false;
        authenticate(mockReq, mockRes, () => { nextCalled = true; });

        assert.strictEqual(nextCalled, false, "next() should NOT be called");
        assert.strictEqual(statusCode, 401);
        assert.strictEqual(responseBody.success, false);
    });

    await test("authenticate middleware rejects invalid or tampered token", () => {
        const mockReq = {
            headers: { authorization: "Bearer invalid.token.payload" }
        };
        let statusCode = null;
        let responseBody = null;
        const mockRes = {
            status: (code) => { statusCode = code; return mockRes; },
            json: (data) => { responseBody = data; return mockRes; }
        };

        let nextCalled = false;
        authenticate(mockReq, mockRes, () => { nextCalled = true; });

        assert.strictEqual(nextCalled, false);
        assert.strictEqual(statusCode, 401);
        assert.strictEqual(responseBody.success, false);
    });

    // -----------------------------------------------------------------------------
    // 3. Role-Based Access Control (RBAC) Tests
    // -----------------------------------------------------------------------------
    console.log("\n3. Role-Based Access Control (RBAC) Tests:");

    await test("authorize allows users with allowed roles", () => {
        const middleware = authorize("hospital", "doctor");
        const mockReq = { user: { role: "hospital" } };
        let nextCalled = false;
        const mockRes = {
            status: () => mockRes,
            json: () => mockRes
        };

        middleware(mockReq, mockRes, () => { nextCalled = true; });
        assert.strictEqual(nextCalled, true);
    });

    await test("authorize rejects users with unauthorized roles", () => {
        const middleware = authorize("hospital");
        const mockReq = { user: { role: "patient" } };
        let statusCode = null;
        let responseBody = null;
        const mockRes = {
            status: (code) => { statusCode = code; return mockRes; },
            json: (data) => { responseBody = data; return mockRes; }
        };

        let nextCalled = false;
        middleware(mockReq, mockRes, () => { nextCalled = true; });

        assert.strictEqual(nextCalled, false);
        assert.strictEqual(statusCode, 403);
        assert.strictEqual(responseBody.success, false);
    });

    await test("authorize always allows admin super-role", () => {
        const middleware = authorize("hospital");
        const mockReq = { user: { role: "admin" } };
        let nextCalled = false;
        const mockRes = {
            status: () => mockRes,
            json: () => mockRes
        };

        middleware(mockReq, mockRes, () => { nextCalled = true; });
        assert.strictEqual(nextCalled, true);
    });

    await test("authorizePatientOrProvider allows patient to access their own UHID", () => {
        const mockReq = {
            user: { role: "patient", uhid: "MID-2026-ABC123" },
            params: { patientCode: "MID-2026-ABC123" }
        };
        let nextCalled = false;
        const mockRes = {
            status: () => mockRes,
            json: () => mockRes
        };

        authorizePatientOrProvider(mockReq, mockRes, () => { nextCalled = true; });
        assert.strictEqual(nextCalled, true);
    });

    await test("authorizePatientOrProvider rejects patient attempting to access another's UHID", () => {
        const mockReq = {
            user: { role: "patient", uhid: "MID-2026-ABC123" },
            params: { patientCode: "MID-2026-DIFFERENT" }
        };
        let statusCode = null;
        const mockRes = {
            status: (code) => { statusCode = code; return mockRes; },
            json: () => mockRes
        };

        let nextCalled = false;
        authorizePatientOrProvider(mockReq, mockRes, () => { nextCalled = true; });
        assert.strictEqual(nextCalled, false);
        assert.strictEqual(statusCode, 403);
    });

    // -----------------------------------------------------------------------------
    // 4. Auth Route Handlers Validation Tests
    // -----------------------------------------------------------------------------
    console.log("\n4. Auth Route Handlers Input Validation Tests:");

    const registerRoute = authRoutes.stack.find(s => s.route && s.route.path === "/register").route.stack[0].handle;
    const loginRoute = authRoutes.stack.find(s => s.route && s.route.path === "/login").route.stack[0].handle;

    await test("auth/register rejects missing required fields with 400", async () => {
        const mockReq = { body: {} };
        let statusCode = null;
        let responseBody = null;
        const mockRes = {
            status: (code) => { statusCode = code; return mockRes; },
            json: (data) => { responseBody = data; return mockRes; }
        };

        await registerRoute(mockReq, mockRes, () => {});
        assert.strictEqual(statusCode, 400);
        assert.strictEqual(responseBody.success, false);
        assert(responseBody.message.includes("Full name, email, and password are required"));
    });

    await test("auth/register rejects password shorter than 8 characters", async () => {
        const mockReq = {
            body: { fullName: "Jane Doe", email: "jane@test.org", password: "short" }
        };
        let statusCode = null;
        let responseBody = null;
        const mockRes = {
            status: (code) => { statusCode = code; return mockRes; },
            json: (data) => { responseBody = data; return mockRes; }
        };

        await registerRoute(mockReq, mockRes, () => {});
        assert.strictEqual(statusCode, 400);
        assert.strictEqual(responseBody.success, false);
        assert(responseBody.message.includes("at least 8 characters"));
    });

    await test("auth/register rejects invalid email format", async () => {
        const mockReq = {
            body: { fullName: "Jane Doe", email: "not-an-email", password: "Password123!" }
        };
        let statusCode = null;
        let responseBody = null;
        const mockRes = {
            status: (code) => { statusCode = code; return mockRes; },
            json: (data) => { responseBody = data; return mockRes; }
        };

        await registerRoute(mockReq, mockRes, () => {});
        assert.strictEqual(statusCode, 400);
        assert.strictEqual(responseBody.success, false);
        assert(responseBody.message.includes("valid email address"));
    });

    await test("auth/login rejects empty email or password with 400", async () => {
        const mockReq = { body: {} };
        let statusCode = null;
        let responseBody = null;
        const mockRes = {
            status: (code) => { statusCode = code; return mockRes; },
            json: (data) => { responseBody = data; return mockRes; }
        };

        await loginRoute(mockReq, mockRes, () => {});
        assert.strictEqual(statusCode, 400);
        assert.strictEqual(responseBody.success, false);
        assert(responseBody.message.includes("Email and password are required"));
    });

    console.log("\n-------------------------------------------------");
    console.log(`Results: ${passedTests}/${totalTests} tests passed.`);
    console.log("-------------------------------------------------");

    if (passedTests === totalTests) {
        console.log("All Milestone 1 tests PASSED successfully!\n");
        process.exit(0);
    } else {
        console.error("Some tests failed.\n");
        process.exit(1);
    }
}

runAll();

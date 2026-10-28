const crypto = require("crypto");

/**
 * Characters used for generating human-readable IDs, excluding ambiguous characters (I, O, 0, 1).
 */
const ALPHANUMERIC_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

/**
 * Generate a random alphanumeric string of a given length.
 * @param {number} length
 * @returns {string}
 */
function randomString(length = 6) {
    const bytes = crypto.randomBytes(length);
    let result = "";
    for (let i = 0; i < length; i++) {
        result += ALPHANUMERIC_CHARS[bytes[i] % ALPHANUMERIC_CHARS.length];
    }
    return result;
}

/**
 * Generate a standard Universal Health ID (UHID).
 * Format: MID-YYYY-XXXXXX (e.g. MID-2026-F89KL2)
 * @returns {string}
 */
function generateUHID() {
    const year = new Date().getFullYear();
    const suffix = randomString(6);
    return `MID-${year}-${suffix}`;
}

/**
 * Validate whether a string is a valid UHID.
 * @param {string} uhid
 * @returns {boolean}
 */
function isValidUHID(uhid) {
    if (typeof uhid !== "string") return false;
    const clean = uhid.trim();
    // Support standard MID-YYYY-XXXXXX and demo formats like DEMO-001
    return /^MID-\d{4}-[A-Z0-9]{6}$/.test(clean) || /^DEMO-\d{3}$/.test(clean);
}

/**
 * Generate a standard hospital code.
 * Format: HOSP-XXXXXX
 * @returns {string}
 */
function generateHospitalCode(cityPrefix = "GEN") {
    const cleanPrefix = (cityPrefix || "GEN").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3) || "GEN";
    const suffix = randomString(4);
    return `HOSP-${cleanPrefix}-${suffix}`;
}

/**
 * Generate a consultation reference code.
 * Format: CON-YYYY-XXXX
 * @returns {string}
 */
function generateConsultationCode() {
    const year = new Date().getFullYear();
    const suffix = randomString(4);
    return `CON-${year}-${suffix}`;
}

/**
 * Generate a medical report reference code.
 * Format: REP-YYYY-XXXX
 * @returns {string}
 */
function generateReportCode() {
    const year = new Date().getFullYear();
    const suffix = randomString(4);
    return `REP-${year}-${suffix}`;
}

module.exports = {
    generateUHID,
    isValidUHID,
    generateHospitalCode,
    generateConsultationCode,
    generateReportCode,
};

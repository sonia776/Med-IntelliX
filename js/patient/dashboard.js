/* =========================================
   MedIntelliX — Patient Dashboard
   File: js/patient/dashboard.js
   ========================================= */

document.addEventListener("DOMContentLoaded", function () {
    initializeDashboardYear();
    initializePatientProfile();
    initializeDashboardStatistics();
});

/* ---------- Footer Year ---------- */

function initializeDashboardYear() {
    const yearElement = document.getElementById("dashboardYear");
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
}

/* ---------- Patient Profile ---------- */

function initializePatientProfile() {
    let name = "Alex Morgan";

    try {
        const stored = localStorage.getItem("medintellix_user");
        if (stored) {
            const user = JSON.parse(stored);
            if (user.fullName) name = user.fullName;
        }
    } catch {
        // Fallback to default name if error parsing
    }

    const patientNameElement = document.getElementById("patientName");
    const welcomeNameElement = document.getElementById("welcomeName");
    const initialsElement = document.getElementById("profileInitials");

    if (patientNameElement) {
        patientNameElement.textContent = name;
    }

    if (welcomeNameElement) {
        welcomeNameElement.textContent = getFirstName(name);
    }

    if (initialsElement) {
        initialsElement.textContent = getInitials(name);
    }
}

function getFirstName(fullName) {
    const cleanedName = fullName.trim();
    if (!cleanedName) return "there";
    return cleanedName.split(/\s+/)[0];
}

function getInitials(fullName) {
    const cleanedName = fullName.trim();
    if (!cleanedName) return "MD";

    return cleanedName
        .split(/\s+/)
        .slice(0, 2)
        .map(function (part) {
            return part.charAt(0).toUpperCase();
        })
        .join("");
}

/* ---------- Dashboard Statistics ---------- */

async function initializeDashboardStatistics() {
    updateStatistic("reportsCount", 4);
    updateStatistic("medicationsCount", 2);
    updateStatistic("appointmentsCount", 1);

    try {
        const response = await fetch("http://localhost:3000/api/patients/count");
        if (!response.ok) throw new Error("Unable to fetch patient count.");

        const data = await response.json();
        if (data.success !== true || !Number.isInteger(data.totalPatients) || data.totalPatients < 0) {
            throw new Error("Invalid patient count response.");
        }

        updateStatistic("recordsCount", data.totalPatients);
    } catch (error) {
        console.error("Dashboard records count failed:", error);
        updateStatistic("recordsCount", "3");
    }
}

function updateStatistic(elementId, value) {
    const element = document.getElementById(elementId);
    if (!element) return;
    element.textContent = String(value);
}

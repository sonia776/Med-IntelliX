document.addEventListener("DOMContentLoaded", function () {
    "use strict";

    // Update the footer year.
    const yearElement = document.getElementById("hospitalYear");
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }

    let hospital = {
        name: "Example Hospital",
        initials: "EH",
        patientCount: 248,
        consultationCount: 18,
        reportCount: 7,
        staffCount: 32
    };

    // Load active hospital user session
    try {
        const stored = localStorage.getItem("medintellix_user");
        if (stored) {
            const user = JSON.parse(stored);
            if (user.role === "hospital" && (user.hospitalName || user.fullName)) {
                hospital.name = user.hospitalName || user.fullName;
                const parts = hospital.name.split(/\s+/).filter(Boolean);
                hospital.initials = parts.map(p => p[0]).join("").slice(0, 2).toUpperCase();
            }
        }
    } catch {
        // Fallback to default
    }

    // Update the organisation name and avatar.
    const hospitalName = document.getElementById("hospitalNameShort");
    const organisationName = document.getElementById("hospitalOrganisationName");
    const initials = document.getElementById("hospitalInitials");

    if (hospitalName) {
        hospitalName.textContent = hospital.name;
    }

    if (organisationName) {
        organisationName.textContent = hospital.name;
    }

    if (initials) {
        initials.textContent = hospital.initials;
    }

    // Update the dashboard summary cards.
    const dashboardValues = {
        hospitalPatientCount: hospital.patientCount,
        hospitalConsultationCount: hospital.consultationCount,
        hospitalReportCount: hospital.reportCount,
        hospitalStaffCount: hospital.staffCount
    };

    Object.entries(dashboardValues).forEach(function ([id, value]) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value.toLocaleString("en-IN");
        }
    });

    // Fetch live counts from backend if available
    fetch("http://localhost:3000/api/hospital/stats")
        .then(res => res.json())
        .then(data => {
            if (data.success && data.stats) {
                if (data.stats.patientCount !== undefined) {
                    const el = document.getElementById("hospitalPatientCount");
                    if (el) el.textContent = data.stats.patientCount.toLocaleString("en-IN");
                }
                if (data.stats.consultationCount !== undefined) {
                    const el = document.getElementById("hospitalConsultationCount");
                    if (el) el.textContent = data.stats.consultationCount.toLocaleString("en-IN");
                }
                if (data.stats.reportCount !== undefined) {
                    const el = document.getElementById("hospitalReportCount");
                    if (el) el.textContent = data.stats.reportCount.toLocaleString("en-IN");
                }
            }
        })
        .catch(() => {
            // Keep default display figures if API call fails
        });
});

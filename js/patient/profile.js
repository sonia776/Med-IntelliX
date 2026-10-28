/* =========================================
   MedIntelliX — Patient Profile
   File: js/patient/profile.js
   ========================================= */

document.addEventListener("DOMContentLoaded", function () {
    "use strict";

    const form = document.getElementById("profileForm");
    const message = document.getElementById("profileMessage");
    const preferencesMessage = document.getElementById("preferencesMessage");

    const fields = {
        name: document.getElementById("fullName"),
        email: document.getElementById("emailAddress"),
        phone: document.getElementById("phoneNumber"),
        birthDate: document.getElementById("dateOfBirth"),
        emergencyName: document.getElementById("emergencyName"),
        relationship: document.getElementById("relationship"),
        emergencyPhone: document.getElementById("emergencyPhone")
    };

    // Load authenticated user profile from localStorage
    try {
        const stored = localStorage.getItem("medintellix_user");
        if (stored) {
            const user = JSON.parse(stored);
            if (user.fullName && fields.name) fields.name.value = user.fullName;
            if (user.email && fields.email) fields.email.value = user.email;
            if (user.phone && fields.phone) fields.phone.value = user.phone;
            if (user.dateOfBirth && fields.birthDate) fields.birthDate.value = String(user.dateOfBirth).slice(0, 10);
            const genderSelect = document.getElementById("gender");
            if (genderSelect && user.gender) {
                const gVal = user.gender.toLowerCase();
                if (genderSelect.querySelector(`option[value="${gVal}"]`)) {
                    genderSelect.value = gVal;
                }
            }

            const patientIdEl = document.getElementById("patientId");
            if (patientIdEl) {
                patientIdEl.value = user.uhid || user.patientCode || "MID-2026-DEMO";
            }

            const addressEl = document.getElementById("address");
            if (addressEl && (user.address || user.city)) {
                addressEl.value = user.address || (user.city + (user.state ? ", " + user.state : ""));
            }

            if (user.emergencyContactName && fields.emergencyName) {
                fields.emergencyName.value = user.emergencyContactName;
            }
            if (user.emergencyContactPhone && fields.emergencyPhone) {
                fields.emergencyPhone.value = user.emergencyContactPhone;
            }
            if (user.emergencyContactRelation && fields.relationship) {
                const rVal = user.emergencyContactRelation.toLowerCase();
                if (fields.relationship.querySelector(`option[value="${rVal}"]`)) {
                    fields.relationship.value = rVal;
                }
            }
        }
    } catch (e) {
        console.error("Could not load user from session:", e);
    }

    const originalValues = new Map();

    // Save the initial form values so Reset can restore them.
    form.querySelectorAll("input, select, textarea").forEach(function (field) {
        if (field.type !== "checkbox" && field.type !== "reset" && field.type !== "submit") {
            originalValues.set(field.id, field.value);
        }
    });

    const currentYear = document.getElementById("profileYear");
    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }

    function displayMessage(element, text, type) {
        element.textContent = text;
        element.hidden = false;
        element.className = "small mt-3 " +
            (type === "success" ? "text-success" : "text-danger");
    }

    function getInitials(name) {
        return name.trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(part => part.charAt(0).toUpperCase())
            .join("");
    }

    function formatBirthDate(value) {
        if (!value) {
            return "Not provided";
        }

        const parts = value.split("-").map(Number);
        const date = new Date(parts[0], parts[1] - 1, parts[2]);

        return date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    }

    function updateProfileDisplay() {
        const name = (fields.name && fields.name.value.trim()) || "Patient";
        const email = (fields.email && fields.email.value.trim()) || "Not provided";
        const phone = (fields.phone && fields.phone.value.trim()) || "Not provided";
        const initials = getInitials(name) || "P";

        const profileDisplayName = document.getElementById("profileDisplayName");
        const profileDisplayEmail = document.getElementById("profileDisplayEmail");
        const profileAvatar = document.getElementById("profileAvatar");
        const profileInitials = document.getElementById("profileInitials");
        const patientName = document.getElementById("patientName");

        if (profileDisplayName) profileDisplayName.textContent = name;
        if (profileDisplayEmail) profileDisplayEmail.textContent = email;
        if (profileAvatar) profileAvatar.textContent = initials;
        if (profileInitials) profileInitials.textContent = initials;
        if (patientName) patientName.textContent = name;

        const summaryEmail = document.getElementById("summaryEmail");
        const summaryPhone = document.getElementById("summaryPhone");
        const summaryBirthDate = document.getElementById("summaryBirthDate");
        const summaryEmergency = document.getElementById("summaryEmergency");

        if (summaryEmail) summaryEmail.textContent = email;
        if (summaryPhone) summaryPhone.textContent = phone;
        if (summaryBirthDate) {
            summaryBirthDate.textContent = formatBirthDate(fields.birthDate ? fields.birthDate.value : "");
        }

        const emergencyName = fields.emergencyName ? fields.emergencyName.value.trim() : "";
        const relationship = fields.relationship ? fields.relationship.value : "";
        const emergencyPhone = fields.emergencyPhone ? fields.emergencyPhone.value.trim() : "";

        let emergencySummary = "Not provided";

        if (emergencyName) {
            emergencySummary = emergencyName;
            if (relationship && fields.relationship.selectedIndex >= 0) {
                emergencySummary += " (" + fields.relationship.options[fields.relationship.selectedIndex].text + ")";
            }
            if (emergencyPhone) {
                emergencySummary += " · " + emergencyPhone;
            }
        } else if (emergencyPhone) {
            emergencySummary = emergencyPhone;
        }

        if (summaryEmergency) {
            summaryEmergency.textContent = emergencySummary;
        }
    }

    // Basic validation for phone number fields.
    function isValidPhone(value) {
        if (!value.trim()) {
            return true;
        }
        const cleaned = value.replace(/[\s()+-]/g, "");
        return /^\d{7,15}$/.test(cleaned);
    }

    form.addEventListener("submit", function (event) {
        event.preventDefault();

        if (!form.reportValidity()) {
            return;
        }

        if (!isValidPhone(fields.phone.value)) {
            fields.phone.setCustomValidity("Enter a valid phone number containing 7–15 digits.");
            fields.phone.reportValidity();
            fields.phone.setCustomValidity("");
            fields.phone.focus();
            return;
        }

        if (!isValidPhone(fields.emergencyPhone.value)) {
            fields.emergencyPhone.setCustomValidity("Enter a valid emergency phone number containing 7–15 digits.");
            fields.emergencyPhone.reportValidity();
            fields.emergencyPhone.setCustomValidity("");
            fields.emergencyPhone.focus();
            return;
        }

        if (fields.emergencyName.value.trim() && !fields.emergencyPhone.value.trim()) {
            displayMessage(
                message,
                "Please add a phone number for the emergency contact, or clear the contact name.",
                "error"
            );
            fields.emergencyPhone.focus();
            return;
        }

        updateProfileDisplay();

        // Save updated values to active session localStorage
        try {
            const stored = localStorage.getItem("medintellix_user");
            let user = stored ? JSON.parse(stored) : {};
            user.fullName = fields.name.value.trim();
            user.email = fields.email.value.trim();
            user.phone = fields.phone.value.trim();
            if (fields.birthDate) user.dateOfBirth = fields.birthDate.value;
            const gSelect = document.getElementById("gender");
            if (gSelect) user.gender = gSelect.value;
            const addrEl = document.getElementById("address");
            if (addrEl) user.address = addrEl.value;
            user.emergencyContactName = fields.emergencyName.value.trim();
            user.emergencyContactPhone = fields.emergencyPhone.value.trim();
            user.emergencyContactRelation = fields.relationship.value;

            localStorage.setItem("medintellix_user", JSON.stringify(user));
        } catch (e) {
            console.error("Could not save to localStorage:", e);
        }

        // Update the reset baseline for the edited form.
        form.querySelectorAll("input, select, textarea").forEach(function (field) {
            if (originalValues.has(field.id)) {
                originalValues.set(field.id, field.value);
            }
        });

        displayMessage(
            message,
            "Profile saved successfully! Your updated details are now active across your account.",
            "success"
        );
    });

    form.addEventListener("reset", function () {
        window.setTimeout(function () {
            message.hidden = true;
            updateProfileDisplay();
        }, 0);
    });

    // Keep the visible profile summary in sync while editing.
    [
        fields.name,
        fields.email,
        fields.phone,
        fields.birthDate,
        fields.emergencyName,
        fields.relationship,
        fields.emergencyPhone
    ].forEach(function (field) {
        if (!field) return;
        field.addEventListener("input", updateProfileDisplay);
        field.addEventListener("change", updateProfileDisplay);
    });

    // Preferences
    const savePrefBtn = document.getElementById("savePreferences");
    if (savePrefBtn) {
        savePrefBtn.addEventListener("click", function () {
            const preferences = {
                appointmentReminders: document.getElementById("appointmentReminders") ? document.getElementById("appointmentReminders").checked : true,
                recordUpdates: document.getElementById("recordUpdates") ? document.getElementById("recordUpdates").checked : true,
                productAnnouncements: document.getElementById("productAnnouncements") ? document.getElementById("productAnnouncements").checked : false
            };

            const selectedCount = Object.values(preferences).filter(Boolean).length;
            displayMessage(
                preferencesMessage,
                `Preferences updated (${selectedCount} enabled).`,
                "success"
            );
        });
    }

    updateProfileDisplay();
});

/* ========================================
   MedIntelliX - Registration Functionality
   Connected to MedIntelliX Auth API
   ======================================== */

document.addEventListener("DOMContentLoaded", function () {
    const API_BASE = "http://localhost:3000/api";

    // Get HTML elements
    const registerForm = document.getElementById("registerForm");
    const fullNameInput = document.getElementById("fullName");
    const emailInput = document.getElementById("registerEmail");
    const passwordInput = document.getElementById("registerPassword");
    const confirmPasswordInput = document.getElementById("confirmPassword");
    const acceptTerms = document.getElementById("acceptTerms");

    const organisationFields = document.getElementById("organisationFields");
    const organisationName = document.getElementById("organisationName");
    const institutionId = document.getElementById("institutionId");
    const organisationLabel = document.getElementById("organisationLabel");
    const institutionIdLabel = document.getElementById("institutionIdLabel");

    const registerMessage = document.getElementById("registerMessage");
    const registerButton = document.getElementById("registerButton");
    const registerYear = document.getElementById("registerYear");

    // Update footer year
    if (registerYear) {
        registerYear.textContent = new Date().getFullYear();
    }

    // Show feedback message
    function showMessage(message, type = "info") {
        if (!registerMessage) return;

        registerMessage.textContent = message;
        registerMessage.hidden = false;

        registerMessage.classList.remove(
            "message-info",
            "message-error",
            "message-success"
        );

        registerMessage.classList.add(`message-${type}`);
    }

    // Hide feedback message
    function hideMessage() {
        if (!registerMessage) return;

        registerMessage.hidden = true;
        registerMessage.textContent = "";
    }

    // Read selected account type
    function getSelectedAccountType() {
        const selected = document.querySelector(
            'input[name="accountType"]:checked'
        );

        return selected ? selected.value : "";
    }

    // Show or hide institutional fields
    function updateAccountFields() {
        const accountType = getSelectedAccountType();
        const isInstitutional =
            accountType === "hospital" ||
            accountType === "government";

        if (!organisationFields) return;

        organisationFields.hidden = !isInstitutional;

        if (organisationName) {
            organisationName.required = isInstitutional;
        }

        if (institutionId) {
            institutionId.required = isInstitutional;
        }

        if (accountType === "hospital") {
            organisationLabel.textContent = "Hospital name";
            organisationName.placeholder = "Enter hospital name";

            institutionIdLabel.textContent = "Hospital registration ID";
            institutionId.placeholder = "Enter hospital registration ID";

        } else if (accountType === "government") {
            organisationLabel.textContent = "Government department";
            organisationName.placeholder = "Enter department name";

            institutionIdLabel.textContent = "Department / institutional ID";
            institutionId.placeholder = "Enter authorised institutional ID";
        }

        hideMessage();
    }

    document.querySelectorAll('input[name="accountType"]').forEach(function (radio) {
        radio.addEventListener("change", updateAccountFields);
    });

    updateAccountFields();

    // Password visibility toggle
    function setupPasswordToggle(buttonId, inputId) {
        const toggleButton = document.getElementById(buttonId);
        const inputField = document.getElementById(inputId);

        if (!toggleButton || !inputField) return;

        toggleButton.addEventListener("click", function () {
            const isHidden = inputField.type === "password";
            inputField.type = isHidden ? "text" : "password";

            toggleButton.innerHTML = isHidden
                ? '<i class="bi bi-eye-slash"></i>'
                : '<i class="bi bi-eye"></i>';

            toggleButton.setAttribute(
                "aria-label",
                isHidden ? "Hide password" : "Show password"
            );
            toggleButton.setAttribute("aria-pressed", String(isHidden));
        });
    }

    setupPasswordToggle("toggleRegisterPassword", "registerPassword");
    setupPasswordToggle("toggleConfirmPassword", "confirmPassword");

    // Clear validation state on input
    [fullNameInput, emailInput, passwordInput, confirmPasswordInput, organisationName, institutionId].forEach(function (input) {
        if (!input) return;
        input.addEventListener("input", function () {
            input.classList.remove("is-invalid");
            hideMessage();
        });
    });

    if (acceptTerms) {
        acceptTerms.addEventListener("change", function () {
            acceptTerms.classList.remove("is-invalid");
            hideMessage();
        });
    }

    // Registration Form Submission
    if (registerForm) {
        registerForm.addEventListener("submit", async function (event) {
            event.preventDefault();
            hideMessage();

            const fullName = fullNameInput.value.trim();
            const email = emailInput.value.trim();
            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput.value;
            const accountType = getSelectedAccountType();
            const termsAccepted = acceptTerms.checked;

            let isValid = true;

            if (fullName.length < 2) {
                fullNameInput.classList.add("is-invalid");
                isValid = false;
            } else {
                fullNameInput.classList.remove("is-invalid");
            }

            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!email || !emailPattern.test(email)) {
                emailInput.classList.add("is-invalid");
                isValid = false;
            } else {
                emailInput.classList.remove("is-invalid");
            }

            if (password.length < 8) {
                passwordInput.classList.add("is-invalid");
                isValid = false;
            } else {
                passwordInput.classList.remove("is-invalid");
            }

            if (!confirmPassword || password !== confirmPassword) {
                confirmPasswordInput.classList.add("is-invalid");
                isValid = false;
            } else {
                confirmPasswordInput.classList.remove("is-invalid");
            }

            if (!termsAccepted) {
                acceptTerms.classList.add("is-invalid");
                isValid = false;
            } else {
                acceptTerms.classList.remove("is-invalid");
            }

            const isInstitutional = accountType === "hospital" || accountType === "government";
            if (isInstitutional) {
                const orgValue = organisationName.value.trim();
                const institutionValue = institutionId.value.trim();

                if (!orgValue) {
                    organisationName.classList.add("is-invalid");
                    isValid = false;
                } else {
                    organisationName.classList.remove("is-invalid");
                }

                if (!institutionValue) {
                    institutionId.classList.add("is-invalid");
                    isValid = false;
                } else {
                    institutionId.classList.remove("is-invalid");
                }
            }

            if (!isValid) {
                showMessage(
                    "Please check the highlighted fields, ensure passwords match (min 8 characters), and accept the terms.",
                    "error"
                );
                return;
            }

            // Execute registration via Backend API
            const originalButtonHtml = registerButton.innerHTML;
            registerButton.disabled = true;
            registerButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Creating account & generating UHID...';

            try {
                const payload = {
                    fullName,
                    email,
                    password,
                    role: accountType,
                    hospitalName: isInstitutional && organisationName ? organisationName.value.trim() : undefined,
                    registrationNumber: isInstitutional && institutionId ? institutionId.value.trim() : undefined
                };

                const response = await fetch(`${API_BASE}/auth/register`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(data.message || "Failed to complete registration.");
                }

                // Store token & user info
                localStorage.setItem("medintellix_token", data.token);
                localStorage.setItem("medintellix_user", JSON.stringify(data.user));

                const uhidInfo = data.user.uhid
                    ? ` Your Universal Health ID is: ${data.user.uhid}.`
                    : "";

                showMessage(
                    `Registration complete!${uhidInfo} Redirecting to your portal...`,
                    "success"
                );

                setTimeout(() => {
                    const destination = accountType === "patient"
                        ? "patient/dashboard.html"
                        : accountType === "hospital"
                        ? "hospital/dashboard.html"
                        : "government/dashboard.html";

                    window.location.href = destination;
                }, 1500);

            } catch (err) {
                console.error("Registration error:", err);
                showMessage(
                    err.message.includes("Failed to fetch")
                        ? "Unable to connect to the MedIntelliX backend server. Ensure http://localhost:3000 is running."
                        : err.message,
                    "error"
                );
            } finally {
                registerButton.disabled = false;
                registerButton.innerHTML = originalButtonHtml;
            }
        });
    }

    // Terms and privacy placeholders
    const termsLink = document.getElementById("termsLink");
    const privacyLink = document.getElementById("privacyLink");

    if (termsLink) {
        termsLink.addEventListener("click", function (event) {
            event.preventDefault();
            showMessage("MedIntelliX Terms of Service: Patient-controlled health records, HIPAA-aligned consent architecture.", "info");
        });
    }

    if (privacyLink) {
        privacyLink.addEventListener("click", function (event) {
            event.preventDefault();
            showMessage("MedIntelliX Privacy Policy: Encrypted health records and zero-unauthorized-access data policies.", "info");
        });
    }
});

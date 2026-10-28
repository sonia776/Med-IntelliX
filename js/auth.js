/* ========================================
   MedIntelliX - Login Functionality
   Connected to MedIntelliX Auth API
   ======================================== */

document.addEventListener("DOMContentLoaded", function () {
    const API_BASE = "http://localhost:3000/api";

    // Get HTML elements
    const loginForm = document.getElementById("loginForm");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const togglePassword = document.getElementById("togglePassword");
    const loginButton = document.getElementById("loginButton");
    const loginMessage = document.getElementById("loginMessage");
    const forgotPasswordLink = document.getElementById("forgotPasswordLink");
    const currentYear = document.getElementById("current-year");

    // Update footer year
    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }

    // Display a message on the login page
    function showMessage(message, type = "info") {
        if (!loginMessage) return;

        loginMessage.textContent = message;
        loginMessage.hidden = false;

        loginMessage.classList.remove(
            "message-info",
            "message-error",
            "message-success"
        );

        loginMessage.classList.add(`message-${type}`);
    }

    // Hide the current message
    function hideMessage() {
        if (loginMessage) {
            loginMessage.hidden = true;
            loginMessage.textContent = "";
        }
    }

    // Get the selected portal
    function getSelectedRole() {
        const selectedRole = document.querySelector(
            'input[name="userRole"]:checked'
        );

        return selectedRole ? selectedRole.value : "";
    }

    // Password visibility toggle
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener("click", function () {
            const isPasswordHidden = passwordInput.type === "password";

            passwordInput.type = isPasswordHidden ? "text" : "password";

            togglePassword.innerHTML = isPasswordHidden
                ? '<i class="bi bi-eye-slash"></i>'
                : '<i class="bi bi-eye"></i>';

            togglePassword.setAttribute(
                "aria-label",
                isPasswordHidden ? "Hide password" : "Show password"
            );

            togglePassword.setAttribute(
                "aria-pressed",
                String(isPasswordHidden)
            );
        });
    }

    // Clear validation styling as the user types
    [emailInput, passwordInput].forEach(function (input) {
        if (!input) return;

        input.addEventListener("input", function () {
            input.classList.remove("is-invalid");
            hideMessage();
        });
    });

    // Clear messages when a different portal is selected
    document.querySelectorAll('input[name="userRole"]').forEach(
        function (radio) {
            radio.addEventListener("change", function () {
                hideMessage();
            });
        }
    );

    // Login form submission
    if (loginForm) {
        loginForm.addEventListener("submit", async function (event) {
            event.preventDefault();
            hideMessage();

            const email = emailInput.value.trim();
            const password = passwordInput.value;
            const role = getSelectedRole();

            let isValid = true;

            // Validate email
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!email || !emailPattern.test(email)) {
                emailInput.classList.add("is-invalid");
                isValid = false;
            } else {
                emailInput.classList.remove("is-invalid");
            }

            // Validate password
            if (!password.trim()) {
                passwordInput.classList.add("is-invalid");
                isValid = false;
            } else {
                passwordInput.classList.remove("is-invalid");
            }

            // Validate portal selection
            if (!role) {
                showMessage("Please select a portal before continuing.", "error");
                return;
            }

            if (!isValid) {
                showMessage("Please enter a valid email address and password.", "error");
                return;
            }

            // Submit to Backend API
            const originalButtonHtml = loginButton.innerHTML;
            loginButton.disabled = true;
            loginButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Signing in...';

            try {
                const response = await fetch(`${API_BASE}/auth/login`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email,
                        password,
                        userRole: role
                    })
                });

                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(data.message || "Invalid login credentials.");
                }

                // Store token & session details
                localStorage.setItem("medintellix_token", data.token);
                localStorage.setItem("medintellix_user", JSON.stringify(data.user));

                showMessage("Authentication successful! Redirecting to your dashboard...", "success");

                // Route to appropriate dashboard
                setTimeout(() => {
                    const destination = role === "patient"
                        ? "patient/dashboard.html"
                        : role === "hospital"
                        ? "hospital/dashboard.html"
                        : "government/dashboard.html";

                    window.location.href = destination;
                }, 800);

            } catch (err) {
                console.error("Login request error:", err);
                showMessage(
                    err.message.includes("Failed to fetch")
                        ? "Unable to reach the MedIntelliX authentication server (http://localhost:3000). Please ensure the backend is running."
                        : err.message,
                    "error"
                );
            } finally {
                loginButton.disabled = false;
                loginButton.innerHTML = originalButtonHtml;
            }
        });
    }

    // Forgot password handler
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener("click", function (event) {
            event.preventDefault();
            showMessage(
                "For demo accounts, use password 'Demo123!' with: patient@demo.com, hospital@demo.com, or government@demo.com",
                "info"
            );
        });
    }
});

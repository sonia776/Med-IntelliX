
document.addEventListener("DOMContentLoaded", function () {
    "use strict";

    let patients = [];

    async function loadPatientsFromAPI() {
        try {
            const response = await fetch(
                "http://localhost:3000/api/hospital/patients"
            );

            if (!response.ok) {
                throw new Error("Failed to load hospital patients.");
            }

            const data = await response.json();

            if (
                data.success !== true ||
                !Array.isArray(data.patients)
            ) {
                throw new Error("Invalid patient API response.");
            }

            patients = data.patients.map((patient) => ({
                ...patient,
                initials: (patient.name || "Unknown")
                    .split(/\s+/)
                    .filter(Boolean)
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase(),
                email: "Not provided",
                phone: "Not provided",
                gender: "Not recorded",
                lastVisit: "Not recorded",
                status: "active",
                bloodGroup: "Not recorded",
                city: "Not recorded",
                emergencyContact: "Not provided"
            }));

            renderSummary();
            renderPatients();

        } catch (error) {
            console.error("Hospital patients API error:", error);

            patients = [];
            renderSummary();
            renderPatients();
        }
    }

    const tableBody = document.getElementById("patientTableBody");
    const searchInput = document.getElementById("patientSearch");
    const statusFilter = document.getElementById("statusFilter");
    const resultsCount = document.getElementById("resultsCount");
    const emptyState = document.getElementById("emptyPatients");
    const totalElement = document.getElementById("totalPatients");
    const activeElement = document.getElementById("activePatients");
    const pendingElement = document.getElementById("pendingPatients");
    const detailsBody = document.getElementById("patientDetailsBody");
    const detailsTitle = document.getElementById("patientDetailsTitle");

    const modalElement = document.getElementById("patientDetailsModal");
    const detailsModal = modalElement && window.bootstrap
        ? new bootstrap.Modal(modalElement)
        : null;

    const yearElement = document.getElementById("hospitalYear");
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }

    function escapeHTML(value) {
        return String(value).replace(/[&<>"']/g, function (character) {
            const entities = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            };

            return entities[character];
        });
    }

    function formatDate(dateString) {
        if (!dateString || dateString === "Not recorded") {
            return "Not recorded";
        }

        const parts = dateString.split("-");
        if (parts.length !== 3) {
            return dateString;
        }

        return new Date(
            Number(parts[0]),
            Number(parts[1]) - 1,
            Number(parts[2])
        ).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }

    function getStatusLabel(status) {
        const labels = {
            active: "Active",
            pending: "Pending",
            inactive: "Inactive"
        };

        return labels[status] || "Unknown";
    }

    function getFilteredPatients() {
        const query = searchInput.value.trim().toLowerCase();
        const selectedStatus = statusFilter.value;

        return patients.filter(function (patient) {
            const searchableText = [
                patient.name,
                patient.id,
                patient.email,
                patient.city
            ].join(" ").toLowerCase();

            const matchesSearch = searchableText.includes(query);
            const matchesStatus =
                selectedStatus === "all" ||
                patient.status === selectedStatus;

            return matchesSearch && matchesStatus;
        });
    }

    function renderPatients() {
        const filteredPatients = getFilteredPatients();

        tableBody.innerHTML = "";

        filteredPatients.forEach(function (patient) {
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>
                    <div class="patient-identity">
                        <div class="patient-avatar">
                            ${escapeHTML(patient.initials)}
                        </div>
                        <div>
                            <div class="patient-name">
                                ${escapeHTML(patient.name)}
                            </div>
                            <div class="patient-id">
                                ${escapeHTML(patient.id)}
                            </div>
                        </div>
                    </div>
                </td>
                <td>
                    ${escapeHTML(patient.age)} years<br>
                    <span class="text-secondary">
                        ${escapeHTML(patient.gender)}
                    </span>
                </td>
                <td>${escapeHTML(formatDate(patient.enrolledOn))}</td>
                <td>${escapeHTML(formatDate(patient.lastVisit))}</td>
                <td>
                    <span class="patient-status ${escapeHTML(patient.status)}">
                        <i class="bi bi-circle-fill" style="font-size:6px;"></i>
                        ${escapeHTML(getStatusLabel(patient.status))}
                    </span>
                </td>
                <td>
                    <button type="button"
                            class="patient-action-btn"
                            data-patient-id="${escapeHTML(patient.id)}"
                            aria-label="View ${escapeHTML(patient.name)} details"
                            title="View patient details">
                        <i class="bi bi-eye"></i>
                    </button>
                </td>
            `;

            tableBody.appendChild(row);
        });

        const count = filteredPatients.length;
        resultsCount.textContent =
            `Showing ${count} of ${patients.length} demo patients`;

        emptyState.classList.toggle("d-none", count !== 0);
        tableBody.classList.toggle("d-none", count === 0);
    }

    function renderSummary() {
        totalElement.textContent = patients.length;

        activeElement.textContent = patients.filter(function (patient) {
            return patient.status === "active";
        }).length;

        pendingElement.textContent = patients.filter(function (patient) {
            return patient.status === "pending";
        }).length;
    }

    function showPatientDetails(patientId) {
        const patient = patients.find(function (item) {
            return item.id === patientId;
        });

        if (!patient || !detailsModal) {
            return;
        }

        detailsTitle.textContent = patient.name;

        detailsBody.innerHTML = `
            <div class="d-flex align-items-center gap-3 mb-4">
                <div class="patient-avatar" style="width:56px;height:56px;font-size:16px;">
                    ${escapeHTML(patient.initials)}
                </div>
                <div>
                    <h3 class="h5 fw-bold mb-1">${escapeHTML(patient.name)}</h3>
                    <div class="text-secondary small">
                        Patient ID: ${escapeHTML(patient.id)}
                    </div>
                    <span class="patient-status ${escapeHTML(patient.status)} mt-2">
                        ${escapeHTML(getStatusLabel(patient.status))}
                    </span>
                </div>
            </div>

            <div class="row g-3">
                <div class="col-12 col-md-6">
                    <section class="detail-section">
                        <h3><i class="bi bi-person me-2"></i>Personal information</h3>
                        <div class="mb-3">
                            <div class="patient-detail-label">Age / Gender</div>
                            <div class="patient-detail-value">
                                ${escapeHTML(patient.age)} years · ${escapeHTML(patient.gender)}
                            </div>
                        </div>
                        <div class="mb-3">
                            <div class="patient-detail-label">City</div>
                            <div class="patient-detail-value">${escapeHTML(patient.city)}</div>
                        </div>
                        <div>
                            <div class="patient-detail-label">Blood group</div>
                            <div class="patient-detail-value">${escapeHTML(patient.bloodGroup)}</div>
                        </div>
                    </section>
                </div>

                <div class="col-12 col-md-6">
                    <section class="detail-section">
                        <h3><i class="bi bi-telephone me-2"></i>Contact information</h3>
                        <div class="mb-3">
                            <div class="patient-detail-label">Email</div>
                            <div class="patient-detail-value">${escapeHTML(patient.email)}</div>
                        </div>
                        <div class="mb-3">
                            <div class="patient-detail-label">Phone</div>
                            <div class="patient-detail-value">${escapeHTML(patient.phone)}</div>
                        </div>
                        <div>
                            <div class="patient-detail-label">Emergency contact</div>
                            <div class="patient-detail-value">${escapeHTML(patient.emergencyContact)}</div>
                        </div>
                    </section>
                </div>

                <div class="col-12">
                    <section class="detail-section">
                        <h3><i class="bi bi-clipboard2-check me-2"></i>Enrolment information</h3>
                        <div class="row g-3">
                            <div class="col-6">
                                <div class="patient-detail-label">Enrolled on</div>
                                <div class="patient-detail-value">
                                    ${escapeHTML(formatDate(patient.enrolledOn))}
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="patient-detail-label">Last visit</div>
                                <div class="patient-detail-value">
                                    ${escapeHTML(formatDate(patient.lastVisit))}
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            <div class="alert alert-info mt-3 mb-0 small">
                <i class="bi bi-info-circle me-2"></i>
                This is fictional demonstration data. No medical record has been accessed.
            </div>
        `;

        detailsModal.show();
    }

    function resetFilters() {
        searchInput.value = "";
        statusFilter.value = "all";
        renderPatients();
    }

    searchInput.addEventListener("input", renderPatients);
    statusFilter.addEventListener("change", renderPatients);

    document.getElementById("resetFilters").addEventListener("click", resetFilters);
    document.getElementById("emptyReset").addEventListener("click", resetFilters);

    tableBody.addEventListener("click", function (event) {
        const button = event.target.closest("[data-patient-id]");

        if (button) {
            showPatientDetails(button.dataset.patientId);
        }
    });

    loadPatientsFromAPI();
});

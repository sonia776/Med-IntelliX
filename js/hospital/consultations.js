document.addEventListener("DOMContentLoaded", function () {
    "use strict";

    let consultations = [];
    async function loadConsultationsFromAPI() {
        try {
            const response = await fetch(
                "http://localhost:3000/api/hospital/consultations"
            );

            if (!response.ok) {
                throw new Error("Failed to load consultations.");
            }

            const data = await response.json();

            if (
                data.success !== true ||
                !Array.isArray(data.consultations)
            ) {
                throw new Error("Invalid consultations API response.");
            }

            consultations = data.consultations.map((item) => ({
                id: item.consultation_code,
                patient: item.full_name,
                patientId: item.patient_code,
                initials: (item.full_name || "Unknown")
                    .split(/\s+/)
                    .filter(Boolean)
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase(),
                doctor: item.doctor_name,
                date: String(item.consultation_date).slice(0, 10),
                time: String(item.consultation_time).slice(0, 5),
                type: item.consultation_type,
                status: item.status,
                duration: `${item.duration_minutes} minutes`,
                department: item.department,
                notes: item.notes
            }));

            updateSummary();
            renderConsultations();

        } catch (error) {
            console.error("Consultations API error:", error);

            consultations = [];
            updateSummary();
            renderConsultations();

            if (typeof window.showPortalNotice === "function") {
                window.showPortalNotice(
                    "Unable to load consultations. Check that the backend is running.",
                    "error"
                );
            }
        }
    }

    const tableBody = document.getElementById("consultationTableBody");
    const searchInput = document.getElementById("consultationSearch");
    const statusFilter = document.getElementById("statusFilter");
    const dateFilter = document.getElementById("dateFilter");
    const resultsCount = document.getElementById("resultsCount");
    const emptyState = document.getElementById("emptyConsultations");

    const modalElement = document.getElementById("consultationDetailsModal");
    const modal = window.bootstrap
        ? new bootstrap.Modal(modalElement)
        : null;

    const detailsTitle = document.getElementById("consultationDetailsTitle");
    const detailsBody = document.getElementById("consultationDetailsBody");
    const newStatusSelect = document.getElementById("newConsultationStatus");
    const saveStatusButton = document.getElementById("saveConsultationStatus");

    let selectedConsultationId = null;

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
        const parts = dateString.split("-");

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

    function formatTime(timeString) {
        const parts = timeString.split(":");
        const date = new Date();

        date.setHours(Number(parts[0]), Number(parts[1]), 0, 0);

        return date.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        });
    }

    function statusLabel(status) {
        const labels = {
            scheduled: "Scheduled",
            "in-progress": "In progress",
            completed: "Completed",
            cancelled: "Cancelled",
            "no-show": "No-show"
        };

        return labels[status] || "Unknown";
    }

    function updateSummary() {
        document.getElementById("totalConsultations").textContent =
            consultations.length;

        document.getElementById("scheduledConsultations").textContent =
            consultations.filter(item => item.status === "scheduled").length;

        document.getElementById("inProgressConsultations").textContent =
            consultations.filter(item => item.status === "in-progress").length;

        document.getElementById("completedConsultations").textContent =
            consultations.filter(item => item.status === "completed").length;
        renderAttentionQueue();
    }

    function attentionFor(item) {
        const note = String(item.notes || "").toLowerCase();
        if (/chest pain|difficulty breathing|severe bleeding|fainting|unconscious|stroke|urgent|emergency/.test(note) || item.type === "emergency") {
            return { label: "Prompt clinical review", tone: "danger", reason: "Urgent symptom or emergency wording in visit notes" };
        }
        if (item.status === "in-progress") return { label: "Being seen", tone: "warning", reason: "Consultation is already in progress" };
        if (item.status === "scheduled" && /follow-up|cardiac|allergy|assessment/.test(`${item.type} ${item.department} ${note}`)) {
            return { label: "Review today", tone: "warning", reason: "Scheduled follow-up or condition noted" };
        }
        return { label: "Routine", tone: "success", reason: "No demo priority terms identified" };
    }

    function renderAttentionQueue() {
        const queue = document.getElementById("attentionQueue");
        if (!queue) return;
        const ranked = consultations.filter(item => !["completed", "cancelled", "no-show"].includes(item.status))
            .map(item => ({ item, priority: attentionFor(item) }))
            .sort((a, b) => ({ danger: 0, warning: 1, success: 2 }[a.priority.tone] - { danger: 0, warning: 1, success: 2 }[b.priority.tone]));
        document.getElementById("attentionCount").textContent = `${ranked.filter(entry => entry.priority.tone !== "success").length} flagged for review`;
        queue.innerHTML = ranked.length ? ranked.slice(0, 4).map(({ item, priority }) => `<div class="col-12 col-md-6"><div class="border rounded-3 p-3 h-100"><div class="d-flex justify-content-between gap-2"><strong>${escapeHTML(item.patient)}</strong><span class="badge text-bg-${priority.tone}">${priority.label}</span></div><div class="small text-secondary mt-1">${escapeHTML(item.department || item.type)} · ${escapeHTML(item.id)}</div><div class="small mt-2">${escapeHTML(priority.reason)}</div></div></div>`).join("") : '<div class="col-12 text-secondary small">No active consultations to review.</div>';
    }

    function createReportSummary(item) {
        const source = String(item.notes || "No narrative notes were provided.").trim();
        const sentence = source.split(/(?<=[.!?])\s+/)[0];
        return `Visit: ${item.department || item.type || "Consultation"}. Note: ${sentence} Verify this summary against the full record and assess the patient directly.`;
    }

    function getFilteredConsultations() {
        const query = searchInput.value.trim().toLowerCase();
        const selectedStatus = statusFilter.value;
        const selectedDate = dateFilter.value;

        return consultations
            .filter(function (item) {
                const searchable = [
                    item.id,
                    item.patient,
                    item.patientId,
                    item.doctor,
                    item.type,
                    item.department
                ].join(" ").toLowerCase();

                const matchesSearch = searchable.includes(query);
                const matchesStatus =
                    selectedStatus === "all" || item.status === selectedStatus;
                const matchesDate =
                    !selectedDate || item.date === selectedDate;

                return matchesSearch && matchesStatus && matchesDate;
            })
            .sort(function (a, b) {
                return `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`);
            });
    }

    function renderConsultations() {
        const filtered = getFilteredConsultations();

        tableBody.innerHTML = "";

        filtered.forEach(function (item) {
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>
                    <div class="consultation-patient">
                        <div class="consultation-avatar">
                            ${escapeHTML(item.initials)}
                        </div>
                        <div>
                            <strong>${escapeHTML(item.patient)}</strong>
                            <small>${escapeHTML(item.patientId)}</small>
                        </div>
                    </div>
                </td>
                <td>${escapeHTML(item.doctor)}</td>
                <td>
                    <strong class="d-block text-dark fw-semibold">
                        ${escapeHTML(formatDate(item.date))}
                    </strong>
                    <span class="text-secondary small">
                        ${escapeHTML(formatTime(item.time))}
                    </span>
                </td>
                <td>${escapeHTML(item.type)}</td>
                <td>
                    <span class="consultation-status ${escapeHTML(item.status)}">
                        ${escapeHTML(statusLabel(item.status))}
                    </span>
                </td>
                <td>
                    <button type="button" class="consultation-action"
                            data-consultation-id="${escapeHTML(item.id)}">
                        <i class="bi bi-eye me-1"></i>Details
                    </button>
                </td>
            `;

            tableBody.appendChild(row);
        });

        resultsCount.textContent =
            `Showing ${filtered.length} of ${consultations.length} demo consultations`;

        emptyState.classList.toggle("d-none", filtered.length !== 0);
        tableBody.classList.toggle("d-none", filtered.length === 0);
    }

    function showDetails(consultationId) {
        const item = consultations.find(function (entry) {
            return entry.id === consultationId;
        });

        if (!item || !modal) {
            return;
        }

        selectedConsultationId = item.id;
        detailsTitle.textContent = item.patient;
        newStatusSelect.value = item.status;

        detailsBody.innerHTML = `
            <div class="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
                <div>
                    <div class="text-secondary small mb-1">Consultation ID</div>
                    <div class="fw-bold">${escapeHTML(item.id)}</div>
                    <div class="text-secondary small mt-1">
                        Patient ID: ${escapeHTML(item.patientId)}
                    </div>
                </div>
                <span class="consultation-status ${escapeHTML(item.status)}">
                    ${escapeHTML(statusLabel(item.status))}
                </span>
            </div>

            <div class="row g-3">
                <div class="col-12 col-md-6">
                    <div class="consultation-detail-card">
                        <h3 class="h6 fw-bold mb-3">
                            <i class="bi bi-person me-2"></i>Patient and clinician
                        </h3>
                        <div class="mb-3">
                            <div class="consultation-detail-label">Patient</div>
                            <div class="consultation-detail-value">
                                ${escapeHTML(item.patient)}
                            </div>
                        </div>
                        <div>
                            <div class="consultation-detail-label">Doctor</div>
                            <div class="consultation-detail-value">
                                ${escapeHTML(item.doctor)}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-md-6">
                    <div class="consultation-detail-card">
                        <h3 class="h6 fw-bold mb-3">
                            <i class="bi bi-calendar-event me-2"></i>Schedule
                        </h3>
                        <div class="mb-3">
                            <div class="consultation-detail-label">Date and time</div>
                            <div class="consultation-detail-value">
                                ${escapeHTML(formatDate(item.date))},
                                ${escapeHTML(formatTime(item.time))}
                            </div>
                        </div>
                        <div>
                            <div class="consultation-detail-label">Estimated duration</div>
                            <div class="consultation-detail-value">
                                ${escapeHTML(item.duration)}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-12">
                    <div class="consultation-detail-card">
                        <h3 class="h6 fw-bold mb-3">
                            <i class="bi bi-clipboard2-pulse me-2"></i>Session information
                        </h3>
                        <div class="row g-3">
                            <div class="col-12 col-md-6">
                                <div class="consultation-detail-label">Consultation type</div>
                                <div class="consultation-detail-value">
                                    ${escapeHTML(item.type)}
                                </div>
                            </div>
                            <div class="col-12 col-md-6">
                                <div class="consultation-detail-label">Department</div>
                                <div class="consultation-detail-value">
                                    ${escapeHTML(item.department)}
                                </div>
                            </div>
                            <div class="col-12">
                                <div class="consultation-detail-label">Demo notes</div>
                                <div class="consultation-detail-value">
                                    ${escapeHTML(item.notes)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="alert alert-info small mt-3 mb-0">
                <i class="bi bi-info-circle me-2"></i>
                This is a fictional appointment. No real clinical record is displayed.
            </div>
            <section class="border rounded-3 p-3 mt-3" aria-label="AI-assisted report summary">
                <div class="d-flex justify-content-between align-items-center gap-2 flex-wrap">
                    <div><strong><i class="bi bi-stars me-1"></i>AI-assisted visit summary</strong><div class="small text-secondary">Draft from the demo note · clinician review required</div></div>
                    <button type="button" class="btn btn-sm btn-outline-primary" data-generate-summary>Generate summary</button>
                </div>
                <p class="small mt-3 mb-0 d-none" data-summary-output aria-live="polite"></p>
            </section>
            <section class="border rounded-3 p-3 mt-3" aria-label="Medication safety review">
                <strong><i class="bi bi-shield-check me-1"></i>Medication safety checklist · Demo</strong>
                <p class="small text-secondary mt-1">Capture current medicines and patient factors for pharmacist review.</p>
                <label class="form-label small" for="clinicianSafetyMeds">Medicines and doses as recorded</label>
                <textarea class="form-control mb-2" id="clinicianSafetyMeds" rows="2" placeholder="One medicine per line"></textarea>
                <div class="row g-2"><div class="col-6 col-md-3"><label class="form-label small" for="clinicianSafetyAllergies">Allergies</label><input class="form-control form-control-sm" id="clinicianSafetyAllergies" placeholder="Known / unknown"></div><div class="col-6 col-md-3"><label class="form-label small" for="clinicianSafetyAge">Age</label><input class="form-control form-control-sm" id="clinicianSafetyAge" type="number" min="0" max="120"></div><div class="col-6 col-md-3"><label class="form-label small" for="clinicianSafetyWeight">Weight (kg)</label><input class="form-control form-control-sm" id="clinicianSafetyWeight" type="number" min="1" step="0.1"></div><div class="col-6 col-md-3"><label class="form-label small" for="clinicianSafetyRenal">Renal function</label><select class="form-select form-select-sm" id="clinicianSafetyRenal"><option>Unknown</option><option>Reported normal</option><option>Reported impaired</option></select></div></div>
                <button class="btn btn-sm btn-outline-primary mt-3" type="button" data-run-med-review>Prepare review checklist</button>
                <div class="small mt-3 d-none" data-med-review-output aria-live="polite"></div>
                <p class="small text-secondary mt-3 mb-0">RxNorm, DrugBank and openFDA are not connected. Interaction, contraindication, and dose checks are unavailable; this does not clear a prescription.</p>
            </section>
        `;

        detailsBody.querySelector("[data-generate-summary]").addEventListener("click", function () {
            const output = detailsBody.querySelector("[data-summary-output]");
            output.textContent = createReportSummary(item);
            output.classList.remove("d-none");
        });

        detailsBody.querySelector("[data-run-med-review]").addEventListener("click", function () {
            const entered = detailsBody.querySelector("#clinicianSafetyMeds").value.trim();
            const allergy = detailsBody.querySelector("#clinicianSafetyAllergies").value.trim();
            const medicationsEntered = entered.split(/\n+/).filter(Boolean);
            const matches = allergy && !/^(unknown|none known)$/i.test(allergy)
                ? medicationsEntered.filter(medication => medication.toLowerCase().includes(allergy.toLowerCase()) || allergy.toLowerCase().includes(medication.toLowerCase()))
                : [];
            const output = detailsBody.querySelector("[data-med-review-output]");
            output.innerHTML = `<div class="alert ${matches.length ? "alert-warning" : "alert-info"} mb-0"><strong>${matches.length ? "Possible name match — verify" : "Checklist prepared; pharmacist review required"}</strong><ul class="mb-0 mt-2"><li>${medicationsEntered.length} medication entries captured.</li><li>${matches.length ? `Possible allergy/name match: ${matches.map(escapeHTML).join(", ")}.` : "No direct text match; this does not rule out an allergy."}</li><li>Drug interactions, contraindications, and dosing have not been validated.</li><li>Age: ${escapeHTML(detailsBody.querySelector("#clinicianSafetyAge").value || "not provided")} · weight: ${escapeHTML(detailsBody.querySelector("#clinicianSafetyWeight").value || "not provided")} kg · renal function: ${escapeHTML(detailsBody.querySelector("#clinicianSafetyRenal").value)}.</li></ul></div>`;
            output.classList.remove("d-none");
        });

        modal.show();
    }

    function resetFilters() {
        searchInput.value = "";
        statusFilter.value = "all";
        dateFilter.value = "";
        renderConsultations();
    }

    searchInput.addEventListener("input", renderConsultations);
    statusFilter.addEventListener("change", renderConsultations);
    dateFilter.addEventListener("change", renderConsultations);

    document.getElementById("resetFilters").addEventListener("click", resetFilters);
    document.getElementById("emptyReset").addEventListener("click", resetFilters);

    tableBody.addEventListener("click", function (event) {
        const button = event.target.closest("[data-consultation-id]");

        if (button) {
            showDetails(button.dataset.consultationId);
        }
    });

    saveStatusButton.addEventListener("click", async function () {
        const item = consultations.find(function (entry) {
            return entry.id === selectedConsultationId;
        });

        if (!item) {
            return;
        }

        const newStatus = newStatusSelect.value;
        const previousStatus = item.status;

        saveStatusButton.disabled = true;

        try {
            const response = await fetch(
                `http://localhost:3000/api/hospital/consultations/${encodeURIComponent(item.id)}/status`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        status: newStatus
                    })
                }
            );

            const result = await response.json();

            if (!response.ok || result.success !== true) {
                throw new Error(
                    result.message || "Unable to save consultation status."
                );
            }

            item.status = result.consultation.status;

            updateSummary();
            renderConsultations();

            const statusBadge =
                detailsBody.querySelector(".consultation-status");

            if (statusBadge) {
                statusBadge.className =
                    `consultation-status ${escapeHTML(item.status)}`;
                statusBadge.textContent = statusLabel(item.status);
            }

            if (typeof window.showPortalNotice === "function") {
                window.showPortalNotice(
                    "Consultation status saved successfully.",
                    "success"
                );
            }

        } catch (error) {
            console.error("Consultation status update failed:", error);

            item.status = previousStatus;
            newStatusSelect.value = previousStatus;

            if (typeof window.showPortalNotice === "function") {
                window.showPortalNotice(
                    error.message || "Unable to save consultation status.",
                    "error"
                );
            } else {
                alert(error.message || "Unable to save consultation status.");
            }

        } finally {
            saveStatusButton.disabled = false;
        }
    });

    loadConsultationsFromAPI();
});

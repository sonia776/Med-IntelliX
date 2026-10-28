
/* =========================================
   MedIntelliX — Health Records
   File: js/patient/health-records.js
   DEMO DATA ONLY
   ========================================= */

document.addEventListener("DOMContentLoaded", function () {
    const recordsList = document.getElementById("recordsList");
    const searchInput = document.getElementById("recordSearch");
    const typeFilter = document.getElementById("recordTypeFilter");
    const emptyState = document.getElementById("recordEmpty");

    if (!recordsList || !searchInput || !typeFilter || !emptyState) {
        return;
    }

    let records = Array.from(
        recordsList.querySelectorAll(".record-card")
    );

    const yearElement = document.getElementById("recordsYear");

    if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
}

async function loadRecords() {
    recordsList.setAttribute("aria-busy", "true");

    try {
        const response = await fetch(
            "http://localhost:3000/api/patients/DEMO-001/records"
        );

        if (!response.ok) {
            throw new Error("Unable to load demonstration records.");
        }

        const data = await response.json();

        if (!data.success || !Array.isArray(data.records)) {
            throw new Error("Invalid records response.");
        }

        recordsList.replaceChildren();

        data.records.forEach(function (item) {
            const card = document.createElement("article");
            card.className = "record-card";

            // Map the database's record type to an existing filter value.
            const recordType = /consultation|checkup/i.test(
                item.recordType || ""
            )
                ? "consultation"
                : "diagnosis";

            card.dataset.type = recordType;
            card.dataset.search = [
                item.recordType,
                item.description,
                data.patient.fullName
            ].filter(Boolean).join(" ").toLowerCase();

            const header = document.createElement("div");
            header.className = "record-card-header";

            const titleGroup = document.createElement("div");
            titleGroup.className = "record-card-title";

            const iconBox = document.createElement("div");
            iconBox.className = "record-type-icon";

            const icon = document.createElement("i");
            icon.className = "bi bi-clipboard2-pulse";
            iconBox.appendChild(icon);

            const titleDetails = document.createElement("div");

            const title = document.createElement("h2");
            title.textContent = item.recordType || "Health record";

            const date = document.createElement("p");
            date.textContent = item.recordedAt
                ? "Recorded: " + new Date(item.recordedAt).toLocaleDateString()
                : "Date not available";

            titleDetails.append(title, date);
            titleGroup.append(iconBox, titleDetails);

            const status = document.createElement("span");
            status.className = "record-status";
            status.textContent = "Sample entry";

            header.append(titleGroup, status);

            const description = document.createElement("p");
            description.className = "record-description";
            description.textContent = item.description || "No description provided.";

            const details = document.createElement("div");
            details.className = "record-details";

            const patientDetail = document.createElement("span");
            patientDetail.className = "record-detail";
            patientDetail.textContent =
                "Patient: " + data.patient.fullName;

            const typeDetail = document.createElement("span");
            typeDetail.className = "record-detail";
            typeDetail.textContent = "Type: " + (item.recordType || "Unspecified");

            details.append(patientDetail, typeDetail);

            const actions = document.createElement("div");
            actions.className = "record-actions";

            const button = document.createElement("button");
            button.type = "button";
            button.className = "record-button record-view-button";
            button.textContent = "View details";

            actions.appendChild(button);
            card.append(header, description, details, actions);
            recordsList.appendChild(card);
        });

        records = Array.from(
            recordsList.querySelectorAll(".record-card")
        );

        updateSummary();
        filterRecords();

    } catch (error) {
        console.error("Health records loading failed:", error);

        recordsList.replaceChildren();

        emptyState.style.display = "block";
        emptyState.querySelector("strong").textContent =
            "Records could not be loaded";

        emptyState.querySelector("span").textContent =
            "Check that the MedIntelliX backend and database are running.";

        return;

    } finally {
        recordsList.setAttribute("aria-busy", "false");
    }

    emptyState.querySelector("strong").textContent =
        "No matching records";

    emptyState.querySelector("span").textContent =
        "Try a different search term or record type.";
}
    function filterRecords() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        const selectedType = typeFilter.value;

        let visibleCount = 0;

        records.forEach(function (record) {
            const searchableText = (
                record.dataset.search + " " + record.textContent
            ).toLowerCase();

            const matchesSearch = searchableText.includes(searchTerm);

            const matchesType =
                selectedType === "all" ||
                record.dataset.type === selectedType;

            const shouldShow = matchesSearch && matchesType;

            record.hidden = !shouldShow;

            if (shouldShow) {
                visibleCount++;
            }
        });

        emptyState.style.display =
            visibleCount === 0 ? "block" : "none";
    }

    function updateSummary() {
        const totalElement = document.getElementById("totalRecords");
        const consultationsElement =
            document.getElementById("consultationCount");
        const facilitiesElement =
            document.getElementById("facilityCount");

        const consultations = records.filter(function (record) {
            return record.dataset.type === "consultation";
        });

        const facilities = new Set();

        records.forEach(function (record) {
            const facilityElement = record.querySelector(
                ".record-details .record-detail:nth-child(2)"
            );

            if (facilityElement) {
                facilities.add(facilityElement.textContent.trim());
            }
        });

        if (totalElement) {
            totalElement.textContent = String(records.length);
        }

        if (consultationsElement) {
            consultationsElement.textContent = String(consultations.length);
        }

        if (facilitiesElement) {
            facilitiesElement.textContent = String(facilities.size);
        }
    }

    function showRecordDetails(record) {
        const titleElement = record.querySelector(".record-card-title h2");
        const descriptionElement = record.querySelector(".record-description");
        const dateElement = record.querySelector(".record-card-title p");

        const modalTitle = document.getElementById("recordModalTitle");
        const modalBody = document.getElementById("recordModalBody");

        if (!modalTitle || !modalBody || !titleElement || !descriptionElement) {
            return;
        }

        // Use textContent so record text is not interpreted as HTML.
        modalTitle.textContent = titleElement.textContent.trim();
        modalBody.replaceChildren();

        const notice = document.createElement("p");
        notice.className = "small text-secondary";
        notice.textContent =
            "Fictional demonstration content — not a real medical record.";

        const description = document.createElement("p");
        description.textContent = descriptionElement.textContent.trim();

        modalBody.append(notice, description);

        if (dateElement) {
            const date = document.createElement("p");
            date.className = "small text-secondary mb-0";
            date.textContent = dateElement.textContent.trim();
            modalBody.appendChild(date);
        }

        const modalElement = document.getElementById("recordDetailsModal");

        if (modalElement && window.bootstrap) {
            window.bootstrap.Modal.getOrCreateInstance(modalElement).show();
        }
    }

    searchInput.addEventListener("input", filterRecords);
typeFilter.addEventListener("change", filterRecords);

recordsList.addEventListener("click", function (event) {
    const button = event.target.closest(".record-view-button");

    if (!button || !recordsList.contains(button)) {
        return;
    }

    const record = button.closest(".record-card");

    if (record) {
        showRecordDetails(record);
    }
});

loadRecords();
});

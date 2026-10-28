
document.addEventListener("DOMContentLoaded", function () {
    const safetyForm = document.getElementById("medSafetyForm");
    safetyForm.addEventListener("submit", function (event) {
        event.preventDefault();
        const medicines = document.getElementById("safetyMeds").value.trim().split(/\n+/).filter(Boolean);
        const allergyText = document.getElementById("safetyAllergies").value.trim();
        const result = document.getElementById("medSafetyResult");
        const possibleMatches = allergyText.toLowerCase() === "none known" ? [] : medicines.filter(medicine => allergyText.toLowerCase().includes(medicine.toLowerCase()) || medicine.toLowerCase().includes(allergyText.toLowerCase()));
        result.innerHTML = `<div class="alert ${possibleMatches.length ? "alert-warning" : "alert-info"} mb-0"><strong>${possibleMatches.length ? "Possible name match — verify with a clinician" : "Safety checklist prepared"}</strong><ul class="mt-2 mb-2"><li>${medicines.length} medication entries captured for review.</li><li>${possibleMatches.length ? `Check possible medication/allergy name match: ${possibleMatches.map(escapeHTML).join(", ")}.` : "No text match found between the allergy entry and medication names; this does not rule out an allergy."}</li><li>Interaction screening, contraindications, and age/weight/renal dose validation: not available in this demo.</li><li>Patient context recorded: age ${escapeHTML(document.getElementById("safetyAge").value)}, ${escapeHTML(document.getElementById("safetyWeight").value)} kg, renal function ${escapeHTML(document.getElementById("safetyRenal").value)}.</li></ul>Have a pharmacist or prescriber verify the complete medication list before changing treatment.</div>`;
    });

    function escapeHTML(value) {
        return String(value).replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character]));
    }
    const yearElement = document.getElementById("medicationsYear");

    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }

    const searchInput = document.getElementById("medicationSearch");
    const statusFilter = document.getElementById("medicationStatusFilter");
    const medicationCards = Array.from(
        document.querySelectorAll(".medication-card")
    );
    const emptyState = document.getElementById("medicationEmpty");

    const medications = [
        {
            name: "Example Medication A",
            reference: "MED-DEMO-001",
            status: "Active (demo)",
            provider: "Example Clinic",
            date: "12 Oct 2026",
            instructions: "See the original prescription."
        },
        {
            name: "Example Medication B",
            reference: "MED-DEMO-002",
            status: "Active (demo)",
            provider: "Sample Health Centre",
            date: "05 Oct 2026",
            instructions: "See the original prescription."
        },
        {
            name: "Example Medication C",
            reference: "MED-DEMO-003",
            status: "Completed (demo)",
            provider: "Example Medical Centre",
            date: "18 Sep 2026",
            instructions: "Refer to the archived record."
        }
    ];

    function filterMedications() {
        const query = searchInput.value.trim().toLowerCase();
        const selectedStatus = statusFilter.value;
        let visibleCount = 0;

        medicationCards.forEach(function (card) {
            const searchableText = card.textContent.toLowerCase();
            const cardStatus = card.dataset.status;

            const matchesSearch = searchableText.includes(query);
            const matchesStatus =
                selectedStatus === "all" || cardStatus === selectedStatus;

            const shouldShow = matchesSearch && matchesStatus;

            card.hidden = !shouldShow;

            if (shouldShow) {
                visibleCount++;
            }
        });

        emptyState.style.display = visibleCount === 0 ? "block" : "none";
    }

    if (searchInput && statusFilter && emptyState) {
        searchInput.addEventListener("input", filterMedications);
        statusFilter.addEventListener("change", filterMedications);
    }

    const totalElement = document.getElementById("totalMedications");
    const activeElement = document.getElementById("activeMedications");
    const completedElement = document.getElementById("completedMedications");

    if (totalElement) {
        totalElement.textContent = medications.length;
    }

    if (activeElement) {
        activeElement.textContent = medications.filter(function (medication) {
            return medication.status.startsWith("Active");
        }).length;
    }

    if (completedElement) {
        completedElement.textContent = medications.filter(function (medication) {
            return medication.status.startsWith("Completed");
        }).length;
    }

    // Open the details modal for the selected fictional record.
    const modalElement = document.getElementById("medicationDetailsModal");

    if (modalElement && window.bootstrap) {
        const medicationModal = new bootstrap.Modal(modalElement);

        document.querySelectorAll("[data-medication]").forEach(function (button) {
            button.addEventListener("click", function () {
                const index = Number(button.dataset.medication);
                const medication = medications[index];

                if (!medication) {
                    return;
                }

                document.getElementById("medicationModalTitle").textContent =
                    medication.name;

                document.getElementById("modalMedicationReference").textContent =
                    medication.reference;

                document.getElementById("modalMedicationStatus").textContent =
                    medication.status;

                document.getElementById("modalMedicationProvider").textContent =
                    medication.provider;

                document.getElementById("modalMedicationDate").textContent =
                    medication.date;

                document.getElementById("modalMedicationInstructions").textContent =
                    medication.instructions;

                medicationModal.show();
            });
        });
    }
});

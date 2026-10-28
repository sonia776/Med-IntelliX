
document.addEventListener("DOMContentLoaded", function () {
    const yearElement = document.getElementById("appointmentsYear");

    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }

    const appointments = [
        {
            reference: "APT-DEMO-001",
            title: "General Consultation",
            status: "scheduled",
            provider: "Dr. Sample Provider",
            clinic: "Example Health Centre",
            date: "28 Oct 2026",
            time: "10:30 AM"
        },
        {
            reference: "APT-DEMO-002",
            title: "Routine Follow-up",
            status: "completed",
            provider: "Dr. Example Clinician",
            clinic: "Sample Medical Centre",
            date: "09 Oct 2026",
            time: "02:00 PM"
        },
        {
            reference: "APT-DEMO-003",
            title: "Specialist Consultation",
            status: "cancelled",
            provider: "Dr. Demo Specialist",
            clinic: "Example Hospital",
            date: "22 Sep 2026",
            time: "11:15 AM"
        }
    ];

    let cards = Array.from(
        document.querySelectorAll(".appointment-card")
    );

    const searchInput = document.getElementById("appointmentSearch");
    const statusFilter = document.getElementById("appointmentStatusFilter");
    const emptyState = document.getElementById("appointmentEmpty");

    const symptomForm = document.getElementById("symptomForm");
    symptomForm.addEventListener("submit", function (event) {
        event.preventDefault();
        const symptoms = document.getElementById("symptomInput").value.trim();
        const location = document.getElementById("symptomLocation").value.trim();
        const result = document.getElementById("symptomResult");
        const text = symptoms.toLowerCase();
        const emergency = /chest pain|difficulty breathing|can't breathe|cannot breathe|fainting|unconscious|stroke|severe bleeding/.test(text);
        let guidance = "Your symptoms may have several causes. Rest, drink fluids, and arrange a clinician consultation if they persist, worsen, or concern you.";
        if (/fever|temperature|chills/.test(text)) guidance = "Monitor your temperature, rest, and drink fluids. Seek medical advice if the fever is high, persists, or you feel worse.";
        if (/headache|migraine/.test(text)) guidance = "Rest in a quiet place and drink water. Seek medical advice for a sudden severe headache, new neurological symptoms, or worsening pain.";
        if (/cough|sore throat|runny nose/.test(text)) guidance = "Rest, drink fluids, and consider limiting close contact while unwell. Contact a clinician if breathing becomes difficult or symptoms worsen.";
        result.innerHTML = `<div class="alert ${emergency ? "alert-danger" : "alert-info"} mb-2"><strong>${emergency ? "Urgent care may be needed" : "General guidance — not a diagnosis"}</strong><p class="mb-0 mt-1">${emergency ? "These symptoms can be urgent. Contact your local emergency number or go to the nearest emergency department now." : guidance}</p></div><div class="border rounded-3 p-3"><strong><i class="bi bi-geo-alt me-1"></i>Sample provider near ${escapeHTML(location)}</strong><div class="mt-1">Example Hospital · Dr. Sample Provider, General Medicine</div><small class="text-secondary">Demo listing only; distance, availability and location have not been verified.</small></div>`;
    });

    document.getElementById("bookingDate").min = new Date().toISOString().slice(0, 10);
    document.getElementById("bookingForm").addEventListener("submit", function (event) {
        event.preventDefault();
        const hospital = document.getElementById("bookingHospital").value;
        const doctor = document.getElementById("bookingDoctor").value;
        const date = document.getElementById("bookingDate").value;
        const mode = document.getElementById("bookingMode").value;
        const message = document.getElementById("bookingResult");
        const dateValue = new Date(`${date}T00:00:00`);
        const month = dateValue.toLocaleDateString("en", { month: "short" });
        const day = dateValue.toLocaleDateString("en", { day: "2-digit" });
        const year = dateValue.getFullYear();
        const id = `APT-DEMO-${String(appointments.length + 1).padStart(3, "0")}`;
        appointments.push({ reference: id, title: "New consultation", status: "scheduled", provider: doctor.split(" · ")[0], clinic: hospital, date: dateValue.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }), time: "Time to be confirmed" });
        const card = document.createElement("article");
        card.className = "appointment-card";
        card.dataset.status = "scheduled";
        card.innerHTML = `<div class="appointment-date-box"><span class="month">${escapeHTML(month)}</span><span class="day">${escapeHTML(day)}</span><span class="year">${year}</span></div><div class="appointment-main"><h2>New consultation</h2><p>${escapeHTML(doctor)} · ${escapeHTML(hospital)}</p><div class="appointment-meta"><span><i class="bi bi-camera-video"></i> ${escapeHTML(mode)}</span><span><i class="bi bi-clock"></i> Time to be confirmed</span><span><i class="bi bi-hash"></i> ${escapeHTML(id)}</span></div></div><div class="appointment-actions"><span class="appointment-status">Request created (demo)</span></div>`;
        document.getElementById("appointmentList").prepend(card);
        cards = Array.from(document.querySelectorAll(".appointment-card"));
        document.getElementById("totalAppointments").textContent = appointments.length;
        document.getElementById("scheduledAppointments").textContent = appointments.filter(item => item.status === "scheduled").length;
        filterAppointments();
        message.className = "small mt-3 text-success";
        message.textContent = `Demo request added: ${doctor} at ${hospital} on ${date} (${mode}). The clinic has not received or confirmed this request.`;
    });

    function escapeHTML(value) {
        return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
    }

    function filterAppointments() {
        const query = searchInput.value.trim().toLowerCase();
        const selectedStatus = statusFilter.value;
        let visibleCount = 0;

        cards.forEach(function (card) {
            const text = card.textContent.toLowerCase();
            const matchesSearch = text.includes(query);
            const matchesStatus =
                selectedStatus === "all" ||
                card.dataset.status === selectedStatus;

            const visible = matchesSearch && matchesStatus;
            card.hidden = !visible;

            if (visible) {
                visibleCount++;
            }
        });

        emptyState.style.display = visibleCount === 0 ? "block" : "none";
    }

    searchInput.addEventListener("input", filterAppointments);
    statusFilter.addEventListener("change", filterAppointments);

    const count = function (status) {
        return appointments.filter(function (appointment) {
            return appointment.status === status;
        }).length;
    };

    document.getElementById("totalAppointments").textContent =
        appointments.length;

    document.getElementById("scheduledAppointments").textContent =
        count("scheduled");

    document.getElementById("completedAppointments").textContent =
        count("completed");

    const modalElement = document.getElementById("appointmentDetailsModal");

    if (modalElement && window.bootstrap) {
        const modal = new bootstrap.Modal(modalElement);

        document.querySelectorAll("[data-appointment]").forEach(function (button) {
            button.addEventListener("click", function () {
                const index = Number(button.dataset.appointment);
                const appointment = appointments[index];

                if (!appointment) {
                    return;
                }

                document.getElementById("appointmentModalTitle").textContent =
                    appointment.title;

                document.getElementById("modalAppointmentReference").textContent =
                    appointment.reference;

                document.getElementById("modalAppointmentStatus").textContent =
                    appointment.status.charAt(0).toUpperCase() +
                    appointment.status.slice(1) + " (demo)";

                document.getElementById("modalAppointmentProvider").textContent =
                    appointment.provider;

                document.getElementById("modalAppointmentClinic").textContent =
                    appointment.clinic;

                document.getElementById("modalAppointmentDate").textContent =
                    appointment.date;

                document.getElementById("modalAppointmentTime").textContent =
                    appointment.time;

                modal.show();
            });
        });
    }
});

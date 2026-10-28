/* =========================================
   MedIntelliX — Shared Portal JavaScript
   File: js/common.js
   ========================================= */

document.addEventListener("DOMContentLoaded", function () {
    initializePortalSidebar();
    initializePortalNotifications();
    initializePortalLinks();
    syncPortalUserProfile();
});

/* ---------- Mobile Sidebar ---------- */

function initializePortalSidebar() {
    const sidebar = document.getElementById("patientSidebar");
    const overlay = document.getElementById("sidebarOverlay");
    const toggleButton = document.getElementById("sidebarToggle");

    if (!sidebar || !overlay || !toggleButton) {
        return;
    }

    function openSidebar() {
        sidebar.classList.add("sidebar-open");
        overlay.classList.add("overlay-visible");

        toggleButton.setAttribute("aria-expanded", "true");
        overlay.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
    }

    function closeSidebar() {
        sidebar.classList.remove("sidebar-open");
        overlay.classList.remove("overlay-visible");

        toggleButton.setAttribute("aria-expanded", "false");
        overlay.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
    }

    function toggleSidebar() {
        const isOpen = sidebar.classList.contains("sidebar-open");

        if (isOpen) {
            closeSidebar();
        } else {
            openSidebar();
        }
    }

    toggleButton.setAttribute("aria-controls", sidebar.id);
    toggleButton.setAttribute("aria-expanded", "false");
    overlay.setAttribute("aria-hidden", "true");

    toggleButton.addEventListener("click", toggleSidebar);
    overlay.addEventListener("click", closeSidebar);

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeSidebar();
        }
    });

    sidebar.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", function () {
            closeSidebar();
        });
    });

    window.addEventListener("resize", function () {
        if (window.innerWidth > 900) {
            closeSidebar();
        }
    });
}

/* ---------- Portal Notifications ---------- */

function showPortalNotice(message, type = "info") {
    let notice = document.getElementById("portalNotice");

    if (!notice) {
        notice = document.createElement("div");
        notice.id = "portalNotice";
        notice.className = "portal-notice";
        notice.setAttribute("role", "status");
        notice.setAttribute("aria-live", "polite");

        document.body.appendChild(notice);
    }

    notice.className = "portal-notice portal-notice-" + type;
    notice.textContent = message;
    notice.hidden = false;

    if (notice.hideTimeout) {
        clearTimeout(notice.hideTimeout);
    }

    notice.hideTimeout = setTimeout(function () {
        notice.hidden = true;
    }, 4000);
}

function initializePortalNotifications() {
    const notificationButton = document.getElementById("notificationButton");

    if (!notificationButton) {
        return;
    }

    notificationButton.addEventListener("click", function () {
        showPortalNotice(
            "System is connected to MedIntelliX secure health network. No unread urgent alerts.",
            "info"
        );
    });
}

/* ---------- Portal Session & Logout ---------- */

function initializePortalLinks() {
    const logoutLink = document.getElementById("logoutLink");

    if (logoutLink) {
        logoutLink.addEventListener("click", function (event) {
            event.preventDefault();

            // Clear authentication session
            localStorage.removeItem("medintellix_token");
            localStorage.removeItem("medintellix_user");

            showPortalNotice("Signing out of MedIntelliX...", "info");

            setTimeout(() => {
                // Determine path to login page depending on current location
                const isSubdir = window.location.pathname.includes("/patient/") ||
                                 window.location.pathname.includes("/hospital/") ||
                                 window.location.pathname.includes("/government/");
                window.location.href = isSubdir ? "../login.html" : "pages/login.html";
            }, 600);
        });
    }
}

/**
 * Synchronize header user avatars and names with active session.
 */
function syncPortalUserProfile() {
    try {
        const storedUser = localStorage.getItem("medintellix_user");
        if (!storedUser) return;

        const user = JSON.parse(storedUser);

        // Patient elements
        const patientNameEl = document.getElementById("patientName");
        const welcomeNameEl = document.getElementById("welcomeName");
        const profileInitialsEl = document.getElementById("profileInitials");
        const uhidBadgeEl = document.getElementById("userUhidBadge");

        if (user.fullName) {
            if (patientNameEl) patientNameEl.textContent = user.fullName;
            if (welcomeNameEl) {
                const firstName = user.fullName.split(" ")[0];
                welcomeNameEl.textContent = firstName;
            }
            if (profileInitialsEl) {
                const parts = user.fullName.split(/\s+/).filter(Boolean);
                const initials = parts.map(p => p[0]).join("").slice(0, 2).toUpperCase();
                profileInitialsEl.textContent = initials;
            }
        }

        // Hospital elements
        const hospitalNameEl = document.getElementById("hospitalNameShort");
        const hospitalOrgEl = document.getElementById("hospitalOrganisationName");
        const hospitalInitialsEl = document.getElementById("hospitalInitials");

        if (user.role === "hospital" && user.fullName) {
            if (hospitalNameEl) hospitalNameEl.textContent = user.fullName;
            if (hospitalOrgEl) hospitalOrgEl.textContent = user.fullName;
            if (hospitalInitialsEl) {
                const parts = user.fullName.split(/\s+/).filter(Boolean);
                hospitalInitialsEl.textContent = parts.map(p => p[0]).join("").slice(0, 2).toUpperCase();
            }
        }

        // If a UHID badge exists or we can inject it
        if (user.uhid && uhidBadgeEl) {
            uhidBadgeEl.textContent = user.uhid;
        }
    } catch {
        // Silently ignore localStorage parse errors
    }
}

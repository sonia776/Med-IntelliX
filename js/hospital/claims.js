document.addEventListener("DOMContentLoaded", function () {
    const readStore = key => {
        try { return JSON.parse(localStorage.getItem(key) || "[]"); }
        catch (_) { return []; }
    };
    const writeStore = (key, value) => localStorage.setItem(key, JSON.stringify(value));
    let policies = readStore("medintellix-demo-policies");
    let claims = readStore("medintellix-demo-claims");
    const statuses = ["Draft", "Submitted", "Under review", "More information needed", "Approved", "Partially approved", "Denied", "Disputed", "Paid", "Closed"];

    function escapeHTML(value) {
        return String(value).replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character]));
    }

    function renderPolicies() {
        const target = document.getElementById("policyList");
        target.innerHTML = policies.length ? `<strong>Saved demo policies</strong><ul class="mb-0 mt-1">${policies.map(policy => `<li>${escapeHTML(policy.patient)} · ${escapeHTML(policy.payer)} · ${escapeHTML(policy.number)} · ${escapeHTML(policy.status)}${policy.coverage ? ` — ${escapeHTML(policy.coverage)}` : ""}</li>`).join("")}</ul>` : "No policy records yet.";
    }

    function renderClaims() {
        const table = document.getElementById("claimsTable");
        document.getElementById("claimCount").textContent = `${claims.length} request${claims.length === 1 ? "" : "s"}`;
        table.innerHTML = claims.length ? claims.map((claim, index) => `<tr><td><strong>${escapeHTML(claim.id)}</strong><div class="small text-secondary">${escapeHTML(claim.type)}</div></td><td>${escapeHTML(claim.patient)}</td><td>${escapeHTML(claim.payer)}<div class="small text-secondary">${escapeHTML(claim.policy)}</div></td><td>${escapeHTML(claim.amount ? `₹${claim.amount}` : "Amount not entered")}</td><td><span class="badge ${claim.codeCheck === "Format looks valid" ? "text-bg-success" : "text-bg-warning"}">${escapeHTML(claim.codeCheck)}</span></td><td><select class="form-select form-select-sm" data-claim-status="${index}" aria-label="Update claim status">${statuses.map(status => `<option ${claim.status === status ? "selected" : ""}>${escapeHTML(status)}</option>`).join("")}</select></td></tr>`).join("") : '<tr><td colspan="6" class="text-center text-secondary py-4">No demo requests yet. Prepare a pre-authorization draft above.</td></tr>';
        table.querySelectorAll("[data-claim-status]").forEach(select => select.addEventListener("change", function () {
            claims[Number(select.dataset.claimStatus)].status = select.value;
            writeStore("medintellix-demo-claims", claims);
        }));
    }

    document.getElementById("policyForm").addEventListener("submit", function (event) {
        event.preventDefault();
        policies.push({ patient: document.getElementById("policyPatient").value.trim(), payer: document.getElementById("payerName").value.trim(), number: document.getElementById("policyNumber").value.trim(), status: document.getElementById("policyStatus").value, coverage: document.getElementById("coverageSummary").value.trim() });
        writeStore("medintellix-demo-policies", policies);
        renderPolicies();
        document.getElementById("policyNotice").textContent = "Saved in this browser only.";
        event.target.reset();
    });

    document.getElementById("claimForm").addEventListener("submit", function (event) {
        event.preventDefault();
        const patient = document.getElementById("claimPatient").value.trim();
        const policy = document.getElementById("claimPolicy").value.trim();
        const note = document.getElementById("clinicalNote").value.trim();
        const icd = document.getElementById("icdCodes").value.split(",").map(code => code.trim()).filter(Boolean);
        const cpt = document.getElementById("cptCodes").value.split(",").map(code => code.trim()).filter(Boolean);
        const invalidCodes = icd.some(code => !/^[A-TV-Z][0-9][A-Z0-9](\.[A-Z0-9]{1,4})?$/i.test(code)) || cpt.some(code => !/^\d{5}$/.test(code));
        const missing = [];
        if (!icd.length) missing.push("ICD-10 code");
        if (!cpt.length) missing.push("CPT code");
        if (!document.getElementById("claimAmount").value) missing.push("estimated amount");
        if (!policies.some(item => item.number === policy)) missing.push("policy not found in saved demo policies");
        const codeCheck = invalidCodes ? "Check code format" : missing.length ? "Needs completion" : "Format looks valid";
        const id = `CLM-DEMO-${String(Date.now()).slice(-6)}`;
        const payer = policies.find(item => item.number === policy)?.payer || "Unverified payer";
        claims.unshift({ id, type: "Pre-authorization", patient, policy, payer, amount: document.getElementById("claimAmount").value, note, icd, cpt, codeCheck, status: "Draft" });
        writeStore("medintellix-demo-claims", claims);
        document.getElementById("claimDraft").innerHTML = `<div class="alert ${missing.length || invalidCodes ? "alert-warning" : "alert-success"}"><h3 class="h6 fw-bold">Draft ${escapeHTML(id)} · ${invalidCodes ? "Check code format" : missing.length ? "Needs completion" : "Ready for human review"}</h3><p><strong>Patient:</strong> ${escapeHTML(patient)} · <strong>Payer:</strong> ${escapeHTML(payer)} · <strong>Policy:</strong> ${escapeHTML(policy)}</p><p><strong>Service rationale:</strong> ${escapeHTML(note)}</p><p><strong>ICD-10:</strong> ${escapeHTML(icd.join(", ") || "Not provided")} · <strong>CPT:</strong> ${escapeHTML(cpt.join(", ") || "Not provided")}</p><p class="mb-0">${invalidCodes ? "One or more codes do not match the expected basic format. " : ""}${missing.length ? `Incomplete: ${escapeHTML(missing.join(", "))}. ` : ""}This draft has not been submitted. A qualified billing specialist must verify codes, coverage, and medical necessity.</p></div>`;
        renderClaims();
    });

    renderPolicies();
    renderClaims();
});

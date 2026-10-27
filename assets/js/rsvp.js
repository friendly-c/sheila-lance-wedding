import { isMockMode, loadInvitation, submitRsvp } from "./rsvp-adapter.js";

const page = document.querySelector("[data-rsvp-page]");
if (page) initRsvp(page);

const FALLBACK_MEALS = [
  { code: "roast-veg", label: "Roast squash, crispy sage & lentils (vegan)" },
  { code: "chicken", label: "Lemon thyme chicken, potatoes & greens" },
  { code: "fish", label: "Herb-baked fish, buttery new potatoes" },
];

async function initRsvp(pageRoot) {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("invite") || params.get("token") || "";
  const loading = pageRoot.querySelector("[data-rsvp-loading]");
  const content = pageRoot.querySelector("[data-rsvp-content]");
  const error = pageRoot.querySelector("[data-rsvp-error]");
  const form = pageRoot.querySelector("[data-rsvp-form]");
  const submittedPanel = pageRoot.querySelector("[data-rsvp-confirmation]");
  const guestList = pageRoot.querySelector("[data-rsvp-guests]");
  const note = pageRoot.querySelector("[data-invite-note]");
  const submitButton = pageRoot.querySelector("[data-rsvp-submit]");
  const status = pageRoot.querySelector("[data-rsvp-status]");

  pageRoot.querySelectorAll("[data-rsvp-demo-only]").forEach((element) => {
    element.hidden = !isMockMode;
  });
  const modeHint = pageRoot.querySelector("[data-rsvp-mode-hint]");
  if (modeHint) {
    modeHint.textContent = isMockMode
      ? "Demo only. Your response will not be sent to the couple."
      : "Your response is sent securely to the couple's private RSVP spreadsheet.";
  }
  const dietaryHint = pageRoot.querySelector("[data-dietary-hint]");
  if (dietaryHint) {
    dietaryHint.textContent = isMockMode
      ? "This prototype stores notes only in this browser."
      : "Please share only information needed for catering or accessibility.";
  }

  let result;
  try {
    result = await loadInvitation(token);
  } catch {
    result = { ok: false, reason: "unavailable" };
  }
  loading.hidden = true;

  if (!result.ok) {
    error.hidden = false;
    const invalidCopy = pageRoot.querySelector("[data-invalid-token]");
    if (result.reason === "unavailable") {
      invalidCopy.textContent = "We couldn't reach the RSVP service just now. Please check your connection and try refreshing this page in a moment.";
    } else if (result.reason === "setup-error") {
      invalidCopy.textContent = "This invitation needs attention from the couple. Please contact them directly so they can check your guest list.";
    } else {
      invalidCopy.textContent = token
        ? "That invitation link doesn't match an active invitation. Check the full link or contact the couple for help."
        : isMockMode
          ? "This page needs a personal invitation link. For this prototype, choose one of the sample invitations below."
          : "This page needs your personal invitation link. Please open the unique link sent to you by the couple.";
    }
    return;
  }

  const invitation = result.invitation;
  content.hidden = false;
  pageRoot.querySelector("[data-party-name]").textContent = invitation.partyName;
  pageRoot.querySelector("[data-party-count]").textContent = invitation.guests.length === 1
    ? "1 guest invited"
    : `${invitation.guests.length} guests invited`;
  note.textContent = invitation.note;

  if (result.submitted) {
    form.hidden = true;
    submittedPanel.hidden = false;
    submittedPanel.querySelector("[data-confirmation-copy]").textContent = isMockMode
      ? "We already have a response saved for this demo invitation on this browser. Your RSVP is locked after submission."
      : "We already have your RSVP. The couple's spreadsheet has recorded this invitation, and it is locked after submission.";
    const reference = result.savedResponse?.reference;
    if (reference) submittedPanel.querySelector("[data-reference]").textContent = reference;
    const referenceLabel = submittedPanel.querySelector("[data-reference-label]");
    if (referenceLabel) referenceLabel.textContent = isMockMode ? "Demo reference" : "Confirmation reference";
    return;
  }

  const mealOptions = Array.isArray(invitation.mealOptions) && invitation.mealOptions.length
    ? invitation.mealOptions
    : FALLBACK_MEALS;
  invitation.guests.forEach((guest, index) => {
    guestList.appendChild(makeGuestFields(guest, index, mealOptions));
  });

  form.addEventListener("change", (event) => {
    const input = event.target;
    if (input.matches('input[type="radio"][data-attendance]')) {
      const row = input.closest("[data-guest-row]");
      const mealField = row?.querySelector("[data-meal-field]");
      if (mealField) {
        const attending = input.value === "yes";
        mealField.hidden = !attending;
        const meal = mealField.querySelector("select");
        if (meal) meal.required = attending;
      }
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.textContent = "";
    status.classList.remove("form-error");
    if (!form.reportValidity()) return;

    const attendees = invitation.guests.map((guest) => {
      const selected = form.querySelector(`input[name="attendance-${cssEscape(guest.id)}"]:checked`);
      const meal = form.querySelector(`[name="meal-${cssEscape(guest.id)}"]`);
      return {
        guestId: guest.id,
        name: guest.name,
        attending: selected?.value === "yes",
        meal: selected?.value === "yes" ? (meal?.value || "") : null,
      };
    });

    const dietaryNotes = form.querySelector("[name='dietary-notes']").value.trim();
    const payload = { attendees, dietaryNotes };
    submitButton.disabled = true;
    submitButton.textContent = isMockMode ? "Saving your demo RSVP…" : "Sending your RSVP…";

    let response;
    try {
      response = await submitRsvp(token, payload);
    } catch {
      response = { ok: false, reason: "unavailable" };
    }
    if (!response.ok) {
      submitButton.disabled = false;
      submitButton.textContent = "Send RSVP ↗";
      status.textContent = response.reason === "already-submitted"
        ? "A response has already been saved for this invitation. This RSVP is locked. Refresh this page to see the confirmation."
        : response.reason === "timeout"
          ? "We haven't been able to confirm whether your RSVP was saved. Refresh this invitation link in a moment before trying again; if it was saved, you'll see the confirmation here."
          : response.reason === "not-found"
            ? "This invitation link is no longer active. Please contact the couple."
            : response.reason === "not-available"
              ? "This invitation is not currently open for responses. Please contact the couple."
              : ["invalid-meal", "invalid-attendance", "invalid-attendees", "invalid-payload", "invalid-roster", "notes-too-long"].includes(response.reason)
                ? "Some RSVP details need to be refreshed. Reload this invitation link and check each attendance and meal selection before submitting again."
                : "We couldn't confirm your RSVP. Please check your connection and try again.";
      status.classList.add("form-error");
      return;
    }

    form.hidden = true;
    submittedPanel.hidden = false;
    submittedPanel.querySelector("[data-confirmation-copy]").textContent = isMockMode
      ? response.storageUnavailable
        ? "Your demo RSVP is confirmed for this page session. Browser storage is unavailable, so this prototype cannot persist the lock after you leave this page."
        : "Your demo RSVP has been saved in this browser. This is a prototype only — nothing has been sent to the couple or a spreadsheet."
      : "Thank you — your RSVP has been saved. The couple can view your response in their private RSVP dashboard, and this invitation is now locked.";
    submittedPanel.querySelector("[data-reference]").textContent = response.reference || "—";
    const referenceLabel = submittedPanel.querySelector("[data-reference-label]");
    if (referenceLabel) referenceLabel.textContent = isMockMode ? "Demo reference" : "Confirmation reference";
  });
}

function makeGuestFields(guest, index, mealOptions) {
  const row = document.createElement("fieldset");
  row.className = "guest-rsvp-card";
  row.dataset.guestRow = "";

  const legend = document.createElement("legend");
  legend.className = "guest-rsvp-name";
  legend.textContent = guest.name;
  row.appendChild(legend);

  const attendanceGroup = document.createElement("div");
  attendanceGroup.className = "attendance-options";
  const attendanceLabel = document.createElement("span");
  attendanceLabel.className = "field-label";
  attendanceLabel.textContent = "Can you make it?";
  attendanceGroup.appendChild(attendanceLabel);

  const groupName = `attendance-${guest.id}`;
  [
    { value: "yes", label: "Yes, count me in" },
    { value: "no", label: "Sorry, I can't" },
  ].forEach((option) => {
    const label = document.createElement("label");
    label.className = "radio-pill";
    const input = document.createElement("input");
    input.type = "radio";
    input.name = groupName;
    input.value = option.value;
    input.required = true;
    input.dataset.attendance = "";
    input.id = `${guest.id}-attendance-${option.value}`;
    const text = document.createElement("span");
    text.textContent = option.label;
    label.append(input, text);
    attendanceGroup.appendChild(label);
  });
  row.appendChild(attendanceGroup);

  const mealField = document.createElement("div");
  mealField.className = "field meal-field";
  mealField.dataset.mealField = "";
  mealField.hidden = true;
  const mealId = `meal-${guest.id}`;
  const mealLabel = document.createElement("label");
  mealLabel.className = "field-label";
  mealLabel.htmlFor = mealId;
  mealLabel.textContent = "Pick your main";
  const select = document.createElement("select");
  select.id = mealId;
  select.name = mealId;
  select.required = false;
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Choose a meal";
  select.appendChild(placeholder);
  mealOptions.forEach((meal) => {
    const option = document.createElement("option");
    option.value = meal.code;
    option.textContent = meal.label;
    select.appendChild(option);
  });
  mealField.append(mealLabel, select);
  row.appendChild(mealField);
  return row;
}

function cssEscape(value) {
  if (window.CSS?.escape) return window.CSS.escape(value);
  return String(value).replace(/[^a-zA-Z0-9_-]/g, "\\$&");
}

import { loadInvitation, submitRsvp } from "./rsvp-adapter.js";

const page = document.querySelector("[data-rsvp-page]");
if (page) initRsvp(page);

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

  const result = await loadInvitation(token);
  loading.hidden = true;

  if (!result.ok) {
    error.hidden = false;
    pageRoot.querySelector("[data-invalid-token]").textContent = token
      ? "That invitation link doesn't match one of our demo invitations. Check the URL or try a sample link below."
      : "This page needs your personal invitation link. For this prototype, choose a sample invitation below.";
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
    submittedPanel.querySelector("[data-confirmation-copy]").textContent =
      "We already have a response saved for this demo invitation on this browser. Your RSVP is locked after submission.";
    const reference = result.savedResponse?.reference;
    if (reference) submittedPanel.querySelector("[data-reference]").textContent = reference;
    return;
  }

  invitation.guests.forEach((guest, index) => {
    guestList.appendChild(makeGuestFields(guest, index));
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
    submitButton.textContent = "Saving your RSVP…";

    const response = await submitRsvp(token, payload);
    if (!response.ok) {
      submitButton.disabled = false;
      submitButton.textContent = "Send RSVP";
      status.textContent = response.reason === "already-submitted"
        ? "A response has already been saved for this invitation. This RSVP is locked."
        : "We couldn't save this demo response. Please check the invitation link and try again.";
      status.classList.add("form-error");
      return;
    }

    payload.reference = response.reference;
    form.hidden = true;
    submittedPanel.hidden = false;
    submittedPanel.querySelector("[data-confirmation-copy]").textContent = response.storageUnavailable
      ? "Your demo RSVP is confirmed for this page session. Browser storage is unavailable, so this prototype cannot persist the lock after you leave this page."
      : "Your demo RSVP has been saved in this browser. This is a prototype only — nothing has been sent to the couple or a spreadsheet.";
    submittedPanel.querySelector("[data-reference]").textContent = response.reference;
  });
}

function makeGuestFields(guest, index) {
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
  ].forEach((option, optionIndex) => {
    const label = document.createElement("label");
    label.className = "radio-pill";
    const input = document.createElement("input");
    input.type = "radio";
    input.name = groupName;
    input.value = option.value;
    input.required = true;
    input.dataset.attendance = "";
    input.id = `${guest.id}-attendance-${option.value}`;
    if (optionIndex === 0 && index === -1) input.checked = true;
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
  const options = [
    ["", "Choose a meal"],
    ["roast-veg", "Roast squash, crispy sage & lentils (vegan)"],
    ["chicken", "Lemon thyme chicken, potatoes & greens"],
    ["fish", "Herb-baked fish, buttery new potatoes"],
  ];
  options.forEach(([value, labelText]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = labelText;
    select.appendChild(option);
  });
  mealField.append(mealLabel, select);
  row.appendChild(mealField);
  return row;
}

// CSS.escape is not present in a few older browsers; these mock ids are simple but
// this fallback keeps selector construction predictable during local preview.
function cssEscape(value) {
  if (window.CSS?.escape) return window.CSS.escape(value);
  return String(value).replace(/[^a-zA-Z0-9_-]/g, "\\$&");
}

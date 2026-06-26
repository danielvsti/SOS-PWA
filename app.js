const API = "https://sos.vsti.cl";
const CONTROL_CENTER_CODE = "CC-VINA";

let userId = localStorage.getItem("user_id");
let neighborProfile = JSON.parse(localStorage.getItem("neighbor_profile") || "null");
let homeLatitude = localStorage.getItem("neighbor_home_latitude") || null;
let homeLongitude = localStorage.getItem("neighbor_home_longitude") || null;
let homeAccuracy = localStorage.getItem("neighbor_home_accuracy") || null;

const homePanel = document.getElementById("homePanel");
const resumeFollowupCard = document.getElementById("resumeFollowupCard");
const resumeTicketId = document.getElementById("resumeTicketId");
const resumeCaseStatus = document.getElementById("resumeCaseStatus");
const resumeFollowupButton = document.getElementById("resumeFollowupButton");
const categoryPanel = document.getElementById("categoryPanel");
const activePanel = document.getElementById("activePanel");
const textPanel = document.getElementById("textPanel");
const audioPanel = document.getElementById("audioPanel");
const recordingBanner = document.getElementById("recordingBanner");
const recordingTimer = document.getElementById("recordingTimer");
const audioInlineTimer = document.getElementById("audioInlineTimer");
const incomingCallPanel = document.getElementById("incomingCallPanel");
const incomingCallIcon = document.getElementById("incomingCallIcon");
const incomingCallTitle = document.getElementById("incomingCallTitle");
const incomingCallText = document.getElementById("incomingCallText");

const authPanel = document.getElementById("authPanel");
const loginBlock = document.getElementById("loginBlock");
const registerBlock = document.getElementById("registerBlock");
const otpBlock = document.getElementById("otpBlock");
const otpHelpText = document.getElementById("otpHelpText");
const otpCode = document.getElementById("otpCode");
const otpDemoCode = document.getElementById("otpDemoCode");
const requestCodeButton = document.getElementById("requestCodeButton");
const showRegisterButton = document.getElementById("showRegisterButton");
const backToLoginButton = document.getElementById("backToLoginButton");
const verifyCodeButton = document.getElementById("verifyCodeButton");
const resendCodeButton = document.getElementById("resendCodeButton");
const otpBackButton = document.getElementById("otpBackButton");
const profilePanel = document.getElementById("profilePanel");
const profileName = document.getElementById("profileName");
const profileMeta = document.getElementById("profileMeta");
const regFullName = document.getElementById("regFullName");
const regPhone = document.getElementById("regPhone");
const regRut = document.getElementById("regRut");
const regEmail = document.getElementById("regEmail");
const regAddress = document.getElementById("regAddress");
const homeLocationButton = document.getElementById("homeLocationButton");
const homeLocationStatus = document.getElementById("homeLocationStatus");
const contact1Name = document.getElementById("contact1Name");
const contact1Phone = document.getElementById("contact1Phone");
const contact1Relation = document.getElementById("contact1Relation");
const contact2Name = document.getElementById("contact2Name");
const contact2Phone = document.getElementById("contact2Phone");
const contact2Relation = document.getElementById("contact2Relation");
const registerButton = document.getElementById("registerButton");
const loginPhone = document.getElementById("loginPhone");
const loginButton = document.getElementById("loginButton"); // legacy fallback
const editProfileButton = document.getElementById("editProfileButton");
const logoutButton = document.getElementById("logoutButton");

const sosButton = document.getElementById("sosButton");
const confirmButton = document.getElementById("confirmButton");
const backButton = document.getElementById("backButton");
const cancelButton = document.getElementById("cancelButton");
const leaveFollowupButton = document.getElementById("leaveFollowupButton");
const voiceButton = document.getElementById("voiceButton");
const textButton = document.getElementById("textButton");
const audioButton = document.getElementById("audioButton");
const videoCallButton = document.getElementById("videoCallButton");
const videoUploadButton = document.getElementById("videoUploadButton");
const videoInput = document.getElementById("videoInput");
const sendTextButton = document.getElementById("sendTextButton");
const stopAudioButton = document.getElementById("stopAudioButton");
const acceptCallButton = document.getElementById("acceptCallButton");
const rejectCallButton = document.getElementById("rejectCallButton");

const textMessage = document.getElementById("textMessage");
const audioStatus = document.getElementById("audioStatus");

const gpsStatus = document.getElementById("gpsStatus");
const accuracyLabel = document.getElementById("accuracy");
const eventStatus = document.getElementById("eventStatus");
const statusLabel = document.getElementById("status");
const eventIdLabel = document.getElementById("eventId");
const ticketIdLabel = document.getElementById("ticketId");
const ticketIdShortLabel = document.getElementById("ticketIdShort");
const caseProgressIcon = document.getElementById("caseProgressIcon");
const caseProgressTitle = document.getElementById("caseProgressTitle");
const caseProgressDetail = document.getElementById("caseProgressDetail");
const caseProgressSteps = document.getElementById("caseProgressSteps");
const resolverContactCard = document.getElementById("resolverContactCard");
const resolverContactName = document.getElementById("resolverContactName");
const resolverContactText = document.getElementById("resolverContactText");

if (neighborProfile?.id && !userId) {
  userId = neighborProfile.id;
  localStorage.setItem("user_id", userId);
}

let currentEventId = localStorage.getItem("event_id");
let currentTicketId = localStorage.getItem("ticket_id");
let followupMinimized = localStorage.getItem("followup_minimized") === "true";
let selectedAlertType = "SOS_MANUAL";
let mediaRecorder = null;
let audioChunks = [];
let audioStream = null;
let recordingTimeout = null;
let recordingTimerInterval = null;
let recordingStartedAt = null;
let activeIncomingCall = null;
let handledCallActionIds = JSON.parse(localStorage.getItem("handled_call_action_ids") || "[]");
let pendingOtpPhone = localStorage.getItem("pending_otp_phone") || null;
let pendingOtpPurpose = localStorage.getItem("pending_otp_purpose") || "LOGIN";
let pendingOtpMode = localStorage.getItem("pending_otp_mode") || "login";

const alertDefinitions = {
  SOS_MANUAL: {
    title: "SOS General",
    priority: 1
  },
  MEDICAL: {
    title: "Emergencia Médica",
    priority: 1
  },
  FIRE: {
    title: "Incendio",
    priority: 1
  },
  SECURITY: {
    title: "Seguridad Ciudadana",
    priority: 2
  },
  VIF: {
    title: "Violencia Intrafamiliar",
    priority: 1
  },
  TRAFFIC_ACCIDENT: {
    title: "Accidente de Tránsito",
    priority: 2
  },
  URBAN_RISK: {
    title: "Riesgo Urbano",
    priority: 3
  },
  OTHER: {
    title: "Otro Incidente",
    priority: 3
  }
};

function normalizePhone(phone) {
  return String(phone || "").trim().replace(/\s+/g, "");
}

function getNeighborName() {
  return neighborProfile?.full_name || "Vecino SOS";
}

function getNeighborPhone() {
  return neighborProfile?.phone || null;
}

function isNeighborRegistered() {
  return !!(userId && neighborProfile?.id);
}

function saveNeighborProfile(user) {
  neighborProfile = user;
  userId = user.id;
  localStorage.setItem("neighbor_profile", JSON.stringify(user));
  localStorage.setItem("user_id", user.id);
}

function clearNeighborProfile() {
  neighborProfile = null;
  userId = null;
  localStorage.removeItem("neighbor_profile");
  localStorage.removeItem("user_id");
}

function updateProfileCard() {
  if (!neighborProfile) return;

  profileName.textContent = neighborProfile.full_name || "Vecino registrado";
  profileMeta.textContent = `${neighborProfile.phone || "sin teléfono"} · ${neighborProfile.validation_status || "PROVISIONAL_ACTIVE"}`;
}

function fillRegisterFormFromProfile() {
  if (!neighborProfile) return;

  regFullName.value = neighborProfile.full_name || "";
  regPhone.value = neighborProfile.phone || "";
  regRut.value = neighborProfile.rut || "";
  regEmail.value = neighborProfile.email || "";
  regAddress.value = neighborProfile.declared_address || "";
  loginPhone.value = neighborProfile.phone || "";
}

function buildEmergencyContacts() {
  const contacts = [];

  if (contact1Name.value.trim() && contact1Phone.value.trim()) {
    contacts.push({
      name: contact1Name.value.trim(),
      phone: normalizePhone(contact1Phone.value),
      relationship: contact1Relation.value.trim() || "Contacto emergencia",
      priority: 1
    });
  }

  if (contact2Name.value.trim() && contact2Phone.value.trim()) {
    contacts.push({
      name: contact2Name.value.trim(),
      phone: normalizePhone(contact2Phone.value),
      relationship: contact2Relation.value.trim() || "Contacto emergencia",
      priority: 2
    });
  }

  return contacts;
}

function resetOtpDemo() {
  if (!otpDemoCode) return;
  otpDemoCode.hidden = true;
  otpDemoCode.textContent = "";
}

function showOtpDemoCode(code) {
  if (!otpDemoCode) return;

  if (code) {
    otpDemoCode.hidden = false;
    otpDemoCode.textContent = `Código demo: ${code}`;
  } else {
    resetOtpDemo();
  }
}

function showLogin() {
  homePanel.hidden = true;
  categoryPanel.hidden = true;
  activePanel.hidden = true;
  profilePanel.hidden = true;
  authPanel.hidden = false;
  loginBlock.hidden = false;
  registerBlock.hidden = true;
  otpBlock.hidden = true;
  cancelButton.hidden = true;
  resetOtpDemo();
  statusLabel.textContent = "Ingresa con tu teléfono registrado";
  fillRegisterFormFromProfile();
}

function showRegister() {
  homePanel.hidden = true;
  categoryPanel.hidden = true;
  activePanel.hidden = true;
  profilePanel.hidden = true;
  authPanel.hidden = false;
  loginBlock.hidden = true;
  registerBlock.hidden = false;
  otpBlock.hidden = true;
  cancelButton.hidden = true;
  resetOtpDemo();
  statusLabel.textContent = "Registro de vecino";
  fillRegisterFormFromProfile();
}

function showOtp({ phone, purpose = "LOGIN", mode = "login", demoCode = null } = {}) {
  pendingOtpPhone = normalizePhone(phone || pendingOtpPhone);
  pendingOtpPurpose = purpose || pendingOtpPurpose || "LOGIN";
  pendingOtpMode = mode || pendingOtpMode || "login";

  localStorage.setItem("pending_otp_phone", pendingOtpPhone);
  localStorage.setItem("pending_otp_purpose", pendingOtpPurpose);
  localStorage.setItem("pending_otp_mode", pendingOtpMode);

  homePanel.hidden = true;
  categoryPanel.hidden = true;
  activePanel.hidden = true;
  profilePanel.hidden = true;
  authPanel.hidden = false;
  loginBlock.hidden = true;
  registerBlock.hidden = true;
  otpBlock.hidden = false;
  cancelButton.hidden = true;
  otpCode.value = "";
  otpHelpText.textContent = `Ingresa el código enviado a ${pendingOtpPhone}.`;
  showOtpDemoCode(demoCode);
  statusLabel.textContent = "Código enviado";
  setTimeout(() => otpCode.focus(), 100);
}

function showAuth() {
  showLogin();
}

async function requestLoginCode() {
  const phone = normalizePhone(loginPhone.value || regPhone.value);

  if (!phone) {
    alert("Ingresa el teléfono registrado.");
    return;
  }

  requestCodeButton.disabled = true;
  statusLabel.textContent = "Enviando código...";

  try {
    const res = await fetch(`${API}/auth/request-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone,
        purpose: "LOGIN"
      })
    });

    const data = await res.json();

    if (!res.ok || data.status !== "ok") {
      throw new Error(data.message || "No se pudo enviar el código");
    }

    showOtp({
      phone,
      purpose: "LOGIN",
      mode: "login",
      demoCode: data.demo_code || null
    });
  } catch (error) {
    console.error(error);
    statusLabel.textContent = "No se pudo enviar el código";
    alert(error.message || "No se pudo enviar el código");
  } finally {
    requestCodeButton.disabled = false;
  }
}

async function registerNeighbor() {
  const fullName = regFullName.value.trim();
  const phone = normalizePhone(regPhone.value);
  const declaredAddress = regAddress.value.trim();

  if (!fullName || !phone || !declaredAddress) {
    alert("Completa nombre, teléfono y dirección.");
    return;
  }

  registerButton.disabled = true;
  statusLabel.textContent = "Registrando y enviando código...";

  try {
    const payload = {
      control_center_code: CONTROL_CENTER_CODE,
      full_name: fullName,
      rut: regRut.value.trim() || null,
      phone,
      email: regEmail.value.trim() || null,
      declared_address: declaredAddress,
      latitude: homeLatitude ? Number(homeLatitude) : null,
      longitude: homeLongitude ? Number(homeLongitude) : null,
      emergency_contacts: buildEmergencyContacts(),
      otp_channel: "demo"
    };

    const res = await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok || data.status !== "ok") {
      throw new Error(data.message || "No se pudo registrar");
    }

    statusLabel.textContent = "Registro recibido. Valida el código.";
    showOtp({
      phone,
      purpose: "REGISTER",
      mode: "register",
      demoCode: data.demo_code || null
    });
  } catch (error) {
    console.error(error);
    statusLabel.textContent = "No se pudo registrar el vecino";
    alert(error.message || "No se pudo registrar el vecino");
  } finally {
    registerButton.disabled = false;
  }
}

async function verifyOtpCode() {
  const phone = normalizePhone(pendingOtpPhone || loginPhone.value || regPhone.value);
  const code = String(otpCode.value || "").trim();

  if (!phone || !code) {
    alert("Ingresa el código recibido.");
    return;
  }

  verifyCodeButton.disabled = true;
  statusLabel.textContent = "Validando código...";

  try {
    const res = await fetch(`${API}/auth/verify-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone,
        code,
        purpose: pendingOtpPurpose || null
      })
    });

    const data = await res.json();

    if (!res.ok || data.status !== "ok") {
      throw new Error(data.message || "Código inválido");
    }

    if (data.user.role !== "NEIGHBOR") {
      throw new Error("Este usuario no tiene perfil de vecino.");
    }

    saveNeighborProfile(data.user);
    updateProfileCard();
    localStorage.removeItem("pending_otp_phone");
    localStorage.removeItem("pending_otp_purpose");
    localStorage.removeItem("pending_otp_mode");
    resetOtpDemo();
    statusLabel.textContent = `Bienvenido/a, ${data.user.full_name}`;
    await recoverActiveCase();
    showHome({ force: true });
  } catch (error) {
    console.error(error);
    statusLabel.textContent = "No se pudo validar el código";
    alert(error.message || "No se pudo validar el código");
  } finally {
    verifyCodeButton.disabled = false;
  }
}

async function resendOtpCode() {
  const phone = normalizePhone(pendingOtpPhone || loginPhone.value || regPhone.value);

  if (!phone) {
    showLogin();
    return;
  }

  resendCodeButton.disabled = true;
  statusLabel.textContent = "Reenviando código...";

  try {
    if (pendingOtpMode === "register") {
      await registerNeighbor();
      return;
    }

    const res = await fetch(`${API}/auth/request-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone,
        purpose: pendingOtpPurpose || "LOGIN"
      })
    });

    const data = await res.json();

    if (!res.ok || data.status !== "ok") {
      throw new Error(data.message || "No se pudo reenviar el código");
    }

    showOtp({
      phone,
      purpose: pendingOtpPurpose || "LOGIN",
      mode: pendingOtpMode || "login",
      demoCode: data.demo_code || null
    });
  } catch (error) {
    console.error(error);
    statusLabel.textContent = "No se pudo reenviar el código";
    alert(error.message || "No se pudo reenviar el código");
  } finally {
    resendCodeButton.disabled = false;
  }
}

async function loginNeighbor() {
  return requestLoginCode();
}

async function useHomeLocation() {
  homeLocationButton.disabled = true;
  homeLocationStatus.textContent = "Obteniendo GPS del domicilio...";

  try {
    const position = await getCurrentPosition();
    homeLatitude = String(position.coords.latitude);
    homeLongitude = String(position.coords.longitude);
    homeAccuracy = String(Math.round(position.coords.accuracy));

    localStorage.setItem("neighbor_home_latitude", homeLatitude);
    localStorage.setItem("neighbor_home_longitude", homeLongitude);
    localStorage.setItem("neighbor_home_accuracy", homeAccuracy);

    homeLocationStatus.textContent = `GPS domicilio OK · precisión ${homeAccuracy} m`;
  } catch (error) {
    console.error(error);
    homeLocationStatus.textContent = "No se pudo obtener GPS del domicilio";
  } finally {
    homeLocationButton.disabled = false;
  }
}

function shortTicketId(ticketId) {
  if (!ticketId) return "-";
  return "#" + String(ticketId).slice(0, 8).toUpperCase();
}

function updateTicketLabels() {
  ticketIdLabel.textContent = currentTicketId || "-";
  ticketIdShortLabel.textContent = shortTicketId(currentTicketId);
}

function setFollowupMinimized(value) {
  followupMinimized = value === true;

  if (followupMinimized) {
    localStorage.setItem("followup_minimized", "true");
  } else {
    localStorage.removeItem("followup_minimized");
  }
}

function updateResumeFollowupCard(stateText = null) {
  if (!resumeFollowupCard) return;

  if (!currentEventId && !currentTicketId) {
    resumeFollowupCard.hidden = true;
    return;
  }

  resumeTicketId.textContent = shortTicketId(currentTicketId);
  resumeCaseStatus.textContent = stateText || "Caso en seguimiento";
  resumeFollowupCard.hidden = false;
}

function clearCurrentCaseLocal() {
  currentEventId = null;
  currentTicketId = null;
  setFollowupMinimized(false);
  localStorage.removeItem("event_id");
  localStorage.removeItem("ticket_id");
  eventIdLabel.textContent = "-";
  eventStatus.textContent = "NORMAL";
  updateTicketLabels();
  updateResumeFollowupCard();
}

function stateToProgressIcon(state) {
  switch (state) {
    case "ASSIGNED":
    case "ACCEPTED_BY_RESOLVER":
      return "👮";
    case "EN_ROUTE":
      return "🚗";
    case "ON_SITE":
      return "📍";
    case "RESOLVED":
    case "CLOSED":
      return "✅";
    case "CANCELLED":
      return "⚪";
    default:
      return "✅";
  }
}

function renderCaseProgress(progress) {
  if (!caseProgressTitle || !progress) return;

  const state = progress.ticket_state || "ACTIVE";
  caseProgressIcon.textContent = stateToProgressIcon(state);
  caseProgressTitle.textContent = progress.headline || "Central informada";
  caseProgressDetail.textContent = progress.detail || "La central ya recibió tu emergencia.";

  if (progress.resolver) {
    resolverContactName.textContent = progress.resolver.name || "Resolutor municipal";
    resolverContactText.textContent = progress.resolver.phone
      ? `Podría contactarte al ${progress.resolver.phone}.`
      : "Asignado a tu caso. Mantén tu teléfono disponible.";
    resolverContactCard.hidden = false;
  } else {
    resolverContactCard.hidden = true;
  }

  const steps = Array.isArray(progress.steps) ? progress.steps : [];
  caseProgressSteps.innerHTML = steps.map((step) => {
    const classes = ["case-step"];
    if (step.done) classes.push("done");
    if (step.active) classes.push("active");

    const dot = step.done ? "✓" : step.active ? "!" : "…";

    return `
      <div class="${classes.join(" ")}">
        <div class="case-step-dot">${dot}</div>
        <div>
          <strong>${step.label || "Estado"}</strong>
          <p>${step.detail || ""}</p>
        </div>
      </div>
    `;
  }).join("");
}

function resetCaseProgress() {
  renderCaseProgress({
    ticket_state: "ACTIVE",
    headline: "Central informada",
    detail: "La central ya recibió tu emergencia.",
    resolver: null,
    steps: [
      {
        label: "Central informada",
        detail: "La central recibió tu emergencia.",
        done: true,
        active: true
      },
      {
        label: "Asignación de resolutor",
        detail: "La central buscará un resolutor disponible.",
        done: false,
        active: false
      }
    ]
  });
}


function saveHandledCallActionIds() {
  localStorage.setItem("handled_call_action_ids", JSON.stringify(handledCallActionIds.slice(-40)));
}

function formatRecordingTime(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function updateRecordingTimer() {
  const value = formatRecordingTime(Date.now() - recordingStartedAt);
  recordingTimer.textContent = value;
  audioInlineTimer.textContent = value;
}

function startRecordingUI() {
  recordingStartedAt = Date.now();
  updateRecordingTimer();
  recordingBanner.hidden = false;
  audioPanel.hidden = false;
  audioButton.classList.add("recording-active");
  navigator.vibrate?.(80);

  clearInterval(recordingTimerInterval);
  recordingTimerInterval = setInterval(updateRecordingTimer, 500);
}

function stopRecordingUI() {
  clearInterval(recordingTimerInterval);
  recordingTimerInterval = null;
  recordingBanner.hidden = true;
  audioPanel.hidden = true;
  audioButton.classList.remove("recording-active");
  audioButton.innerHTML = "🎙️<span>Mensaje audio</span>";
  navigator.vibrate?.([60, 80, 60]);
}

function showIncomingCall(request) {
  if (!request || handledCallActionIds.includes(request.id)) return;

  activeIncomingCall = request;
  const isVideo = request.mode === "video";

  incomingCallIcon.textContent = isVideo ? "🎥" : "📞";
  incomingCallTitle.textContent = isVideo
    ? "La central solicita videollamada"
    : "La central solicita llamada de voz";
  incomingCallText.textContent = isVideo
    ? "La central solicita coordinar una videollamada para este caso. Aceptar solo notificará a la central; la llamada real se habilitará en la siguiente versión."
    : "La central solicita coordinar una llamada de voz para este caso. Aceptar solo notificará a la central; la llamada real se habilitará en la siguiente versión.";

  incomingCallPanel.hidden = false;
  navigator.vibrate?.([180, 120, 180]);
}

async function respondIncomingCall(response) {
  if (!activeIncomingCall || !currentTicketId) {
    incomingCallPanel.hidden = true;
    return;
  }

  const request = activeIncomingCall;
  incomingCallPanel.hidden = true;
  activeIncomingCall = null;

  try {
    const res = await fetch(`${API}/tickets/${currentTicketId}/call-response`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        request_action_id: request.id,
        response,
        mode: request.mode,
        sender_role: "NEIGHBOR",
        sender_name: getNeighborName()
      })
    });

    if (!res.ok) throw new Error("Error HTTP " + res.status);

    handledCallActionIds.push(request.id);
    saveHandledCallActionIds();

    statusLabel.textContent = response === "ACCEPTED"
      ? "Solicitud aceptada. La central fue notificada."
      : "Solicitud rechazada. La central fue notificada.";
  } catch (error) {
    console.error(error);
    statusLabel.textContent = "No se pudo responder a la central";
  }
}

async function recoverActiveCase() {
  if (!isNeighborRegistered() || currentEventId) return false;

  try {
    const res = await fetch(`${API}/public/mobile/active?user_id=${encodeURIComponent(userId)}`);

    if (!res.ok) return false;

    const data = await res.json();

    if (data.status !== "ok" || !data.event?.id) {
      return false;
    }

    currentEventId = data.event.id;
    currentTicketId = data.event.ticket_id || data.ticket_id || null;
    setFollowupMinimized(true);

    localStorage.setItem("event_id", currentEventId);
    if (currentTicketId) {
      localStorage.setItem("ticket_id", currentTicketId);
    }

    eventIdLabel.textContent = currentEventId;
    eventStatus.textContent = data.effective_state || data.event.effective_state || data.event.state || "ACTIVO";
    updateTicketLabels();

    if (data.neighbor_progress) {
      renderCaseProgress(data.neighbor_progress);
    }

    updateResumeFollowupCard(`Caso activo · ${eventStatus.textContent}`);
    return true;
  } catch (error) {
    console.warn("No se pudo recuperar caso activo", error);
    return false;
  }
}

function showHome(options = {}) {
  if (currentEventId && !followupMinimized && !options.force) return;

  if (!isNeighborRegistered()) {
    showAuth();
    return;
  }

  updateProfileCard();
  authPanel.hidden = true;
  profilePanel.hidden = false;
  homePanel.hidden = false;
  categoryPanel.hidden = true;
  activePanel.hidden = true;
  textPanel.hidden = true;
  audioPanel.hidden = true;
  cancelButton.hidden = true;
  sosButton.disabled = false;
  confirmButton.disabled = false;
  backButton.disabled = false;
  updateResumeFollowupCard();
  statusLabel.textContent = currentEventId && followupMinimized
    ? "Tienes un caso activo en seguimiento"
    : "Lista para usar";
}

function showCategories() {
  if (!isNeighborRegistered()) {
    showAuth();
    return;
  }

  if (currentEventId) {
    statusLabel.textContent = "Ya existe una alerta activa";
    showActiveAlert();
    return;
  }

  homePanel.hidden = true;
  categoryPanel.hidden = false;
  activePanel.hidden = true;
  statusLabel.textContent = "Selecciona el tipo de emergencia";
}

function showActiveAlert() {
  setFollowupMinimized(false);
  authPanel.hidden = true;
  profilePanel.hidden = true;
  homePanel.hidden = true;
  categoryPanel.hidden = true;
  activePanel.hidden = false;
  cancelButton.hidden = false;
  sosButton.disabled = true;
  confirmButton.disabled = false;
  backButton.disabled = false;
  updateTicketLabels();
}

function setSendingState(isSending) {
  confirmButton.disabled = isSending;
  backButton.disabled = isSending;
  cancelButton.disabled = isSending;
}

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("GPS no disponible en este dispositivo"));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });
  });
}

function requireTicket() {
  if (!currentTicketId) {
    statusLabel.textContent = "Esperando folio del ticket...";
    alert("La alerta fue enviada, pero aún no tengo el folio del ticket. Espera unos segundos y vuelve a intentar.");
    return false;
  }

  return true;
}

async function sendSOS() {
  if (currentEventId) {
    statusLabel.textContent = "Ya existe una alerta activa";
    showActiveAlert();
    return;
  }

  setSendingState(true);
  statusLabel.textContent = "Obteniendo ubicación...";
  gpsStatus.textContent = "Buscando...";

  try {
    const position = await getCurrentPosition();

    gpsStatus.textContent = "OK";
    statusLabel.textContent = "Enviando alerta...";

    const payload = {
      user_id: userId,
      name: getNeighborName(),
      phone: getNeighborPhone(),
      source: "mobile_pwa",
      control_center_code: CONTROL_CENTER_CODE,
      alert_type: selectedAlertType,
      title: alertDefinitions[selectedAlertType].title,
      description: "Alerta enviada desde PWA SOS Municipal",
      priority: alertDefinitions[selectedAlertType].priority,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: Math.round(position.coords.accuracy),
      battery: null
    };

    accuracyLabel.textContent = payload.accuracy + " m";

    const res = await fetch(`${API}/public/mobile/sos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error("Error HTTP " + res.status);
    }

    const data = await res.json();

    currentEventId = data.event_id;
    currentTicketId = data.ticket_id || null;

    localStorage.setItem("event_id", currentEventId);
    setFollowupMinimized(false);
    if (currentTicketId) {
      localStorage.setItem("ticket_id", currentTicketId);
    }

    eventIdLabel.textContent = currentEventId;
    eventStatus.textContent = "ACTIVO";
    statusLabel.textContent = currentTicketId
      ? `Alerta enviada · ${shortTicketId(currentTicketId)}`
      : "Alerta enviada";

    showActiveAlert();
    resetCaseProgress();
  } catch (error) {
    console.error(error);
    gpsStatus.textContent = "ERROR";
    statusLabel.textContent = "No se pudo enviar la alerta";
    showCategories();
  } finally {
    setSendingState(false);
  }
}

async function leaveFollowup() {
  if (!currentEventId && !currentTicketId) {
    showHome();
    return;
  }

  const ticketForNotice = currentTicketId;

  if (ticketForNotice) {
    try {
      await fetch(`${API}/tickets/${ticketForNotice}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sender_role: "NEIGHBOR",
          sender_name: getNeighborName(),
          message: "El vecino volvió al inicio de la aplicación sin cancelar la emergencia. El caso debe seguir siendo gestionado por la central."
        })
      });
    } catch (error) {
      console.warn("No se pudo registrar salida de seguimiento", error);
    }
  }

  setFollowupMinimized(true);
  updateResumeFollowupCard("La central mantiene el caso activo");
  statusLabel.textContent = "Volviste al inicio. La central mantiene el caso.";

  showHome({ force: true });
}

async function cancelSOS() {
  if (!currentEventId) {
    showHome();
    return;
  }

  cancelButton.disabled = true;
  statusLabel.textContent = "Cancelando alerta...";

  try {
    const res = await fetch(`${API}/public/mobile/cancel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        event_id: currentEventId,
        user_id: userId
      })
    });

    if (!res.ok) {
      throw new Error("Error HTTP " + res.status);
    }

    clearCurrentCaseLocal();

    eventStatus.textContent = "CANCELADO";
    statusLabel.textContent = "Alerta cancelada";
    showHome({ force: true });
  } catch (error) {
    console.error(error);
    statusLabel.textContent = "No se pudo cancelar la alerta";
    showActiveAlert();
  } finally {
    cancelButton.disabled = false;
  }
}

async function refreshStatus() {
  if (!currentEventId) return;

  try {
    const res = await fetch(`${API}/public/mobile/status/${currentEventId}`);

    if (!res.ok) {
      throw new Error("Error HTTP " + res.status);
    }

    const data = await res.json();
    const event = data?.event || {};
    const terminalStates = ["CANCELLED", "CLOSED", "RESOLVED"];

    const ticketState = event.ticket_state || data?.ticket_state || null;
    const state = terminalStates.includes(ticketState)
      ? ticketState
      : (event.effective_state || data?.effective_state || event.state || "DESCONOCIDO");

    if (event.ticket_id && !currentTicketId) {
      currentTicketId = event.ticket_id;
      localStorage.setItem("ticket_id", currentTicketId);
      updateTicketLabels();
    }

    if (data?.neighbor_progress) {
      renderCaseProgress(data.neighbor_progress);
    }

    if (data?.pending_call_request && !terminalStates.includes(state)) {
      showIncomingCall(data.pending_call_request);
    }

    eventStatus.textContent = state;
    statusLabel.textContent = currentTicketId
      ? `Estado: ${state} · ${shortTicketId(currentTicketId)}`
      : "Estado: " + state;
    updateResumeFollowupCard(`Estado: ${state}`);

    if (terminalStates.includes(state)) {
      const finishedTicket = currentTicketId;

      clearCurrentCaseLocal();

      statusLabel.textContent =
        state === "RESOLVED"
          ? `Caso resuelto · ${shortTicketId(finishedTicket)}`
          : state === "CLOSED"
            ? `Caso cerrado · ${shortTicketId(finishedTicket)}`
            : "Alerta cancelada";

      setTimeout(() => showHome({ force: true }), 1800);
      return;
    }
  } catch (error) {
    console.error(error);
    statusLabel.textContent = "Sin conexión con plataforma";
  }
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function sendTextMessage() {
  if (!requireTicket()) return;

  const message = textMessage.value.trim();
  if (!message) {
    alert("Escribe un mensaje antes de enviarlo.");
    return;
  }

  sendTextButton.disabled = true;
  statusLabel.textContent = "Enviando mensaje...";

  try {
    const res = await fetch(`${API}/tickets/${currentTicketId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        sender_role: "NEIGHBOR",
        sender_name: getNeighborName(),
        message
      })
    });

    if (!res.ok) {
      throw new Error("Error HTTP " + res.status);
    }

    textMessage.value = "";
    textPanel.hidden = true;
    statusLabel.textContent = "Mensaje enviado a la central";
  } catch (error) {
    console.error(error);
    statusLabel.textContent = "No se pudo enviar el mensaje";
  } finally {
    sendTextButton.disabled = false;
  }
}

async function uploadMedia(mediaType, blob, fileName) {
  if (!requireTicket()) return;

  statusLabel.textContent = mediaType === "audio"
    ? "Subiendo audio..."
    : "Subiendo video...";

  const dataUrl = await blobToDataUrl(blob);

  const res = await fetch(`${API}/tickets/${currentTicketId}/media`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      sender_role: "NEIGHBOR",
      sender_name: getNeighborName(),
      media_type: mediaType,
      file_name: fileName,
      data_url: dataUrl
    })
  });

  if (!res.ok) {
    throw new Error("Error HTTP " + res.status);
  }

  await res.json();
  statusLabel.textContent = mediaType === "audio"
    ? "Audio enviado a la central"
    : "Video enviado a la central";
}

function getPreferredAudioOptions() {
  if (!window.MediaRecorder) return {};

  const candidates = [
    "audio/mp4",
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus"
  ];

  for (const mimeType of candidates) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return { mimeType };
    }
  }

  return {};
}

function extensionForMime(mimeType, fallback) {
  const clean = String(mimeType || "").split(";")[0];
  const map = {
    "audio/mp4": "m4a",
    "audio/webm": "webm",
    "audio/ogg": "ogg",
    "audio/wav": "wav",
    "video/mp4": "mp4",
    "video/quicktime": "mov",
    "video/webm": "webm"
  };

  return map[clean] || fallback;
}

async function toggleAudioRecording() {
  if (!requireTicket()) return;

  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
    return;
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    alert("Este navegador no permite grabar audio desde la PWA.");
    return;
  }

  try {
    audioChunks = [];
    audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const options = getPreferredAudioOptions();
    mediaRecorder = new MediaRecorder(audioStream, options);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      clearTimeout(recordingTimeout);
      audioStream?.getTracks().forEach(track => track.stop());
      stopRecordingUI();

      const mimeType = mediaRecorder.mimeType || audioChunks[0]?.type || "audio/webm";
      const audioBlob = new Blob(audioChunks, { type: mimeType });
      const ext = extensionForMime(mimeType, "webm");

      try {
        await uploadMedia("audio", audioBlob, `audio-${Date.now()}.${ext}`);
      } catch (error) {
        console.error(error);
        statusLabel.textContent = "No se pudo enviar el audio";
      }
    };

    mediaRecorder.start();
    audioStatus.textContent = "Mantén el teléfono cerca y describe qué está ocurriendo. Máximo 30 segundos.";
    audioButton.innerHTML = "⏹️<span>Detener audio</span>";
    statusLabel.textContent = "Grabando audio...";
    startRecordingUI();

    recordingTimeout = setTimeout(() => {
      if (mediaRecorder?.state === "recording") {
        mediaRecorder.stop();
      }
    }, 30000);
  } catch (error) {
    console.error(error);
    statusLabel.textContent = "No se pudo acceder al micrófono";
  }
}

async function uploadSelectedVideo() {
  const file = videoInput.files?.[0];
  if (!file) return;

  if (file.size > 25 * 1024 * 1024) {
    alert("El video es muy grande para la demo. Usa un clip más corto.");
    videoInput.value = "";
    return;
  }

  try {
    await uploadMedia("video", file, file.name || `video-${Date.now()}.mp4`);
  } catch (error) {
    console.error(error);
    statusLabel.textContent = "No se pudo enviar el video";
  } finally {
    videoInput.value = "";
  }
}

async function requestCall(mode) {
  if (!requireTicket()) return;

  statusLabel.textContent = mode === "voice"
    ? "Solicitando llamada de voz..."
    : "Solicitando videollamada...";

  try {
    const res = await fetch(`${API}/tickets/${currentTicketId}/call-start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        mode,
        sender_role: "NEIGHBOR",
        sender_name: getNeighborName()
      })
    });

    if (!res.ok) {
      throw new Error("Error HTTP " + res.status);
    }

    await res.json();
    statusLabel.textContent = mode === "voice"
      ? "Solicitud de llamada enviada a la central"
      : "Solicitud de videollamada enviada a la central";

    alert(mode === "voice"
      ? "La central recibió tu solicitud de llamada. Mantente en esta pantalla y espera instrucciones."
      : "La central recibió tu solicitud de videollamada. Mantente en esta pantalla y espera instrucciones."
    );
  } catch (error) {
    console.error(error);
    statusLabel.textContent = "No se pudo enviar la solicitud";
  }
}


function resumeFollowup() {
  if (!currentEventId && !currentTicketId) {
    statusLabel.textContent = "No tienes casos activos en seguimiento";
    updateResumeFollowupCard();
    return;
  }

  setFollowupMinimized(false);
  showActiveAlert();
  refreshStatus();
}

document.querySelectorAll(".emergency-option").forEach(button => {
  button.addEventListener("click", () => {
    document
      .querySelectorAll(".emergency-option")
      .forEach(option => option.classList.remove("active"));

    button.classList.add("active");
    selectedAlertType = button.dataset.type;

    statusLabel.textContent =
      "Tipo seleccionado: " + alertDefinitions[selectedAlertType].title;
  });
});

sosButton.addEventListener("click", showCategories);
confirmButton.addEventListener("click", sendSOS);
backButton.addEventListener("click", showHome);
cancelButton.addEventListener("click", cancelSOS);
leaveFollowupButton.addEventListener("click", leaveFollowup);
resumeFollowupButton?.addEventListener("click", resumeFollowup);
voiceButton.addEventListener("click", () => requestCall("voice"));
videoCallButton.addEventListener("click", () => requestCall("video"));
textButton.addEventListener("click", () => {
  textPanel.hidden = !textPanel.hidden;
});
sendTextButton.addEventListener("click", sendTextMessage);
audioButton.addEventListener("click", toggleAudioRecording);
stopAudioButton.addEventListener("click", toggleAudioRecording);
acceptCallButton.addEventListener("click", () => respondIncomingCall("ACCEPTED"));
rejectCallButton.addEventListener("click", () => respondIncomingCall("REJECTED"));
videoUploadButton.addEventListener("click", () => videoInput.click());
videoInput.addEventListener("change", uploadSelectedVideo);
registerButton.addEventListener("click", registerNeighbor);
loginButton?.addEventListener("click", loginNeighbor);
requestCodeButton?.addEventListener("click", requestLoginCode);
showRegisterButton?.addEventListener("click", showRegister);
backToLoginButton?.addEventListener("click", showLogin);
verifyCodeButton?.addEventListener("click", verifyOtpCode);
resendCodeButton?.addEventListener("click", resendOtpCode);
otpBackButton?.addEventListener("click", showLogin);
otpCode?.addEventListener("keyup", (event) => {
  if (event.key === "Enter") verifyOtpCode();
});
homeLocationButton.addEventListener("click", useHomeLocation);
editProfileButton.addEventListener("click", showRegister);
logoutButton.addEventListener("click", () => {
  if (currentEventId) {
    alert("No puedes salir del perfil mientras hay una alerta activa. Primero vuelve al inicio sin cancelar o cancela la alerta si fue falsa alarma.");
    return;
  }

  clearNeighborProfile();
  showAuth();
});

setInterval(refreshStatus, 5000);

async function initializeApp() {
  updateTicketLabels();

  if (currentEventId) {
    eventIdLabel.textContent = currentEventId;
    eventStatus.textContent = "RECUPERANDO";
    statusLabel.textContent = "Recuperando alerta activa...";
    resetCaseProgress();

    if (followupMinimized) {
      updateProfileCard();
      updateResumeFollowupCard("Recuperando seguimiento...");
      showHome({ force: true });
    } else {
      showActiveAlert();
    }

    refreshStatus();
    return;
  }

  if (isNeighborRegistered()) {
    updateProfileCard();
    const recovered = await recoverActiveCase();

    if (recovered) {
      showHome({ force: true });
    } else {
      showHome({ force: true });
    }
  } else {
    showAuth();
  }
}

initializeApp();

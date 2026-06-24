const API = "https://sos.vsti.cl";
const CONTROL_CENTER_CODE = "CC-VINA";

const userId = localStorage.getItem("user_id") || crypto.randomUUID();
localStorage.setItem("user_id", userId);

const homePanel = document.getElementById("homePanel");
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

const sosButton = document.getElementById("sosButton");
const confirmButton = document.getElementById("confirmButton");
const backButton = document.getElementById("backButton");
const cancelButton = document.getElementById("cancelButton");
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

let currentEventId = localStorage.getItem("event_id");
let currentTicketId = localStorage.getItem("ticket_id");
let selectedAlertType = "SOS_MANUAL";
let mediaRecorder = null;
let audioChunks = [];
let audioStream = null;
let recordingTimeout = null;
let recordingTimerInterval = null;
let recordingStartedAt = null;
let activeIncomingCall = null;
let handledCallActionIds = JSON.parse(localStorage.getItem("handled_call_action_ids") || "[]");

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

function shortTicketId(ticketId) {
  if (!ticketId) return "-";
  return "#" + String(ticketId).slice(0, 8).toUpperCase();
}

function updateTicketLabels() {
  ticketIdLabel.textContent = currentTicketId || "-";
  ticketIdShortLabel.textContent = shortTicketId(currentTicketId);
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
        sender_name: "Vecino SOS"
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

function showHome() {
  if (currentEventId) return;

  homePanel.hidden = false;
  categoryPanel.hidden = true;
  activePanel.hidden = true;
  textPanel.hidden = true;
  audioPanel.hidden = true;
  cancelButton.hidden = true;
  sosButton.disabled = false;
  confirmButton.disabled = false;
  backButton.disabled = false;
  statusLabel.textContent = "Lista para usar";
}

function showCategories() {
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
      name: "Usuario móvil",
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
    if (currentTicketId) {
      localStorage.setItem("ticket_id", currentTicketId);
    }

    eventIdLabel.textContent = currentEventId;
    eventStatus.textContent = "ACTIVO";
    statusLabel.textContent = currentTicketId
      ? `Alerta enviada · ${shortTicketId(currentTicketId)}`
      : "Alerta enviada";

    showActiveAlert();
  } catch (error) {
    console.error(error);
    gpsStatus.textContent = "ERROR";
    statusLabel.textContent = "No se pudo enviar la alerta";
    showCategories();
  } finally {
    setSendingState(false);
  }
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

    currentEventId = null;
    currentTicketId = null;
    localStorage.removeItem("event_id");
    localStorage.removeItem("ticket_id");

    eventStatus.textContent = "CANCELADO";
    eventIdLabel.textContent = "-";
    updateTicketLabels();
    statusLabel.textContent = "Alerta cancelada";
    showHome();
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

    if (data?.pending_call_request && !terminalStates.includes(state)) {
      showIncomingCall(data.pending_call_request);
    }

    eventStatus.textContent = state;
    statusLabel.textContent = currentTicketId
      ? `Estado: ${state} · ${shortTicketId(currentTicketId)}`
      : "Estado: " + state;

    if (terminalStates.includes(state)) {
      const finishedTicket = currentTicketId;

      currentEventId = null;
      currentTicketId = null;
      localStorage.removeItem("event_id");
      localStorage.removeItem("ticket_id");
      eventIdLabel.textContent = "-";
      updateTicketLabels();

      statusLabel.textContent =
        state === "RESOLVED"
          ? `Caso resuelto · ${shortTicketId(finishedTicket)}`
          : state === "CLOSED"
            ? `Caso cerrado · ${shortTicketId(finishedTicket)}`
            : "Alerta cancelada";

      setTimeout(showHome, 1800);
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
        sender_name: "Vecino SOS",
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
      sender_name: "Vecino SOS",
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
        sender_name: "Vecino SOS"
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

setInterval(refreshStatus, 5000);

if (currentEventId) {
  eventIdLabel.textContent = currentEventId;
  updateTicketLabels();
  eventStatus.textContent = "RECUPERANDO";
  statusLabel.textContent = "Recuperando alerta activa...";
  showActiveAlert();
  refreshStatus();
} else {
  updateTicketLabels();
  showHome();
}

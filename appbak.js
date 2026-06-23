const API = "https://sos.vsti.cl";

const userId = localStorage.getItem("user_id") || crypto.randomUUID();
localStorage.setItem("user_id", userId);

const homePanel = document.getElementById("homePanel");
const categoryPanel = document.getElementById("categoryPanel");

const sosButton = document.getElementById("sosButton");
const confirmButton = document.getElementById("confirmButton");
const backButton = document.getElementById("backButton");
const cancelButton = document.getElementById("cancelButton");

const gpsStatus = document.getElementById("gpsStatus");
const accuracyLabel = document.getElementById("accuracy");
const eventStatus = document.getElementById("eventStatus");
const statusLabel = document.getElementById("status");
const eventIdLabel = document.getElementById("eventId");

let currentEventId = localStorage.getItem("event_id");
let selectedAlertType = "SOS_MANUAL";

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

function showHome() {
  if (currentEventId) return;

  homePanel.hidden = false;
  categoryPanel.hidden = true;
  cancelButton.hidden = true;
  sosButton.disabled = false;
  confirmButton.disabled = false;
  backButton.disabled = false;
  statusLabel.textContent = "Lista para usar";
}

function showCategories() {
  if (currentEventId) {
    statusLabel.textContent = "Ya existe una alerta activa";
    return;
  }

  homePanel.hidden = true;
  categoryPanel.hidden = false;
  statusLabel.textContent = "Selecciona el tipo de emergencia";
}

function showActiveAlert() {
  homePanel.hidden = true;
  categoryPanel.hidden = true;
  cancelButton.hidden = false;
  sosButton.disabled = true;
  confirmButton.disabled = false;
  backButton.disabled = false;
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
      alert_type: selectedAlertType,
      title: alertDefinitions[selectedAlertType].title,
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
    localStorage.setItem("event_id", currentEventId);

    eventIdLabel.textContent = currentEventId;
    eventStatus.textContent = "ACTIVO";
    statusLabel.textContent = "Alerta enviada";

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
    localStorage.removeItem("event_id");

    eventStatus.textContent = "CANCELADO";
    eventIdLabel.textContent = "-";
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
    const state = data?.event?.state || "DESCONOCIDO";

    eventStatus.textContent = state;
    statusLabel.textContent = "Estado: " + state;

    if (state === "CANCELLED" || state === "CLOSED" || state === "RESOLVED") {
      currentEventId = null;
      localStorage.removeItem("event_id");
      eventIdLabel.textContent = "-";
      showHome();
    }
  } catch (error) {
    console.error(error);
    statusLabel.textContent = "Sin conexión con plataforma";
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

setInterval(refreshStatus, 5000);

if (currentEventId) {
  eventIdLabel.textContent = currentEventId;
  eventStatus.textContent = "RECUPERANDO";
  statusLabel.textContent = "Recuperando alerta activa...";
  showActiveAlert();
  refreshStatus();
} else {
  showHome();
}

const API = "https://sos.vsti.cl";

const userId = localStorage.getItem("user_id")
|| crypto.randomUUID();

localStorage.setItem("user_id", userId);

const sosButton = document.getElementById("sosButton");
const cancelButton = document.getElementById("cancelButton");

const gpsStatus = document.getElementById("gpsStatus");
const accuracyLabel = document.getElementById("accuracy");
const eventStatus = document.getElementById("eventStatus");
const statusLabel = document.getElementById("status");
const eventIdLabel =
  document.getElementById("eventId");

let currentEventId = null;

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

statusLabel.textContent = "Lista para usar";



async function sendSOS() {

if (currentEventId) {
		statusLabel.textContent = "Ya existe una alerta activa";
		return;
	}

	statusLabel.textContent = "Obteniendo ubicación...";
	sosButton.disabled = true;

	gpsStatus.textContent = "Buscando...";

	navigator.geolocation.getCurrentPosition(

			async (position) => {

			gpsStatus.textContent = "OK";
			statusLabel.textContent = "Enviando alerta...";


const payload = {
  user_id: userId,

  name: "Usuario móvil",

  source: "mobile_pwa",

  alert_type: selectedAlertType,

  title:
    alertDefinitions[selectedAlertType].title,

  priority:
    alertDefinitions[selectedAlertType].priority,

  latitude: position.coords.latitude,

  longitude: position.coords.longitude,

  accuracy: Math.round(
    position.coords.accuracy
  ),

  battery: null
};




accuracyLabel.textContent =
payload.accuracy + " m";

const res = await fetch(
	`${API}/public/mobile/sos`,
	{
method: "POST",
headers: {
"Content-Type": "application/json"
},
body: JSON.stringify(payload)
}
);

const data = await res.json();

currentEventId = data.event_id;
eventIdLabel.textContent = currentEventId;

statusLabel.textContent = "Alerta enviada";
localStorage.setItem(
		"event_id",
		currentEventId
		);

eventStatus.textContent = "ACTIVO";

cancelButton.hidden = false;
sosButton.disabled = true;
},

	() => {

		gpsStatus.textContent = "ERROR";
		statusLabel.textContent = "Error obteniendo GPS";
		sosButton.disabled = false;

	},

{
enableHighAccuracy: true,
		    timeout: 10000
}
);
}

async function cancelSOS() {
	statusLabel.textContent = "Cancelando alerta...";
	await fetch(
			`${API}/public/mobile/cancel`,
			{
method: "POST",
headers: {
"Content-Type": "application/json"
},
body: JSON.stringify({
event_id: currentEventId,
user_id: userId
})
}
);

	eventStatus.textContent = "CANCELADO";
	statusLabel.textContent = "Alerta cancelada";
	sosButton.disabled = false;

	cancelButton.hidden = true;

	localStorage.removeItem("event_id");

	currentEventId = null;

eventIdLabel.textContent = "-";


	}

async function refreshStatus() {

	if (!currentEventId) return;

	const res = await fetch(
			`${API}/public/mobile/status/${currentEventId}`
			);

	const data = await res.json();
	eventStatus.textContent = data.event.state;
	statusLabel.textContent = "Estado: " + data.event.state;

	if (
			data.event.state === "CANCELLED" ||
			data.event.state === "CLOSED"
	   ) {
		currentEventId = null;

		localStorage.removeItem("event_id");

		cancelButton.hidden = true;
		sosButton.disabled = false;
	}



}



document
  .querySelectorAll(".emergency-option")
  .forEach(button => {

    button.addEventListener("click", () => {

      document
        .querySelectorAll(".emergency-option")
        .forEach(b =>
          b.classList.remove("active")
        );

      button.classList.add("active");

      selectedAlertType =
        button.dataset.type;

      statusLabel.textContent =
        "Tipo seleccionado: " +
        alertDefinitions[selectedAlertType].title;
    });

  });



sosButton.onclick = sendSOS;

cancelButton.onclick = cancelSOS;

setInterval(refreshStatus, 5000);



/*kotto temporal */
localStorage.removeItem("event_id");
/* hasta aqui temporalmente */

currentEventId = localStorage.getItem("event_id");

if (currentEventId) {

  eventIdLabel.textContent = currentEventId;

  cancelButton.hidden = false;
  sosButton.disabled = true;

  statusLabel.textContent =
    "Recuperando alerta activa...";

  refreshStatus();
}



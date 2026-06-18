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

let currentEventId = null;
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
latitude: position.coords.latitude,
longitude: position.coords.longitude,
accuracy: Math.round(position.coords.accuracy),
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

sosButton.onclick = sendSOS;

cancelButton.onclick = cancelSOS;

setInterval(refreshStatus, 5000);
currentEventId = localStorage.getItem("event_id");

if (currentEventId) {
	cancelButton.hidden = false;
	sosButton.disabled = true;

	statusLabel.textContent =
		"Recuperando alerta activa...";

	refreshStatus();
}

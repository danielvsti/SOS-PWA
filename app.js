const API = "https://sos.vsti.cl";

const userId = localStorage.getItem("user_id")
  || crypto.randomUUID();

localStorage.setItem("user_id", userId);

const sosButton = document.getElementById("sosButton");
const cancelButton = document.getElementById("cancelButton");

const gpsStatus = document.getElementById("gpsStatus");
const accuracyLabel = document.getElementById("accuracy");
const eventStatus = document.getElementById("eventStatus");

let currentEventId = null;

async function sendSOS() {

  gpsStatus.textContent = "Buscando...";

  navigator.geolocation.getCurrentPosition(

    async (position) => {

      gpsStatus.textContent = "OK";

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

      localStorage.setItem(
        "event_id",
        currentEventId
      );

      eventStatus.textContent = "ACTIVO";

      cancelButton.hidden = false;

    },

    () => {
      gpsStatus.textContent = "ERROR";
      alert("No fue posible obtener GPS");
    },

    {
      enableHighAccuracy: true,
      timeout: 10000
    }
  );
}

async function cancelSOS() {

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

  eventStatus.textContent =
    data.event.state;
}

sosButton.onclick = sendSOS;

cancelButton.onclick = cancelSOS;

setInterval(refreshStatus, 5000);

currentEventId = localStorage.getItem("event_id");

if (currentEventId) {
  cancelButton.hidden = false;
}

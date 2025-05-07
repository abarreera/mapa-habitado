// Variables globales
let map;
let activeInfoWindow = null;
let lastAddedMarker = null;

// Exponer `initMap` globalmente para el callback de Google Maps
window.initMap = async function () {
  const { Map } = await google.maps.importLibrary("maps");

  map = new Map(document.getElementById("map"), {
    center: { lat: 39.46975, lng: -0.37739 },
    zoom: 12,
    mapId: "6bf319749ec8b051"
  });

  initStreetView();
  connectButtons();
  loadFirebaseMarkers();
  loadStaticMarkers();
};

function initStreetView() {
  const el = document.getElementById("street-view");
  if (!el) return;

  const panorama = new google.maps.StreetViewPanorama(el, {
    pov: { heading: 165, pitch: 0 },
    zoom: 1
  });

  map.setStreetView(panorama);
}

function updateStreetView(location) {
  const el = document.getElementById("street-view");
  if (!el) return;

  const panorama = new google.maps.StreetViewPanorama(el, {
    position: location,
    pov: { heading: 165, pitch: 0 },
    zoom: 1
  });

  map.setStreetView(panorama);
}

function connectButtons() {
  document.getElementById("btnLocation1")?.addEventListener("click", () => {
    map.setCenter({ lat: 39.46975, lng: -0.37739 });
    map.setZoom(12);
  });

  document.getElementById("btnLocation2")?.addEventListener("click", () => {
    map.setCenter({ lat: 40.4167, lng: -3.704 });
    map.setZoom(12);
  });

  document.getElementById("btnGlobalView")?.addEventListener("click", () => {
    map.setCenter({ lat: 39.0, lng: -3.0 });
    map.setZoom(6);
  });
}

function createMarker(position, label, title, content) {
  const marker = new google.maps.Marker({
    position,
    map,
    label,
    title,
    draggable: false,
    animation: google.maps.Animation.DROP
  });

  const infoWindow = new google.maps.InfoWindow({ content });

  marker.addListener("click", () => {
    activeInfoWindow?.close();
    infoWindow.open(map, marker);
    activeInfoWindow = infoWindow;
  });

  return marker;
}

function loadFirebaseMarkers() {
  const db = window.firebaseDB;
  const ref = window.firebaseRef;
  const onValue = window.firebaseOnValue;

  const markersRef = ref(db, "markers");
  onValue(markersRef, (snapshot) => {
    snapshot.forEach((child) => {
      const data = child.val();
      createMarker(
        { lat: data.lat, lng: data.lng },
        "⌂",
        data.name,
        `<strong>${data.name}</strong><br><p>${data.note}</p>`
      );
    });
  });
}

function loadStaticMarkers() {
  createMarker({ lat: 39.4805, lng: -0.3801 }, "⌂", "Tu casa nueva",
    "<p>Desde Madrid traje a mi mejor amiga...</p>");
  
    createMarker({ lat: 39.424330473855335, lng: -0.3926034900899616 }, "⌂", "Av/Dr. Antonio Muñoz",
      "<p>La vista del tren desde el balcón. El banco de debajo de casa. La alquería reformada al otro lado de las vías. El otro lado del balcón.</p>");
  
    createMarker({ lat: 39.47831752000949, lng: -0.4016914330893657 }, "⌂", "Hospital 9 d'octubre",
      "<p>Mi primera habitación. Pasé un tiempo extra aquí porque nací asfixiada con mi propio cordón umbilical...</p>");
  
    createMarker({ lat: 39.41457386524401, lng: -0.39878186715367625 }, "⌂", "Carrer de Blasco Ibañez",
      "<p>Aquí venía solo los fines de semana desde 2007 hasta 2014.</p>");
  
    createMarker({ lat: 40.39841836995521, lng: -3.699664293095911 }, "⌂", "Piso en Embajadores",
      "<p>La casa en la que vivía mi padre antes y meses después de tener una hija.</p>");
  
    createMarker({ lat: 40.40904688715919, lng: -3.6991805425744846 }, "⌂", "Calle Salitre",
      "<p>Viviamos separadas pero juntas. Cuando no dormíamos juntas nos llamábamos llorando...</p>");
  
    createMarker({ lat: 40.49279957696005, lng: -3.8761872327693303 }, "⌂", "Piso en Las Rozas",
      "<p>Esta fue la casa de mi abuela por parte paterna. Luego fue la casa de mi padre...</p>");
  
    createMarker({ lat: 40.403384085313625, lng: -3.665905002526079 }, "⌂", "Calle Tejar de la Pastora. Vallecas",
      "<p>Me dijiste: vente a vivir conmigo. Y allí construimos un pequeño núcleo cálido...</p>");
  
    createMarker({ lat: 40.4108170209775, lng: -3.7017369358467094 }, "⌂", "Calle Olivar. Lavapiés",
      "<p>Un piso abuhardillado en el cual mi cuarto y el de Elena estaban literalmente conectados...</p>");
  

  connectButtons();
}
document.addEventListener("DOMContentLoaded", () => {
  // Animaciones
  if (document.getElementById("animated-text")) {
    startTypingEffect("animated-text", ["Explora el mapa a través de tu propia habitabilidad"]);
  }

  if (document.getElementById("animated-text-2")) {
    startTypingEffect("animated-text-2", ["La vida real es solo una ventana más"]);
  }

  // Confeti
  const confetti = document.getElementById("addLocationBtn");
  if (confetti) {
    confetti.addEventListener("mouseenter", () => triggerConfetti(10, 100));
    confetti.addEventListener("click", () => triggerConfetti(20, 50));
  }

  // Modal control
  const modal = document.getElementById("customModal");
  const closeBtn = document.querySelector(".close-btn");
  modal.style.display = "none";
  closeBtn?.addEventListener("click", () => {
    modal.style.display = "none";
  });

  // Buscar y añadir ubicación
  document.getElementById("addLocationBtn")?.addEventListener("click", () => {
    const input = document.getElementById("searchBox").value;
    if (!input) return alert("Escribe una dirección primero.");

    const searchService = new google.maps.places.PlacesService(map);

    searchService.findPlaceFromQuery({
      query: input,
      fields: ["geometry", "name"]
    }, (results, status) => {
      if (status === "OK" && results[0]) {
        const location = results[0].geometry.location;
        const name = results[0].name;

        modal.style.display = "flex";

        document.getElementById("saveNoteBtn").onclick = () => {
          const note = document.getElementById("noteInput").value;
          if (note.trim() === "") return alert("No se añadió ninguna nota.");

          const db = window.firebaseDB;
          const ref = window.firebaseRef;
          const push = window.firebasePush;

          const markersRef = ref(db, "markers");
          push(markersRef, {
            lat: location.lat(),
            lng: location.lng(),
            name,
            note
          });

          const marker = new google.maps.Marker({
            position: location,
            map,
            title: name,
            animation: google.maps.Animation.DROP
          });

          const infoWindow = new google.maps.InfoWindow({
            content: `<strong>${name}</strong><br><p>${note}</p>`
          });

          marker.addListener("click", () => infoWindow.open(map, marker));
          lastAddedMarker = marker;

          map.setCenter(location);
          map.setZoom(14);
          modal.style.display = "none";
          document.getElementById("noteInput").value = "";
        };
      } else {
        alert("No se encontró la dirección.");
      }
    });
  });

  // Eliminar marcador
  document.getElementById("removeLastMarkerBtn")?.addEventListener("click", () => {
    if (lastAddedMarker) {
      lastAddedMarker.setMap(null);
      lastAddedMarker = null;
    }
  });
});

// Animación de texto
function startTypingEffect(id, messages) {
  const el = document.getElementById(id);
  let i = 0, j = 0, deleting = false;

  function type() {
    const msg = messages[i];
    el.textContent = deleting ? msg.substring(0, j--) : msg.substring(0, j++);

    if (!deleting && j === msg.length) {
      deleting = true;
      setTimeout(type, 2500);
    } else if (deleting && j === 0) {
      deleting = false;
      i = (i + 1) % messages.length;
      setTimeout(type, 1000);
    } else {
      setTimeout(type, deleting ? 50 : 100);
    }
  }
  type();
}

// Confetti
function triggerConfetti(count, delay) {
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const el = document.createElement("div");
      el.textContent = "⌂";
      el.className = "house-confetti";
      el.style.left = Math.random() * window.innerWidth + "px";
      el.style.top = "-20px";
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1500);
    }, i * delay);
  }
}

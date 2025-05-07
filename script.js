let map;
let activeInfoWindow = null;
let addedMarkers = [];
let lastAddedMarker = null;

async function initMap() {
    const { Map } = await google.maps.importLibrary("maps");

    map = new Map(document.getElementById("map"), {
        center: { lat: 39.46975, lng: -0.37739 },
        zoom: 12,
        mapId: "6bf319749ec8b051"
    });

    loadSavedMarkers();

    connectButtons();
    initStreetView();

    // Eventos del buscador
    document.getElementById("searchBtn").addEventListener("click", handleSearch);
    document.getElementById("addLocationBtn").addEventListener("click", openAddLocationModal);
    document.getElementById("removeLastMarkerBtn").addEventListener("click", removeLastMarker);
    document.querySelector(".close-btn").addEventListener("click", () => {
        document.getElementById("customModal").style.display = "none";
    });
}

function createMarker({ lat, lng, name, note }) {
    const position = { lat, lng };
    const marker = new google.maps.Marker({
        position,
        map,
        title: name,
        animation: google.maps.Animation.DROP
    });

    const infoWindow = new google.maps.InfoWindow({
        content: `<strong>${name}</strong><br><p>${note}</p>`,
    });

    marker.addListener("click", () => {
        if (activeInfoWindow) activeInfoWindow.close();
        infoWindow.open(map, marker);
        activeInfoWindow = infoWindow;
    });
}

function loadSavedMarkers() {
    const onValue = window.firebaseOnValue;
    const ref = window.firebaseRef;
    const db = window.firebaseDB;

    const markersRef = ref(db, "markers");

    onValue(markersRef, (snapshot) => {
        snapshot.forEach((child) => {
            const data = child.val();
            createMarker(data);
        });
    });
}

function openAddLocationModal() {
    const input = document.getElementById("searchBox").value;
    if (!input) return alert("Escribe una dirección primero.");

    const searchService = new google.maps.places.PlacesService(map);
    searchService.findPlaceFromQuery({
        query: input,
        fields: ["geometry", "name"],
    }, (results, status) => {
        if (status === "OK" && results[0]) {
            const location = results[0].geometry.location;
            const name = results[0].name;

            const modal = document.getElementById("customModal");
            modal.style.display = "flex";

            document.getElementById("saveNoteBtn").onclick = function () {
                const userNote = document.getElementById("noteInput").value.trim();
                if (!userNote) {
                    alert("No se añadió ninguna nota.");
                    return;
                }

                const newMarker = {
                    lat: location.lat(),
                    lng: location.lng(),
                    name,
                    note: userNote
                };

                // Guardar en Firebase
                const push = window.firebasePush;
                const ref = window.firebaseRef;
                const db = window.firebaseDB;

                push(ref(db, "markers"), newMarker);

                createMarker(newMarker);
                map.setCenter(location);
                map.setZoom(14);

                modal.style.display = "none";
                document.getElementById("noteInput").value = "";
            };
        } else {
            alert("No se encontró la dirección.");
        }
    });
}

function removeLastMarker() {
    if (lastAddedMarker) {
        lastAddedMarker.setMap(null);
        lastAddedMarker = null;
    }
}

function handleSearch() {
    const input = document.getElementById("searchBox").value;
    if (!input) return;

    const searchService = new google.maps.places.PlacesService(map);
    searchService.findPlaceFromQuery({
        query: input,
        fields: ["geometry"],
    }, (results, status) => {
        if (status === "OK" && results[0]) {
            const location = results[0].geometry.location;
            map.setCenter(location);
            map.setZoom(14);
            updateStreetView(location);
        } else {
            console.error("No se encontró la dirección");
        }
    });
}

function initStreetView() {
    const streetViewElement = document.getElementById("street-view");
    if (!streetViewElement) return;

    const panorama = new google.maps.StreetViewPanorama(streetViewElement, {
        pov: { heading: 165, pitch: 0 },
        zoom: 1
    });

    map.setStreetView(panorama);
}

function updateStreetView(location) {
    const streetViewElement = document.getElementById("street-view");
    if (!streetViewElement) return;

    const panorama = new google.maps.StreetViewPanorama(streetViewElement, {
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
        map.setCenter({ lat: 40.4167, lng: -3.7040 });
        map.setZoom(12);
    });

    document.getElementById("btnGlobalView")?.addEventListener("click", () => {
        map.setCenter({ lat: 39.0, lng: -3.0 });
        map.setZoom(6);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const animated1 = document.getElementById("animated-text");
    const animated2 = document.getElementById("animated-text-2");

    if (animated1) startTypingEffect("animated-text", ["Explora el mapa a través de tu propia habitabilidad"]);
    if (animated2) startTypingEffect("animated-text-2", ["La vida real es solo una ventana más"]);
});

function startTypingEffect(elementId, messages) {
    const textElement = document.getElementById(elementId);
    let index = 0, charIndex = 0, isDeleting = false;

    function typeEffect() {
        const msg = messages[index];

        textElement.textContent = isDeleting
            ? msg.substring(0, charIndex--)
            : msg.substring(0, charIndex++);

        let delay = isDeleting ? 50 : 100;
        if (!isDeleting && charIndex === msg.length) {
            delay = 2500;
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            index = (index + 1) % messages.length;
            delay = 1000;
        }

        setTimeout(typeEffect, delay);
    }

    typeEffect();
}

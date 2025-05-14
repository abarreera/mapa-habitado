/*  Código para el mapa */
let map;
let activeInfoWindow = null;
let addedMarkers = [];
let lastAddedMarker =null;
let tempLocation = null;

/*  se inicia el mapa */
async function initMap() {
  const { Map, places } = await google.maps.importLibrary("maps");

  map = new Map(document.getElementById("map"), {
      center: { lat: 39.46975, lng: -0.37739 },
      zoom: 12,
      mapId: "6bf319749ec8b051"
  });
  /* visualiza marcadores en el mapa  */
const db = window.firebaseDB;
const ref = window.firebaseRef;
const onValue = window.firebaseOnValue;

const markersRef = ref(db, "markers");

onValue(markersRef, (snapshot) => {
  snapshot.forEach((childSnapshot) => {
    const data = childSnapshot.val();

    const marker = new google.maps.Marker({
      position: { lat: data.lat, lng: data.lng },
      map: map,
      title: data.name,
      animation: google.maps.Animation.DROP,
    });

    const infoWindow = new google.maps.InfoWindow({
      content: `<strong>${data.name}</strong><br><p>${data.note}</p>`,
    });

     marker.addListener("click", () => {
      if (activeInfoWindow) {
        activeInfoWindow.close();
      }
      infoWindow.open(map, marker);
      activeInfoWindow = infoWindow;
    });
  });
});



/*  crea marcadores */
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

      google.maps.event.addListener(marker, 'click', function () {
          if (activeInfoWindow) {
              activeInfoWindow.close();
          }
          infoWindow.open(map, marker);
          activeInfoWindow = infoWindow;
      });

      return marker;
  }
  function initStreetView() {
    const streetViewElement = document.getElementById("street-view");

    if (!streetViewElement) {
        console.error("Error: No se encontró el contenedor `#street-view`.");
        return;
    }

    //  Inicializar Street View sin ubicación inicial
    const panorama = new google.maps.StreetViewPanorama(streetViewElement, {
        pov: { heading: 165, pitch: 0 },
        zoom: 1
    });

    map.setStreetView(panorama);
}

//  Función para actualizar `Street View` cuando el usuario busca una dirección
function updateStreetView(location) {
    const streetViewElement = document.getElementById("street-view");

    if (!streetViewElement) return;

    //  Actualiza la posición de `Street View`
    const panorama = new google.maps.StreetViewPanorama(streetViewElement, {
        position: location,
        pov: { heading: 165, pitch: 0 },
        zoom: 1
    });

    map.setStreetView(panorama);
}

//  Modifica la búsqueda para actualizar `Street View`
document.getElementById("searchBtn").addEventListener("click", () => {
    const input = document.getElementById("searchBox").value;
    if (!input) return;

    const searchService = new google.maps.places.PlacesService(map);

    searchService.findPlaceFromQuery(
        {
            query: input,
            fields: ["geometry", "name"],
        },
        (results, status) => {
            if (status === "OK" && results[0]) {
                const location = results[0].geometry.location;
                map.setCenter(location);
                map.setZoom(14);

                // Actualizar `Street View` con la dirección encontrada
                updateStreetView(location);
            } else {
                console.error("No se encontró la dirección");
            }
        }
    );
});



    // Lista de marcadores
    

    createMarker({ lat: 40.49279957696005, lng: -3.8761872327693303 }, "⌂", "Piso en Las Rozas",
      "<p>Esta fue la casa de mi abuela por parte paterna. Luego fue la casa de mi padre...</p>");

    


  connectButtons();
}
document.addEventListener('DOMContentLoaded', () => {
    const addLocationBtn = document.getElementById('addLocationBtn');

    function createHouseConfetti() {
        const house = document.createElement('div');
        house.textContent = '⌂';
        house.classList.add('house-confetti');

        house.style.left = Math.random() * window.innerWidth + 'px';
        house.style.top = '-20px';

        document.body.appendChild(house);

        setTimeout(() => {
            house.remove();
        }, 1500);
    }

    function triggerConfetti(quantity, interval) {
        for (let i = 0; i < quantity; i++) {
            setTimeout(createHouseConfetti, i * interval);
        }
    }

    addLocationBtn.addEventListener('mouseenter', () => {
        triggerConfetti(10, 100);
    });

    addLocationBtn.addEventListener('click', () => {
        triggerConfetti(20, 50);
    });
});

document.addEventListener("DOMContentLoaded", function () {
  const modal = document.getElementById("customModal");
  const closeBtn = document.querySelector(".close-btn");

  // Asegura que el modal esté oculto al cargar la página
  modal.style.display = "none";

  //buscar con enter
  document.getElementById("searchBox").addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      document.getElementById("searchBtn").click();
    }
  });
  // Al hacer clic en "Añadir Ubicación"

  document.getElementById("addLocationBtn").addEventListener("click", function () {
    const input = document.getElementById("searchBox").value;
    if (!input) return alert("Escribe una dirección primero.");

    const searchService = new google.maps.places.PlacesService(map);
    const modal = document.getElementById("customModal"); // ✅ aquí definimos modal

    searchService.findPlaceFromQuery(
        {
            query: input,
            fields: ["geometry", "name"],
        },
        (results, status) => {
            if (status === "OK" && results[0]) {
                const location = results[0].geometry.location;
                const name = results[0].name;

                tempLocation = { location, name };

                modal.style.display = "flex";

                document.getElementById("saveNoteBtn").onclick = function () {
                    const userNote = document.getElementById("noteInput").value;

                    if (userNote.trim() === "") {
                        alert("No se añadió ninguna nota.");
                        return;
                    }

                    guardarUbicacionEnFirebase(
                        tempLocation.location.lat(),
                        tempLocation.location.lng(),
                        tempLocation.name,
                        userNote
                    );

                    lastAddedMarker = new google.maps.Marker({
                        position: tempLocation.location,
                        map: map,
                        title: tempLocation.name,
                        animation: google.maps.Animation.DROP
                    });

                    const infoWindow = new google.maps.InfoWindow({
                        content: `<strong>${tempLocation.name}</strong><br><p>${userNote}</p>`,
                    });

                    lastAddedMarker.addListener("click", function () {
                        infoWindow.open(map, lastAddedMarker);
                    });

                    map.setCenter(tempLocation.location);
                    map.setZoom(14);

                    modal.style.display = "none";
                    document.getElementById("noteInput").value = "";
                };
            } else {
                alert("No se encontró la dirección.");
            }
        }
    );
});



  // Cerrar la ventana emergente al hacer clic en la "X"
  closeBtn.addEventListener("click", function () {
      modal.style.display = "none";
  });
});
document.getElementById("removeLastMarkerBtn").addEventListener("click", function () {
    if (lastAddedMarker) {
        lastAddedMarker.setMap(null); // Elimina solo el último marcador
        lastAddedMarker = null; // Restablece la variable
    }
});





/*  Conectar botones de navegación */
function connectButtons() {
  document.getElementById("btnLocation1")?.addEventListener("click", function () {
      map.setCenter({ lat: 39.46975, lng: -0.37739 });
      map.setZoom(12);
  });

  document.getElementById("btnLocation2")?.addEventListener("click", function () {
      map.setCenter({ lat: 40.4167, lng: -3.7040 });
      map.setZoom(12);
  });

  document.getElementById("btnGlobalView")?.addEventListener("click", function () {
      map.setCenter({ lat: 39.0, lng: -3.0 });
      map.setZoom(6);
  });
}

document.addEventListener("DOMContentLoaded", function () {
  const saveButton = document.getElementById("saveLocations");

  if (saveButton) {
      saveButton.addEventListener("click", saveExistingMarkers);
  }
});

document.addEventListener("DOMContentLoaded", function () {
    // Inicializa la animación de texto si hay elementos con ID "animated-text" o "animated-text-2"
    if (document.getElementById("animated-text")) {
        startTypingEffect("animated-text", ["Explora el mapa a través de tu propia habitabilidad"]);
    }

    if (document.getElementById("animated-text-2")) {
        startTypingEffect("animated-text-2", ["La vida real es solo una ventana más"]);
    }
   // if (document.getElementById("animated-text-2")) {
       // startTypingEffect("animated-text-2", ["La vida real es solo una ventana más"]);
    //}

    // Inicializa el mapa solo si está en la página del mapa
    if (document.getElementById("map")) {
        initMap();
    }
  });

  /* Función para animación de escritura */
  function startTypingEffect(elementId, messages) {
    const textElement = document.getElementById(elementId);
    let index = 0;
    let charIndex = 0;
    let isDeleting = false;

    function typeEffect() {
        const currentMessage = messages[index];

        if (isDeleting) {
            textElement.textContent = currentMessage.substring(0, charIndex - 1);
            charIndex--;
        } else {
            textElement.textContent = currentMessage.substring(0, charIndex + 1);
            charIndex++;
        }

        let speed = isDeleting ? 50 : 100;
        if (!isDeleting && charIndex === currentMessage.length) {
            speed = 2500;
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            index = (index + 1) % messages.length;
            speed = 1000;
        }

        setTimeout(typeEffect, speed);
    }

    typeEffect();
  }
  //  guardar en base de datos
function guardarUbicacionEnFirebase(lat, lng, name, note) {
    const db = window.firebaseDB;
    const ref = window.firebaseRef;
    const push = window.firebasePush;

    const markersRef = ref(db, "markers");
    push(markersRef, {
        lat: lat,
        lng: lng,
        name: name,
        note: note
    }).then(() => {
        console.log("Ubicación guardada en Firebase:", { lat, lng, name, note });
    }).catch((error) => {
        console.error("Error al guardar en Firebase:", error);
    });

}

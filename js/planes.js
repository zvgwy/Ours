const SUPABASE_URL = "https://enyeraxntpgcektunuwa.supabase.co";
const SUPABASE_KEY = "sb_publishable_qmf2WYLzaHF2qmhvX-TCNQ_aJC0m3nd";
const AIRLABS_KEY = "7dff56b9-3de3-43ff-97fb-cb836e82b0db";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentSearchResults = [];
let visibleResultCount = 3;

let userLocation = null;

navigator.geolocation.getCurrentPosition(
  (position) => {
    userLocation = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    };
  },
  () => {
    console.log("Location permission denied or unavailable.");
  }
);

function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

let selectedPlaneData = null;

const airlineColors = {
  PR: "#0038A8",
  "5J": "#F7941D",
  Z2: "#D71920",
  SQ: "#00266B",
  CX: "#006564",
  QR: "#5C0D34",
  EK: "#D71920",
  UA: "#002244",
  DL: "#B31B1B",
  AA: "#0078D2",
};

const airlineNames = {
  PR: "Philippine Airlines",
  "5J": "Cebu Pacific",
  Z2: "Philippines AirAsia",
  SQ: "Singapore Airlines",
  CX: "Cathay Pacific",
  QR: "Qatar Airways",
  EK: "Emirates",
  UA: "United Airlines",
  DL: "Delta Air Lines",
  AA: "American Airlines",
};

function countryCodeToFlag(code) {
  if (!code) return "";
  return code
    .toUpperCase()
    .replace(/./g, (char) =>
      String.fromCodePoint(127397 + char.charCodeAt())
    );
}

function getAirlineName(plane) {
  return (
    airlineNames[plane.airline_iata] ||
    plane.airline_icao ||
    plane.airline_iata ||
    "Unknown Airline"
  );
}

function getAirlineColor(plane) {
  return airlineColors[plane.airline_iata] || "#ff5f98";
}

function detectSearchType(value) {
  const input = value.trim().toUpperCase();

  if (/^[A-Z]{3}$/.test(input)) return "dep_iata";
  if (/^[A-Z][A-Z0-9]{2,3}$/.test(input)) return "aircraft_icao";
  if (/^[A-Z0-9]{2,3}\d{2,4}$/.test(input)) return "flight_iata";
  if (input.includes("-") || /^[A-Z]\d/.test(input)) return "reg_number";

  return "flight_iata";
}

async function searchPlanes() {
  const searchValue = document.getElementById("searchValue").value.trim();
  const searchType = detectSearchType(searchValue);
  const container = document.getElementById("searchResults");

  if (!searchValue) {
    container.innerHTML = `<p class="empty-state">Enter something first.</p>`;
    return;
  }

  container.innerHTML = `<p class="empty-state">Searching...</p>`;

  try {
    const url = `https://airlabs.co/api/v9/flights?api_key=${AIRLABS_KEY}&${searchType}=${encodeURIComponent(searchValue)}`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data.response || data.response.length === 0) {
      container.innerHTML = `<p class="empty-state">No results found.</p>`;
      return;
    }

    let results = data.response;

    if (userLocation) {
      results = results
        .map((plane) => {
          if (!plane.lat || !plane.lng) {
            return { ...plane, distanceKm: null };
          }

          return {
            ...plane,
            distanceKm: getDistanceKm(
              userLocation.lat,
              userLocation.lng,
              Number(plane.lat),
              Number(plane.lng)
            ),
          };
        })
        .sort((a, b) => {
          if (a.distanceKm === null) return 1;
          if (b.distanceKm === null) return -1;
          return a.distanceKm - b.distanceKm;
        });
    }

    container.innerHTML = "";

    container.innerHTML = "";
    results.slice(0, 8).forEach((plane) => {
      const div = document.createElement("div");
      div.className = "plane-result";

      div.innerHTML = `
        <div>
          <strong>${plane.flight_iata || "Unknown Flight"}</strong>
          <p>${getAirlineName(plane)}</p>
          <p>${plane.aircraft_icao || "Unknown aircraft"} • ${plane.status || ""}</p>
          <p>${plane.dep_iata || "?"} → ${plane.arr_iata || "?"}</p>
          <p>
            ${
              plane.distanceKm != null
                ? `${plane.distanceKm.toFixed(1)} km away`
                : "Distance unavailable"
            }
          </p>
        </div>
        <button>Select</button>
      `;

      div.querySelector("button").addEventListener("click", () => {
        selectPlane(plane);
      });

      container.appendChild(div);
    });
  } catch (error) {
    console.error(error);
    container.innerHTML = `<p class="empty-state">Error fetching AirLabs data.</p>`;
  }
}

function selectPlane(plane) {
  selectedPlaneData = plane;

  document.getElementById("selectedPlane").textContent =
    `${plane.flight_iata || ""} • ${plane.aircraft_icao || "Unknown aircraft"}`;
}

async function savePlane() {
  if (!selectedPlaneData) {
    alert("Select a plane first.");
    return;
  }

  const location = document.getElementById("locationInput").value.trim();
  const notes = document.getElementById("notesInput").value.trim();

  const planeToSave = {
    hex: selectedPlaneData.hex || "",
    reg_number: selectedPlaneData.reg_number || "",
    flag: selectedPlaneData.flag || "",

    airline_icao: selectedPlaneData.airline_icao || "",
    airline_iata: selectedPlaneData.airline_iata || "",
    airline_name: getAirlineName(selectedPlaneData),
    airline_color: getAirlineColor(selectedPlaneData),

    aircraft_icao: selectedPlaneData.aircraft_icao || "",
    aircraft_iata: selectedPlaneData.aircraft_iata || "",
    model: selectedPlaneData.model || "",
    manufacturer: selectedPlaneData.manufacturer || "",

    lat: selectedPlaneData.lat || "",
    lng: selectedPlaneData.lng || "",
    alt: selectedPlaneData.alt || "",
    dir: selectedPlaneData.dir || "",
    speed: selectedPlaneData.speed || "",
    v_speed: selectedPlaneData.v_speed || "",
    squawk: selectedPlaneData.squawk || "",
    last_seen: selectedPlaneData.updated || "",

    flight_iata: selectedPlaneData.flight_iata || "",
    flight_icao: selectedPlaneData.flight_icao || "",
    dep_iata: selectedPlaneData.dep_iata || "",
    arr_iata: selectedPlaneData.arr_iata || "",
    status: selectedPlaneData.status || "",

    location,
    notes,
  };

  const { error } = await db.from("planes").insert([planeToSave]);

  if (error) {
    console.error("Supabase save error:", error);
    alert(error.message);
    return;
  }

  selectedPlaneData = null;
  document.getElementById("selectedPlane").textContent = "No plane selected";
  document.getElementById("locationInput").value = "";
  document.getElementById("notesInput").value = "";

  loadPlanes();
}

async function loadPlanes() {
  const { data, error } = await db
    .from("planes")
    .select("*")
    .order("created_at", { ascending: false });

  const container = document.getElementById("planeLog");

  if (error) {
    container.innerHTML = `<p>Error loading log.</p>`;
    return;
  }

  container.innerHTML = "";

  if (!data || data.length === 0) {
    document.getElementById("totalPlanesSeen").textContent = 0;
    document.getElementById("uniqueAircraftSeen").textContent = 0;

    container.innerHTML = `<p>No planes yet.</p>`;
    return;
  }

  document.getElementById("totalPlanesSeen").textContent = data.length;

  const uniqueAircrafts = new Set(
    data.map((plane) => plane.aircraft_icao || plane.model || "Unknown")
  );

  document.getElementById("uniqueAircraftSeen").textContent = uniqueAircrafts.size;

  data.forEach((plane) => {
    const card = document.createElement("div");
    card.className = "plane-log-card";
    const flagEmoji = countryCodeToFlag(plane.flag);

    card.innerHTML = `
      <div class="plane-card-header">
        <div>
          <h3>
            ${flagEmoji} ${plane.manufacturer || ""}
            ${plane.model || plane.aircraft_icao || "Unknown Aircraft"}
          </h3>

          <p class="plane-airline" style="background:${plane.airline_color}">
            ${plane.airline_name || "Unknown Airline"}
          </p>
        </div>

        <button class="delete-btn" onclick="deletePlaneLog('${plane.id}', this)">
          ✕
        </button>
      </div>

      <p><strong>Flight:</strong> ${plane.flight_iata || ""}</p>
      <p><strong>Route:</strong> ${plane.dep_iata || "?"} → ${plane.arr_iata || "?"}</p>
      <p><strong>Seen at:</strong> ${plane.location || ""}</p>
      ${plane.notes ? `
        <p class="plane-note">
          <span class="note-emoji">📝</span>
          <span class="note-text">${plane.notes}</span>
        </p>
      ` : ""}

      <div class="plane-card-footer">
        <span class="plane-meta">
          Added ${formatRelativeTime(plane.created_at)}
        </span>
      </div>
    `;

    container.appendChild(card);
  });
}

async function deletePlaneLog(id, button) {
  if (!button.classList.contains("confirming")) {
    button.classList.add("confirming");
    button.textContent = "✓";

    setTimeout(() => {
      button.classList.remove("confirming");
      button.textContent = "✓";
    }, 3000);

    return;
  }

  const { error } = await db.from("planes").delete().eq("id", id);

  if (error) {
    console.error("Delete error:", error);
    alert(error.message);
    return;
  }

  loadPlanes();
}

window.searchPlanes = searchPlanes;
window.savePlane = savePlane;
window.deletePlaneLog = deletePlaneLog;

loadPlanes();

function renderSearchResults() {
  const container = document.getElementById("searchResults");
  container.innerHTML = "";

  currentSearchResults.slice(0, visibleResultCount).forEach((plane) => {
    const div = document.createElement("div");
    div.className = "plane-result";

    div.innerHTML = `
      <div>
        <strong>${plane.flight_iata || "Unknown Flight"}</strong>
        <p>${getAirlineName(plane)}</p>
        <p>${plane.aircraft_icao || "Unknown aircraft"} • ${plane.status || ""}</p>
        <p>${plane.dep_iata || "?"} → ${plane.arr_iata || "?"}</p>
        <p>
          ${
            plane.distanceKm != null
              ? `${plane.distanceKm.toFixed(1)} km away`
              : "Distance unavailable"
          }
        </p>
      </div>
      <button>Select</button>
    `;

    div.querySelector("button").addEventListener("click", () => {
      selectPlane(plane);
    });

    container.appendChild(div);
  });

  if (visibleResultCount < currentSearchResults.length) {
    const seeMoreBtn = document.createElement("button");
    seeMoreBtn.className = "see-more-btn";
    seeMoreBtn.textContent = "See more";
    seeMoreBtn.addEventListener("click", () => {
      visibleResultCount += 3;
      renderSearchResults();
    });

    container.appendChild(seeMoreBtn);
  }
}

function formatRelativeTime(dateValue) {
  if (!dateValue) return "just now";

  const date = new Date(dateValue + "Z");
  const now = new Date();

  const diffMs = now.getTime() - date.getTime();
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes} min${minutes > 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hr${hours > 1 ? "s" : ""} ago`;
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;

  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
const rings = [
  {
    title: "Copper",
    meaning: "In a relationship",
    status: "Unlocked",
    badge: "Current Level",
    image: "../img/copper.png",
    unlocked: true,
  },
  {
    title: "Silver",
    meaning: "Engaged",
    status: "",
    badge: "Next Upgrade",
    image: "../img/silver.png",
    unlocked: false,
  },
  {
    title: "Gold",
    meaning: "Married",
    status: "",
    badge: "Final Level",
    image: "../img/gold.png",
    unlocked: false,
  },
];

let currentRing = 0;

const ringImage = document.getElementById("ringImage");
const ringTitle = document.getElementById("ringTitle");
const ringMeaning = document.getElementById("ringMeaning");
const ringStatus = document.getElementById("ringStatus");
const ringBadge = document.getElementById("ringBadge");
const dots = document.querySelectorAll(".dot");
const lockOverlay = document.getElementById("lockOverlay");

function updateRing() {

  const ring = rings[currentRing];

  ringImage.classList.remove("ring-animate");
  void ringImage.offsetWidth;
  ringImage.classList.add("ring-animate");

  ringImage.src = ring.image;
  ringImage.alt = ring.title;

  ringTitle.textContent = ring.title;
  ringMeaning.textContent = ring.meaning;
  ringStatus.textContent = ring.status;
  ringBadge.textContent = ring.badge;

  ringStatus.className = ring.unlocked
    ? "ring-status unlocked-text"
    : "ring-status locked-text";

  ringBadge.className = ring.unlocked
    ? "ring-badge"
    : "ring-badge locked-ring-badge";

  ringImage.classList.toggle("locked-ring-image", !ring.unlocked);

  // 🔒 control lock overlay
    if (!ring.unlocked) {
    lockOverlay.classList.add("show");
    } else {
    lockOverlay.classList.remove("show");
    }

  dots.forEach((dot, index) => {
    dot.classList.toggle("active", index === currentRing);
  });
}

document.getElementById("nextBtn").addEventListener("click", () => {
  currentRing = (currentRing + 1) % rings.length;
  updateRing();
});

document.getElementById("prevBtn").addEventListener("click", () => {
  currentRing = (currentRing - 1 + rings.length) % rings.length;
  updateRing();
});

updateRing();
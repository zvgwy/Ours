const SUPABASE_URL = "https://enyeraxntpgcektunuwa.supabase.co";
const SUPABASE_KEY = "sb_publishable_qmf2WYLzaHF2qmhvX-TCNQ_aJC0m3nd";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const identityScreen = document.getElementById("identityScreen");
const siteContent = document.getElementById("siteContent");

const personSelect = document.getElementById("personSelect");
const enterBtn = document.getElementById("enterBtn");
const switchUserBtn = document.getElementById("switchUserBtn");

const welcomeTitle = document.getElementById("welcomeTitle");
const missTitle = document.getElementById("missTitle");
const senderNote = document.getElementById("senderNote");

const missBtn = document.getElementById("missBtn");
const missCount = document.getElementById("missCount");

const people = ["Gwyneth", "Mariah"];
let currentUser = localStorage.getItem("currentUser");

function getOtherPerson(name) {
  return people.find((person) => person !== name);
}

async function loadMissCount() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const { data, error } = await db
    .from("miss_taps")
    .select("*")
    .eq("receiver", currentUser)
    .gte("created_at", startOfToday.toISOString());

  if (error) {
    console.error(error);
    missCount.textContent = 0;
    return;
  }

  missCount.textContent = data.length;
}

function showSentPopup(otherPerson) {
  const popup = document.getElementById("sentPopup");

  popup.textContent = `Sent to ${otherPerson} 💌`;
  popup.classList.remove("show");
  void popup.offsetWidth;
  popup.classList.add("show");

  clearTimeout(window.sentPopupTimer);

  window.sentPopupTimer = setTimeout(() => {
    popup.classList.remove("show");
  }, 1500);
}

function showSite() {
  const otherPerson = getOtherPerson(currentUser);

  identityScreen.style.display = "none";
  siteContent.classList.remove("hidden");

  welcomeTitle.textContent = `Hi ${currentUser}, welcome home.`;
  missTitle.textContent = `${otherPerson} missed you`;
  senderNote.textContent = `Tap the button to tell ${otherPerson} you miss them today.`;

  loadMissCount();
}

enterBtn.addEventListener("click", () => {
  const selectedName = personSelect.value;

  if (!selectedName) {
    alert("Choose your name first 💗");
    return;
  }

  currentUser = selectedName;
  localStorage.setItem("currentUser", currentUser);

  showSite();
});

missBtn.addEventListener("click", async () => {
  const otherPerson = getOtherPerson(currentUser);

  const { error } = await db.from("miss_taps").insert([
    {
      sender: currentUser,
      receiver: otherPerson,
    },
  ]);

  if (error) {
    console.error(error);
    alert(error.message);
    return;
  }

  showSentPopup(otherPerson);
  loadMissCount();
});

switchUserBtn.addEventListener("click", () => {
  localStorage.removeItem("currentUser");
  currentUser = null;

  siteContent.classList.add("hidden");
  identityScreen.style.display = "flex";
});

if (currentUser) {
  showSite();

  document.querySelector(".home-page").classList.remove("fade-in");
  void document.querySelector(".home-page").offsetWidth;
  document.querySelector(".home-page").classList.add("fade-in");
} else {
  siteContent.classList.add("hidden");
  identityScreen.style.display = "flex";
}

const officialDate = new Date("2025-04-20T00:00:00+08:00");

function updateRelationshipCounter() {
  const now = new Date();

  let years = now.getFullYear() - officialDate.getFullYear();
  let months = now.getMonth() - officialDate.getMonth();
  let days = now.getDate() - officialDate.getDate();

  if (days < 0) {
    months--;
    const previousMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += previousMonth.getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  const diff = now.getTime() - officialDate.getTime();

  document.getElementById("years").textContent = years;
  document.getElementById("months").textContent = months;
  document.getElementById("days").textContent = days;
  document.getElementById("hours").textContent =
    Math.floor(diff / (1000 * 60 * 60)) % 24;
  document.getElementById("minutes").textContent =
    Math.floor(diff / (1000 * 60)) % 60;
  document.getElementById("seconds").textContent =
    Math.floor(diff / 1000) % 60;
}

updateRelationshipCounter();
setInterval(updateRelationshipCounter, 1000);
setInterval(() => {
  if (currentUser) loadMissCount();
}, 5000);
const SUPABASE_URL = "https://enyeraxntpgcektunuwa.supabase.co";
const SUPABASE_KEY = "sb_publishable_qmf2WYLzaHF2qmhvX-TCNQ_aJC0m3nd";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const officialDate = new Date("2025-04-20T00:00:00+08:00");

const bucketForm = document.getElementById("bucketForm");
const bucketInput = document.getElementById("bucketInput");
const bucketList = document.getElementById("bucketList");

let bucketItems = [];

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

async function loadBucketItems() {
  const { data, error } = await db
    .from("bucket_items")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  bucketItems = data || [];
  renderBucketList();
}

function renderBucketList() {
  bucketList.innerHTML = "";

  if (bucketItems.length === 0) {
    bucketList.innerHTML = `<li class="empty-state">No bucket list items yet.</li>`;
    return;
  }

  bucketItems.forEach((item) => {
    const li = document.createElement("li");
    li.className = item.done ? "done" : "";

    li.innerHTML = `
      <span>${item.text}</span>

      <div>
        <button class="small-btn" onclick="toggleBucketItem('${item.id}', ${item.done})">
          ${item.done ? "Undo" : "Done"}
        </button>

        <button class="small-btn delete-btn" onclick="deleteBucketItem('${item.id}')">
          Delete
        </button>
      </div>
    `;

    bucketList.appendChild(li);
  });
}

bucketForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const text = bucketInput.value.trim();
  if (!text) return;

  await db.from("bucket_items").insert([{ text, done: false }]);

  bucketInput.value = "";
  loadBucketItems();
});

async function toggleBucketItem(id, currentDoneStatus) {
  await db
    .from("bucket_items")
    .update({ done: !currentDoneStatus })
    .eq("id", id);

  loadBucketItems();
}

async function deleteBucketItem(id) {
  await db.from("bucket_items").delete().eq("id", id);
  loadBucketItems();
}

async function updateMissStats() {
  const now = new Date();

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const { data, error } = await db
    .from("miss_taps")
    .select("*")
    .gte("created_at", startOfYear.toISOString());

  if (error) {
    console.error(error);
    return;
  }

  const taps = data || [];

  const todayCount = taps.filter(
    (tap) => new Date(tap.created_at) >= startOfToday
  ).length;

  const monthCount = taps.filter(
    (tap) => new Date(tap.created_at) >= startOfMonth
  ).length;

  const yearCount = taps.length;

  const gwynethTotal = taps.filter((tap) => tap.sender === "Gwyneth").length;
  const mariahTotal = taps.filter((tap) => tap.sender === "Mariah").length;

  document.getElementById("missToday").textContent = todayCount;
  document.getElementById("missMonth").textContent = monthCount;
  document.getElementById("missYear").textContent = yearCount;

  document.getElementById("gTotal").textContent = gwynethTotal;
  document.getElementById("mTotal").textContent = mariahTotal;
}

window.toggleBucketItem = toggleBucketItem;
window.deleteBucketItem = deleteBucketItem;

updateRelationshipCounter();
setInterval(updateRelationshipCounter, 1000);

loadBucketItems();
updateMissStats();
setInterval(updateMissStats, 5000);
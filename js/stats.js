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

function getPHDateParts(dateValue) {
  const date = new Date(dateValue);

  const parts = new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  return {
    year: parts.find((p) => p.type === "year").value,
    month: parts.find((p) => p.type === "month").value,
    day: parts.find((p) => p.type === "day").value,
  };
}

async function fetchAllMissTaps() {
  let allData = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await db
      .from("miss_taps")
      .select("*")
      .range(from, from + pageSize - 1);

    if (error) {
      console.error(error);
      break;
    }

    if (!data || data.length === 0) break;

    allData = allData.concat(data);

    if (data.length < pageSize) break;

    from += pageSize;
  }

  return allData;
}

async function updateMissStats() {
  const taps = await fetchAllMissTaps();
  const todayPH = getPHDateParts(new Date());

  let todayCount = 0;
  let monthCount = 0;
  let yearCount = 0;
  let gwynethTotal = 0;
  let mariahTotal = 0;

  taps.forEach((tap) => {
    const tapDate = getPHDateParts(tap.created_at);
    const sender = tap.sender?.trim().toLowerCase();

    if (
      tapDate.year === todayPH.year &&
      tapDate.month === todayPH.month &&
      tapDate.day === todayPH.day
    ) {
      todayCount++;
    }

    if (
      tapDate.year === todayPH.year &&
      tapDate.month === todayPH.month
    ) {
      monthCount++;
    }

    if (tapDate.year === todayPH.year) {
      yearCount++;
    }

    if (sender === "gwyneth") gwynethTotal++;
    if (sender === "mariah") mariahTotal++;
  });

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
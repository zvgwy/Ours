const SUPABASE_URL = "https://enyeraxntpgcektunuwa.supabase.co";
const SUPABASE_KEY = "sb_publishable_qmf2WYLzaHF2qmhvX-TCNQ_aJC0m3nd";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const DEFAULT_GOAL = 80000;

const moneyForm = document.getElementById("moneyForm");
const moneyInput = document.getElementById("moneyInput");
const moneyNote = document.getElementById("moneyNote");
const savedAmount = document.getElementById("savedAmount");
const progressBar = document.getElementById("progressBar");
const progressPercent = document.getElementById("progressPercent");
const moneyList = document.getElementById("moneyList");

const wishlistForm = document.getElementById("wishlistForm");
const wishlistItem = document.getElementById("wishlistItem");
const wishlistPrice = document.getElementById("wishlistPrice");
const wishlist = document.getElementById("wishlist");

let goal = DEFAULT_GOAL;
let contributions = [];
let wishlistItems = [];

function formatPeso(amount) {
  return `₱${Number(amount).toLocaleString("en-PH")}`;
}

async function loadFundsData() {
  const { data: settingsData } = await db
    .from("fund_settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (settingsData) {
    goal = Number(settingsData.goal);
  }

  const { data: contributionsData } = await db
    .from("fund_contributions")
    .select("*")
    .order("created_at", { ascending: false });

  contributions = contributionsData || [];

  const { data: wishlistData } = await db
    .from("wishlist_items")
    .select("*")
    .order("created_at", { ascending: false });

  wishlistItems = wishlistData || [];

  renderWishlist();
  renderFunds();
}

async function saveGoal() {
  await db
    .from("fund_settings")
    .update({ goal })
    .eq("id", 1);
}

function getWishlistTotal() {
  return wishlistItems.reduce(
    (sum, item) => sum + Number(item.price || 0),
    0
  );
}

function getDynamicGoal() {
  return goal + getWishlistTotal();
}

function getTotalSaved() {
  const addedMoney = contributions.reduce(
    (sum, item) => sum + Number(item.amount),
    0
  );

  const boughtItems = wishlistItems
    .filter((item) => item.bought)
    .reduce((sum, item) => sum + Number(item.price || 0), 0);

  return addedMoney - boughtItems;
}

function renderFunds() {
  const total = getTotalSaved();
  const dynamicGoal = getDynamicGoal();
  const percent = Math.min((total / dynamicGoal) * 100, 100);

  document.getElementById("goalTitle").textContent = `${formatPeso(dynamicGoal)} Goal`;
  savedAmount.textContent = formatPeso(total);
  progressBar.style.width = `${Math.max(percent, 0)}%`;
  progressPercent.textContent = `${Math.max(percent, 0).toFixed(1)}% of goal`;

  moneyList.innerHTML = "";

  const additionTransactions = contributions.map((item) => ({
    type: "add",
    id: item.id,
    amount: Number(item.amount),
    note: item.note || "Added to our future fund",
    date: item.created_at,
  }));

  const purchaseTransactions = wishlistItems
    .filter((item) => item.bought)
    .map((item) => ({
      type: "subtract",
      amount: Number(item.price || 0),
      note: `Bought: ${item.name}`,
      date: item.bought_at || item.created_at,
    }));

  const transactions = [...additionTransactions, ...purchaseTransactions].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  if (transactions.length === 0) {
    moneyList.innerHTML = `<li class="empty-state">No transactions yet.</li>`;
    return;
  }

  transactions.forEach((item) => {
    const li = document.createElement("li");

    li.innerHTML = `
      <div>
        <strong class="${item.type === "subtract" ? "negative-money" : ""}">
          ${item.type === "subtract" ? "-" : "+"}${formatPeso(item.amount)}
        </strong>
        <p>${item.note}</p>
      </div>

      <div class="money-actions">
        <small>${new Date(item.date).toLocaleDateString()}</small>
        ${
          item.type === "add"
            ? `<button class="small-btn delete-btn" onclick="deleteContribution('${item.id}')">Delete</button>`
            : ""
        }
      </div>
    `;

    moneyList.appendChild(li);
  });
}

moneyForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const amount = Number(moneyInput.value);
  const note = moneyNote.value.trim();

  if (!amount || amount <= 0) return;

  await db.from("fund_contributions").insert([
    {
      amount,
      note,
    },
  ]);

  moneyInput.value = "";
  moneyNote.value = "";

  loadFundsData();
});

async function deleteContribution(id) {
  await db.from("fund_contributions").delete().eq("id", id);
  loadFundsData();
}

function renderWishlist() {
  wishlist.innerHTML = "";

  if (wishlistItems.length === 0) {
    wishlist.innerHTML = `<li class="empty-state">No wishlist items yet.</li>`;
    renderFunds();
    return;
  }

  wishlistItems.forEach((item) => {
    const li = document.createElement("li");
    li.className = "wishlist-item";

    li.innerHTML = `
      <div class="wishlist-info">
        <strong class="${item.bought ? "completed" : ""}">
          ${item.name}
        </strong>
        <span>${formatPeso(item.price)}</span>
      </div>

      <div class="wishlist-actions">
        <button class="primary-btn" onclick="toggleWishlist('${item.id}', ${item.bought})">
          ${item.bought ? "Undo" : "Bought"}
        </button>

        <button class="delete-btn" onclick="deleteWishlist('${item.id}')">
          Delete
        </button>
      </div>
    `;

    wishlist.appendChild(li);
  });

  renderFunds();
}

wishlistForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = wishlistItem.value.trim();
  const price = Number(wishlistPrice.value) || 0;

  if (!name) return;

  await db.from("wishlist_items").insert([
    {
      name,
      price,
      bought: false,
    },
  ]);

  wishlistItem.value = "";
  wishlistPrice.value = "";

  loadFundsData();
});

async function toggleWishlist(id, currentBoughtStatus) {
  const newBoughtStatus = !currentBoughtStatus;

  await db
    .from("wishlist_items")
    .update({
      bought: newBoughtStatus,
      bought_at: newBoughtStatus ? new Date().toISOString() : null,
    })
    .eq("id", id);

  loadFundsData();
}

async function deleteWishlist(id) {
  await db.from("wishlist_items").delete().eq("id", id);
  loadFundsData();
}

async function editGoal() {
  const newGoal = Number(prompt("Enter new base goal amount:", goal));

  if (!newGoal || newGoal <= 0) return;

  goal = newGoal;
  await saveGoal();
  loadFundsData();
}

async function resetFunds() {
  const confirmReset = confirm(
    "Are you sure you want to reset all funds data? This will delete savings additions, wishlist items, and reset the goal."
  );

  if (!confirmReset) return;

  goal = DEFAULT_GOAL;

  await db.from("fund_settings").update({ goal: DEFAULT_GOAL }).eq("id", 1);
  await db.from("fund_contributions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("wishlist_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  loadFundsData();
}

window.deleteContribution = deleteContribution;
window.toggleWishlist = toggleWishlist;
window.deleteWishlist = deleteWishlist;
window.editGoal = editGoal;
window.resetFunds = resetFunds;

loadFundsData();
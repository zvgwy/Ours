const SUPABASE_URL = "https://enyeraxntpgcektunuwa.supabase.co";
const SUPABASE_KEY = "sb_publishable_qmf2WYLzaHF2qmhvX-TCNQ_aJC0m3nd";
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const people = ["Mariah", "Gwyneth"];
let currentUser = localStorage.getItem("currentUser");
let selectedLetter = null;
const identityScreen = document.getElementById("identityScreen");
const siteContent = document.getElementById("siteContent");
const userOptions = document.querySelectorAll(".user-option");
const switchUserBtn = document.getElementById("switchUserBtn");
const currentUserNote = document.getElementById("currentUserNote");
const lettersBoard = document.getElementById("lettersBoard");
const letterModal = document.getElementById("letterModal");
const paperCloseBtn = document.getElementById("paperCloseBtn");
const bigEnvelope = document.getElementById("bigEnvelope");
const letterMeta = document.getElementById("letterMeta");
const letterTitle = document.getElementById("letterTitle");
const letterBody = document.getElementById("letterBody");
const writeModal = document.getElementById("writeModal");
const openWriteModalBtn = document.getElementById("openWriteModalBtn");
const closeWriteBtn = document.getElementById("closeWriteBtn");
const letterForm = document.getElementById("letterForm");
const titleInput = document.getElementById("titleInput");
const bodyInput = document.getElementById("bodyInput");
const writeTitle = document.getElementById("writeTitle");
userOptions.forEach((btn) => {
  btn.addEventListener("click", () => {
    currentUser = btn.dataset.user;
    localStorage.setItem("currentUser", currentUser);
    showSite();
  });
});
function getOtherPerson(name) {
  return people.find((person) => person !== name);
}
function showSite() {
  identityScreen.style.display = "none";
  siteContent.classList.remove("hidden");
  currentUserNote.textContent = `Currently using as ${currentUser}.`;
  loadLetters();
}
function requireIdentity() {
  if (currentUser) {
    showSite();
  } else {
    siteContent.classList.add("hidden");
    identityScreen.style.display = "flex";
  }
}
async function loadLetters() {
  const { data: letters, error: lettersError } = await db
    .from("letters")
    .select("*")
    .order("created_at", { ascending: false });
  if (lettersError) {
    console.error(lettersError);
    lettersBoard.innerHTML = `<p class="empty-state">Could not load letters.</p>`;
    return;
  }
  const { data: reads, error: readsError } = await db
    .from("letter_reads")
    .select("*");
  console.log("LETTERS FROM SUPABASE:", letters);
  console.log("READS FROM SUPABASE:", reads);
  if (readsError) {
    console.error(readsError);
    lettersBoard.innerHTML = `<p class="empty-state">Could not load read status.</p>`;
    return;
  }
  renderLetters(letters || [], reads || []);
}
function renderLetters(letters, reads) {
  lettersBoard.innerHTML = "";
  if (!letters.length) {
    lettersBoard.innerHTML = `<p class="empty-state">No letters yet. Write the first one?</p>`;
    return;
  }
  letters.forEach((letter, index) => {
    const isRead = reads.some(
      (read) => read.letter_id === letter.id && read.reader === letter.receiver
    );
    const envelope = document.createElement("button");
    envelope.className = `letter-envelope ${letter.receiver.toLowerCase()} ${isRead ? "read" : "unread"}`;
    envelope.style.setProperty("--float-delay", `${index * 0.25}s`);
    envelope.style.setProperty("--tilt", `${index % 2 === 0 ? -3 : 3}deg`);
    envelope.innerHTML = `
      <div class="mini-envelope">
        <div class="mini-envelope-flap"></div>
        <div class="mini-envelope-front"></div>
      </div>
      <div class="letter-envelope-info">
        <strong>${escapeHTML(letter.title)}</strong>
        <span>For ${escapeHTML(letter.receiver)}</span>
        <small>${formatDate(letter.created_at)}</small>
      </div>
    `;
    envelope.addEventListener("click", () => openLetter(letter, isRead));
    lettersBoard.appendChild(envelope);
  });
}
function resetPaperScroll() {
  const paper = document.querySelector(".envelope-paper");
  if (paper) {
    paper.scrollTop = 0;
  }
  if (letterModal) {
    letterModal.scrollTop = 0;
  }
}
async function openLetter(letter, isRead) {
  selectedLetter = letter;
  letterMeta.textContent = `From ${letter.sender} to ${letter.receiver} • ${formatDate(letter.created_at)}`;
  letterTitle.textContent = letter.title;
  letterBody.innerHTML = `
    ${formatLetterBody(letter.body)}
    <p class="letter-end-actions">
      <button type="button" id="inlineUnreadBtn" class="inline-unread-btn">
        Mark as unread
      </button>
    </p>
  `;
  resetPaperScroll();
  letterModal.classList.remove("hidden");
  letterModal.classList.remove("letter-only-mode");
  bigEnvelope.className = `big-envelope ${letter.receiver.toLowerCase()}`;
  requestAnimationFrame(() => {
    resetPaperScroll();
    bigEnvelope.classList.add("open");
  });
  if (currentUser === letter.receiver && !isRead) {
    await markAsRead(letter.id, currentUser);
    await loadLetters();
  }
}
async function markAsRead(letterId, reader) {
  const { error } = await db
    .from("letter_reads")
    .upsert(
      {
        letter_id: letterId,
        reader: reader,
      },
      {
        onConflict: "letter_id,reader",
      }
    );
  if (error) {
    console.error(error);
  }
}
async function markAsUnread() {
  if (!selectedLetter) return;
  const { error } = await db
    .from("letter_reads")
    .delete()
    .eq("letter_id", selectedLetter.id)
    .eq("reader", selectedLetter.receiver);
  if (error) {
    console.error(error);
    alert(error.message);
    return;
  }
  closeLetter();
  await loadLetters();
}
function closeLetter() {
  resetPaperScroll();
  letterModal.classList.add("hidden");
  bigEnvelope.classList.remove("open");
  bigEnvelope.classList.remove("letter-only");
  letterModal.classList.remove("letter-only-mode");
  selectedLetter = null;
}
const paper = document.querySelector(".envelope-paper");
if (paper) {
  paper.addEventListener("click", (e) => {
    e.stopPropagation();
    resetPaperScroll();
    bigEnvelope.classList.add("letter-only");
    letterModal.classList.add("letter-only-mode");
  });
}
letterBody.addEventListener("click", (e) => {
  const unreadBtn = e.target.closest("#inlineUnreadBtn");
  if (unreadBtn) {
    e.stopPropagation();
    markAsUnread();
  }
});
function openWriteModal() {
  const receiver = getOtherPerson(currentUser);
  writeTitle.innerHTML = `Hi, ${currentUser}!<br> This letter will be for ${receiver}.`;
  titleInput.value = "";
  bodyInput.value = "";
  writeModal.classList.remove("hidden");
}
function closeWriteModal() {
  writeModal.classList.add("hidden");
}
letterForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const sender = currentUser;
  const receiver = getOtherPerson(currentUser);
  const title = titleInput.value.trim();
  const body = bodyInput.value.trim();
  if (!sender || !receiver || !title || !body) return;
  const submitBtn = letterForm.querySelector("button[type='submit']");
  submitBtn.disabled = true;
  submitBtn.textContent = "Saving...";
  const { error } = await db.from("letters").insert([
    {
      sender,
      receiver,
      title,
      body,
    },
  ]);
  submitBtn.disabled = false;
  submitBtn.textContent = "Save letter 💌";
  if (error) {
    console.error(error);
    alert(error.message);
    return;
  }
  closeWriteModal();
  await loadLetters();
});
function formatDate(value) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
function formatLetterBody(text) {
  return escapeHTML(text)
    .split("\n")
    .map((line) => `<p>${line || "&nbsp;"}</p>`)
    .join("");
}
function escapeHTML(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
switchUserBtn.addEventListener("click", () => {
  localStorage.removeItem("currentUser");
  currentUser = null;
  siteContent.classList.add("hidden");
  identityScreen.style.display = "flex";
});
if (paperCloseBtn) {
  paperCloseBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    closeLetter();
  });
}
openWriteModalBtn.addEventListener("click", openWriteModal);
closeWriteBtn.addEventListener("click", closeWriteModal);
letterModal.addEventListener("click", (e) => {
  if (e.target.classList.contains("letter-modal-backdrop")) {
    closeLetter();
  }
});
writeModal.addEventListener("click", (e) => {
  if (e.target.classList.contains("letter-modal-backdrop")) {
    closeWriteModal();
  }
});
requireIdentity();
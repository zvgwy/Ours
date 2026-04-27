const pages = ["index.html", "stats.html", "funds.html", "planes.html", "levelup.html"];

let startX = 0;
let startY = 0;
let isSwiping = false;

function getCurrentIndex() {
  const file = window.location.pathname.split("/").pop() || "index.html";
  return pages.indexOf(file);
}

function goToPage(index, direction = "left") {
  const inPagesFolder = window.location.pathname.includes("/pages/");
  let target = pages[index];

  if (inPagesFolder && target === "index.html") {
    target = "../index.html";
  } else if (!inPagesFolder && target !== "index.html") {
    target = `pages/${target}`;
  }

  document.body.classList.add(
    direction === "left" ? "page-exit-left" : "page-exit-right"
  );

  setTimeout(() => {
    window.location.href = target;
  }, 220);
}

function shouldIgnoreSwipe(target) {
  return target.closest("button, input, textarea, select, a");
}

document.addEventListener("pointerdown", (e) => {
  if (shouldIgnoreSwipe(e.target)) return;

  startX = e.clientX;
  startY = e.clientY;
  isSwiping = true;
});

document.addEventListener("pointerup", (e) => {
  if (!isSwiping) return;

  const endX = e.clientX;
  const endY = e.clientY;

  const diffX = endX - startX;
  const diffY = endY - startY;

  isSwiping = false;

  const minSwipe = 100;

  // ignore mostly vertical movement
  if (Math.abs(diffY) > Math.abs(diffX)) return;
  if (Math.abs(diffX) < minSwipe) return;

  const currentIndex = getCurrentIndex();
  if (currentIndex === -1) return;

  // swipe left = next page
  if (diffX < 0 && currentIndex < pages.length - 1) {
    goToPage(currentIndex + 1, "left");
  }

  // swipe right = previous page
  if (diffX > 0 && currentIndex > 0) {
    goToPage(currentIndex - 1, "right");
  }
});

let wheelLock = false;

document.addEventListener(
  "wheel",
  (e) => {
    if (wheelLock) return;

    const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
    if (!horizontal) return;

    const minSwipe = 60;
    if (Math.abs(e.deltaX) < minSwipe) return;

    const currentIndex = getCurrentIndex();
    if (currentIndex === -1) return;

    wheelLock = true;

    // touchpad swipe left = next page
    if (e.deltaX > 0 && currentIndex < pages.length - 1) {
      goToPage(currentIndex + 1);
    }

    // touchpad swipe right = previous page
    if (e.deltaX < 0 && currentIndex > 0) {
      goToPage(currentIndex - 1);
    }

    setTimeout(() => {
      wheelLock = false;
    }, 700);
  },
  { passive: true }
);
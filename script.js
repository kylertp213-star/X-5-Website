// Rendering only — edit names and details in data.js, not here.

const socialIcons = {
  instagram: `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>`,
  tiktok: `<svg viewBox="0 0 24 24"><path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 3c.4 2.6 2 4.2 5 4.4"/></svg>`,
  github: `<svg viewBox="0 0 24 24"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>`,
};

const avatarSVG = `
<svg viewBox="0 0 100 100" aria-hidden="true">
  <defs>
    <linearGradient id="g{ID}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#c9a08f"/><stop offset="1" stop-color="#8a5c54"/>
    </linearGradient>
  </defs>
  <circle cx="50" cy="38" r="17" fill="url(#g{ID})"/>
  <path d="M16 92c0-20 15-33 34-33s34 13 34 33z" fill="url(#g{ID})"/>
</svg>`;

let uid = 0;
const people = []; // every profile, in order, so the pop-up can look them up

// Puts a photo into a box.
//   kind "card"  -> uses  photo       (the small profile on the tree)
//   kind "popup" -> uses  popupPhoto  (the big one in the pop-up),
//                   or falls back to  photo  if popupPhoto is empty.
// If a file is missing, the default icon is shown instead.
function fillPhoto(box, p, kind = "card") {
  const icon = avatarSVG.replaceAll("{ID}", ++uid);
  const sources = (kind === "popup" ? [p.popupPhoto, p.photo] : [p.photo])
    .filter((s, i, arr) => s && arr.indexOf(s) === i);

  if (!sources.length) { box.innerHTML = icon; return; }

  let n = 0;
  const img = new Image();
  img.alt = p.name;
  img.onerror = () => {
    n += 1;
    if (n < sources.length) img.src = sources[n];
    else box.innerHTML = icon;
  };
  img.src = sources[0];
  box.innerHTML = "";
  box.appendChild(img);
}

function createCard(p, roleLabel, isTop = false) {
  const role = roleLabel || "Member";
  const idx = people.push({ ...p, role }) - 1;
  const song = p.song || {};

  const card = document.createElement("article");
  card.className = "card";
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `Open profile of ${p.name}`);
  card.dataset.search =
    `${p.name} ${role} ${p.hobby || ""} ${p.dream || ""} ${p.quote || ""} ${song.title || ""} ${song.artist || ""}`.toLowerCase();
  card.innerHTML = `
    <div class="avatar"></div>
    <span class="role ${isTop ? "top" : roleLabel ? "" : "member"}">${role}</span>
    <h3 class="name">${p.name}</h3>
    <span class="view">View profile</span>`;
  fillPhoto(card.querySelector(".avatar"), p, "card");

  card.addEventListener("click", () => openModal(idx));
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openModal(idx); }
  });
  return card;
}

function render() {
  const tree = document.getElementById("tree");

  leaders.forEach((tierData) => {
    const tier = document.createElement("section");
    tier.className = "tier" + (tierData.length === 2 ? " pair" : "");
    tierData.forEach((p) => tier.appendChild(createCard(p, p.role, p.top)));
    tree.appendChild(tier);
  });

  const label = document.createElement("div");
  label.className = "members-label";
  label.innerHTML = `<span>Members &middot; ${members.length}</span>`;
  tree.appendChild(label);

  const grid = document.createElement("section");
  grid.className = "grid";
  members.forEach((m) => grid.appendChild(createCard(m, "")));
  tree.appendChild(grid);
}

// ---------------- Pop-up ----------------
const modal = document.getElementById("modal");
let lastFocus = null;
const $ = (id) => document.getElementById(id);

function setSection(id, value) {
  const el = $(id);
  el.textContent = value || "";
  el.parentElement.hidden = !value;
}

function openModal(i) {
  const p = people[i];
  lastFocus = document.activeElement;

  fillPhoto($("mPhoto"), p, "popup");
  $("mRole").textContent = p.role;
  $("mName").textContent = p.name;
  setSection("mDob", p.dob);
  setSection("mHobby", p.hobby);
  setSection("mDream", p.dream);
  setSection("mQuote", p.quote ? `“${p.quote}”` : "");

  // Favourite song: title + artist name (text only)
  const s = p.song || {};
  $("songTitle").textContent = s.title || "";
  $("songArtist").textContent = s.artist || "";
  $("mSongBox").hidden = !(s.title || s.artist);

  const socials = { ...defaultSocials, ...(p.socials || {}) };
  $("mSocials").innerHTML = Object.entries(socials)
    .filter(([, url]) => url)
    .map(([k, url]) =>
      `<a href="${url}" target="_blank" rel="noopener noreferrer" title="${k}" aria-label="${k}">${socialIcons[k] || k.slice(0, 2).toUpperCase()}</a>`
    ).join("");

  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("no-scroll");
  $("modalClose").focus();
}

function closeModal() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("no-scroll");
  if (lastFocus) lastFocus.focus();
}

function setupModal() {
  $("modalClose").addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("open")) closeModal();
  });
}

// ---------------- Search ----------------
function setupSearch() {
  const input = $("search");
  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    document.querySelectorAll(".card").forEach((c) => {
      c.classList.toggle("hidden", q && !c.dataset.search.includes(q));
    });
  });
}

// Want a real cat photo? Put a transparent PNG named "cat.png" next to
// index.html and it replaces the drawn cat automatically.
function setupCat() {
  const box = $("bgCat");
  const photo = new Image();
  photo.alt = "";
  photo.onload = () => {
    box.innerHTML = "";
    box.appendChild(photo);
  };
  photo.src = "cat.png";
}

// BANNER PHOTO: edit this path in the code to change the image.
// Put your image inside a folder named "photos" next to index.html,
// then update the filename below (for example: "photos/class-trip.jpg").
const BANNER_PHOTO = "photos/rs.jpg";

function setupBanner() {
  const image = $("bannerPhoto");
  const placeholder = $("bannerPlaceholder");

  image.onload = () => {
    image.hidden = false;
    placeholder.hidden = true;
  };
  image.onerror = () => {
    image.removeAttribute("src");
    image.hidden = true;
    placeholder.hidden = false;
  };
  image.src = BANNER_PHOTO;
}

render();
setupModal();
setupSearch();
setupCat();
setupBanner();
$("year").textContent = new Date().getFullYear();

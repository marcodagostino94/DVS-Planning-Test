// DVS Planning v26

const ROOMS = [
  ...Array.from({ length: 15 }, (_, index) => ({
    id: `sala-${index + 1}`,
    label: index < 10 ? `Sala ${index + 1}` : `Sala ${index - 9}A`,
    sortOrder: index + 1
  })),
  { id: "remoto-1", label: "Remote 1", sortOrder: 16 },
  { id: "remoto-2", label: "Remote 2", sortOrder: 17 },
  { id: "remoto-3", label: "Remote 3", sortOrder: 18 }
];

const GROUPS = {
  0: "CHINOTTO 1 · Sale 1–5",
  5: "CHINOTTO 2 · Sale 6–10",
  10: "CARSO 3 · Sale 1A–5A",
  15: "LAVORAZIONI DA REMOTO"
};

const FILM_COLORS = {
  amber:  { label: "Ambra", rgb: "225, 166, 34" },
  blue:   { label: "Blu", rgb: "61, 125, 235" },
  green:  { label: "Verde", rgb: "54, 165, 91" },
  violet: { label: "Viola", rgb: "135, 79, 225" },
  cyan:   { label: "Azzurro", rgb: "35, 167, 192" },
  orange: { label: "Arancione", rgb: "235, 126, 39" },
  pink:   { label: "Rosa", rgb: "226, 74, 151" },
  red:    { label: "Rosso", rgb: "218, 56, 70" },
  lime:   { label: "Lime", rgb: "111, 174, 57" },
  indigo: { label: "Indaco", rgb: "78, 84, 203" },
  teal:   { label: "Petrolio", rgb: "28, 145, 134" },
  coral:  { label: "Corallo", rgb: "224, 102, 84" }
};

const ITALIAN_FIXED_HOLIDAYS = new Set([
  "01-01", "01-06", "04-25", "05-01", "06-02",
  "08-15", "11-01", "12-08", "12-25", "12-26"
]);

const SHIFT_STORAGE = "dvs-planning-build-10-shifts";
const EDITOR_STORAGE = "dvs-planning-build-9-staff";
const ZOOM_STORAGE = "dvs-planning-build-11-zoom";
const PROFILE_STORAGE = "dvs-planning-build-11-profile";
const REMEMBER_PROFILE_STORAGE = "dvs-planning-build-11-remember";
const REMINDER_STORAGE = "dvs-planning-build-12-reminders";
const DEFAULT_PROFILES = [
  { id: "alessio-iuso", name: "Alessio Iuso", initials: "AI", tone: "red" },
  { id: "nicola-iuso", name: "Nicola Iuso", initials: "NI", tone: "blue" },
  { id: "sara-dal-pont", name: "Sara Dal Pont", initials: "SD", tone: "purple" },
  { id: "marco-dagostino", name: "Marco D'Agostino", initials: "MD", tone: "orange" }
];

const hasSupabaseConfig = Boolean(
  window.DVS_SUPABASE?.url &&
  window.DVS_SUPABASE?.publishableKey &&
  window.supabase?.createClient
);

const db = hasSupabaseConfig
  ? window.supabase.createClient(
      window.DVS_SUPABASE.url,
      window.DVS_SUPABASE.publishableKey
    )
  : null;

let currentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let summaryMonth = new Date(2026, 6, 1);
let selectedSummaryEditorId = null;
let editingShiftId = null;
let editingEditorId = null;
let selectedShiftIds = new Set();
let selectionAnchorId = null;
let selectedCell = null;
let draggedShiftId = null;
let copiedShifts = [];
let clipboardMode = "copy";
let cutShiftIds = new Set();
let marqueeState = null;
let marqueeElement = null;
let contextTargetCell = null;
let dragSourceShiftId = null;
let dragGhost = null;
let activeDragGroup = [];
let activeDragSource = null;
let suppressNextClick = false;
let emptyCellClickTimer = null;
let highlightedDropCells = new Set();
let planningZoom = Number(localStorage.getItem(ZOOM_STORAGE)) || 1;
let activeProfile = null;
let profiles = structuredClone(DEFAULT_PROFILES);
let onlineProfiles = [];
let presenceHeartbeatTimer = null;
let lastUserActivityAt = Date.now();
let editingProfileId = null;
let reminders = loadLocal(REMINDER_STORAGE, []);

const seedEditors = [
  { id:"ed-1", firstName:"Marco", lastName:"D'Agostino", active:true },
  { id:"ed-2", firstName:"Valentina", lastName:"Rossi", active:true },
  { id:"ed-3", firstName:"Alessandra", lastName:"Marimpietri", active:true },
  { id:"ed-4", firstName:"Barbara", lastName:"Cupertino", active:true },
  { id:"ed-5", firstName:"Luca", lastName:"Mancini", active:true },
  { id:"ed-6", firstName:"Davide", lastName:"Gentili", active:true },
  { id:"ed-7", firstName:"Giulia", lastName:"Corsi", active:true },
  { id:"ed-8", firstName:"Lorenzo", lastName:"Conti", active:true }
];

const seedShifts = [
  { id:"1", room:"sala-1", date:"2026-07-01", production:"RAI", film:"VITA IN DIRETTA", start:"08:00", end:"16:00", workType:"EDIT", editorId:"ed-1", status:"definitivo", color:"amber" },
  { id:"2", room:"sala-1", date:"2026-07-02", production:"RAI", film:"VITA IN DIRETTA", start:"08:00", end:"16:00", workType:"EDIT", editorId:"ed-2", status:"definitivo", color:"amber" },
  { id:"3", room:"sala-2", date:"2026-07-01", production:"CATTLEYA", film:"DOC - NELLE TUE MANI 4", start:"10:00", end:"18:00", workType:"EDIT", editorId:null, status:"provvisorio", color:"violet" },
  { id:"4", room:"sala-3", date:"2026-07-01", production:"NETFLIX", film:"LUPIN - STAGIONE 4", start:"09:00", end:"17:00", workType:"EDIT", editorId:"ed-5", status:"definitivo", color:"green" },
  { id:"5", room:"sala-3", date:"2026-07-01", production:"NETFLIX", film:"LUPIN - STAGIONE 4", start:"17:00", end:"24:00", workType:"ASSISTENTE", editorId:"ed-4", status:"definitivo", color:"green" },
  { id:"6", room:"sala-4", date:"2026-07-03", production:"FREMANTLE", film:"ITALIA'S GOT TALENT", start:"08:30", end:"16:30", workType:"EDIT", editorId:"ed-6", status:"definitivo", color:"red" },
  { id:"7", room:"sala-5", date:"2026-07-04", production:"BANIJAY", film:"PECHINO EXPRESS", start:"09:30", end:"17:30", workType:"EDIT", editorId:"ed-7", status:"definitivo", color:"cyan" },
  { id:"8", room:"sala-6", date:"2026-07-06", production:"DISCOVERY", film:"SURVIVOR ITALIA", start:"10:00", end:"18:00", workType:"EDIT", editorId:"ed-1", status:"definitivo", color:"orange" },
  { id:"9", room:"sala-7", date:"2026-07-07", production:"RAI", film:"UNOMATTINA", start:"08:00", end:"16:00", workType:"EDIT", editorId:"ed-4", status:"definitivo", color:"pink" },
  { id:"10", room:"sala-8", date:"2026-07-08", production:"CATTLEYA", film:"GOMORRA - STAGIONE 6", start:"09:00", end:"17:00", workType:"COLOR", editorId:"ed-3", status:"definitivo", color:"violet" },
  { id:"11", room:"sala-9", date:"2026-07-09", production:"AMAZON PRIME", film:"CELEBRITY HUNTED", start:"10:00", end:"18:00", workType:"COLOR", editorId:"ed-2", status:"definitivo", color:"lime" },
  { id:"12", room:"sala-10", date:"2026-07-10", production:"DVS", film:"SPOT ISTITUZIONALE", start:"08:00", end:"17:00", workType:"SOUND", editorId:"ed-8", status:"definitivo", color:"blue" },
  { id:"13", room:"remoto-1", date:"2026-07-02", production:"RAI", film:"VITA IN DIRETTA", start:"09:00", end:"17:00", workType:"GRAFICA", editorId:"ed-7", status:"definitivo", color:"coral" }
];

let editors = loadLocal(EDITOR_STORAGE, []);
// Build 8.0.1: elimina automaticamente i soli nominativi dimostrativi della vecchia interfaccia.
const prototypeStaffIds = new Set(seedEditors.map(item => item.id));
editors = editors.filter(item => !prototypeStaffIds.has(item.id));
let shifts = loadLocal(SHIFT_STORAGE, seedShifts).map(shift => ({
  ...shift,
  isClient: Boolean(shift.isClient),
  isDoubleStation: Boolean(shift.isDoubleStation),
  isVariable: Boolean(shift.isVariable),
  notes: String(shift.notes || "").slice(0, 100),
  confirmed: Boolean(shift.confirmed)
}));

const planningGrid = document.getElementById("planningGrid");
const planningCanvas = document.getElementById("planningCanvas");
const planningScroller = document.getElementById("planningScroller");

// Modalità iPad separata: il comportamento Mac resta invariato.
const IS_SMALL_APPLE_TOUCH = navigator.maxTouchPoints > 1
  && /Macintosh|MacIntel|iPhone|iPod/.test(`${navigator.userAgent} ${navigator.platform}`)
  && Math.min(screen.width, screen.height) <= 500;
const IS_IPHONE = /iPhone|iPod/.test(navigator.userAgent) || IS_SMALL_APPLE_TOUCH;
const IS_IPAD = !IS_IPHONE && (/iPad/.test(navigator.userAgent)
  || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
const IS_TOUCH_APPLE = IS_IPAD || IS_IPHONE;
const IS_MAC_APP = !IS_TOUCH_APPLE;
function updateAppleDeviceLayout() {
  const iphoneLandscape = IS_IPHONE && window.matchMedia("(orientation: landscape)").matches;
  document.documentElement.classList.toggle("is-iphone-device", IS_IPHONE);
  document.documentElement.classList.toggle("is-iphone-landscape", iphoneLandscape);
  document.documentElement.classList.toggle("is-iphone", IS_IPHONE && !iphoneLandscape);
  document.documentElement.classList.toggle("is-ipad", IS_IPAD || iphoneLandscape);
}
updateAppleDeviceLayout();
window.addEventListener("orientationchange", () => requestAnimationFrame(updateAppleDeviceLayout));
window.matchMedia("(orientation: landscape)").addEventListener?.("change", updateAppleDeviceLayout);
let planningRenderSignature = "";
const monthLabel = document.getElementById("monthLabel");
const zoomSelect = document.getElementById("zoomSelect");
const profileGate = document.getElementById("profileGate");
const profileGrid = document.getElementById("profileGrid");
const rememberProfile = document.getElementById("rememberProfile");
const activeProfileLabel = document.getElementById("activeProfileLabel");
const shiftDialog = document.getElementById("shiftDialog");
const editorDialog = document.getElementById("editorDialog");
const shiftForm = document.getElementById("shiftForm");
const editorForm = document.getElementById("editorForm");
const toast = document.getElementById("toast");
const contextMenu = document.getElementById("contextMenu");
const selectionBadge = document.getElementById("selectionBadge");
const assignEditorDialog = document.getElementById("assignEditorDialog");
const assignEditorForm = document.getElementById("assignEditorForm");
const assignEditorSearch = document.getElementById("assignEditorSearch");

function renderProfiles() {
  profileGrid.innerHTML = profiles.filter(profile => profile.active !== false).map(profile => `
    <button class="profile-card profile-${profile.tone || "red"}" type="button" data-profile-id="${profile.id}">
      <span class="profile-avatar"><span class="profile-head"></span><span class="profile-body"></span></span>
      <strong>${escapeHtml(profile.name)}</strong>
    </button>
  `).join("");
  profileGrid.querySelectorAll(".profile-card").forEach(card => {
    card.addEventListener("click", () => selectProfile(card.dataset.profileId));
  });
}

function updateActiveProfileUI() {
  activeProfileLabel.textContent = activeProfile ? `Profilo: ${activeProfile.name}` : "";
}

async function selectProfile(profileId) {
  activeProfile = profiles.find(profile => profile.id === profileId) || null;
  if (!activeProfile) return;
  if (rememberProfile.checked) {
    localStorage.setItem(PROFILE_STORAGE, activeProfile.id);
    localStorage.setItem(REMEMBER_PROFILE_STORAGE, "true");
  } else {
    localStorage.removeItem(PROFILE_STORAGE);
    localStorage.removeItem(REMEMBER_PROFILE_STORAGE);
  }
  updateActiveProfileUI();
  profileGate.classList.add("hidden");
  await setCurrentProfileOnline();
  startPresenceTracking();
  renderDashboard();
}

function initializeProfileGate() {
  renderProfiles();
  const remembered = localStorage.getItem(REMEMBER_PROFILE_STORAGE) === "true";
  const rememberedId = localStorage.getItem(PROFILE_STORAGE);
  rememberProfile.checked = remembered;
  if (remembered && rememberedId) {
    activeProfile = profiles.find(profile => profile.id === rememberedId) || null;
    if (activeProfile) profileGate.classList.add("hidden");
  }
  updateActiveProfileUI();
}

async function logoutProfile() {
  await setCurrentProfileOffline();
  stopPresenceTracking();
  activeProfile = null;
  localStorage.removeItem(PROFILE_STORAGE);
  localStorage.removeItem(REMEMBER_PROFILE_STORAGE);
  rememberProfile.checked = false;
  updateActiveProfileUI();
  profileGate.classList.remove("hidden");
}

function loadLocal(key, fallback) {
  const saved = localStorage.getItem(key);
  if (!saved) return structuredClone(fallback);
  try { return JSON.parse(saved); }
  catch { return structuredClone(fallback); }
}

function saveLocal() {
  localStorage.setItem(SHIFT_STORAGE, JSON.stringify(shifts));
  localStorage.setItem(EDITOR_STORAGE, JSON.stringify(editors));
}

const SHIFT_HISTORY_LIMIT = 20;
let shiftUndoStack = [];
let shiftRedoStack = [];
let shiftHistoryBusy = false;

function cloneShiftState() {
  return structuredClone(shifts);
}

function recordShiftUndo(label) {
  if (shiftHistoryBusy) return;
  shiftUndoStack.push({ label, state: cloneShiftState() });
  if (shiftUndoStack.length > SHIFT_HISTORY_LIMIT) shiftUndoStack.shift();
  shiftRedoStack = [];
}

async function syncRestoredShiftState(previousState, restoredState) {
  if (!db) return;
  const previousById = new Map(previousState.map(shift => [shift.id, shift]));
  const restoredById = new Map(restoredState.map(shift => [shift.id, shift]));
  const deletedIds = [...previousById.keys()].filter(id => !restoredById.has(id));
  const changed = [...restoredById.values()].filter(shift => {
    const previous = previousById.get(shift.id);
    return !previous || JSON.stringify(previous) !== JSON.stringify(shift);
  });
  await Promise.all([
    ...deletedIds.map(id => deleteShiftFromSupabase(id)),
    ...changed.map(shift => syncShiftToSupabase(shift))
  ]);
}

async function restoreShiftHistory(sourceStack, destinationStack, actionName) {
  if (shiftHistoryBusy || !sourceStack.length) {
    if (!sourceStack.length) showToast(actionName === "Annullata" ? "Nessuna operazione da annullare" : "Nessuna operazione da ripristinare");
    return;
  }
  shiftHistoryBusy = true;
  try {
    const entry = sourceStack.pop();
    const previousState = cloneShiftState();
    destinationStack.push({ label: entry.label, state: previousState });
    if (destinationStack.length > SHIFT_HISTORY_LIMIT) destinationStack.shift();
    shifts = structuredClone(entry.state);
    clearSelection();
    clearCutState();
    copiedShifts = [];
    clipboardMode = "copy";
    saveLocal();
    renderPlanning();
    renderDashboard();
    renderSummaries();
    await syncRestoredShiftState(previousState, shifts);
    showToast(`${actionName}: ${entry.label}`);
  } catch (error) {
    console.error("Errore ripristino cronologia turni:", error);
    showToast("Impossibile completare l’operazione");
  } finally {
    shiftHistoryBusy = false;
  }
}

function undoShiftOperation() {
  return restoreShiftHistory(shiftUndoStack, shiftRedoStack, "Annullata");
}

function redoShiftOperation() {
  return restoreShiftHistory(shiftRedoStack, shiftUndoStack, "Ripristinata");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 1800);
}

function isoDate(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function daysInMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function monthName(date) {
  return new Intl.DateTimeFormat("it-IT", {
    month: "long",
    year: "numeric"
  }).format(date);
}

function addDays(date, amount) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

function startOfPlanningMonth(monthDate) {
  const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  return addDays(first, -mondayOffset);
}

function endOfPlanningMonth(monthDate) {
  const last = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  const sundayOffset = (7 - last.getDay()) % 7;
  return addDays(last, sundayOffset);
}

function planningDates(monthDate) {
  const dates = [];
  const start = startOfPlanningMonth(monthDate);
  const end = endOfPlanningMonth(monthDate);
  for (let date = new Date(start); date <= end; date = addDays(date, 1)) dates.push(new Date(date));
  return dates;
}

function isoFromDate(date) {
  return isoDate(date.getFullYear(), date.getMonth(), date.getDate());
}

function normalizeTime(value) {
  const trimmed = value.trim();
  if (trimmed === "24" || trimmed === "24:0" || trimmed === "24:00") return "24:00";
  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function timeToMinutes(value) {
  if (value === "24:00") return 1440;
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function overlaps(a, b) {
  return timeToMinutes(a.start) < timeToMinutes(b.end)
    && timeToMinutes(b.start) < timeToMinutes(a.end);
}

function roomConflict(candidate, excludeId = null) {
  return shifts.some(shift =>
    shift.id !== excludeId
    && shift.room === candidate.room
    && shift.date === candidate.date
    && overlaps(shift, candidate)
  );
}

function getEditor(id) {
  return editors.find(editor => editor.id === id) || null;
}

function editorDisplay(editor) {
  if (!editor) return "";
  const initial = editor.firstName.trim().charAt(0).toUpperCase();
  return `${initial}. ${editor.lastName.trim().toUpperCase()}`;
}

function fullEmployeeName(editor) {
  return `${editor.firstName || ""} ${editor.lastName || ""}`.trim();
}

function editorConflict(shift) {
  if (!shift.editorId) return false;
  return shifts.some(other =>
    other.id !== shift.id
    && other.date === shift.date
    && other.editorId === shift.editorId
    && overlaps(other, shift)
  );
}

function selectedShiftList() {
  return shifts.filter(shift => selectedShiftIds.has(shift.id));
}

function selectOnlyShift(id) {
  selectedShiftIds = new Set([id]);
  selectionAnchorId = id;
  selectedCell = null;
}

function selectShiftRange(anchorId, targetId) {
  if (!IS_MAC_APP) {
    selectOnlyShift(targetId);
    return;
  }
  const anchorShift = shifts.find(shift => shift.id === anchorId);
  const targetShift = shifts.find(shift => shift.id === targetId);

  if (!anchorShift || !targetShift) {
    selectOnlyShift(targetId);
    return;
  }

  const anchorRoomIndex = ROOMS.findIndex(room => room.id === anchorShift.room);
  const targetRoomIndex = ROOMS.findIndex(room => room.id === targetShift.room);
  if (anchorRoomIndex < 0 || targetRoomIndex < 0) {
    selectOnlyShift(targetId);
    return;
  }

  const firstRoom = Math.min(anchorRoomIndex, targetRoomIndex);
  const lastRoom = Math.max(anchorRoomIndex, targetRoomIndex);
  const firstDate = anchorShift.date < targetShift.date ? anchorShift.date : targetShift.date;
  const lastDate = anchorShift.date > targetShift.date ? anchorShift.date : targetShift.date;
  const visibleIds = new Set(
    [...planningGrid.querySelectorAll(".shift-card")]
      .map(card => card.dataset.shiftId)
      .filter(Boolean)
  );

  selectedShiftIds = new Set(shifts
    .filter(shift => {
      const roomIndex = ROOMS.findIndex(room => room.id === shift.room);
      return visibleIds.has(shift.id)
        && roomIndex >= firstRoom
        && roomIndex <= lastRoom
        && shift.date >= firstDate
        && shift.date <= lastDate;
    })
    .map(shift => shift.id));
  selectedCell = null;
}

function clearSelection() {
  selectedShiftIds.clear();
  selectionAnchorId = null;
  selectedCell = null;
}

function clearCutState() {
  cutShiftIds.clear();
  document.querySelectorAll('.shift-card.cut-pending').forEach(card => card.classList.remove('cut-pending'));
}

function copySelectedShifts() {
  const selected = selectedShiftList()
    .sort((a, b) =>
      a.date.localeCompare(b.date)
      || (ROOMS.findIndex(room => room.id === a.room) - ROOMS.findIndex(room => room.id === b.room))
      || a.start.localeCompare(b.start)
    );

  if (!selected.length) return false;

  clipboardMode = "copy";
  clearCutState();
  copiedShifts = selected.map(shift => ({ ...shift }));
  renderPlanning();
  showToast(selected.length === 1 ? "Turno copiato" : `${selected.length} turni copiati`);
  return true;
}

function cutSelectedShifts() {
  const selected = selectedShiftList()
    .sort((a, b) =>
      a.date.localeCompare(b.date)
      || (ROOMS.findIndex(room => room.id === a.room) - ROOMS.findIndex(room => room.id === b.room))
      || a.start.localeCompare(b.start)
    );
  if (!selected.length) return false;
  if (selected.some(shift => shift.confirmed)) { showToast("Il turno confermato è bloccato"); return false; }

  clipboardMode = "cut";
  copiedShifts = selected.map(shift => ({ ...shift }));
  cutShiftIds = new Set(selected.map(shift => shift.id));
  renderPlanning();
  showToast(selected.length === 1 ? "Turno tagliato" : `${selected.length} turni tagliati`);
  return true;
}

function pasteCopiedShifts() {
  if (!copiedShifts.length || !selectedCell) return false;

  const sourceBase = new Date(`${copiedShifts[0].date}T12:00:00`);
  const targetBase = new Date(`${selectedCell.date}T12:00:00`);
  const offsetDays = Math.round((targetBase - sourceBase) / 86400000);
  const isCut = clipboardMode === "cut";
  const movingIds = isCut ? new Set(copiedShifts.map(shift => shift.id)) : new Set();
  const sourceRoomIndexes = copiedShifts.map(shift => ROOMS.findIndex(room => room.id === shift.room));
  const sourceBaseRoomIndex = Math.min(...sourceRoomIndexes);
  const targetBaseRoomIndex = ROOMS.findIndex(room => room.id === selectedCell.room);

  if (sourceBaseRoomIndex < 0 || targetBaseRoomIndex < 0) {
    showToast("Sala di destinazione non valida");
    return true;
  }

  const candidates = copiedShifts.map(source => {
    const sourceDate = new Date(`${source.date}T12:00:00`);
    sourceDate.setDate(sourceDate.getDate() + offsetDays);
    const sourceRoomIndex = ROOMS.findIndex(room => room.id === source.room);
    const targetRoom = ROOMS[targetBaseRoomIndex + (sourceRoomIndex - sourceBaseRoomIndex)];
    if (!targetRoom) return null;
    return {
      ...source,
      id: isCut ? source.id : crypto.randomUUID(),
      confirmed: isCut ? Boolean(source.confirmed) : false,
      confirmedAt: null,
      room: targetRoom.id,
      date: isoDate(sourceDate.getFullYear(), sourceDate.getMonth(), sourceDate.getDate())
    };
  });

  if (candidates.includes(null)) {
    showToast("Non ci sono abbastanza sale disponibili nella direzione scelta");
    return true;
  }

  const hasInternalConflict = candidates.some((candidate, index) =>
    candidates.some((other, otherIndex) => index !== otherIndex
      && candidate.room === other.room && candidate.date === other.date && overlaps(candidate, other))
  );
  const hasExistingConflict = candidates.some(candidate =>
    shifts.some(existing => !movingIds.has(existing.id)
      && existing.room === candidate.room && existing.date === candidate.date && overlaps(existing, candidate))
  );

  if (hasInternalConflict || hasExistingConflict) {
    showToast("Orari non compatibili: operazione annullata");
    return true;
  }

  recordShiftUndo(isCut
    ? (candidates.length === 1 ? "spostamento turno" : `spostamento di ${candidates.length} turni`)
    : (candidates.length === 1 ? "incolla turno" : `incolla di ${candidates.length} turni`));
  if (isCut) {
    const movedById = new Map(candidates.map(candidate => [candidate.id, candidate]));
    shifts = shifts.map(shift => movedById.get(shift.id) || shift);
    candidates.forEach(syncShiftToSupabase);
    copiedShifts = [];
    clipboardMode = "copy";
    clearCutState();
  } else {
    shifts.push(...candidates);
    candidates.forEach(syncShiftToSupabase);
  }

  saveLocal();
  selectedShiftIds = new Set(candidates.map(candidate => candidate.id));
  selectionAnchorId = candidates[0]?.id || null;
  selectedCell = null;
  renderPlanning();
  showToast(candidates.length === 1 ? (isCut ? "Turno spostato" : "Turno incollato") : `${candidates.length} turni ${isCut ? "spostati" : "incollati"}`);
  return true;
}


function selectionRoom() {
  const selected = selectedShiftList();
  return selected.length ? selected[0].room : null;
}

function updateSelectionBadge() {
  const count = selectedShiftIds.size;
  selectionBadge.textContent = count > 1 ? `${count} turni selezionati` : "";
  selectionBadge.classList.toggle("hidden", count <= 1);
}

function toggleCommandSelection(id) {
  if (!IS_MAC_APP) {
    selectOnlyShift(id);
    return;
  }
  const target = shifts.find(shift => shift.id === id);
  if (!target) return;
  if (selectedShiftIds.has(id)) {
    selectedShiftIds.delete(id);
    if (selectionAnchorId === id) selectionAnchorId = [...selectedShiftIds][0] || null;
  } else {
    selectedShiftIds.add(id);
    if (!selectionAnchorId) selectionAnchorId = id;
  }
  selectedCell = null;
}

function hideContextMenu() {
  contextMenu.classList.add("hidden");
  contextTargetCell = null;
}

function showContextMenu(event, targetCell) {
  event.preventDefault();
  event.stopPropagation?.();
  contextTargetCell = targetCell || null;
  const selected = selectedShiftList();
  const hasConfirmed = selected.some(shift => shift.confirmed);
  const hasUnconfirmed = selected.some(shift => !shift.confirmed);
  const exactlyOne = selected.length === 1;
  contextMenu.querySelector('[data-action="edit"]').disabled = !exactlyOne || hasConfirmed;
  contextMenu.querySelector('[data-action="confirm"]').hidden = !hasUnconfirmed;
  contextMenu.querySelector('[data-action="confirm"]').disabled = !hasUnconfirmed;
  contextMenu.querySelector('[data-action="unconfirm"]').hidden = !hasConfirmed;
  contextMenu.querySelector('[data-action="unconfirm"]').disabled = !hasConfirmed;
  const canChangeEditor = selectedShiftsEligibleForEditorChange();
  const assignEditorButton = contextMenu.querySelector('[data-action="assign-editor"]');
  assignEditorButton.hidden = !canChangeEditor;
  assignEditorButton.textContent = selected.some(shift => shift.editorId)
    ? "Modifica montatore"
    : "Assegna montatore";
  contextMenu.querySelector('[data-action="copy"]').disabled = !selected.length;
  contextMenu.querySelector('[data-action="cut"]').disabled = !selected.length || hasConfirmed;
  contextMenu.querySelector('[data-action="paste"]').disabled = !copiedShifts.length || !targetCell;
  contextMenu.querySelector('[data-action="make-definitive"]').disabled = hasConfirmed || !selected.some(s => s.status === "provvisorio");
  contextMenu.querySelector('[data-action="make-provisional"]').disabled = hasConfirmed || !selected.some(s => s.status === "definitivo");
  contextMenu.querySelector('[data-action="delete"]').disabled = !selected.length || hasConfirmed;
  contextMenu.classList.remove("hidden");
  const width = 210;
  const height = contextMenu.offsetHeight || 250;
  contextMenu.style.left = `${Math.max(8, Math.min(event.clientX, innerWidth-width-8))}px`;
  contextMenu.style.top = `${Math.max(8, Math.min(event.clientY, innerHeight-height-8))}px`;
}

function deleteSelectedShifts() {
  const selected = selectedShiftList();
  if (selected.some(shift => shift.confirmed)) return showToast("Il turno confermato è bloccato");
  if (!selected.length) return;
  if (!confirm(selected.length === 1 ? "Eliminare questo turno?" : `Eliminare ${selected.length} turni?`)) return;
  recordShiftUndo(selected.length === 1 ? "eliminazione turno" : `eliminazione di ${selected.length} turni`);
  const ids = new Set(selected.map(s=>s.id));
  shifts = shifts.filter(s=>!ids.has(s.id));
  selected.forEach(s=>deleteShiftFromSupabase(s.id));
  saveLocal(); clearSelection(); renderPlanning();
}

function setSelectedStatus(status) {
  const selected = selectedShiftList();
  if (selected.some(shift => shift.confirmed)) return showToast("Il turno confermato è bloccato");
  recordShiftUndo(selected.length === 1 ? `cambio stato in ${status}` : `cambio stato di ${selected.length} turni`);
  selected.forEach(s=>{ s.status=status; syncShiftToSupabase(s); });
  saveLocal(); renderPlanning();
  showToast(selected.length === 1 ? `Turno reso ${status}` : `${selected.length} turni aggiornati`);
}

function selectedGroupForDrag(sourceId) {
  const source = shifts.find(shift => shift.id === sourceId);
  if (!source || source.confirmed) {
    if (source?.confirmed) showToast("Il turno confermato è bloccato");
    return [];
  }

  if (!selectedShiftIds.has(sourceId)) {
    selectOnlyShift(sourceId);
  }

  if (!IS_MAC_APP) return [{ ...source }];

  return selectedShiftList()
    .filter(shift => !shift.confirmed)
    .map(shift => ({ ...shift }))
    .sort((a, b) =>
      (ROOMS.findIndex(room => room.id === a.room) - ROOMS.findIndex(room => room.id === b.room))
      || a.date.localeCompare(b.date)
      || a.start.localeCompare(b.start)
      || a.id.localeCompare(b.id)
    );
}

async function setShiftConfirmed(shift, confirmed) {
  if (!shift) return;
  recordShiftUndo(confirmed ? "conferma turno" : "annullamento conferma");
  shift.confirmed = confirmed;
  shift.confirmedAt = confirmed ? new Date().toISOString() : null;
  saveLocal();
  await syncShiftToSupabase(shift);
  renderPlanning();
  showToast(confirmed ? "Turno confermato e bloccato" : "Conferma annullata");
}

async function confirmSelectedShift() {
  const selected = selectedShiftList().filter(shift => !shift.confirmed);
  if (!selected.length) return;

  recordShiftUndo(selected.length === 1 ? "conferma turno" : `conferma di ${selected.length} turni`);
  const confirmedAt = new Date().toISOString();
  selected.forEach(shift => {
    shift.confirmed = true;
    shift.confirmedAt = confirmedAt;
  });

  saveLocal();
  await Promise.all(selected.map(shift => syncShiftToSupabase(shift)));
  renderPlanning();
  showToast(selected.length === 1
    ? "Turno confermato e bloccato"
    : `${selected.length} turni confermati e bloccati`);
}

async function unconfirmSelectedShift() {
  const selected = selectedShiftList().filter(shift => shift.confirmed);
  if (!selected.length) return;
  const message = selected.length === 1
    ? "Vuoi annullare la conferma del turno?"
    : `Vuoi annullare la conferma di ${selected.length} turni?`;
  if (!confirm(message)) return;

  recordShiftUndo(selected.length === 1 ? "annullamento conferma" : `annullamento conferma di ${selected.length} turni`);
  selected.forEach(shift => {
    shift.confirmed = false;
    shift.confirmedAt = null;
  });

  saveLocal();
  await Promise.all(selected.map(shift => syncShiftToSupabase(shift)));
  renderPlanning();
  showToast(selected.length === 1
    ? "Conferma annullata"
    : `Conferma annullata per ${selected.length} turni`);
}

function captureDragGroup(sourceId) {
  activeDragGroup = selectedGroupForDrag(sourceId);
  activeDragSource = activeDragGroup.find(shift => shift.id === sourceId) || null;
  return activeDragGroup;
}

function buildMovedGroup(targetRoom, targetDate) {
  if (!activeDragSource || !activeDragGroup.length) return [];

  const sourceDate = new Date(`${activeDragSource.date}T12:00:00`);
  const destinationDate = new Date(`${targetDate}T12:00:00`);
  const offsetDays = Math.round((destinationDate - sourceDate) / 86400000);
  const sourceRoomIndex = ROOMS.findIndex(room => room.id === activeDragSource.room);
  const targetRoomIndex = ROOMS.findIndex(room => room.id === targetRoom);
  if (sourceRoomIndex < 0 || targetRoomIndex < 0) return [];

  const candidates = activeDragGroup.map(original => {
    const movedDate = new Date(`${original.date}T12:00:00`);
    movedDate.setDate(movedDate.getDate() + offsetDays);
    const originalRoomIndex = ROOMS.findIndex(room => room.id === original.room);
    const movedRoom = ROOMS[targetRoomIndex + (originalRoomIndex - sourceRoomIndex)];
    if (!movedRoom) return null;

    return {
      ...original,
      room: movedRoom.id,
      date: isoDate(
        movedDate.getFullYear(),
        movedDate.getMonth(),
        movedDate.getDate()
      )
    };
  });
  return candidates.includes(null) ? [] : candidates;
}

function groupHasConflict(candidates) {
  const movingIds = new Set(activeDragGroup.map(shift => shift.id));

  for (let first = 0; first < candidates.length; first += 1) {
    for (let second = first + 1; second < candidates.length; second += 1) {
      const a = candidates[first];
      const b = candidates[second];
      if (
        a.room === b.room
        && a.date === b.date
        && overlaps(a, b)
      ) return true;
    }
  }

  return candidates.some(candidate =>
    shifts.some(existing =>
      !movingIds.has(existing.id)
      && existing.room === candidate.room
      && existing.date === candidate.date
      && overlaps(existing, candidate)
    )
  );
}

function clearActiveDrag() {
  activeDragGroup = [];
  activeDragSource = null;
}

function startMarquee(event, cell) {
  if (!IS_MAC_APP) return;
  if (event.button !== 0 || event.target.closest('.shift-card')) return;
  marqueeState = {
    startX: event.clientX,
    startY: event.clientY,
    currentX: event.clientX,
    currentY: event.clientY,
    additive: event.metaKey || event.ctrlKey,
    baseSelection: new Set(event.metaKey || event.ctrlKey ? selectedShiftIds : []),
    active: false
  };
}

function updateMarquee(event) {
  if (!marqueeState) return;
  marqueeState.currentX = event.clientX;
  marqueeState.currentY = event.clientY;
  if (!marqueeState.active
    && Math.abs(marqueeState.currentX - marqueeState.startX) < 5
    && Math.abs(marqueeState.currentY - marqueeState.startY) < 5) return;

  if (!marqueeState.active) {
    marqueeState.active = true;
    if (!marqueeState.additive) { selectedShiftIds.clear(); selectionAnchorId = null; }
    selectedCell = null;
    marqueeElement = document.createElement('div');
    marqueeElement.className = 'selection-marquee';
    document.body.appendChild(marqueeElement);
  }

  const left = Math.min(marqueeState.startX, marqueeState.currentX);
  const right = Math.max(marqueeState.startX, marqueeState.currentX);
  const top = Math.min(marqueeState.startY, marqueeState.currentY);
  const bottom = Math.max(marqueeState.startY, marqueeState.currentY);
  Object.assign(marqueeElement.style, {left:`${left}px`, top:`${top}px`, width:`${Math.max(1,right-left)}px`, height:`${Math.max(1,bottom-top)}px`});
  const nextSelection = new Set(marqueeState.baseSelection);
  document.querySelectorAll('.planning-cell .shift-card').forEach(card => {
    const r = card.getBoundingClientRect();
    if (!(r.right < left || r.left > right || r.bottom < top || r.top > bottom)) nextSelection.add(card.dataset.shiftId);
  });
  selectedShiftIds = nextSelection;
  if (!selectionAnchorId || !selectedShiftIds.has(selectionAnchorId)) {
    selectionAnchorId = [...selectedShiftIds][0] || null;
  }
  document.querySelectorAll('.shift-card').forEach(card => card.classList.toggle('selected', selectedShiftIds.has(card.dataset.shiftId)));
  updateSelectionBadge();
}

function finishMarquee() {
  if (!marqueeState) return;
  const wasActive = marqueeState.active;
  marqueeElement?.remove();
  marqueeElement = null;
  marqueeState = null;
  if (wasActive) renderPlanning();
}

function createDragGhost(group) {
  dragGhost?.remove();
  dragGhost = document.createElement('div');
  dragGhost.className = 'drag-group-ghost';
  group.forEach((shift, index) => {
    const sourceCard = document.querySelector(`.shift-card[data-shift-id="${shift.id}"]`);
    const preview = sourceCard ? sourceCard.cloneNode(true) : document.createElement('div');
    preview.classList.remove('selected', 'dragging', 'cut-pending');
    preview.classList.add('drag-ghost-card');
    preview.removeAttribute('draggable');
    preview.style.transform = `translate(${index * 5}px, ${index * 5}px)`;
    dragGhost.appendChild(preview);
  });
  document.body.appendChild(dragGhost);
}

function moveDragGhost(event) {
  if (dragGhost) {
    dragGhost.style.transform = `translate3d(${Math.round(event.clientX + 14)}px, ${Math.round(event.clientY + 14)}px, 0)`;
  }
}

function clearDropHighlights() {
  highlightedDropCells.clear();
  document.querySelectorAll('.group-drop-target, .group-drop-invalid').forEach(cell => cell.classList.remove('group-drop-target', 'group-drop-invalid'));
}

function highlightGroupDestination(targetRoom, targetDate) {
  clearDropHighlights();
  const candidates = buildMovedGroup(targetRoom, targetDate);
  const invalid = candidates.length === 0 || groupHasConflict(candidates);
  candidates.forEach(candidate => {
    const key = `${candidate.room}|${candidate.date}`;
    highlightedDropCells.add(key);
    const cell = document.querySelector(`.planning-cell[data-room="${candidate.room}"][data-date="${candidate.date}"]`);
    cell?.classList.add(invalid ? 'group-drop-invalid' : 'group-drop-target');
  });
  return !invalid;
}

function removeDragGhost() {
  dragGhost?.remove();
  dragGhost = null;
  clearDropHighlights();
}


function isHoliday(date) {
  const key = `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return ITALIAN_FIXED_HOLIDAYS.has(key);
}

function fitText(element, minSize) {
  const original = Number(getComputedStyle(element).fontSize.replace("px", ""));
  let size = original;
  element.style.fontSize = `${size}px`;

  while (element.scrollWidth > element.clientWidth && size > minSize) {
    size -= .35;
    element.style.fontSize = `${size}px`;
  }
}

function fitAllCardText(immediate = false) {
  if (fitTextJob) {
    if (typeof cancelIdleCallback === "function") cancelIdleCallback(fitTextJob);
    else cancelAnimationFrame(fitTextJob);
  }

  const run = () => {
    fitTextJob = null;
    if (document.body.classList.contains("dvs-drag-active")) return;
    const viewport = planningScroller.getBoundingClientRect();
    const visibleCards = [...planningGrid.querySelectorAll(".shift-card")].filter(card => {
      const rect = card.getBoundingClientRect();
      return rect.right >= viewport.left && rect.left <= viewport.right
        && rect.bottom >= viewport.top && rect.top <= viewport.bottom;
    });

    const selectors = [
      [".shift-production", 5.5], [".shift-time", 6], [".shift-film", 6],
      [".shift-type", 6], [".shift-note", 8.5], [".editor-name", 6.5]
    ];
    for (const card of visibleCards) {
      for (const [selector, minSize] of selectors) {
        const element = card.querySelector(selector);
        if (element) fitText(element, minSize);
      }
    }
  };

  if (immediate) {
    run();
    return;
  }

  fitTextJob = typeof requestIdleCallback === "function"
    ? requestIdleCallback(run, { timeout: 250 })
    : requestAnimationFrame(run);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderCard(shift) {
  const color = FILM_COLORS[shift.color] || FILM_COLORS.blue;
  const workType = String(shift.workType || "").toUpperCase();
  const isHighlightedWork = ["GRAFICA", "SOUND", "COLOR"].includes(workType);
  const editor = getEditor(shift.editorId);
  const warning = editorConflict(shift);
  const assignment = shift.isClient ? "CLIENTE" : editorDisplay(editor);
  const cardClasses = [
    "shift-card", shift.status,
    shift.confirmed ? "confirmed" : "",
    shift.isDoubleStation ? "double-station" : "",
    selectedShiftIds.has(shift.id) ? "selected" : "",
    cutShiftIds.has(shift.id) ? "cut-pending" : "",
    shift.notes ? "has-note" : "",
    isHighlightedWork ? "highlighted-work" : ""
  ].filter(Boolean).join(" ");

  return `
    <article
      class="${cardClasses}"
      data-shift-id="${shift.id}"
      draggable="${shift.confirmed ? "false" : "true"}"
      style="--accent-rgb:${color.rgb}">
      <div class="shift-main">
        <div class="shift-production">${escapeHtml(shift.production)}</div>
        <button class="iphone-shift-menu" type="button" aria-label="Azioni turno" title="Azioni turno">•••</button>
        <div class="shift-time">${escapeHtml(shift.start)} – ${escapeHtml(shift.end)}</div>
        <div class="shift-film">${escapeHtml(shift.film)}</div>
        <div class="shift-type${isHighlightedWork ? " shift-type-red" : ""}">${escapeHtml(shift.workType)}${shift.isVariable ? '<span class="variable-label"> - VARIABILE</span>' : ""}${shift.isDoubleStation ? '<span class="double-station-label">DOPPIA POSTAZIONE</span>' : ""}</div>
        ${shift.notes ? `<div class="shift-note">${escapeHtml(shift.notes)}</div>` : ""}
      </div>
      <div class="shift-editor">
        <span class="editor-name${shift.confirmed ? " confirmed-name" : ""}">${escapeHtml(assignment)}</span>
        ${shift.confirmed ? '<span class="confirmed-lock" title="Turno confermato">●</span>' : ""}
        ${warning ? '<span class="editor-warning" title="Dipendente presente su più turni sovrapposti">▲</span>' : ""}
      </div>
    </article>
  `;
}

let renderEditorMap = new Map();
let renderConflictIds = new Set();
let fitTextJob = null;
let planningEventsBound = false;

function buildRenderConflictIds() {
  const byEditorDate = new Map();
  for (const shift of shifts) {
    if (!shift.editorId) continue;
    const key = `${shift.editorId}|${shift.date}`;
    const bucket = byEditorDate.get(key);
    if (bucket) bucket.push(shift);
    else byEditorDate.set(key, [shift]);
  }

  const conflicts = new Set();
  for (const bucket of byEditorDate.values()) {
    bucket.sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
    for (let i = 0; i < bucket.length; i += 1) {
      for (let j = i + 1; j < bucket.length; j += 1) {
        if (timeToMinutes(bucket[j].start) >= timeToMinutes(bucket[i].end)) break;
        if (overlaps(bucket[i], bucket[j])) {
          conflicts.add(bucket[i].id);
          conflicts.add(bucket[j].id);
        }
      }
    }
  }
  return conflicts;
}

function buildPlanningShiftIndex() {
  const index = new Map();
  for (const shift of shifts) {
    const key = `${shift.room}|${shift.date}`;
    const bucket = index.get(key);
    if (bucket) bucket.push(shift);
    else index.set(key, [shift]);
  }
  for (const bucket of index.values()) {
    bucket.sort((a, b) => String(a.start || "").localeCompare(String(b.start || "")));
  }
  return index;
}


function currentPlanningSignature() {
  return `${currentMonth.getFullYear()}-${currentMonth.getMonth()}|${shifts.length}|${editors.length}`;
}

function planningNeedsRender() {
  return !planningGrid.children.length || planningRenderSignature !== currentPlanningSignature();
}

function buildRoomTimeSlots(roomId, dateMeta, shiftIndex) {
  const dailyBuckets = dateMeta.map(meta => shiftIndex.get(`${roomId}|${meta.iso}`) || []);
  const slotCount = Math.max(0, ...dailyBuckets.map(bucket => bucket.length));
  return Array.from({ length: slotCount }, (_, slotIndex) => {
    const completeBuckets = dailyBuckets.filter(bucket => bucket.length === slotCount);
    const starts = (completeBuckets.length ? completeBuckets : dailyBuckets)
      .map(bucket => bucket[slotIndex]?.start).filter(Boolean);
    const frequency = new Map();
    starts.forEach(start => frequency.set(start, (frequency.get(start) || 0) + 1));
    const start = [...frequency.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] || "00:00";
    const height = Math.max(88, ...dailyBuckets
      .map(bucket => bucket[slotIndex])
      .filter(Boolean)
      .map(shift => shift.notes ? 102 : 88));
    return { start, height };
  });
}

function alignDayShiftsToSlots(dayShifts, timeSlots) {
  const aligned = Array(timeSlots.length).fill(null);
  const freeSlots = new Set(timeSlots.map((_, index) => index));
  for (const shift of dayShifts) {
    const exactIndex = timeSlots.findIndex((slot, index) => freeSlots.has(index) && slot.start === shift.start);
    const chosenIndex = exactIndex >= 0
      ? exactIndex
      : [...freeSlots].sort((a, b) =>
          Math.abs(timeToMinutes(timeSlots[a].start) - timeToMinutes(shift.start))
          - Math.abs(timeToMinutes(timeSlots[b].start) - timeToMinutes(shift.start))
        )[0];
    if (chosenIndex === undefined) continue;
    aligned[chosenIndex] = shift;
    freeSlots.delete(chosenIndex);
  }
  return aligned;
}

function renderPlanning() {
  const dates = planningDates(currentMonth);
  const activeMonth = currentMonth.getMonth();
  const now = new Date();
  const shiftIndex = buildPlanningShiftIndex();
  renderEditorMap = new Map(editors.map(editor => [editor.id, editor]));
  renderConflictIds = buildRenderConflictIds();
  const dateMeta = dates.map((date, index) => ({
    dateObject: date,
    iso: isoFromDate(date),
    weekday: new Intl.DateTimeFormat("it-IT", { weekday: "short" })
      .format(date).replace(".", "").toUpperCase(),
    weekend: [0, 6].includes(date.getDay()),
    holiday: isHoliday(date),
    weekStart: date.getDay() === 1 && index !== 0,
    today: date.toDateString() === now.toDateString(),
    outsideMonth: date.getMonth() !== activeMonth,
    monthMini: date.getMonth() !== activeMonth
      ? new Intl.DateTimeFormat("it-IT", { month: "short" }).format(date).replace(".", "").toUpperCase()
      : ""
  }));

  monthLabel.textContent = monthName(currentMonth);
  planningGrid.style.setProperty("--days", dates.length);

  const html = ['<div class="corner">SALE</div>'];

  for (const meta of dateMeta) {
    html.push(`
      <div class="day-head ${meta.weekend ? "weekend" : ""} ${meta.holiday ? "holiday" : ""} ${meta.weekStart ? "week-start" : ""} ${meta.today ? "today-column" : ""} ${meta.outsideMonth ? "outside-month" : ""}"
           data-date="${meta.iso}">
        <span class="dow">${meta.weekday}</span>
        <span class="num">${String(meta.dateObject.getDate()).padStart(2, "0")}</span>
        ${meta.outsideMonth ? `<span class="month-mini">${meta.monthMini}</span>` : ""}
      </div>
    `);
  }

  ROOMS.forEach((room, roomIndex) => {
    if (GROUPS[roomIndex]) html.push(`<div class="group-row">${GROUPS[roomIndex]}</div>`);

    const timeSlots = buildRoomTimeSlots(room.id, dateMeta, shiftIndex);
    const rowHeight = Math.max(98,
      timeSlots.reduce((total, slot) => total + slot.height, 0)
      + Math.max(0, timeSlots.length - 1) * 5
      + 10);
    const roomNumber = room.label.replace(/^Sala\s+/i, "").replace(/^Remote?\s+/i, "");
    const roomKind = room.id.startsWith("remoto-") ? "REMOTO" : "SALA";
    html.push(`<div class="room-label" style="--row-height:${rowHeight}px"><span class="room-label-kind">${roomKind}</span><strong class="room-label-number">${escapeHtml(roomNumber)}</strong></div>`);

    for (const meta of dateMeta) {
      const isSelected = selectedCell?.room === room.id && selectedCell?.date === meta.iso;
      const dayShifts = shiftIndex.get(`${room.id}|${meta.iso}`) || [];
      const alignedShifts = alignDayShiftsToSlots(dayShifts, timeSlots);
      const alignedCards = dayShifts.length ? alignedShifts.map((shift, slotIndex) =>
        `<div class="shift-time-slot${shift ? "" : " is-empty"}" style="height:${timeSlots[slotIndex].height}px">${shift ? renderCard(shift) : ""}</div>`
      ).join("") : "";

      html.push(`
        <div class="planning-cell ${meta.weekend ? "weekend" : ""} ${meta.holiday ? "holiday" : ""} ${meta.weekStart ? "week-start" : ""} ${meta.outsideMonth ? "outside-month" : ""} ${isSelected ? "cell-selected" : ""}"
          style="--row-height:${rowHeight}px" data-room="${room.id}" data-date="${meta.iso}">
          ${isSelected ? '<span class="cell-selection-dot" aria-hidden="true"></span>' : ""}
          ${alignedCards}
          ${dayShifts.length ? "" : '<span class="cell-add-hint">+ turno</span>'}
        </div>`);
    }
  });

  // Un'unica scrittura DOM evita centinaia di insertAdjacentHTML e relativi reflow.
  planningGrid.innerHTML = html.join("");

  bindPlanningEvents();
  updateSelectionBadge();
  // Mac: comportamento stabile esistente. iPad: niente fit sincrono del testo.
  if (!IS_TOUCH_APPLE) fitAllCardText(true);
  applyPlanningZoom(false);
  planningRenderSignature = currentPlanningSignature();

}

function syncPlanningSelectionUI() {
  planningGrid.querySelectorAll('.shift-card').forEach(card => {
    card.classList.toggle('selected', selectedShiftIds.has(card.dataset.shiftId));
  });
  planningGrid.querySelectorAll('.planning-cell').forEach(cell => {
    const selected = selectedCell?.room === cell.dataset.room && selectedCell?.date === cell.dataset.date;
    cell.classList.toggle('cell-selected', selected);
    let dot = cell.querySelector('.cell-selection-dot');
    if (selected && !dot) cell.insertAdjacentHTML('afterbegin', '<span class="cell-selection-dot" aria-hidden="true"></span>');
    else if (!selected) dot?.remove();
  });
  updateSelectionBadge();
}

let lastDragTargetKey = "";

function bindPlanningEvents() {
  if (planningEventsBound) return;
  planningEventsBound = true;

  planningGrid.addEventListener('click', event => {
    const menuButton = event.target.closest('.iphone-shift-menu');
    const card = event.target.closest('.shift-card');
    const cell = event.target.closest('.planning-cell');
    if (menuButton && card && cell) {
      event.preventDefault();
      event.stopPropagation();
      const id = card.dataset.shiftId;
      if (!selectedShiftIds.has(id)) selectOnlyShift(id);
      syncPlanningSelectionUI();
      const rect = menuButton.getBoundingClientRect();
      showContextMenu({
        clientX: rect.right - 8,
        clientY: rect.bottom + 6,
        preventDefault() {},
        stopPropagation() {}
      }, cell);
      return;
    }
    if (card) {
      event.stopPropagation();
      if (suppressNextClick) { suppressNextClick = false; return; }
      hideContextMenu();
      const id = card.dataset.shiftId;
      if (IS_MAC_APP && (event.metaKey || event.ctrlKey)) toggleCommandSelection(id);
      else if (IS_MAC_APP && event.shiftKey && selectionAnchorId) selectShiftRange(selectionAnchorId, id);
      else selectOnlyShift(id);
      syncPlanningSelectionUI();
      return;
    }
    if (!cell || marqueeState?.active) return;
    clearTimeout(emptyCellClickTimer);
    emptyCellClickTimer = setTimeout(() => {
      hideContextMenu();
      selectedShiftIds.clear();
      selectionAnchorId = null;
      selectedCell = { room: cell.dataset.room, date: cell.dataset.date };
      syncPlanningSelectionUI();
    }, 190);
  });

  planningGrid.addEventListener('dblclick', event => {
    const card = event.target.closest('.shift-card');
    const cell = event.target.closest('.planning-cell');
    clearTimeout(emptyCellClickTimer);
    emptyCellClickTimer = null;
    if (card) {
      event.stopPropagation(); hideContextMenu();
      const shift = shifts.find(item => item.id === card.dataset.shiftId);
      if (shift?.confirmed) return showToast('Il turno confermato è bloccato');
      openEditShift(card.dataset.shiftId);
      return;
    }
    if (cell) {
      selectedCell = { room: cell.dataset.room, date: cell.dataset.date };
      openNewShift(cell.dataset.room, cell.dataset.date);
    }
  });

  planningGrid.addEventListener('mousedown', event => {
    const cell = event.target.closest('.planning-cell');
    if (cell && !event.target.closest('.shift-card')) startMarquee(event, cell);
  });

  planningGrid.addEventListener('contextmenu', event => {
    const card = event.target.closest('.shift-card');
    const cell = event.target.closest('.planning-cell');
    if (!cell) return;
    clearTimeout(emptyCellClickTimer);
    if (card) {
      const id = card.dataset.shiftId;
      if (!selectedShiftIds.has(id)) selectOnlyShift(id);
      syncPlanningSelectionUI();
    } else selectedCell = { room: cell.dataset.room, date: cell.dataset.date };
    showContextMenu(event, cell);
  });

  planningGrid.addEventListener('dragstart', event => {
    if (event.target.closest('.iphone-shift-menu')) { event.preventDefault(); return; }
    const card = event.target.closest('.shift-card');
    if (!card) return;
    const dragged = shifts.find(item => item.id === card.dataset.shiftId);
    if (dragged?.confirmed) { event.preventDefault(); return showToast('Il turno confermato è bloccato'); }
    dragSourceShiftId = card.dataset.shiftId;
    lastDragTargetKey = "";
    document.body.classList.add("dvs-drag-active");
    const group = captureDragGroup(dragSourceShiftId);
    selectedShiftIds = new Set(group.map(shift => shift.id));
    selectionAnchorId = dragSourceShiftId;
    suppressNextClick = true;
    planningGrid.querySelectorAll('.shift-card').forEach(item => {
      if (selectedShiftIds.has(item.dataset.shiftId)) item.classList.add('dragging');
    });
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', dragSourceShiftId);
    const image = new Image();
    image.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
    event.dataTransfer.setDragImage(image, 0, 0);
    createDragGhost(group);
    updateSelectionBadge();
  });

  planningGrid.addEventListener('dragend', event => {
    if (!event.target.closest('.shift-card')) return;
    planningGrid.querySelectorAll('.shift-card.dragging').forEach(item => item.classList.remove('dragging'));
    dragSourceShiftId = null;
    document.body.classList.remove("dvs-drag-active");
    lastDragTargetKey = "";
    clearActiveDrag();
    removeDragGhost();
  });

  planningGrid.addEventListener('dragover', event => {
    const cell = event.target.closest('.planning-cell');
    if (!cell) return;
    event.preventDefault();
    const targetKey = `${cell.dataset.room}|${cell.dataset.date}`;
    let valid = true;
    if (targetKey !== lastDragTargetKey) {
      lastDragTargetKey = targetKey;
      valid = highlightGroupDestination(cell.dataset.room, cell.dataset.date);
    } else {
      valid = !cell.classList.contains("group-drop-invalid");
    }
    event.dataTransfer.dropEffect = valid ? 'move' : 'none';
    moveDragGhost(event);
  });

  planningGrid.addEventListener('dragleave', event => {
    if (!event.relatedTarget?.closest?.('.planning-cell')) clearDropHighlights();
  });

  planningGrid.addEventListener('drop', event => {
    const cell = event.target.closest('.planning-cell');
    if (!cell) return;
    event.preventDefault(); clearDropHighlights();
    document.body.classList.remove("dvs-drag-active");
    const sourceId = dragSourceShiftId || event.dataTransfer.getData('text/plain');
    if (!activeDragGroup.length) captureDragGroup(sourceId);
    const candidates = buildMovedGroup(cell.dataset.room, cell.dataset.date);
    if (!candidates.length) { clearActiveDrag(); return removeDragGhost(); }
    if (groupHasConflict(candidates)) {
      showToast('Orari non compatibili'); clearActiveDrag(); return removeDragGhost();
    }
    recordShiftUndo(candidates.length === 1 ? 'spostamento turno' : `spostamento di ${candidates.length} turni`);
    const movedById = new Map(candidates.map(candidate => [candidate.id, candidate]));
    shifts = shifts.map(shift => movedById.get(shift.id) || shift);
    candidates.forEach(syncShiftToSupabase);
    saveLocal();
    selectedShiftIds = new Set(candidates.map(candidate => candidate.id));
    selectionAnchorId = sourceId;
    selectedCell = null;
    clearActiveDrag();
    renderPlanning();
    removeDragGhost();
    showToast(candidates.length === 1 ? 'Turno spostato' : `${candidates.length} turni spostati`);
  });
}

document.addEventListener('mousemove',event=>{ if (marqueeState) updateMarquee(event); if (dragGhost) moveDragGhost(event); });
document.addEventListener('mouseup',()=>{ if (marqueeState) finishMarquee(); });
document.addEventListener('click',event=>{ if (!contextMenu.contains(event.target)) hideContextMenu(); });

contextMenu.addEventListener('click',event=>{
  const button=event.target.closest('button[data-action]'); if (!button||button.disabled) return;
  const action=button.dataset.action, targetCell=contextTargetCell; hideContextMenu();
  if (action==='edit') { const s=selectedShiftList(); if (s.length===1) openEditShift(s[0].id); }
  else if (action==='confirm') confirmSelectedShift();
  else if (action==='unconfirm') unconfirmSelectedShift();
  else if (action==='assign-editor') openAssignEditorDialog();
  else if (action==='copy') copySelectedShifts();
  else if (action==='cut') cutSelectedShifts();
  else if (action==='paste'&&targetCell) { selectedCell={room:targetCell.dataset.room,date:targetCell.dataset.date}; pasteCopiedShifts(); }
  else if (action==='make-definitive') setSelectedStatus('definitivo');
  else if (action==='make-provisional') setSelectedStatus('provvisorio');
  else if (action==='delete') deleteSelectedShifts();
});

function populateShiftSelects() {
  document.getElementById("room").innerHTML = ROOMS.map(room => `<option value="${room.id}">${room.label}</option>`).join("");
  document.getElementById("color").innerHTML = Object.entries(FILM_COLORS).map(([value,item]) => `<option value="${value}">${item.label}</option>`).join("");

  const sortedEditors = [...editors].sort((a,b) => fullEmployeeName(a).localeCompare(fullEmployeeName(b), "it"));
  document.getElementById("editorSuggestions").innerHTML = sortedEditors.map(editor =>
    `<option value="${escapeHtml(fullEmployeeName(editor))}" data-id="${editor.id}"></option>`
  ).join("");

  const productions = [...new Set(shifts.map(shift => shift.production).filter(Boolean))].sort();
  const films = [...new Set(shifts.map(shift => shift.film).filter(Boolean))].sort();
  document.getElementById("productionSuggestions").innerHTML = productions.map(value => `<option value="${escapeHtml(value)}"></option>`).join("");
  document.getElementById("filmSuggestions").innerHTML = films.map(value => `<option value="${escapeHtml(value)}"></option>`).join("");
  renderMultiRoomAssignments();
}

function sortedActiveEditors() {
  return [...editors]
    .filter(editor => editor.active !== false)
    .sort((a, b) => fullEmployeeName(a).localeCompare(fullEmployeeName(b), "it"));
}

function selectedShiftsEligibleForEditorChange() {
  const selected = selectedShiftList();
  return selected.length > 0
    && selected.every(shift => !shift.isClient && !shift.confirmed);
}

function closeAssignEditorDialog() {
  assignEditorDialog?.close();
  assignEditorForm?.reset();
  const error = document.getElementById("assignEditorError");
  if (error) error.textContent = "";
}

function openAssignEditorDialog() {
  if (!selectedShiftsEligibleForEditorChange()) {
    showToast("Seleziona un turno modificabile");
    return;
  }
  const selected = selectedShiftList();
  const isChange = selected.some(shift => shift.editorId);
  const activeEditors = sortedActiveEditors();
  if (!activeEditors.length) {
    showToast("Nessun montatore attivo disponibile");
    return;
  }
  document.getElementById("assignEditorSuggestions").innerHTML = activeEditors.map(editor =>
    `<option value="${escapeHtml(fullEmployeeName(editor))}"></option>`
  ).join("");
  document.getElementById("assignEditorDialogTitle").textContent = isChange
    ? "Modifica montatore"
    : "Assegna montatore";
  document.getElementById("assignEditorSubmit").textContent = isChange ? "Modifica" : "Assegna";
  document.getElementById("assignEditorSelectionCount").textContent = isChange
    ? `Il nuovo montatore verrà applicato a tutti i ${selected.length} turni selezionati`
    : `${selected.length} turni senza montatore selezionati`;
  assignEditorForm.reset();
  document.getElementById("assignEditorError").textContent = "";
  assignEditorDialog.showModal();
  requestAnimationFrame(() => assignEditorSearch.focus());
}

assignEditorForm?.addEventListener("submit", async event => {
  event.preventDefault();
  const error = document.getElementById("assignEditorError");
  if (!selectedShiftsEligibleForEditorChange()) {
    error.textContent = "La selezione non è più valida.";
    return;
  }
  const selected = selectedShiftList();
  const isChange = selected.some(shift => shift.editorId);
  const requestedName = assignEditorSearch.value.trim().toLocaleLowerCase("it");
  if (!requestedName && !isChange) {
    error.textContent = "Seleziona un montatore da assegnare.";
    assignEditorSearch.focus();
    return;
  }
  const editor = requestedName
    ? sortedActiveEditors().find(item => fullEmployeeName(item).toLocaleLowerCase("it") === requestedName)
    : null;
  if (requestedName && !editor) {
    error.textContent = "Seleziona un montatore presente nell’elenco.";
    assignEditorSearch.focus();
    return;
  }

  recordShiftUndo(editor
    ? `${isChange ? "modifica" : "assegnazione"} montatore a ${selected.length} turni`
    : `rimozione montatore da ${selected.length} turni`);
  selected.forEach(shift => { shift.editorId = editor?.id || null; });
  saveLocal();
  closeAssignEditorDialog();
  await Promise.all(selected.map(shift => syncShiftToSupabase(shift)));
  renderPlanning();
  renderDashboard();
  renderSummaries();
  showToast(editor
    ? `${fullEmployeeName(editor)} applicato a ${selected.length} turni`
    : `Montatore rimosso da ${selected.length} turni`);
});

document.getElementById("cancelAssignEditor")?.addEventListener("click", closeAssignEditorDialog);
document.getElementById("closeAssignEditorDialog")?.addEventListener("click", closeAssignEditorDialog);

function editorOptions(selectedId = "") {
  return `<option value="">— Nessun dipendente —</option>${sortedActiveEditors().map(editor =>
    `<option value="${escapeHtml(editor.id)}" ${editor.id === selectedId ? "selected" : ""}>${escapeHtml(fullEmployeeName(editor))}</option>`
  ).join("")}`;
}

function renderMultiRoomAssignments(selected = new Map()) {
  const container = document.getElementById("multiRoomAssignments");
  if (!container) return;
  container.innerHTML = ROOMS.map(room => {
    const assignment = selected.get(room.id);
    return `<div class="multi-room-row" data-multi-room="${room.id}">
      <label class="multi-room-check"><input type="checkbox" ${assignment ? "checked" : ""}><strong>${escapeHtml(room.label)}</strong></label>
      <select aria-label="Dipendente per ${escapeHtml(room.label)}">${editorOptions(assignment?.editorId || "")}</select>
    </div>`;
  }).join("");
  updateMultiRoomUI();
}

function updateMultiRoomUI() {
  const enabled = Boolean(document.getElementById("multiRoomEnabled")?.checked);
  const container = document.getElementById("multiRoomAssignments");
  const singleRoom = document.getElementById("room");
  const singleEditor = document.getElementById("editorSearchInput");
  container?.classList.toggle("hidden", !enabled);
  if (singleRoom) singleRoom.disabled = enabled;
  if (singleEditor) {
    singleEditor.disabled = enabled || Boolean(document.getElementById("isClient")?.checked);
    singleEditor.closest("label")?.classList.toggle("disabled-field", enabled);
  }
}

function selectedRoomAssignments() {
  if (!document.getElementById("multiRoomEnabled")?.checked) {
    return [{
      room: document.getElementById("room").value,
      editorId: document.getElementById("editor").value || null
    }];
  }
  return [...document.querySelectorAll("#multiRoomAssignments .multi-room-row")]
    .filter(row => row.querySelector('input[type="checkbox"]')?.checked)
    .map(row => ({
      room: row.dataset.multiRoom,
      editorId: row.querySelector("select")?.value || null
    }));
}

document.getElementById("multiRoomEnabled")?.addEventListener("change", updateMultiRoomUI);

function setWeekdaySelection(values = ["all"]) {
  const selected = new Set(values.map(String));
  document.querySelectorAll("#weekdayPicker button").forEach(button => button.classList.toggle("active", selected.has(button.dataset.weekday)));
}

function selectedWeekdays() {
  const values = [...document.querySelectorAll("#weekdayPicker button.active")].map(button => button.dataset.weekday);
  return values.includes("all") ? null : new Set(values.map(Number));
}

function setStatusUI(status) {
  document.getElementById("status").value = status;
  document.querySelectorAll(".segmented-control [data-status]").forEach(button => button.classList.toggle("active", button.dataset.status === status));
  const color = document.getElementById("color");
  color.disabled = status === "provvisorio";
  document.getElementById("colorField").classList.toggle("disabled-field", status === "provvisorio");
}

function updateClientUI() {
  const client = document.getElementById("isClient").checked;
  const multiRoom = Boolean(document.getElementById("multiRoomEnabled")?.checked);
  const search = document.getElementById("editorSearchInput");
  search.disabled = client || multiRoom;
  if (client) { search.value = ""; document.getElementById("editor").value = ""; }
  document.querySelectorAll("#multiRoomAssignments select").forEach(select => {
    select.disabled = client;
    if (client) select.value = "";
  });
}

function resolveEditorInput(showError = false) {
  const input = document.getElementById("editorSearchInput");
  const normalized = input.value.trim().toLocaleLowerCase("it");
  if (!normalized) { document.getElementById("editor").value = ""; return true; }
  const match = editors.find(editor => fullEmployeeName(editor).toLocaleLowerCase("it") === normalized);
  document.getElementById("editor").value = match?.id || "";
  if (!match && showError) document.getElementById("shiftFormError").textContent = "Seleziona un dipendente presente nel database.";
  return Boolean(match);
}


let dateCalendarMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
let activeDateField = null;

function formatRangeDate(value) {
  if (!value) return "—";
  return new Date(`${value}T12:00:00`).toLocaleDateString("it-IT", { day:"2-digit", month:"short", year:"numeric" });
}

function updateDateRangeDisplay() {
  const from = document.getElementById("dateFrom").value;
  const to = document.getElementById("dateTo").value;
  document.getElementById("dateFromDisplay").textContent = formatRangeDate(from);
  document.getElementById("dateToDisplay").textContent = formatRangeDate(to);
}

function renderDateCalendar() {
  const title = document.getElementById("dateCalendarTitle");
  const grid = document.getElementById("dateCalendarGrid");
  if (!title || !grid) return;

  title.textContent = dateCalendarMonth.toLocaleDateString("it-IT", { month:"long", year:"numeric" });
  const first = new Date(dateCalendarMonth.getFullYear(), dateCalendarMonth.getMonth(), 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  const gridStart = addDays(first, -mondayOffset);
  const selectedValue = activeDateField ? document.getElementById(activeDateField).value : "";
  const today = isoFromDate(new Date());

  grid.innerHTML = Array.from({length:42}, (_,index) => {
    const date = addDays(gridStart,index);
    const value = isoFromDate(date);
    const outside = date.getMonth() !== dateCalendarMonth.getMonth();
    const classes = [
      "compact-calendar-day",
      outside ? "outside" : "",
      value === selectedValue ? "selected" : "",
      value === today ? "today" : ""
    ].filter(Boolean).join(" ");
    return `<button type="button" class="${classes}" data-calendar-date="${value}">${date.getDate()}</button>`;
  }).join("");

  grid.querySelectorAll("[data-calendar-date]").forEach(button => {
    button.addEventListener("click", event => {
      event.stopPropagation();
      selectCalendarDate(button.dataset.calendarDate);
    });
  });
}

function selectCalendarDate(value) {
  if (!activeDateField) return;
  const from = document.getElementById("dateFrom");
  const to = document.getElementById("dateTo");
  const error = document.getElementById("shiftFormError");

  if (activeDateField === "dateFrom") {
    from.value = value;
    if (!to.value || to.value < value) to.value = value;
  } else {
    if (from.value && value < from.value) {
      if (error) error.textContent = "La data finale non può essere precedente alla data iniziale.";
      return;
    }
    to.value = value;
  }

  if (error) error.textContent = "";
  updateDateRangeDisplay();
  closeDateCalendar();
}

function openDateCalendar(fieldId) {
  const popover = document.getElementById("dateCalendarPopover");
  const trigger = document.getElementById(fieldId === "dateFrom" ? "dateFromTrigger" : "dateToTrigger");
  const value = document.getElementById(fieldId).value || document.getElementById("dateFrom").value;
  activeDateField = fieldId;

  if (value) {
    const date = new Date(`${value}T12:00:00`);
    dateCalendarMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  }

  popover.classList.toggle("align-to", fieldId === "dateTo");
  popover.classList.toggle("align-from", fieldId === "dateFrom");
  document.getElementById("dateFromTrigger")?.classList.toggle("active", fieldId === "dateFrom");
  document.getElementById("dateToTrigger")?.classList.toggle("active", fieldId === "dateTo");
  document.getElementById("dateFromTrigger")?.setAttribute("aria-expanded", String(fieldId === "dateFrom"));
  document.getElementById("dateToTrigger")?.setAttribute("aria-expanded", String(fieldId === "dateTo"));

  renderDateCalendar();
  popover.classList.remove("hidden");
  trigger?.focus({preventScroll:true});
}

function closeDateCalendar() {
  document.getElementById("dateCalendarPopover")?.classList.add("hidden");
  document.getElementById("dateFromTrigger")?.classList.remove("active");
  document.getElementById("dateToTrigger")?.classList.remove("active");
  document.getElementById("dateFromTrigger")?.setAttribute("aria-expanded", "false");
  document.getElementById("dateToTrigger")?.setAttribute("aria-expanded", "false");
  activeDateField = null;
}

function toggleDateCalendar(fieldId) {
  const popover = document.getElementById("dateCalendarPopover");
  const sameFieldOpen = !popover?.classList.contains("hidden") && activeDateField === fieldId;
  if (sameFieldOpen) closeDateCalendar();
  else openDateCalendar(fieldId);
}

document.getElementById("dateFromTrigger")?.addEventListener("click", event => { event.stopPropagation(); toggleDateCalendar("dateFrom"); });
document.getElementById("dateToTrigger")?.addEventListener("click", event => { event.stopPropagation(); toggleDateCalendar("dateTo"); });
document.getElementById("datePrevMonth")?.addEventListener("click", event => { event.stopPropagation(); dateCalendarMonth = new Date(dateCalendarMonth.getFullYear(),dateCalendarMonth.getMonth()-1,1); renderDateCalendar(); });
document.getElementById("dateNextMonth")?.addEventListener("click", event => { event.stopPropagation(); dateCalendarMonth = new Date(dateCalendarMonth.getFullYear(),dateCalendarMonth.getMonth()+1,1); renderDateCalendar(); });
document.getElementById("dateCalendarPopover")?.addEventListener("click", event => event.stopPropagation());
document.addEventListener("click", event => {
  const field = document.querySelector(".date-range-field");
  if (field && !field.contains(event.target)) closeDateCalendar();
});

function updateShiftNotesUI() {
  const enabled = document.getElementById("hasShiftNotes")?.checked;
  const field = document.getElementById("shiftNotesField");
  const textarea = document.getElementById("shiftNotes");
  const count = document.getElementById("shiftNotesCount");
  field?.classList.toggle("hidden", !enabled);
  if (!enabled && textarea) textarea.value = "";
  if (count) count.textContent = String((textarea?.value || "").length);
}

document.getElementById("hasShiftNotes")?.addEventListener("change", () => {
  updateShiftNotesUI();
  if (document.getElementById("hasShiftNotes")?.checked) document.getElementById("shiftNotes")?.focus();
});
document.getElementById("shiftNotes")?.addEventListener("input", updateShiftNotesUI);

function resetShiftForm(shift = {}) {
  const date = shift.date || isoDate(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  document.getElementById("shiftId").value = shift.id || "";
  document.getElementById("production").value = shift.production || "";
  document.getElementById("film").value = shift.film || "";
  document.getElementById("dateFrom").value = date;
  document.getElementById("dateTo").value = shift.dateTo || date;
  updateDateRangeDisplay();
  dateCalendarMonth = new Date(`${date}T12:00:00`);
  renderDateCalendar();
  document.getElementById("room").value = shift.room || "sala-1";
  document.getElementById("start").value = shift.start || "10:00";
  document.getElementById("end").value = shift.end || "18:00";
  document.getElementById("workType").value = shift.workType || "EDIT";
  document.getElementById("editor").value = shift.editorId || "";
  document.getElementById("editorSearchInput").value = shift.editorId ? fullEmployeeName(getEditor(shift.editorId)) : "";
  document.getElementById("isClient").checked = Boolean(shift.isClient);
  document.getElementById("isDoubleStation").checked = Boolean(shift.isDoubleStation);
  document.getElementById("isVariable").checked = Boolean(shift.isVariable);
  const noteValue = String(shift.notes || "").slice(0, 100);
  document.getElementById("hasShiftNotes").checked = Boolean(noteValue);
  document.getElementById("shiftNotes").value = noteValue;
  updateShiftNotesUI();
  document.getElementById("color").value = shift.color || "blue";
  document.getElementById("multiRoomEnabled").checked = false;
  renderMultiRoomAssignments();
  setStatusUI(shift.status || "definitivo");
  setWeekdaySelection(["all"]);
  updateClientUI();
  document.getElementById("shiftFormError").textContent = "";
}

function openNewShift(room = "sala-1", date = "") {
  populateShiftSelects(); editingShiftId = null;
  document.getElementById("shiftDialogTitle").textContent = "Nuovo turno";
  document.getElementById("deleteShiftBtn").classList.add("hidden");
  document.querySelector(".date-range-field").classList.remove("calendar-disabled");
  document.querySelectorAll("#dateCalendarPopover button").forEach(button => button.disabled = false);
  document.getElementById("dateFromTrigger").disabled = false;
  document.getElementById("weekdayPicker").classList.remove("disabled");
  document.getElementById("multiRoomField")?.classList.remove("editing-disabled");
  resetShiftForm({ room, date: date || isoDate(currentMonth.getFullYear(), currentMonth.getMonth(), 1) });
  shiftDialog.showModal();
}

function openEditShift(id) {
  const shift = shifts.find(item => item.id === id);
  if (!shift) return;
  if (shift.confirmed) return showToast("Il turno confermato è bloccato");
  populateShiftSelects(); editingShiftId = id;
  document.getElementById("shiftDialogTitle").textContent = "Modifica turno";
  document.getElementById("deleteShiftBtn").classList.remove("hidden");
  resetShiftForm(shift);
  document.querySelector(".date-range-field").classList.remove("calendar-disabled");
  document.getElementById("dateFromTrigger").disabled = true;
  document.getElementById("dateToTrigger").disabled = false;
  document.getElementById("weekdayPicker").classList.remove("disabled");
  document.getElementById("multiRoomField")?.classList.add("editing-disabled");
  shiftDialog.showModal();
}

function closeShiftDialog() { shiftDialog.close(); document.getElementById("shiftFormError").textContent = ""; }

function datesForFormRange() {
  const from = new Date(`${document.getElementById("dateFrom").value}T12:00:00`);
  const to = new Date(`${document.getElementById("dateTo").value}T12:00:00`);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to < from) return [];
  const weekdays = selectedWeekdays();
  const values = [];
  for (let date = new Date(from); date <= to; date = addDays(date, 1)) if (!weekdays || weekdays.has(date.getDay())) values.push(isoFromDate(date));
  return values;
}

shiftForm.addEventListener("submit", event => {
  event.preventDefault();
  const start = normalizeTime(document.getElementById("start").value);
  const rawEnd = document.getElementById("end").value.trim();
  let end = normalizeTime(rawEnd);
  // A fine turno, 00:00 indica la mezzanotte successiva: internamente resta 24:00.
  if (end === "00:00" && start && start !== "00:00") end = "24:00";
  const error = document.getElementById("shiftFormError");
  error.textContent = "";
  if (!start || !end || timeToMinutes(end) <= timeToMinutes(start)) { error.textContent = "Inserisci un intervallo orario valido."; return; }
  const multiRoom = !editingShiftId && document.getElementById("multiRoomEnabled")?.checked;
  if (!multiRoom && !document.getElementById("isClient").checked && !resolveEditorInput(true)) return;

  const dates = datesForFormRange();
  if (!dates.length) { error.textContent = "Il periodo non contiene giorni selezionati."; return; }

  const assignments = editingShiftId
    ? [{ room: document.getElementById("room").value, editorId: document.getElementById("editor").value || null }]
    : selectedRoomAssignments();
  if (!assignments.length) { error.textContent = "Seleziona almeno una sala."; return; }
  const common = {
    production: document.getElementById("production").value.trim().replace(/\s+/g," ").toUpperCase(),
    film: document.getElementById("film").value.trim().replace(/\s+/g," ").toUpperCase(),
    start, end,
    workType: document.getElementById("workType").value,
    isClient: document.getElementById("isClient").checked,
    isDoubleStation: document.getElementById("isDoubleStation").checked,
    isVariable: document.getElementById("isVariable").checked,
    notes: document.getElementById("hasShiftNotes").checked
      ? document.getElementById("shiftNotes").value.trim().replace(/\s+/g, " ").slice(0, 100)
      : "",
    status: document.getElementById("status").value,
    color: document.getElementById("color").value,
    confirmed: false
  };

  const original = editingShiftId ? shifts.find(item => item.id === editingShiftId) : null;
  let candidates = assignments.flatMap(assignment => dates.map(date => ({
    ...common,
    id: editingShiftId && date === original?.date ? editingShiftId : crypto.randomUUID(),
    room: assignment.room,
    editorId: common.isClient ? null : assignment.editorId,
    date
  })));
  if (editingShiftId) {
    candidates = candidates.filter(candidate => candidate.id === editingShiftId || !shifts.some(existing =>
      existing.id !== editingShiftId
      && existing.room === candidate.room
      && existing.date === candidate.date
      && existing.start === candidate.start
      && existing.end === candidate.end
      && existing.production === candidate.production
      && existing.film === candidate.film
      && existing.workType === candidate.workType
      && existing.editorId === candidate.editorId
    ));
  }
  const conflict = candidates.find(candidate => roomConflict(candidate, editingShiftId));
  if (conflict) { error.textContent = `La sala contiene già un turno sovrapposto il ${new Date(conflict.date+"T12:00:00").toLocaleDateString("it-IT")}.`; return; }

  recordShiftUndo(editingShiftId
    ? (candidates.length > 1 ? `modifica e prolungamento con ${candidates.length - 1} nuovi turni` : "modifica turno")
    : (candidates.length === 1 ? "creazione turno" : `creazione di ${candidates.length} turni`));
  if (editingShiftId) {
    const previous = shifts.find(item => item.id === editingShiftId);
    const edited = candidates.find(item => item.id === editingShiftId);
    if (!edited) { error.textContent = "Il turno originale non è disponibile."; return; }
    edited.confirmed = Boolean(previous?.confirmed);
    shifts[shifts.findIndex(item => item.id === editingShiftId)] = edited;
    shifts.push(...candidates.filter(item => item.id !== editingShiftId));
  } else shifts.push(...candidates);

  saveLocal(); candidates.forEach(syncShiftToSupabase);
  selectedShiftIds = new Set(candidates.map(candidate => candidate.id)); selectionAnchorId = candidates[0].id; selectedCell = null;
  closeShiftDialog(); renderPlanning();
  showToast(candidates.length === 1
    ? "Turno salvato"
    : editingShiftId
      ? `Turno modificato e prolungato: ${candidates.length - 1} nuovi turni`
      : `${candidates.length} turni creati in ${assignments.length} ${assignments.length === 1 ? "sala" : "sale"}`);
});

document.getElementById("deleteShiftBtn").addEventListener("click", () => {
  const shift = shifts.find(item => item.id === editingShiftId);
  if (!editingShiftId || shift?.confirmed) return;
  const targets = [shift];
  const unlocked = targets.filter(item => !item.confirmed);
  const lockedCount = targets.length - unlocked.length;
  const message = `Eliminare ${unlocked.length} ${unlocked.length === 1 ? "turno" : "turni"}${lockedCount ? `? ${lockedCount} confermati resteranno invariati.` : "?"}`;
  if (!unlocked.length || !confirm(message)) return;
  recordShiftUndo(unlocked.length === 1 ? "eliminazione turno" : `eliminazione di ${unlocked.length} turni`);
  const ids = new Set(unlocked.map(item => item.id));
  shifts = shifts.filter(item => !ids.has(item.id));
  saveLocal();
  unlocked.forEach(item => deleteShiftFromSupabase(item.id));
  selectedShiftIds.clear(); selectionAnchorId = null; closeShiftDialog(); renderPlanning();
  showToast(`${unlocked.length} ${unlocked.length === 1 ? "turno eliminato" : "turni eliminati"}`);
});

document.getElementById("closeShiftDialog").addEventListener("click", closeShiftDialog);
document.getElementById("cancelShiftBtn").addEventListener("click", closeShiftDialog);
document.getElementById("newShiftBtn").addEventListener("click", () => openNewShift());

document.getElementById("start").addEventListener("change", event => {
  const value = normalizeTime(event.target.value); if (!value) return;
  event.target.value = value;
  const minutes = timeToMinutes(value) + 480;
  document.getElementById("end").value = minutes >= 1440 ? "24:00" : `${String(Math.floor(minutes/60)).padStart(2,"0")}:${String(minutes%60).padStart(2,"0")}`;
});

function bindTimeSegmentSelection(input) {
  if (!input) return;
  input.addEventListener("focus", () => {
    requestAnimationFrame(() => input.setSelectionRange(0, 2));
  });
  input.addEventListener("mouseup", event => {
    event.preventDefault();
    const caret = input.selectionStart ?? 0;
    requestAnimationFrame(() => {
      if (caret >= 3) input.setSelectionRange(3, 5);
      else input.setSelectionRange(0, 2);
    });
  });
}

bindTimeSegmentSelection(document.getElementById("start"));
bindTimeSegmentSelection(document.getElementById("end"));

document.getElementById("isClient").addEventListener("change", updateClientUI);
document.getElementById("editorSearchInput").addEventListener("change", () => resolveEditorInput(false));
document.querySelectorAll(".segmented-control [data-status]").forEach(button => button.addEventListener("click", () => setStatusUI(button.dataset.status)));
document.querySelectorAll("#weekdayPicker button").forEach(button => button.addEventListener("click", () => {
  if (button.dataset.weekday === "all") return setWeekdaySelection(["all"]);
  document.querySelector('#weekdayPicker [data-weekday="all"]').classList.remove("active");
  button.classList.toggle("active");
  if (![...document.querySelectorAll('#weekdayPicker button:not([data-weekday="all"])')].some(item => item.classList.contains("active"))) setWeekdaySelection(["all"]);
}));
document.getElementById("dateFrom").addEventListener("change", event => {
  const to = document.getElementById("dateTo"); if (!to.value || to.value < event.target.value) to.value = event.target.value;
});

document.getElementById("prevMonth").addEventListener("click", () => {
  currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
  clearSelection();
  renderPlanning();
});

document.getElementById("nextMonth").addEventListener("click", () => {
  currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
  clearSelection();
  renderPlanning();
});

document.getElementById("todayBtn").addEventListener("click", () => {
  const now = new Date();
  currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  clearSelection();
  renderPlanning();

  requestAnimationFrame(() => {
    const dayHeader = planningGrid.querySelector(`[data-date="${isoFromDate(now)}"]`);
    if (!dayHeader) return;
    const target = dayHeader.offsetLeft * planningZoom
      - planningScroller.clientWidth / 2
      + dayHeader.offsetWidth * planningZoom / 2;
    planningScroller.scrollTo({ left: Math.max(0, target), behavior: IS_TOUCH_APPLE ? "auto" : "smooth" });
  });
});

function clampZoom(value) {
  return Math.min(2, Math.max(.5, value));
}

function nearestZoomOption(value) {
  const options = [.5, .75, 1, 1.25, 1.5, 1.75, 2];
  return options.reduce((best, option) => Math.abs(option - value) < Math.abs(best - value) ? option : best, 1);
}

function updateZoomSelectDisplay(forceFit = false) {
  if (!zoomSelect) return;
  zoomSelect.querySelector('option[data-custom-zoom]')?.remove();
  if (forceFit) {
    zoomSelect.value = "fit";
    return;
  }
  const rounded = Math.round(planningZoom * 100) / 100;
  const preset = [...zoomSelect.options].find(option =>
    option.value !== "fit" && Math.abs(Number(option.value) - rounded) < .001
  );
  if (preset) {
    zoomSelect.value = preset.value;
    return;
  }
  const customOption = document.createElement("option");
  customOption.dataset.customZoom = "true";
  customOption.value = String(rounded);
  customOption.textContent = `${Math.round(rounded * 100)}%`;
  zoomSelect.insertBefore(customOption, zoomSelect.options[1] || null);
  zoomSelect.value = customOption.value;
}

function fitPlanningToWindow() {
  planningCanvas.style.zoom = 1;
  const naturalWidth = planningCanvas.scrollWidth || 1;
  const availableWidth = Math.max(1, planningScroller.clientWidth - 4);
  planningZoom = clampZoom(availableWidth / naturalWidth);
  applyPlanningZoom();
  updateZoomSelectDisplay(true);
}

function applyPlanningZoom(save = true, preserveFitLabel = zoomSelect?.value === "fit") {
  planningZoom = clampZoom(planningZoom);
  planningCanvas.style.zoom = planningZoom;
  updateZoomSelectDisplay(preserveFitLabel);
  if (save) localStorage.setItem(ZOOM_STORAGE, String(planningZoom));
}

planningScroller.addEventListener("wheel", event => {
  if (!(event.metaKey || event.ctrlKey)) return;
  event.preventDefault();

  const rect = planningScroller.getBoundingClientRect();
  const mouseX = event.clientX - rect.left + planningScroller.scrollLeft;
  const mouseY = event.clientY - rect.top + planningScroller.scrollTop;
  const previous = planningZoom;
  const continuousDelta = Math.max(-20, Math.min(20, event.deltaY));
  planningZoom = clampZoom(planningZoom * Math.exp(-continuousDelta * .003));

  const ratio = planningZoom / previous;
  applyPlanningZoom(true, false);

  planningScroller.scrollLeft = mouseX * ratio - (event.clientX - rect.left);
  planningScroller.scrollTop = mouseY * ratio - (event.clientY - rect.top);
}, { passive: false });

let gestureStartZoom = planningZoom;
planningScroller.addEventListener("gesturestart", event => {
  event.preventDefault();
  gestureStartZoom = planningZoom;
}, { passive: false });

planningScroller.addEventListener("gesturechange", event => {
  event.preventDefault();
  planningZoom = clampZoom(gestureStartZoom * event.scale);
  applyPlanningZoom(true, false);
}, { passive: false });

document.addEventListener("keydown", event => {
  const target = event.target;
  const isTyping = Boolean(target.closest?.("input, select, textarea, [contenteditable='true']"));

  if (IS_MAC_APP && !isTyping && event.metaKey && event.key.toLowerCase() === "z") {
    event.preventDefault();
    if (event.shiftKey) redoShiftOperation();
    else undoShiftOperation();
    return;
  }

  if (
    IS_MAC_APP
    && !isTyping
    && !shiftDialog.open
    && !editorDialog.open
    && document.getElementById("planningView")?.classList.contains("active")
    && selectedShiftIds.size
    && (event.key === "Backspace" || event.key === "Delete")
  ) {
    event.preventDefault();
    deleteSelectedShifts();
    return;
  }

  if (!isTyping && (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "c") {
    if (copySelectedShifts()) event.preventDefault();
  }

  if (!isTyping && (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "x") {
    if (cutSelectedShifts()) event.preventDefault();
  }

  if (!isTyping && (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "v") {
    if (pasteCopiedShifts()) event.preventDefault();
  }

  if ((event.metaKey || event.ctrlKey) && ["+", "=", "-"].includes(event.key)) {
    if (isTyping) return;
    event.preventDefault();
    planningZoom = nearestZoomOption(planningZoom + (event.key === "-" ? -.2 : .2));
    zoomSelect.value = String(planningZoom);
    applyPlanningZoom();
  }

  if ((event.metaKey || event.ctrlKey) && event.key === "0" && !isTyping) {
    event.preventDefault();
    fitPlanningToWindow();
  }

  if (event.key === "Escape" && !shiftDialog.open && !editorDialog.open) {
    selectedShiftIds.clear();
  selectionAnchorId = null;
    selectedCell = null;
    renderPlanning();
  }
});

function renderEditors() {
  const query = document.getElementById("editorSearch").value.trim().toLocaleLowerCase("it");
  const roleFilter = document.getElementById("editorRoleFilter")?.value || "";
  const filtered = editors
    .filter(editor => {
      const haystack = [fullEmployeeName(editor), editor.role, editor.phone, editor.email, editor.notes]
        .filter(Boolean).join(" ").toLocaleLowerCase("it");
      return haystack.includes(query) && (!roleFilter || editor.role === roleFilter);
    })
    .sort((a, b) => a.firstName.localeCompare(b.firstName, "it", { sensitivity: "base" })
      || a.lastName.localeCompare(b.lastName, "it", { sensitivity: "base" }));

  document.getElementById("editorsCount").textContent = `${filtered.length} dipendenti`;
  document.getElementById("editorsList").innerHTML = filtered.length ? filtered.map(editor => `
    <article class="editor-row" data-editor-id="${editor.id}" tabindex="0" aria-label="Modifica ${escapeHtml(fullEmployeeName(editor))}">
      <div class="employee-main">
        <div class="employee-heading">
          <div class="editor-display">${escapeHtml(fullEmployeeName(editor).toLocaleUpperCase("it"))}</div>
          <span class="employee-role">${escapeHtml(editor.role || "Altro")}</span>
        </div>
        <div class="employee-details">
          ${editor.phone ? `<a class="employee-contact" href="tel:${escapeHtml(editor.phone.replace(/[^+\d]/g, ""))}" data-stop-open>☎ ${escapeHtml(editor.phone)}</a>` : ""}
          ${editor.email ? `<a class="employee-contact" href="mailto:${escapeHtml(editor.email)}" data-stop-open>✉ ${escapeHtml(editor.email)}</a>` : ""}
        </div>
      </div>
      <div class="employee-note-column"><span>Nota</span><div class="employee-notes">${editor.notes ? escapeHtml(editor.notes) : "—"}</div></div>
      <button class="editor-edit-btn" type="button" data-editor-id="${editor.id}" title="Modifica" aria-label="Modifica ${escapeHtml(fullEmployeeName(editor))}">✎</button>
    </article>
  `).join("") : `<div class="employees-empty">Nessun dipendente trovato.</div>`;

  document.querySelectorAll(".editor-row").forEach(row => {
    row.addEventListener("click", event => {
      if (!event.target.closest("[data-stop-open], .editor-edit-btn")) openEditEditor(row.dataset.editorId);
    });
    row.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openEditEditor(row.dataset.editorId);
      }
    });
  });
  document.querySelectorAll(".editor-edit-btn").forEach(button => {
    button.addEventListener("click", () => openEditEditor(button.dataset.editorId));
  });
}

function setEmployeeDialogValues(editor = null) {
  document.getElementById("editorId").value = editor?.id || "";
  document.getElementById("editorFirstName").value = editor?.firstName || "";
  document.getElementById("editorLastName").value = editor?.lastName || "";
  document.getElementById("editorRole").value = editor?.role || "Montatore";
  document.getElementById("editorPhone").value = editor?.phone || "";
  document.getElementById("editorEmail").value = editor?.email || "";
  document.getElementById("editorNotes").value = editor?.notes || "";
  document.getElementById("deleteEditorBtn").classList.toggle("hidden", !editor);
  document.getElementById("editorFormError").textContent = "";
}

function openDialogSafely(dialog) {
  if (!dialog) return;
  try {
    if (!dialog.open && typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  } catch {
    dialog.setAttribute("open", "");
  }
}

function closeDialogSafely(dialog) {
  if (!dialog) return;
  try {
    if (dialog.open && typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
  } catch {
    dialog.removeAttribute("open");
  }
}

function openNewEditor() {
  editingEditorId = null;
  document.getElementById("editorDialogTitle").textContent = "Nuovo dipendente";
  setEmployeeDialogValues();
  openDialogSafely(editorDialog);
  requestAnimationFrame(() => document.getElementById("editorFirstName")?.focus());
}

function openEditEditor(id) {
  const editor = editors.find(item => item.id === id);
  if (!editor) return;
  editingEditorId = id;
  document.getElementById("editorDialogTitle").textContent = "Modifica dipendente";
  setEmployeeDialogValues(editor);
  openDialogSafely(editorDialog);
  requestAnimationFrame(() => document.getElementById("editorFirstName")?.focus());
}

function closeEditorDialog() {
  closeDialogSafely(editorDialog);
  document.getElementById("editorFormError").textContent = "";
}

editorForm.addEventListener("submit", async event => {
  event.preventDefault();

  const firstName = document.getElementById("editorFirstName").value.trim().replace(/\s+/g, " ").toLocaleUpperCase("it");
  const lastName = document.getElementById("editorLastName").value.trim().replace(/\s+/g, " ").toLocaleUpperCase("it");
  const role = document.getElementById("editorRole").value;
  const phone = document.getElementById("editorPhone").value.trim();
  const email = document.getElementById("editorEmail").value.trim();
  const notes = document.getElementById("editorNotes").value.trim();

  if (!firstName || !lastName) {
    document.getElementById("editorFormError").textContent = "Inserisci nome e cognome.";
    return;
  }

  const duplicate = editors.some(editor => editor.id !== editingEditorId
    && editor.firstName.toLocaleLowerCase("it") === firstName.toLocaleLowerCase("it")
    && editor.lastName.toLocaleLowerCase("it") === lastName.toLocaleLowerCase("it"));
  if (duplicate) {
    document.getElementById("editorFormError").textContent = "Questo dipendente esiste già.";
    return;
  }

  const candidate = { id: editingEditorId || crypto.randomUUID(), firstName, lastName, role, phone, email, notes };
  if (editingEditorId) editors[editors.findIndex(item => item.id === editingEditorId)] = candidate;
  else editors.push(candidate);

  saveLocal();
  const ok = await syncEditorToSupabase(candidate);
  closeEditorDialog();
  renderEditors();
  renderPlanning();
  showToast(ok ? "Dipendente salvato" : "Dipendente salvato in locale");
});

async function deleteCurrentEditor() {
  if (!editingEditorId) return;
  const editor = editors.find(item => item.id === editingEditorId);
  if (!editor) return;
  const linkedShifts = shifts.filter(shift => shift.editorId === editingEditorId).length;
  const warning = linkedShifts
    ? `\n\nÈ associato a ${linkedShifts} turn${linkedShifts === 1 ? "o" : "i"}: nei turni il dipendente verrà impostato come non assegnato.`
    : "";
  if (!confirm(`Eliminare definitivamente ${fullEmployeeName(editor)}?\n\nQuesta operazione non può essere annullata.${warning}`)) return;

  if (linkedShifts) {
    recordShiftUndo(`rimozione dipendente da ${linkedShifts} ${linkedShifts === 1 ? "turno" : "turni"}`);
    shifts = shifts.map(shift => shift.editorId === editingEditorId ? { ...shift, editorId: null } : shift);
    for (const shift of shifts.filter(item => item.editorId === null)) await syncShiftToSupabase(shift);
  }
  editors = editors.filter(item => item.id !== editingEditorId);
  await deleteEditorFromSupabase(editingEditorId);
  saveLocal();
  closeEditorDialog();
  renderEditors();
  renderPlanning();
  showToast("Dipendente eliminato");
}

const newEditorBtn = document.getElementById("newEditorBtn");
const closeEditorDialogBtn = document.getElementById("closeEditorDialog");
const cancelEditorBtn = document.getElementById("cancelEditorBtn");
const deleteEditorBtn = document.getElementById("deleteEditorBtn");
const editorSearch = document.getElementById("editorSearch");

newEditorBtn?.addEventListener("click", openNewEditor);
closeEditorDialogBtn?.addEventListener("click", closeEditorDialog);
cancelEditorBtn?.addEventListener("click", closeEditorDialog);
deleteEditorBtn?.addEventListener("click", deleteCurrentEditor);
editorSearch?.addEventListener("input", renderEditors);
document.getElementById("editorRoleFilter")?.addEventListener("change", renderEditors);
document.getElementById("summarySearch")?.addEventListener("input", renderSummaries);
document.getElementById("summaryPrevMonth")?.addEventListener("click", () => { summaryMonth = new Date(summaryMonth.getFullYear(), summaryMonth.getMonth() - 1, 1); selectedSummaryEditorId = null; renderSummaries(); });
document.getElementById("summaryNextMonth")?.addEventListener("click", () => { summaryMonth = new Date(summaryMonth.getFullYear(), summaryMonth.getMonth() + 1, 1); selectedSummaryEditorId = null; renderSummaries(); });
document.getElementById("summaryMonthLabel")?.addEventListener("click", () => { summaryMonth = new Date(); summaryMonth.setDate(1); selectedSummaryEditorId = null; renderSummaries(); });
document.getElementById("summaryPdfBtn")?.addEventListener("click", exportSummaryPdf);

// Fallback delegato: mantiene funzionanti apertura e modifica anche dopo render dinamici o cache parziali.
document.addEventListener("click", event => {
  const newButton = event.target.closest("#newEditorBtn");
  if (newButton) {
    event.preventDefault();
    openNewEditor();
    return;
  }

  const editButton = event.target.closest(".editor-edit-btn[data-editor-id]");
  if (editButton) {
    event.preventDefault();
    event.stopPropagation();
    openEditEditor(editButton.dataset.editorId);
  }
});

zoomSelect?.addEventListener("change", () => {
  if (zoomSelect.value === "fit") fitPlanningToWindow();
  else {
    planningZoom = Number(zoomSelect.value);
    applyPlanningZoom();
  }
});

document.getElementById("logoutBtn")?.addEventListener("click", logoutProfile);


function localTodayIso() {
  const now = new Date();
  return isoDate(now.getFullYear(), now.getMonth(), now.getDate());
}

function italianLongDate(date = new Date()) {
  return new Intl.DateTimeFormat("it-IT", { weekday:"long", day:"numeric", month:"long", year:"numeric" }).format(date);
}


function profileFullName(profile) {
  if (profile.firstName || profile.lastName) return `${profile.firstName || ""} ${profile.lastName || ""}`.trim();
  return profile.name || "Profilo";
}

function normalizeProfile(row) {
  const displayName = row.display_name || row.name || "Profilo";
  const parts = displayName.trim().split(/\s+/);
  return {
    id: String(row.id),
    name: displayName,
    firstName: row.first_name || parts.shift() || "",
    lastName: row.last_name || parts.join(" "),
    initials: (row.initials || displayName.split(/\s+/).map(p => p[0]).join("").slice(0, 3)).toUpperCase(),
    tone: row.tone || row.color_key || "red",
    active: row.active !== false
  };
}

async function loadProfilesFromSupabase() {
  if (!db) { renderProfiles(); return; }
  const { data, error } = await db.from("planning_profiles").select("*").order("sort_order").order("display_name");
  if (error) { console.warn("Profili Build 13 non ancora configurati:", error.message); renderProfiles(); return; }
  profiles = (data || []).map(normalizeProfile);
  if (!profiles.length) profiles = structuredClone(DEFAULT_PROFILES);
  if (activeProfile) activeProfile = profiles.find(p => p.id === activeProfile.id) || activeProfile;
  renderProfiles();
  updateActiveProfileUI();
  renderRegisteredProfiles();
}

async function saveProfileToSupabase(profile) {
  if (!db) return false;
  const row = { id:profile.id, display_name:profileFullName(profile), first_name:profile.firstName, last_name:profile.lastName, initials:profile.initials, tone:profile.tone, active:profile.active !== false };
  const { error } = await db.from("planning_profiles").upsert(row);
  if (error) { showToast(`Profili: ${error.message}`); return false; }
  return true;
}

async function deleteProfileFromSupabase(profileId) {
  if (!db) return false;
  const { error } = await db.from("planning_profiles").delete().eq("id", profileId);
  if (error) { showToast(`Profili: ${error.message}`); return false; }
  return true;
}

function renderRegisteredProfiles() {
  const list = document.getElementById("registeredProfilesList");
  if (!list) return;
  list.innerHTML = profiles.length ? profiles.map(profile => `
    <button class="registered-profile-row" type="button" data-profile-edit="${escapeHtml(profile.id)}">
      <span class="profile-mini-avatar profile-${escapeHtml(profile.tone)}">${escapeHtml(profile.initials)}</span>
      <span class="registered-profile-copy"><strong>${escapeHtml(profileFullName(profile))}</strong><small>${profile.active === false ? "Disattivato" : "Attivo"}</small></span>
      <span class="row-chevron">›</span>
    </button>`).join("") : '<div class="empty-dashboard">Nessun profilo registrato.</div>';
}

function openProfileDialog(profileId = null) {
  editingProfileId = profileId;
  const profile = profiles.find(p => p.id === profileId);
  document.getElementById("profileDialogTitle").textContent = profile ? "Modifica profilo" : "Nuovo profilo";
  document.getElementById("profileId").value = profile?.id || "";
  document.getElementById("profileFirstName").value = profile?.firstName || "";
  document.getElementById("profileLastName").value = profile?.lastName || "";
  document.getElementById("profileInitials").value = profile?.initials || "";
  document.getElementById("profileTone").value = profile?.tone || "red";
  document.getElementById("profileActive").checked = profile?.active !== false;
  document.getElementById("deleteProfileBtn").hidden = !profile;
  document.getElementById("profileDialog").showModal();
}
function closeProfileDialog(){ document.getElementById("profileDialog")?.close(); editingProfileId = null; }

function renderConnectedUsers() {
  const count = onlineProfiles.length;
  const countText = `${count} ${count === 1 ? "utente connesso" : "utenti connessi"}`;
  const title = document.getElementById("connectedUsersTitle");
  const list = document.getElementById("connectedUsersList");
  const sidebarCount = document.getElementById("sidebarOnlineCount");
  const avatars = document.getElementById("sidebarOnlineAvatars");
  if (title) title.textContent = countText;
  if (sidebarCount) sidebarCount.textContent = countText;
  if (avatars) avatars.innerHTML = onlineProfiles.slice(0,3).map(p => `<i class="profile-${escapeHtml(p.tone)}">${escapeHtml(p.initials)}</i>`).join("");
  updateIPhoneOnlineAvatars();
  if (list) list.innerHTML = count ? onlineProfiles.map(profile => `<div class="connected-user-row"><span class="profile-mini-avatar profile-${escapeHtml(profile.tone)}">${escapeHtml(profile.initials)}</span><span><strong>${escapeHtml(profileFullName(profile))}</strong><small>Online</small></span><i class="online-green-dot" aria-label="Online"></i></div>`).join("") : '<div class="empty-dashboard">Nessun utente collegato.</div>';
}

async function loadOnlineProfiles() {
  if (!db) { onlineProfiles = activeProfile ? [activeProfile] : []; renderConnectedUsers(); return; }
  const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const { data, error } = await db.from("profile_presence").select("profile_id,last_seen,is_online,planning_profiles(*)").eq("is_online", true).gte("last_seen", cutoff).order("last_seen", { ascending:false });
  if (error) { console.warn("Presenza Build 13 non ancora configurata:", error.message); return; }
  onlineProfiles = (data || []).filter(row => row.planning_profiles).map(row => normalizeProfile(row.planning_profiles));
  renderConnectedUsers();
}

async function setCurrentProfileOnline() {
  if (!activeProfile) return;
  if (!db) { onlineProfiles = [activeProfile]; renderConnectedUsers(); return; }
  await db.from("profile_presence").upsert({ profile_id:activeProfile.id, is_online:true, last_seen:new Date().toISOString() });
  await loadOnlineProfiles();
}
async function setCurrentProfileOffline() {
  if (!activeProfile || !db) return;
  await db.from("profile_presence").upsert({ profile_id:activeProfile.id, is_online:false, last_seen:new Date().toISOString() });
}
function noteUserActivity(){
  const wasInactive = Date.now() - lastUserActivityAt >= 5 * 60 * 1000;
  lastUserActivityAt = Date.now();
  if (wasInactive && activeProfile) setCurrentProfileOnline();
}
function stopPresenceTracking(){ if (presenceHeartbeatTimer) clearInterval(presenceHeartbeatTimer); presenceHeartbeatTimer = null; }
function startPresenceTracking(){
  stopPresenceTracking();
  noteUserActivity();
  presenceHeartbeatTimer = setInterval(async () => {
    if (!activeProfile) return;
    if (Date.now() - lastUserActivityAt >= 5 * 60 * 1000) await setCurrentProfileOffline();
    else await setCurrentProfileOnline();
  }, 30000);
}
["pointerdown","keydown","mousemove","touchstart","scroll"].forEach(type => window.addEventListener(type, noteUserActivity, { passive:true }));
window.addEventListener("pagehide", () => { setCurrentProfileOffline(); });


function summaryMonthBounds() {
  const start = isoDate(summaryMonth.getFullYear(), summaryMonth.getMonth(), 1);
  const end = isoDate(summaryMonth.getFullYear(), summaryMonth.getMonth(), daysInMonth(summaryMonth));
  return { start, end };
}

function shiftDurationHours(shift) {
  const parse = value => {
    if (value === "24:00") return 24 * 60;
    const [hours, minutes] = String(value || "0:0").split(":").map(Number);
    return (hours || 0) * 60 + (minutes || 0);
  };
  let minutes = parse(shift.end) - parse(shift.start);
  if (minutes < 0) minutes += 24 * 60;
  return minutes / 60;
}

function formatHours(value) {
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded).replace(".", ",");
}

function summaryRows() {
  const { start, end } = summaryMonthBounds();
  const grouped = new Map();
  shifts.filter(shift => shift.editorId && shift.date >= start && shift.date <= end).forEach(shift => {
    if (!grouped.has(shift.editorId)) grouped.set(shift.editorId, []);
    grouped.get(shift.editorId).push(shift);
  });
  return [...grouped.entries()].map(([editorId, employeeShifts]) => ({
    editorId,
    editor: editors.find(editor => editor.id === editorId),
    shifts: employeeShifts.sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start)),
    totalShifts: employeeShifts.length,
    totalHours: employeeShifts.reduce((sum, shift) => sum + shiftDurationHours(shift), 0)
  })).filter(row => row.editor).sort((a, b) => fullEmployeeName(a.editor).localeCompare(fullEmployeeName(b.editor), "it", { sensitivity:"base" }));
}

function formatSummaryDate(dateString) {
  return new Intl.DateTimeFormat("it-IT", { weekday:"short", day:"2-digit", month:"long" }).format(new Date(`${dateString}T12:00:00`));
}

function renderSummaryDetail(row) {
  const empty = document.getElementById("summaryDetailEmpty");
  const content = document.getElementById("summaryDetailContent");
  if (!row) {
    selectedSummaryEditorId = null;
    empty.hidden = false;
    content.hidden = true;
    content.innerHTML = "";
    return;
  }
  selectedSummaryEditorId = row.editorId;
  const pending = row.shifts.filter(shift => !shift.confirmed);
  empty.hidden = true;
  content.hidden = false;
  content.innerHTML = `
    <div class="summary-detail-header">
      <small>${escapeHtml(monthName(summaryMonth))}</small>
      <h2>${escapeHtml(fullEmployeeName(row.editor))}</h2>
      <div class="summary-totals">
        <div class="summary-total"><span>Totale turni</span><strong>${row.totalShifts}</strong></div>
        <div class="summary-total"><span>Totale ore</span><strong>${escapeHtml(formatHours(row.totalHours))}</strong></div>
      </div>
      <div class="summary-detail-actions">
        <button id="confirmSummaryShifts" class="primary-btn summary-confirm-btn" type="button" ${pending.length ? "" : "disabled"}>${pending.length ? `Conferma ${pending.length} ${pending.length === 1 ? "turno" : "turni"}` : "Tutti i turni sono confermati"}</button>
      </div>
    </div>
    <div class="summary-shift-list">${row.shifts.map(shift => {
      const room = ROOMS.find(item => item.id === shift.room)?.label || shift.room || "—";
      return `<article class="summary-shift-item">
        <div class="summary-shift-top"><div><div class="summary-shift-date">${escapeHtml(formatSummaryDate(shift.date))}</div><div class="summary-shift-room">${escapeHtml(room)}</div></div><div class="summary-shift-time">${escapeHtml(shift.start)}–${escapeHtml(shift.end)}</div></div>
        <div class="summary-shift-production">${escapeHtml(shift.production || "—")}</div>
        <div class="summary-shift-meta">${escapeHtml(shift.film || "—")} · ${escapeHtml(shift.workType || "—")}</div>
        <div class="${shift.confirmed ? "summary-confirmed-mark" : "summary-confirmed-mark summary-unconfirmed-mark"}">${shift.confirmed ? "✓ Confermato" : "○ Da confermare"}</div>
      </article>`;
    }).join("")}</div>`;
  document.getElementById("confirmSummaryShifts")?.addEventListener("click", () => confirmSummaryShifts(row.editorId));
}

function renderSummaries() {
  const label = document.getElementById("summaryMonthLabel");
  if (!label) return;
  label.textContent = monthName(summaryMonth);
  const query = (document.getElementById("summarySearch")?.value || "").trim().toLocaleLowerCase("it");
  const rows = summaryRows().filter(row => fullEmployeeName(row.editor).toLocaleLowerCase("it").includes(query));
  const list = document.getElementById("summaryEmployeesList");
  list.innerHTML = rows.length ? rows.map(row => `<button class="summary-employee-row${row.editorId === selectedSummaryEditorId ? " is-active" : ""}" type="button" data-summary-editor-id="${escapeHtml(row.editorId)}"><span class="summary-employee-name">${escapeHtml(fullEmployeeName(row.editor))}</span><span class="summary-number">${row.totalShifts}</span><span class="summary-number">${escapeHtml(formatHours(row.totalHours))}</span></button>`).join("") : `<div class="summary-empty">Nessun dipendente ha turni nel mese selezionato.</div>`;
  list.querySelectorAll("[data-summary-editor-id]").forEach(button => button.addEventListener("click", () => {
    selectedSummaryEditorId = button.dataset.summaryEditorId;
    renderSummaries();
  }));
  const selected = rows.find(row => row.editorId === selectedSummaryEditorId) || null;
  renderSummaryDetail(selected);
}

async function confirmSummaryShifts(editorId) {
  const row = summaryRows().find(item => item.editorId === editorId);
  if (!row) return;
  const pending = row.shifts.filter(shift => !shift.confirmed);
  if (!pending.length) return;
  const message = `Confermare ${pending.length} ${pending.length === 1 ? "turno" : "turni"} di ${fullEmployeeName(row.editor)} per ${monthName(summaryMonth)}? I turni verranno confermati indipendentemente dalla sala.`;
  if (!window.confirm(message)) return;
  recordShiftUndo(pending.length === 1 ? "conferma turno da riepilogo" : `conferma di ${pending.length} turni da riepilogo`);
  const confirmedAt = new Date().toISOString();
  pending.forEach(shift => { shift.confirmed = true; shift.confirmedAt = confirmedAt; });
  saveLocal();
  if (db) await Promise.all(pending.map(shift => syncShiftToSupabase(shift)));
  renderSummaries();
  renderPlanning();
  renderDashboard();
  showToast(`${pending.length} ${pending.length === 1 ? "turno confermato" : "turni confermati"}`);
}

function exportSummaryPdf() {
  const rows = summaryRows();
  if (!rows.length) return showToast("Nessun turno da esportare nel mese selezionato");
  const selected = rows.find(row => row.editorId === selectedSummaryEditorId);
  const exportRows = selected ? [selected] : rows;
  const detail = exportRows.map(row => `
    <section class="employee">
      <h2>${escapeHtml(fullEmployeeName(row.editor))}</h2>
      <p class="totals"><strong>${row.totalShifts}</strong> turni · <strong>${escapeHtml(formatHours(row.totalHours))}</strong> ore</p>
      <table><thead><tr><th>Data</th><th>Sala</th><th>Orario</th><th>Produzione</th><th>Lavorazione</th><th>Conferma</th></tr></thead><tbody>${row.shifts.map(shift => `<tr><td>${escapeHtml(formatSummaryDate(shift.date))}</td><td>${escapeHtml(ROOMS.find(item => item.id === shift.room)?.label || shift.room || "—")}</td><td>${escapeHtml(shift.start)}–${escapeHtml(shift.end)}</td><td>${escapeHtml(shift.production || "—")}</td><td>${escapeHtml(shift.workType || "—")}</td><td>${shift.confirmed ? "Sì" : "No"}</td></tr>`).join("")}</tbody></table>
    </section>`).join("");
  const popup = window.open("", "_blank");
  if (!popup) return showToast("Consenti l’apertura della finestra per esportare il PDF");
  const html = `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>Riepiloghi ${escapeHtml(monthName(summaryMonth))}</title><style>@page{size:A4;margin:15mm}*{box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#111;margin:0;background:#fff}header{border-bottom:2px solid #111;padding-bottom:10px;margin-bottom:18px}h1{font-size:24px;margin:0}header p{margin:4px 0 0;color:#555}.employee{break-inside:avoid-page;page-break-inside:avoid;margin-bottom:24px}.employee h2{margin:0;font-size:18px}.totals{margin:4px 0 10px}table{width:100%;border-collapse:collapse;font-size:10px}th,td{padding:6px;border-bottom:1px solid #ddd;text-align:left;vertical-align:top}th{font-size:9px;text-transform:uppercase;letter-spacing:.04em;background:#f3f3f3}.actions{position:sticky;top:0;z-index:5;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:calc(10px + env(safe-area-inset-top)) 10px 10px;background:#15171b}.actions button{border:0;border-radius:9px;background:#e54b57;color:#fff;font-weight:700;padding:10px 15px;cursor:pointer}.actions .back{background:#343940}@media print{.actions{display:none}}</style></head><body><div class="actions"><button class="back" onclick="if(window.opener){window.opener.focus();window.close()}else if(history.length>1){history.back()}">‹ Torna ai riepiloghi</button><button onclick="window.print()">Stampa / Salva PDF</button></div><main><header><h1>Digital Video Service</h1><p>Riepilogo turni · ${escapeHtml(monthName(summaryMonth))}</p></header>${detail}</main></body></html>`;
  popup.document.open();
  popup.document.write(html);
  popup.document.close();
  popup.focus();
  setTimeout(() => { try { popup.print(); } catch (_) {} }, 350);
}



// Build 16.2 — Mesi dinamici — Centro Stampa
let printMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);

function printMonthWeeks(monthDate) {
  const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1, 12);
  const last = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 12);
  const mondayOffset = (first.getDay() + 6) % 7;
  const start = new Date(first); start.setDate(first.getDate() - mondayOffset);
  const sundayOffset = (7 - last.getDay()) % 7;
  const end = new Date(last); end.setDate(last.getDate() + sundayOffset);
  const weeks = [];
  for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 7)) {
    const weekStart = new Date(cursor);
    const weekEnd = new Date(cursor); weekEnd.setDate(weekEnd.getDate() + 6);
    weeks.push({ start: isoFromDate(weekStart), end: isoFromDate(weekEnd), dates: Array.from({length:7}, (_,i) => { const d=new Date(weekStart); d.setDate(d.getDate()+i); return d; }) });
  }
  return weeks;
}

function shortPrintDate(iso, includeMonth=true) {
  const date = new Date(`${iso}T12:00:00`);
  return new Intl.DateTimeFormat('it-IT', includeMonth ? { day:'numeric', month:'short' } : { day:'numeric' }).format(date).replace('.', '');
}

function printSettingsHtml() {
  const weeks = printMonthWeeks(printMonth);
  const monthValue = `${printMonth.getFullYear()}-${String(printMonth.getMonth()+1).padStart(2,'0')}`;
  // Intervallo dinamico: segue automaticamente il calendario e i dati presenti.
  // Mostra almeno dall'anno precedente a quello corrente fino a tre anni avanti;
  // se nel database esistono turni fuori da questo intervallo, li include comunque.
  const currentYear = new Date().getFullYear();
  const shiftYears = shifts
    .map(shift => Number(String(shift.date || '').slice(0, 4)))
    .filter(year => Number.isInteger(year) && year >= 2000 && year <= 9999);
  const selectedYear = printMonth.getFullYear();
  const firstYear = Math.min(currentYear - 1, selectedYear, ...(shiftYears.length ? shiftYears : [currentYear]));
  const lastYear = Math.max(currentYear + 3, selectedYear, ...(shiftYears.length ? shiftYears : [currentYear]));
  const monthOptions = [];
  for (let year = firstYear; year <= lastYear; year++) {
    for (let month = 0; month < 12; month++) {
      const value = `${year}-${String(month + 1).padStart(2, '0')}`;
      const label = new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric' }).format(new Date(year, month, 1));
      monthOptions.push(`<option value="${value}" ${value === monthValue ? 'selected' : ''}>${label.charAt(0).toUpperCase() + label.slice(1)}</option>`);
    }
  }
  return `
    <div class="print-center">
      <div class="print-center-heading"><div><small>CENTRO STAMPA</small><h2>Planning da stampare</h2><p>Scegli periodo e sale, quindi apri l’anteprima dedicata.</p></div></div>
      <section class="print-option-card">
        <div class="print-option-title"><span>1</span><div><h3>Periodo</h3><p>Seleziona il mese e le settimane da includere.</p></div></div>
        <label class="print-month-field">Mese<select id="printMonthInput">${monthOptions.join('')}</select></label>
        <div class="print-choice-row">
          <label class="print-radio"><input type="radio" name="printPeriodMode" value="month" checked><span>Tutto il mese</span></label>
          <label class="print-radio"><input type="radio" name="printPeriodMode" value="weeks"><span>Settimane specifiche</span></label>
        </div>
        <div id="printWeeksList" class="print-check-grid is-disabled">${weeks.map((week,index)=>`<label class="print-check"><input type="checkbox" value="${week.start}" data-week-end="${week.end}" ${index===0?'checked':''}><span>${shortPrintDate(week.start)} – ${shortPrintDate(week.end)}</span></label>`).join('')}</div>
      </section>
      <section class="print-option-card">
        <div class="print-option-title"><span>2</span><div><h3>Sale</h3><p>Stampa tutte le sale oppure soltanto quelle necessarie.</p></div></div>
        <div class="print-choice-row">
          <label class="print-radio"><input type="radio" name="printRoomMode" value="all" checked><span>Tutte le sale</span></label>
          <label class="print-radio"><input type="radio" name="printRoomMode" value="specific"><span>Sale specifiche</span></label>
        </div>
        <div class="print-room-tools"><button id="printSelectAllRooms" type="button">Seleziona tutte</button><button id="printClearRooms" type="button">Deseleziona tutte</button></div>
        <div id="printRoomsList" class="print-check-grid print-rooms-grid is-disabled">${ROOMS.map(room=>`<label class="print-check"><input type="checkbox" value="${room.id}" checked><span>${escapeHtml(room.label.replace(/^Remote /,'Remoto '))}</span></label>`).join('')}</div>
      </section>
      <section class="print-option-card print-layout-card">
        <div class="print-option-title"><span>3</span><div><h3>Impaginazione</h3><p>L’anteprima viene adattata automaticamente alla pagina.</p></div></div>
        <label class="print-switch"><input id="printAutoFit" type="checkbox" checked><span>Adatta automaticamente alla pagina</span></label>
      </section>
      <div class="print-primary-action"><button id="openPrintPreview" class="primary-btn" type="button">Anteprima di stampa</button></div>
    </div>`;
}

function bindPrintSettings() {
  const monthInput=document.getElementById('printMonthInput');
  const weeksList=document.getElementById('printWeeksList');
  const roomsList=document.getElementById('printRoomsList');
  const refreshModes=()=>{
    const weeksMode=document.querySelector('input[name="printPeriodMode"]:checked')?.value==='weeks';
    weeksList?.classList.toggle('is-disabled',!weeksMode);
    weeksList?.querySelectorAll('input').forEach(input=>input.disabled=!weeksMode);
    const roomsMode=document.querySelector('input[name="printRoomMode"]:checked')?.value==='specific';
    roomsList?.classList.toggle('is-disabled',!roomsMode);
    roomsList?.querySelectorAll('input').forEach(input=>input.disabled=!roomsMode);
    document.getElementById('printSelectAllRooms').disabled=!roomsMode;
    document.getElementById('printClearRooms').disabled=!roomsMode;
  };
  document.querySelectorAll('input[name="printPeriodMode"],input[name="printRoomMode"]').forEach(input=>input.addEventListener('change',refreshModes));
  monthInput?.addEventListener('change',()=>{
    const [year,month]=monthInput.value.split('-').map(Number);
    if(!year||!month)return;
    printMonth=new Date(year,month-1,1);
    const weeks=printMonthWeeks(printMonth);
    weeksList.innerHTML=weeks.map((week,index)=>`<label class="print-check"><input type="checkbox" value="${week.start}" data-week-end="${week.end}" ${index===0?'checked':''}><span>${shortPrintDate(week.start)} – ${shortPrintDate(week.end)}</span></label>`).join('');
    refreshModes();
  });
  document.getElementById('printSelectAllRooms')?.addEventListener('click',()=>roomsList.querySelectorAll('input').forEach(input=>input.checked=true));
  document.getElementById('printClearRooms')?.addEventListener('click',()=>roomsList.querySelectorAll('input').forEach(input=>input.checked=false));
  document.getElementById('openPrintPreview')?.addEventListener('click',openPrintPreview);
  refreshModes();
}

function printCardHtml(shift) {
  const color=FILM_COLORS[shift.color]||FILM_COLORS.blue;
  const editor=getEditor(shift.editorId);
  const assignment=shift.isClient?'CLIENTE':editorDisplay(editor);
  return `<article class="p-shift ${escapeHtml(shift.status||'definitivo')} ${shift.confirmed?'confirmed':''}" style="--accent:${color.rgb}"><div class="p-main"><b>${escapeHtml(shift.production||'')}</b><time>${escapeHtml(shift.start)} – ${escapeHtml(shift.end)}</time><strong>${escapeHtml(shift.film||'')}</strong><em>${escapeHtml(shift.workType||'')}${shift.isVariable?' - VARIABILE':''}</em>${shift.notes?`<small>${escapeHtml(shift.notes)}</small>`:''}</div><footer>${escapeHtml(assignment)}</footer></article>`;
}

function openPrintPreview() {
  const periodMode=document.querySelector('input[name="printPeriodMode"]:checked')?.value||'month';
  const roomMode=document.querySelector('input[name="printRoomMode"]:checked')?.value||'all';
  const allWeeks=printMonthWeeks(printMonth);
  const selectedWeeks=periodMode==='month'?allWeeks:[...document.querySelectorAll('#printWeeksList input:checked')].map(input=>allWeeks.find(week=>week.start===input.value)).filter(Boolean);
  if(!selectedWeeks.length)return showToast('Seleziona almeno una settimana');
  const selectedRooms=roomMode==='all'?ROOMS:[...document.querySelectorAll('#printRoomsList input:checked')].map(input=>ROOMS.find(room=>room.id===input.value)).filter(Boolean);
  if(!selectedRooms.length)return showToast('Seleziona almeno una sala');
  const autoFit=document.getElementById('printAutoFit')?.checked!==false;
  const periodLabel=periodMode==='month'?monthName(printMonth):selectedWeeks.map(w=>`${shortPrintDate(w.start)} – ${shortPrintDate(w.end)}`).join(' · ');
  const pages=selectedWeeks.map((week,pageIndex)=>{
    const cells=['<div class="p-corner">SALE</div>'];
    week.dates.forEach(date=>{
      const outside=date.getMonth()!==printMonth.getMonth();
      cells.push(`<div class="p-day ${[0,6].includes(date.getDay())?'weekend':''} ${outside?'outside':''}"><span>${new Intl.DateTimeFormat('it-IT',{weekday:'short'}).format(date).replace('.','').toUpperCase()}</span><b>${String(date.getDate()).padStart(2,'0')}</b>${outside?`<small>${new Intl.DateTimeFormat('it-IT',{month:'short'}).format(date).replace('.','').toUpperCase()}</small>`:''}</div>`);
    });
    selectedRooms.forEach(room=>{
      cells.push(`<div class="p-room">${escapeHtml(room.label.replace(/^Remote /,'Remoto '))}</div>`);
      week.dates.forEach(date=>{
        const iso=isoFromDate(date);
        const dayShifts=shifts.filter(s=>s.room===room.id&&s.date===iso).sort((a,b)=>a.start.localeCompare(b.start));
        cells.push(`<div class="p-cell ${[0,6].includes(date.getDay())?'weekend':''}">${dayShifts.map(printCardHtml).join('')}</div>`);
      });
    });
    const weekLabel=`${shortPrintDate(week.start)} – ${shortPrintDate(week.end)}`;
    return `<main class="paper"><header class="head"><div><h1>Digital Video Service</h1><p>PLANNING · ${escapeHtml(monthName(printMonth))}</p><small>Settimana ${escapeHtml(weekLabel)}</small></div><strong>${selectedRooms.length===ROOMS.length?'Tutte le sale':`${selectedRooms.length} sale selezionate`}</strong></header><section class="grid">${cells.join('')}</section><footer class="page-footer"><span>DVS Planning · v26</span><span>Pagina ${pageIndex+1} di ${selectedWeeks.length}</span></footer></main>`;
  }).join('');
  const popup=window.open('','_blank');
  if(!popup)return showToast('Consenti l’apertura della finestra di anteprima');
  popup.document.open();
  popup.document.write(`<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>DVS Planning · ${escapeHtml(periodLabel)}</title><style>
  :root{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#17181b;background:#e9eaed}*{box-sizing:border-box}body{margin:0}.preview-bar{position:sticky;top:0;z-index:5;display:flex;align-items:center;justify-content:space-between;padding:14px 22px;background:#111318;color:#fff;box-shadow:0 5px 20px #0003}.preview-bar div{display:flex;gap:10px}.preview-bar button{border:0;border-radius:10px;padding:10px 16px;font-weight:700;cursor:pointer}.preview-bar .print{background:#e54b57;color:#fff}.paper{margin:24px auto;background:#fff;width:min(1500px,calc(100vw - 48px));padding:22px;box-shadow:0 12px 45px #0002;break-after:page;page-break-after:always}.paper:last-child{break-after:auto;page-break-after:auto}.head{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #17181b;padding-bottom:12px;margin-bottom:14px}.head h1{margin:0;font-size:24px}.head p{margin:4px 0 0;color:#5d626c}.head small{display:block;margin-top:3px;color:#777}.head strong{font-size:13px}.grid{display:grid;grid-template-columns:95px repeat(7,${autoFit?'minmax(0,1fr)':'150px'});width:100%;border:1px solid #cfd2d8;border-right:0;border-bottom:0}.grid>div{border-right:1px solid #cfd2d8;border-bottom:1px solid #cfd2d8}.p-corner,.p-day{height:50px;background:#f1f2f4;display:flex;align-items:center;justify-content:center}.p-corner{font-size:11px;font-weight:800}.p-day{flex-direction:column}.p-day span{font-size:9px;font-weight:800}.p-day b{font-size:18px}.p-day small{font-size:7px}.p-day.weekend,.p-cell.weekend{background:#f7f1f2}.p-day.outside{opacity:.55}.p-room{padding:8px;font-size:11px;font-weight:800;background:#f6f7f8;display:flex;align-items:flex-start}.p-cell{min-height:94px;padding:4px;background:#fff}.p-shift{--accent:61,125,235;border:1px solid rgba(var(--accent),.55);border-radius:7px;background:rgba(var(--accent),.18);overflow:hidden;margin-bottom:4px;font-size:7px;break-inside:avoid}.p-shift.provvisorio{background:#fff;border-style:dashed}.p-main{padding:5px}.p-main b,.p-main strong,.p-main em,.p-main time,.p-main small{display:block;white-space:normal;overflow-wrap:anywhere}.p-main b{font-size:8px}.p-main time{font-weight:700;margin:2px 0}.p-main strong{font-size:8px}.p-main em{font-style:normal;font-weight:700;margin-top:2px}.p-main small{margin-top:3px;border-top:1px solid #0002;padding-top:2px}.p-shift footer{background:rgba(var(--accent),.32);padding:4px 5px;font-weight:800}.p-shift.confirmed footer:after{content:'  ●';font-size:6px}.page-footer{margin-top:12px;display:flex;justify-content:space-between;font-size:9px;color:#777}@page{size:A4 landscape;margin:8mm}@media print{body{background:#fff}.preview-bar{display:none}.paper{margin:0;padding:0;box-shadow:none;width:100%;height:auto;break-after:page;page-break-after:always}.paper:last-child{break-after:auto;page-break-after:auto}.grid{width:100%;grid-template-columns:72px repeat(7,minmax(0,1fr))}.p-cell{min-height:60px;padding:2px}.p-room{font-size:8px;padding:4px}.p-day{height:38px}.p-day b{font-size:13px}.p-shift{font-size:5px;border-radius:3px;margin-bottom:2px}.p-main{padding:2px}.p-main b,.p-main strong{font-size:5.5px}.p-shift footer{padding:2px}.head{margin-bottom:6px;padding-bottom:6px}.head h1{font-size:16px}.head p,.head strong,.head small{font-size:8px}.page-footer{font-size:7px}}
  </style></head><body><div class="preview-bar"><button onclick="window.close()">‹ Torna alle impostazioni</button><div><button class="print" onclick="window.print()">Stampa / Salva PDF</button></div></div>${pages}</body></html>`);
  popup.document.close();
  popup.focus();
}



const IPHONE_VIEW_TITLES = {
  dashboard: "Dashboard",
  planning: "Planning",
  editors: "Dipendenti",
  summaries: "Riepiloghi",
  settings: "Impostazioni",
  connected: "Utenti collegati"
};

function updateIPhoneChrome(viewName) {
  if (!IS_IPHONE) return;
  document.querySelectorAll(".iphone-nav-item[data-view]").forEach(item => item.classList.toggle("active", item.dataset.view === viewName));
  updateIPhoneNavIndicator(viewName);
  const title = document.getElementById("iphoneSectionTitle");
  if (title) title.textContent = IPHONE_VIEW_TITLES[viewName] || "DVS Planning";
  const action = document.getElementById("iphoneContextAction");
  if (!action) return;
  action.classList.add("hidden");
  action.textContent = "";
  action.onclick = null;
  if (viewName === "planning") {
    action.textContent = "+";
    action.setAttribute("aria-label", "Nuovo turno");
    action.onclick = () => document.getElementById("newShiftBtn")?.click();
    action.classList.remove("hidden");
  } else if (viewName === "editors") {
    action.textContent = "+";
    action.setAttribute("aria-label", "Nuovo dipendente");
    action.onclick = () => document.getElementById("newEditorBtn")?.click();
    action.classList.remove("hidden");
  }
}

const IPHONE_NAV_VIEWS = ["dashboard", "planning", "editors", "summaries", "settings"];
function updateIPhoneNavIndicator(viewName, animate = true) {
  const indicator = document.getElementById("iphoneNavIndicator");
  const nav = document.getElementById("iphoneBottomNav");
  const index = IPHONE_NAV_VIEWS.indexOf(viewName);
  if (!indicator || !nav || index < 0) return;
  const step = Math.max(0, (nav.getBoundingClientRect().width - 10) / IPHONE_NAV_VIEWS.length);
  indicator.classList.toggle("no-transition", !animate);
  indicator.style.transform = `translate3d(${index * step}px,0,0)`;
  if (!animate) requestAnimationFrame(() => indicator.classList.remove("no-transition"));
}

function bindIPhoneDraggableNavigation() {
  const nav = document.getElementById("iphoneBottomNav");
  const indicator = document.getElementById("iphoneNavIndicator");
  if (!nav || !indicator || !IS_IPHONE) return;
  let dragging = false;
  let pointerId = null;
  let suppressClick = false;
  const geometry = () => {
    const rect = nav.getBoundingClientRect();
    return { rect, step:(rect.width - 10) / IPHONE_NAV_VIEWS.length };
  };
  const moveIndicator = clientX => {
    const { rect, step } = geometry();
    const x = Math.max(0, Math.min(step * (IPHONE_NAV_VIEWS.length - 1), clientX - rect.left - 5 - step / 2));
    indicator.style.transform = `translate3d(${x}px,0,0)`;
  };
  nav.addEventListener("pointerdown", event => {
    if (!document.documentElement.classList.contains("is-iphone")) return;
    const item = event.target.closest(".iphone-nav-item");
    if (!item?.classList.contains("active")) return;
    dragging = true;
    pointerId = event.pointerId;
    suppressClick = false;
    indicator.classList.add("is-dragging", "no-transition");
    nav.setPointerCapture?.(pointerId);
    moveIndicator(event.clientX);
    event.preventDefault();
  });
  nav.addEventListener("pointermove", event => {
    if (!dragging || event.pointerId !== pointerId) return;
    suppressClick = true;
    moveIndicator(event.clientX);
    event.preventDefault();
  });
  const finish = event => {
    if (!dragging || event.pointerId !== pointerId) return;
    const { rect, step } = geometry();
    const index = Math.max(0, Math.min(IPHONE_NAV_VIEWS.length - 1, Math.floor((event.clientX - rect.left - 5) / step)));
    dragging = false;
    nav.releasePointerCapture?.(pointerId);
    pointerId = null;
    indicator.classList.remove("is-dragging", "no-transition");
    openView(IPHONE_NAV_VIEWS[index]);
    suppressClick = true;
    setTimeout(() => { suppressClick = false; }, 0);
    event.preventDefault();
  };
  nav.addEventListener("pointerup", finish);
  nav.addEventListener("pointercancel", event => {
    if (!dragging || event.pointerId !== pointerId) return;
    dragging = false;
    pointerId = null;
    indicator.classList.remove("is-dragging", "no-transition");
    const active = nav.querySelector(".iphone-nav-item.active")?.dataset.view;
    updateIPhoneNavIndicator(active || "dashboard");
  });
  nav.addEventListener("click", event => {
    if (!suppressClick) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);
  window.addEventListener("resize", () => {
    const active = nav.querySelector(".iphone-nav-item.active")?.dataset.view;
    updateIPhoneNavIndicator(active || "dashboard", false);
  });
}

function updateIPhoneOnlineAvatars() {
  if (!IS_IPHONE) return;
  const container = document.getElementById("iphoneOnlineAvatars");
  if (!container) return;
  container.innerHTML = onlineProfiles.slice(0,3).map(p => `<i class="profile-${escapeHtml(p.tone)}">${escapeHtml(p.initials)}</i>`).join("");
}

function updateIPhoneBackupLight() {
  if (!IS_IPHONE) return;
  const light = document.getElementById("iphoneBackupLight");
  if (!light) return;
  const healthy = isSharedBackupHealthy(backupAgentStatus);
  light.classList.toggle("is-green", healthy);
  light.classList.toggle("is-red", !healthy);
}

function openView(viewName, keepPlanningMonth = false) {
  if (viewName === "planning" && !keepPlanningMonth) {
    const now = new Date();
    currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    clearSelection();
  }
  document.querySelectorAll(".nav-item[data-view]").forEach(item => item.classList.toggle("active", item.dataset.view === viewName));
  updateIPhoneChrome(viewName);
  document.querySelectorAll(".app-view").forEach(view => view.classList.remove("active"));
  document.getElementById(`${viewName}View`)?.classList.add("active");
  if (viewName === "editors") renderEditors();
  if (viewName === "summaries") renderSummaries();
  if (viewName === "dashboard") renderDashboard();
  if (viewName === "planning") renderPlanning();
  if (viewName === "connected") renderConnectedUsers();
  if (viewName === "settings") { showSettingsHome(); }
}

function showSettingsHome() {
  const home = document.getElementById("settingsHome");
  const detail = document.getElementById("profilesSettingsSection");
  const generic = document.getElementById("genericSettingsSection");
  if (home) home.hidden = false;
  if (detail) detail.hidden = true;
  if (generic) generic.hidden = true;
  const title = document.getElementById("settingsPageTitle");
  const subtitle = document.getElementById("settingsPageSubtitle");
  if (title) title.textContent = "Impostazioni";
  if (subtitle) subtitle.textContent = "Gestione applicazione";
}

function showProfilesSettings() {
  const home = document.getElementById("settingsHome");
  const detail = document.getElementById("profilesSettingsSection");
  const generic = document.getElementById("genericSettingsSection");
  if (home) home.hidden = true;
  if (detail) detail.hidden = false;
  if (generic) generic.hidden = true;
  const title = document.getElementById("settingsPageTitle");
  const subtitle = document.getElementById("settingsPageSubtitle");
  if (title) title.textContent = "Gestione Profili";
  if (subtitle) subtitle.textContent = "Profili registrati e accesso";
  renderRegisteredProfiles();
}

document.getElementById("openProfilesSettings")?.addEventListener("click", showProfilesSettings);
document.getElementById("backToSettings")?.addEventListener("click", showSettingsHome);
document.getElementById("backFromGenericSettings")?.addEventListener("click", showSettingsHome);

document.querySelectorAll("[data-settings-section]").forEach(button => button.addEventListener("click", () => {
  const section = button.dataset.settingsSection;
  const home = document.getElementById("settingsHome");
  const profilesDetail = document.getElementById("profilesSettingsSection");
  const generic = document.getElementById("genericSettingsSection");
  const content = document.getElementById("genericSettingsContent");
  const title = document.getElementById("settingsPageTitle");
  const subtitle = document.getElementById("settingsPageSubtitle");
  if (home) home.hidden = true;
  if (profilesDetail) profilesDetail.hidden = true;
  if (generic) generic.hidden = false;
  const sections = {
    backup: { title:"Backup", subtitle:"Stato e autorizzazione", html:backupSettingsHtml() },
    print: { title:"Stampa", subtitle:"Centro Stampa", html:printSettingsHtml() },
    info: { title:"Informazioni", subtitle:"DVS Planning", html:`<img class="settings-info-logo" src="./assets/logos/digital-video-full.png" alt="Digital Video"><h2>DVS Planning</h2><p>Applicazione collaborativa per la gestione del Planning di Digital Video Service.</p><div class="settings-info-meta"><div><span>Versione</span><strong>v26</strong></div><div><span>Ideazione e sviluppo</span><strong>Marco D'Agostino per Digital Video Service</strong></div><div><span>Sincronizzazione</span><strong>Supabase Realtime</strong></div></div><p class="settings-info-copyright"><strong>Copyright © 2026 Marco D'Agostino per Digital Video Service</strong><br>Tutti i diritti riservati.</p>` }
  };
  const selected = sections[section];
  if (!selected) return;
  if (title) title.textContent = selected.title;
  if (subtitle) subtitle.textContent = selected.subtitle;
  if (content) content.innerHTML = selected.html;
  if (section === "backup") renderBackupSettings();
  if (section === "print") bindPrintSettings();
}));

function openPlanningToday() {
  const now = new Date();
  const targetMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  currentMonth = targetMonth;
  openView("planning", true);

  requestAnimationFrame(() => {
    const todayCell = planningGrid.querySelector(`[data-date="${localTodayIso()}"]`);
    if (!todayCell) return;
    if (IS_TOUCH_APPLE) {
      const target = todayCell.offsetLeft * planningZoom
        - planningScroller.clientWidth / 2
        + todayCell.offsetWidth * planningZoom / 2;
      planningScroller.scrollLeft = Math.max(0, target);
    } else {
      todayCell.scrollIntoView({ behavior:"smooth", inline:"center", block:"nearest" });
    }
  });
}

function employeeNameById(id) {
  const editor = editors.find(item => item.id === id);
  return editor ? fullEmployeeName(editor) : "CLIENTE";
}

function dashboardRoomOrder(roomId) {
  const room = ROOMS.find(item => item.id === roomId);
  return room?.sortOrder ?? Number.MAX_SAFE_INTEGER;
}

function renderDashboard() {
  const today = localTodayIso();
  const todays = shifts
    .filter(shift => shift.date === today)
    .sort((a, b) => {
      const roomDifference = dashboardRoomOrder(a.room) - dashboardRoomOrder(b.room);
      return roomDifference || String(a.start || "").localeCompare(String(b.start || ""));
    });

  const people = [...new Set(todays.filter(shift => shift.editorId).map(shift => shift.editorId))]
    .sort((a, b) => employeeNameById(a).localeCompare(employeeNameById(b), "it", { sensitivity:"base" }));
  const occupiedPhysicalRooms = new Set(todays.filter(shift => /^sala-\d+$/.test(shift.room)).map(shift => shift.room));

  const greeting = document.getElementById("dashboardGreeting");
  if (greeting) greeting.textContent = `Buongiorno${activeProfile?.name ? `, ${activeProfile.name.split(" ")[0]}` : ""}`;
  const dateLabel = document.getElementById("dashboardDate");
  if (dateLabel) dateLabel.textContent = italianLongDate();

  const shiftCount = document.getElementById("todayShiftCount");
  const peopleCount = document.getElementById("todayPeopleCount");
  const roomCount = document.getElementById("todayRoomCount");
  if (shiftCount) shiftCount.textContent = String(todays.length);
  if (peopleCount) peopleCount.textContent = String(people.length);
  if (roomCount) roomCount.textContent = `${occupiedPhysicalRooms.size}/15`;

  const planningList = document.getElementById("todayPlanningList");
  if (planningList) {
    planningList.innerHTML = todays.length ? todays.map(shift => {
      const room = ROOMS.find(item => item.id === shift.room)?.label || shift.room;
      return `<div class="today-shift-row"><time>${escapeHtml(shift.start)}–${escapeHtml(shift.end)}</time><span class="room">${escapeHtml(room)}</span><strong>${escapeHtml(shift.film || shift.production || "Turno")}</strong><span>${escapeHtml(employeeNameById(shift.editorId))}</span></div>`;
    }).join("") : '<div class="empty-dashboard">Nessun turno programmato per oggi.</div>';
    planningList.scrollTop = 0;
  }

  const roomsList = document.getElementById("todayRoomsList");
  if (roomsList) {
    // Mostra sempre tutte le 15 sale e le 3 postazioni remote.
    // Il semaforo dipende esclusivamente dalla presenza di un turno odierno.
    const dashboardRooms = [...ROOMS].sort((a, b) => a.sortOrder - b.sortOrder);
    const rowsPerColumn = Math.ceil(dashboardRooms.length / 2);
    roomsList.style.setProperty("--dashboard-room-rows", String(rowsPerColumn));
    roomsList.innerHTML = dashboardRooms.map(room => {
      const isBusy = todays.some(shift => shift.room === room.id);
      const label = room.label.replace(/^Remote\s+/i, "Remoto ");
      return `<div class="compact-room"><i class="room-dot ${isBusy ? "busy" : ""}" aria-hidden="true"></i><span>${escapeHtml(label)}</span></div>`;
    }).join("");
    roomsList.scrollTop = 0;
  }

  const employeesList = document.getElementById("todayEmployeesList");
  if (employeesList) {
    employeesList.innerHTML = people.length ? people.map(id => {
      const employeeShifts = todays.filter(shift => shift.editorId === id);
      const roomLabels = [...new Set(employeeShifts.map(shift => {
        const label = ROOMS.find(item => item.id === shift.room)?.label || shift.room || "—";
        return label.replace(/^Remote\s+/i, "Remoto ");
      }))];
      return `<div class="compact-row"><span>${escapeHtml(employeeNameById(id))}</span><span>${escapeHtml(roomLabels.join(", "))}</span></div>`;
    }).join("") : '<div class="empty-dashboard">Nessun dipendente presente oggi.</div>';
    employeesList.scrollTop = 0;
  }

  renderReminders();
}

function renderReminders() {
  const list = document.getElementById("remindersList");
  const count = document.getElementById("remindersCount");
  if (!list || !count) return;
  count.textContent = String(reminders.length);
  list.innerHTML = reminders.length ? reminders.map(item => `<div class="reminder-row"><span>${escapeHtml(item.text)}</span><button class="reminder-delete" type="button" data-reminder-id="${escapeHtml(item.id)}" aria-label="Elimina promemoria">×</button></div>`).join("") : '<div class="empty-dashboard">Nessun promemoria condiviso.</div>';
}

async function syncReminderToSupabase(reminder) {
  if (!db) return;
  const { error } = await db.from("reminders").upsert({ id:reminder.id, text:reminder.text, created_by:activeProfile?.name || null, created_at:reminder.createdAt });
  if (error) showToast(`Promemoria: ${error.message}`);
}
async function deleteReminderFromSupabase(id) {
  if (!db) return;
  const { error } = await db.from("reminders").delete().eq("id", id);
  if (error) showToast(`Promemoria: ${error.message}`);
}
async function loadRemindersFromSupabase() {
  if (!db) return;
  const { data, error } = await db.from("reminders").select("*").order("created_at", { ascending:false });
  if (error) { console.warn("Tabella reminders non ancora configurata:", error.message); return; }
  reminders = (data || []).map(row => ({ id:String(row.id), text:row.text, createdAt:row.created_at }));
  localStorage.setItem(REMINDER_STORAGE, JSON.stringify(reminders));
  renderReminders();
}

document.getElementById("todayShiftsCard")?.addEventListener("click", openPlanningToday);
document.getElementById("openTodayPlanning")?.addEventListener("click", openPlanningToday);
document.getElementById("reminderForm")?.addEventListener("submit", async event => {
  event.preventDefault();
  const input = document.getElementById("reminderInput");
  const text = input.value.trim();
  if (!text) return;
  const reminder = { id: crypto.randomUUID(), text, createdAt:new Date().toISOString() };
  reminders.unshift(reminder);
  localStorage.setItem(REMINDER_STORAGE, JSON.stringify(reminders));
  input.value = "";
  renderReminders();
  await syncReminderToSupabase(reminder);
});
document.getElementById("remindersList")?.addEventListener("click", async event => {
  const button = event.target.closest(".reminder-delete");
  if (!button) return;
  const id = button.dataset.reminderId;
  reminders = reminders.filter(item => item.id !== id);
  localStorage.setItem(REMINDER_STORAGE, JSON.stringify(reminders));
  renderReminders();
  await deleteReminderFromSupabase(id);
});

document.querySelectorAll(".nav-item[data-view]").forEach(button => {
  button.addEventListener("click", () => openView(button.dataset.view));
});

document.querySelectorAll(".iphone-nav-item[data-view]").forEach(button => {
  button.addEventListener("click", () => openView(button.dataset.view));
});
bindIPhoneDraggableNavigation();
document.getElementById("iphoneBackupStatus")?.addEventListener("click", () => { openView("settings"); document.querySelector('[data-settings-section="backup"]')?.click(); });
document.getElementById("iphoneOnlineUsers")?.addEventListener("click", () => openView("connected"));
document.getElementById("iphoneLogoutProfile")?.addEventListener("click", logoutProfile);


document.getElementById("connectedUsersCard")?.addEventListener("click", () => openView("connected"));
document.getElementById("newProfileBtn")?.addEventListener("click", () => openProfileDialog());
document.getElementById("registeredProfilesList")?.addEventListener("click", event => {
  const row = event.target.closest("[data-profile-edit]"); if (row) openProfileDialog(row.dataset.profileEdit);
});
document.getElementById("closeProfileDialog")?.addEventListener("click", closeProfileDialog);
document.getElementById("cancelProfileBtn")?.addEventListener("click", closeProfileDialog);
document.getElementById("profileForm")?.addEventListener("submit", async event => {
  event.preventDefault();
  const firstName = document.getElementById("profileFirstName").value.trim();
  const lastName = document.getElementById("profileLastName").value.trim();
  const initialsInput = document.getElementById("profileInitials").value.trim().toUpperCase();
  const profile = { id: editingProfileId || crypto.randomUUID(), firstName, lastName, name:`${firstName} ${lastName}`.trim(), initials:initialsInput || `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase(), tone:document.getElementById("profileTone").value, active:document.getElementById("profileActive").checked };
  const existingIndex = profiles.findIndex(p => p.id === profile.id);
  if (existingIndex >= 0) profiles[existingIndex] = profile; else profiles.push(profile);
  renderProfiles(); renderRegisteredProfiles(); closeProfileDialog();
  if (db) await saveProfileToSupabase(profile);
});
document.getElementById("deleteProfileBtn")?.addEventListener("click", async () => {
  if (!editingProfileId) return;
  if (activeProfile?.id === editingProfileId) { showToast("Non puoi eliminare il profilo attualmente connesso."); return; }
  if (!confirm("Eliminare definitivamente questo profilo?")) return;
  const id = editingProfileId;
  if (db && !(await deleteProfileFromSupabase(id))) return;
  profiles = profiles.filter(p => p.id !== id); renderProfiles(); renderRegisteredProfiles(); closeProfileDialog();
});

async function syncShiftSuggestions(shift) {
  if (!db) return;
  const operations = [];
  if (shift.production) operations.push(db.from("production_suggestions").insert({ name: shift.production }));
  if (shift.film) operations.push(db.from("program_suggestions").insert({ name: shift.film }));
  const results = await Promise.all(operations);
  const failed = results.find(result => result.error && result.error.code !== "23505");
  if (failed?.error) console.warn("Suggerimenti non sincronizzati:", failed.error.message);
}

async function syncShiftToSupabase(shift) {
  if (!db) return;
  const row = {
    id: shift.id,
    room_code: shift.room,
    shift_date: shift.date,
    production: shift.production,
    film: shift.film,
    program_title: shift.film,
    start_time: shift.start === "24:00" ? "00:00" : shift.start,
    end_time: shift.end === "24:00" ? "00:00" : shift.end,
    end_is_24: shift.end === "24:00",
    work_type: shift.workType,
    staff_id: shift.editorId,
    is_client: Boolean(shift.isClient),
    is_double_station: Boolean(shift.isDoubleStation),
    is_variable: Boolean(shift.isVariable),
    notes: shift.notes || null,
    status: shift.status,
    confirmed: Boolean(shift.confirmed),
    confirmed_at: shift.confirmed ? (shift.confirmedAt || new Date().toISOString()) : null,
    color_key: shift.color
  };
  const { error } = await db.from("shifts").upsert(row);
  if (error) showToast(`Supabase: ${error.message}`);
  else syncShiftSuggestions(shift);
}

async function deleteShiftFromSupabase(id) {
  if (!db) return;
  const { error } = await db.from("shifts").delete().eq("id", id);
  if (error) showToast(`Supabase: ${error.message}`);
}

async function syncEditorToSupabase(editor) {
  if (!db) return false;
  const row = {
    id: editor.id,
    first_name: editor.firstName,
    last_name: editor.lastName,
    role: editor.role || "Altro",
    phone: editor.phone || null,
    email: editor.email || null,
    notes: editor.notes || null
  };
  const { error } = await db.from("staff").upsert(row);
  if (error) { showToast(`Supabase: ${error.message}`); return false; }
  return true;
}

async function deleteEditorFromSupabase(id) {
  if (!db) return true;
  const { error } = await db.from("staff").delete().eq("id", id);
  if (error) { showToast(`Supabase: ${error.message}`); return false; }
  return true;
}

async function fetchAllSupabaseRows(table, configureQuery, pageSize = 1000) {
  const rows = [];
  let from = 0;

  while (true) {
    let query = db.from(table).select("*");
    query = configureQuery ? configureQuery(query) : query;

    const { data, error } = await query.range(from, from + pageSize - 1);
    if (error) return { data: null, error };

    const page = data || [];
    rows.push(...page);

    if (page.length < pageSize) break;
    from += pageSize;
  }

  return { data: rows, error: null };
}

async function loadSupabaseData() {
  if (!db) return;

  const [staffResult, shiftsResult] = await Promise.all([
    fetchAllSupabaseRows("staff", query => query.order("first_name").order("last_name").order("id")),
    fetchAllSupabaseRows("shifts", query => query.order("shift_date").order("start_time").order("room_code").order("id"))
  ]);

  if (staffResult.error) {
    console.error("Errore caricamento staff:", staffResult.error);
    showToast(`Supabase staff: ${staffResult.error.message}`);
    return;
  }

  if (shiftsResult.error) {
    console.error("Errore caricamento turni:", shiftsResult.error);
    showToast(`Supabase turni: ${shiftsResult.error.message}`);
    return;
  }

  editors = (staffResult.data || []).map(row => ({
    id: String(row.id),
    firstName: row.first_name,
    lastName: row.last_name,
    role: row.role || "Altro",
    phone: row.phone || "",
    email: row.email || "",
    notes: row.notes || ""
  }));

  shifts = (shiftsResult.data || []).map(row => ({
    id: String(row.id),
    room: row.room_code,
    date: row.shift_date,
    production: row.production || "",
    film: row.program_title || row.film || "",
    start: String(row.start_time || "").slice(0, 5),
    end: row.end_is_24 ? "24:00" : String(row.end_time || "").slice(0, 5),
    workType: row.work_type,
    editorId: row.staff_id ? String(row.staff_id) : null,
    isClient: Boolean(row.is_client),
    isDoubleStation: Boolean(row.is_double_station),
    isVariable: Boolean(row.is_variable),
    notes: String(row.notes || "").slice(0, 100),
    status: row.status,
    color: row.color_key,
    confirmed: Boolean(row.confirmed),
    confirmedAt: row.confirmed_at || null
  }));

  saveLocal();
  renderEditors();
  renderPlanning();
  renderDashboard();
  renderSummaries();
}

let realtimeDataRefreshTimer = null;
function scheduleRealtimeDataRefresh() {
  clearTimeout(realtimeDataRefreshTimer);
  realtimeDataRefreshTimer = setTimeout(() => {
    loadSupabaseData();
  }, 140);
}

function enableRealtime() {
  if (!db) return;

  db.channel("dvs-planning-realtime")
    .on("postgres_changes", { event: "*", schema: "public", table: "staff" }, scheduleRealtimeDataRefresh)
    .on("postgres_changes", { event: "*", schema: "public", table: "shifts" }, scheduleRealtimeDataRefresh)
    .on("postgres_changes", { event: "*", schema: "public", table: "reminders" }, loadRemindersFromSupabase)
    .on("postgres_changes", { event: "*", schema: "public", table: "planning_profiles" }, loadProfilesFromSupabase)
    .on("postgres_changes", { event: "*", schema: "public", table: "profile_presence" }, loadOnlineProfiles)
    .on("postgres_changes", { event: "*", schema: "public", table: "backup_agent_status" }, loadBackupStatus)
    .subscribe();
}



// Build 16.2 — Mesi dinamici — Centro Stampa; Build 15 invariata nelle altre sezioni.
let backupAgentStatus = null;
let backupStatusTimer = null;

function formatBackupDate(value) {
  if (!value) return "Nessun backup registrato";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data non disponibile";
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  const time = new Intl.DateTimeFormat("it-IT", { hour:"2-digit", minute:"2-digit" }).format(date);
  if (sameDay) return `Ultimo backup: oggi, ${time}`;
  const day = new Intl.DateTimeFormat("it-IT", { day:"2-digit", month:"2-digit", year:"numeric" }).format(date);
  return `Ultimo backup: ${day}, ${time}`;
}

function backupReason(status) {
  if (!status) return "Backup Agent non ancora registrato";
  if (status.authorized === false) return "Autorizzazione revocata";
  if (isSharedBackupHealthy(status)) return "Backup aggiornato e valido";
  if (status.last_status === "error") return status.last_error || "Ultimo backup non riuscito";
  if (!status.last_success_at) return "Nessun backup completato";
  return "Ultimo backup più vecchio di 24 ore";
}

function isSharedBackupHealthy(status) {
  if (!status || status.authorized === false || !status.last_success_at) return false;
  if (status.healthy !== true || status.last_status !== "success" || status.last_error) return false;
  const lastSuccess = new Date(status.last_success_at).getTime();
  if (!Number.isFinite(lastSuccess)) return false;
  const age = Date.now() - lastSuccess;
  return age >= 0 && age <= 24 * 60 * 60 * 1000;
}

function updateBackupSidebar() {
  const light = document.getElementById("backupSidebarLight");
  const date = document.getElementById("backupSidebarDate");
  const healthy = isSharedBackupHealthy(backupAgentStatus);
  light?.classList.toggle("is-green", healthy);
  light?.classList.toggle("is-red", !healthy);
  if (date) date.textContent = formatBackupDate(backupAgentStatus?.last_success_at);
  updateIPhoneBackupLight();
}

function backupSettingsHtml() {
  return `
    <div class="backup-page-header">
      <div><small>PROTEZIONE DATI</small><h2>Backup Agent</h2><p>Il semaforo indica se l’ultimo backup automatico è affidabile.</p></div>
      <span id="backupPageBadge" class="backup-health-badge is-red"><i></i><b>Da verificare</b></span>
    </div>
    <div class="backup-details-grid">
      <div class="backup-detail"><span>Stato</span><strong id="backupDetailReason">Caricamento…</strong></div>
      <div class="backup-detail"><span>Ultimo backup</span><strong id="backupDetailDate">—</strong></div>
      <div class="backup-detail"><span>Utente autorizzato</span><strong id="backupDetailUser">—</strong></div>
      <div class="backup-detail"><span>Computer autorizzato</span><strong id="backupDetailComputer">—</strong></div>
      <div class="backup-detail"><span>Versione Agent</span><strong id="backupDetailVersion">—</strong></div>
      <div class="backup-detail"><span>Cartella backup</span><strong id="backupDetailFolder">—</strong></div>
    </div>
    <div class="backup-actions">
      <a class="primary-btn backup-download-btn" href="./downloads/DVS_Backup_Agent.pkg" download>Scarica Backup Agent</a>
      <button id="revokeBackupAuthorization" class="danger-outline-btn" type="button">Revoca autorizzazione</button>
    </div>
    <p class="backup-utility-note">Per eseguire “Backup ora”, aprire la cartella o consultare i log usa <strong>DVS Backup Agent Utility</strong> nella cartella Applicazioni del Mac autorizzato.</p>`;
}

function renderBackupSettings() {
  const status = backupAgentStatus;
  const healthy = isSharedBackupHealthy(status);
  const badge = document.getElementById("backupPageBadge");
  if (badge) {
    badge.classList.toggle("is-green", healthy);
    badge.classList.toggle("is-red", !healthy);
    const text = badge.querySelector("b");
    if (text) text.textContent = healthy ? "Backup protetto" : "Attenzione";
  }
  const set = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value || "—"; };
  set("backupDetailReason", backupReason(status));
  set("backupDetailDate", status?.last_success_at ? formatBackupDate(status.last_success_at).replace("Ultimo backup: ", "") : "Mai eseguito");
  set("backupDetailUser", status?.authorized_user_name || "Non assegnato");
  set("backupDetailComputer", status?.computer_name || "Non registrato");
  set("backupDetailVersion", status?.agent_version || "Non rilevata");
  set("backupDetailFolder", status?.backup_folder || "Non comunicata");
  const revoke = document.getElementById("revokeBackupAuthorization");
  if (revoke) {
    const isAuthorized = Boolean(status?.authorized);
    revoke.disabled = false;
    revoke.classList.toggle("danger-outline-btn", isAuthorized);
    revoke.classList.toggle("primary-btn", !isAuthorized);
    revoke.textContent = isAuthorized ? "Revoca autorizzazione" : "Autorizza nuovo computer";
    revoke.onclick = isAuthorized ? revokeBackupAuthorization : authorizeNewBackupComputer;
  }
}

async function loadBackupStatus() {
  if (!db) { backupAgentStatus = null; updateBackupSidebar(); renderBackupSettings(); return; }
  const { data, error } = await db.from("backup_agent_status").select("*").eq("id", "primary").maybeSingle();
  if (error) {
    console.warn("Stato Backup Agent non disponibile:", error.message);
    backupAgentStatus = null;
  } else backupAgentStatus = data || null;
  updateBackupSidebar();
  renderBackupSettings();
}

async function revokeBackupAuthorization() {
  if (!db || !backupAgentStatus?.authorized) return;
  const userName = activeProfile?.name || "Profilo sconosciuto";
  const confirmed = window.confirm(`Revocare l’autorizzazione al backup per “${backupAgentStatus.computer_name || "questo computer"}”? I backup già creati non verranno eliminati.`);
  if (!confirmed) return;
  const { error } = await db.from("backup_agent_status").update({
    authorized:false,
    healthy:false,
    last_status:"revoked",
    last_error:"Autorizzazione revocata dal Planning",
    revoked_at:new Date().toISOString(),
    revoked_by_profile_id:activeProfile?.id || null,
    revoked_by_name:userName,
    updated_at:new Date().toISOString()
  }).eq("id", "primary");
  if (error) { showToast(`Revoca non riuscita: ${error.message}`); return; }
  showToast("Autorizzazione del computer revocata.");
  await loadBackupStatus();
}

async function authorizeNewBackupComputer() {
  if (!db) return showToast("Connessione al database non disponibile");
  const userName = activeProfile?.name || "Profilo sconosciuto";
  const confirmed = window.confirm(`Autorizzare un nuovo computer per il backup come “${userName}”? Il primo Mac che eseguirà “Backup ora” verrà registrato.`);
  if (!confirmed) return;
  const payload = {
    id:"primary",
    authorized:true,
    authorized_user_profile_id:activeProfile?.id || null,
    authorized_user_name:userName,
    computer_id:null,
    computer_name:null,
    healthy:false,
    last_status:"awaiting_registration",
    last_error:null,
    revoked_at:null,
    revoked_by_profile_id:null,
    revoked_by_name:null,
    updated_at:new Date().toISOString()
  };
  const { error } = await db.from("backup_agent_status").upsert(payload, { onConflict:"id" });
  if (error) { showToast(`Autorizzazione non riuscita: ${error.message}`); return; }
  showToast("Autorizzazione aperta. Premi “Backup ora” sul nuovo Mac.");
  await loadBackupStatus();
}

document.getElementById("backupStatusCard")?.addEventListener("click", () => {
  openView("settings");
  const button = document.querySelector('[data-settings-section="backup"]');
  button?.click();
});

loadProfilesFromSupabase().then(() => { initializeProfileGate(); if (activeProfile) { setCurrentProfileOnline(); startPresenceTracking(); } });
populateShiftSelects();
if (IS_TOUCH_APPLE && !localStorage.getItem("dvs-planning-touch-zoom-initialized")) {
  zoomSelect.value = "fit";
} else {
  zoomSelect.value = String(nearestZoomOption(planningZoom));
}
applyPlanningZoom(false);
renderPlanning();
updateIPhoneChrome("dashboard");
if (IS_TOUCH_APPLE && !localStorage.getItem("dvs-planning-touch-zoom-initialized")) {
  requestAnimationFrame(() => {
    fitPlanningToWindow();
    localStorage.setItem("dvs-planning-touch-zoom-initialized", "1");
  });
}
renderEditors();
renderDashboard();
renderSummaries();
loadRemindersFromSupabase();
loadSupabaseData();
loadOnlineProfiles();
loadBackupStatus();
backupStatusTimer = setInterval(loadBackupStatus, 60000);
enableRealtime();

const STORAGE_KEY = "nothub-progress";

function loadProgress() {
    const fallback = { readNotes: [], lastNoteId: null, activityDays: [] };

    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return { ...fallback, ...saved };
    } catch (error) {
        return fallback;
    }
}

function saveProgress(progress) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (error) {
        console.error("Could not save progress.", error);
    }
}

function notifyProgress() {
    document.dispatchEvent(new CustomEvent("progresschange"));
}

function dateKey(date) {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${date.getFullYear()}-${month}-${day}`;
}

function recordActivity(progress) {
    const today = dateKey(new Date());
    if (!progress.activityDays.includes(today)) {
        progress.activityDays.push(today);
    }
}

function isNoteRead(id) {
    return loadProgress().readNotes.includes(id);
}

function setLastNote(id) {
    const progress = loadProgress();
    progress.lastNoteId = id;
    recordActivity(progress);
    saveProgress(progress);
    notifyProgress();
}

function toggleNoteRead(id) {
    const progress = loadProgress();

    if (progress.readNotes.includes(id)) {
        progress.readNotes = progress.readNotes.filter((noteId) => noteId !== id);
    } else {
        progress.readNotes.push(id);
        recordActivity(progress);
    }

    saveProgress(progress);
    notifyProgress();
}

function getStreak() {
    const days = new Set(loadProgress().activityDays);
    const cursor = new Date();
    let streak = 0;

    // If you haven't studied yet today, the streak can still continue from yesterday
    if (!days.has(dateKey(cursor))) {
        cursor.setDate(cursor.getDate() - 1);
    }

    while (days.has(dateKey(cursor))) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
    }

    return streak;
}
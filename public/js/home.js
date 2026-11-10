const homeView = document.getElementById("view-home");
const homeDate = document.getElementById("home-date");
const homeGreeting = document.getElementById("home-greeting");
const homeTagline = document.getElementById("home-tagline");
const heroButton = document.getElementById("home-hero-button");
const homeStats = document.getElementById("home-stats");
const homeContinue = document.getElementById("home-continue");
const homeSubjects = document.getElementById("home-subjects");

// Small helper to create an element with a class and text
function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

function renderHeader(progress) {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    const streak = getStreak();

    homeGreeting.textContent = greeting;
    homeDate.textContent = new Date().toLocaleDateString(undefined, {
        weekday: "long",
        day: "numeric",
        month: "long"
    });

    homeTagline.textContent =
        streak > 0
            ? `You're on a ${streak}-day streak. Keep it going!`
            : "Open a note today to start your streak.";

    // The button resumes your last note, or starts the first one
    const note = notes.find((n) => n.id === progress.lastNoteId);

    delete heroButton.dataset.noteId;
    delete heroButton.dataset.goto;

    if (note) {
        heroButton.dataset.noteId = note.id;
        heroButton.textContent = "Continue learning →";
    } else {
        heroButton.dataset.goto = "notes";
        heroButton.textContent = "Start learning →";
    }
}

function renderStats(progress) {
    const readCount = notes.filter((note) => progress.readNotes.includes(note.id)).length;
    const streak = getStreak();

    const stats = [
        { label: "Notes read", value: `${readCount}/${notes.length}` },
        { label: "DPP solved", value: "0", hint: "Coming soon" },
        { label: "Puzzles solved", value: "0", hint: "Coming soon" },
        { label: "Day streak", value: String(streak), hint: streak === 1 ? "day" : "days" }
    ];

    homeStats.innerHTML = "";

    stats.forEach((stat) => {
        const card = el("div", "stat");
        card.append(el("span", "stat-label", stat.label), el("strong", "stat-value", stat.value));
        if (stat.hint) card.append(el("span", "stat-hint", stat.hint));
        homeStats.append(card);
    });
}

function renderContinue(progress) {
    const note = notes.find((n) => n.id === progress.lastNoteId);

    homeContinue.innerHTML = "";

    const card = el("button", "card card-highlight");
    card.type = "button";

    if (note) {
        card.dataset.noteId = note.id;
        card.append(el("strong", "", note.title), el("span", "", `${note.subject} · Tap to resume`));
    } else {
        card.dataset.goto = "notes";
        card.append(el("strong", "", "Start your first note"), el("span", "", "You haven't opened a note yet"));
    }

    homeContinue.append(card);
}

function renderSubjects(progress) {
    const subjects = [...new Set(notes.map((note) => note.subject))];

    homeSubjects.innerHTML = "";

    subjects.forEach((subject) => {
        const subjectNotes = notes.filter((note) => note.subject === subject);
        const done = subjectNotes.filter((note) => progress.readNotes.includes(note.id)).length;
        const percent = Math.round((done / subjectNotes.length) * 100);

        const item = el("li");
        const row = el("div", "subject-row");
        row.append(el("span", "", subject), el("span", "", `${done}/${subjectNotes.length} read`));

        const bar = el("div", "bar");
        bar.setAttribute("role", "progressbar");
        bar.setAttribute("aria-label", `${subject} progress`);
        bar.setAttribute("aria-valuemin", "0");
        bar.setAttribute("aria-valuemax", "100");
        bar.setAttribute("aria-valuenow", String(percent));

        const fill = el("div", "bar-fill");
        fill.style.width = `${percent}%`;
        bar.append(fill);

        item.append(row, bar);
        homeSubjects.append(item);
    });
}

function renderHome() {
    const progress = loadProgress();
    renderHeader(progress);
    renderStats(progress);
    renderContinue(progress);
    renderSubjects(progress);
}

// One click handler for every button on Home
homeView.addEventListener("click", (event) => {
    const noteButton = event.target.closest("[data-note-id]");
    if (noteButton) {
        openNote(noteButton.dataset.noteId);
        return;
    }

    const gotoButton = event.target.closest("[data-goto]");
    if (gotoButton) {
        showViewByName(gotoButton.dataset.goto);
    }
});

document.addEventListener("progresschange", renderHome);
document.addEventListener("viewchange", (event) => {
    if (event.detail === "home") renderHome();
});

renderHome();
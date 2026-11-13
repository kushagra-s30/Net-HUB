/* ==========================================================
   NotHub - notes.js
   Notes page flow:
     1. Class tiles      (Class 9th, 10th, 11th, 12th)
     2. Subject tiles    (Maths, Physics, Chemistry, Biology)
     3. List of notes    (for that class + subject)
     4. The note opens as a PDF you upload

   To add a note:
     a) Put the PDF in the public/pdfs folder, for example
        public/pdfs/class-11/maths/limits-basics.pdf
     b) Copy one item in the "notes" list below, then set
        "id" (unique), "grade" ("9", "10", "11" or "12"),
        "subject" (a name from SUBJECT_LIST), "title", and
        "file" (the PDF path inside public, without "public/").
   To add or remove a subject tile, edit SUBJECT_LIST.
   ========================================================== */

const GRADES = ["9", "10", "11", "12"];
const SUBJECT_LIST = ["Maths", "Physics", "Chemistry", "Biology"];

const notes = [
    {
        id: "intro-programming",
        grade: "11",
        subject: "Programming",
        title: "Introduction to Programming",
        file: "pdfs/class-11/programming/intro-programming.pdf"
    },
    {
        id: "Mat",
        grade: "11",
        subject: "Programming",
        title: "Variables and Data Types",
        file: "pdfs/class-11/programming/variables-and-data-types.pdf"
    },
    {
        id: "limits-basics",
        grade: "11",
        subject: "Maths",
        title: "Limits: The Basics",
        file: "pdfs/class-11/maths/limits-basics.pdf"
    }
];

const notesList = document.getElementById("notes-list");
const subjectFilter = document.getElementById("subject-filter");
const notesListView = document.getElementById("notes-list-view");
const noteDetail = document.getElementById("note-detail");
const noteTitle = document.getElementById("note-title");
const noteSubject = document.getElementById("note-subject");
const noteContent = document.getElementById("note-content");
const noteBack = document.getElementById("note-back");
const noteRead = document.getElementById("note-read");
const notesIntro = notesListView.querySelector("p");

let currentNoteId = null;
let level = "grades";        // "grades" | "subjects" | "list"
let selectedGrade = null;
let selectedSubject = null;

// The old subject filter bar is not used any more
if (subjectFilter) subjectFilter.hidden = true;

/* ---------- helpers ---------- */

function gradeLabel(grade) {
    return "Class " + grade + "th";
}

function notesFor(grade, subject) {
    return notes.filter((n) => n.grade === grade && n.subject === subject);
}

function notesInGrade(grade) {
    return notes.filter((n) => n.grade === grade && SUBJECT_LIST.includes(n.subject));
}

function countText(count) {
    if (count === 0) return "No notes yet";
    return count === 1 ? "1 note" : count + " notes";
}

/* ---------- back bar (shown on levels 2 and 3) ---------- */

const notesNav = document.createElement("div");
notesNav.className = "notes-nav";

const levelBack = document.createElement("button");
levelBack.type = "button";
levelBack.className = "back-button";

const crumb = document.createElement("span");
crumb.className = "notes-crumb";

notesNav.append(levelBack, crumb);
notesList.before(notesNav);

/* ---------- rendering ---------- */

function makeTile(title, meta, dataName, dataValue) {
    const item = document.createElement("li");
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "card tile";
    tile.dataset[dataName] = dataValue;

    const name = document.createElement("strong");
    name.textContent = title;

    const info = document.createElement("span");
    info.textContent = meta;

    tile.append(name, info);
    item.append(tile);
    return item;
}

function makeNoteCard(note) {
    const item = document.createElement("li");
    const card = document.createElement("button");
    card.type = "button";
    card.className = "card";
    card.dataset.noteId = note.id;

    const title = document.createElement("strong");
    title.textContent = note.title;

    card.append(title);
    item.append(card);
    return item;
}

function renderLevel(focusFirst) {
    notesList.innerHTML = "";
    notesNav.hidden = level === "grades";
    notesList.classList.toggle("tile-list", level !== "list");
    notesList.classList.toggle("note-rows", level === "list");

    if (level === "grades") {
        if (notesIntro) notesIntro.textContent = "Pick your class.";
        GRADES.forEach((grade) => {
            notesList.append(
                makeTile(gradeLabel(grade), countText(notesInGrade(grade).length), "grade", grade)
            );
        });
    } else if (level === "subjects") {
        if (notesIntro) notesIntro.textContent = "Pick a subject.";
        levelBack.textContent = "← All classes";
        crumb.textContent = gradeLabel(selectedGrade);
        SUBJECT_LIST.forEach((subject) => {
            notesList.append(
                makeTile(subject, countText(notesFor(selectedGrade, subject).length), "subject", subject)
            );
        });
    } else {
        if (notesIntro) notesIntro.textContent = "Pick a note to read.";
        levelBack.textContent = "← All subjects";
        crumb.textContent = gradeLabel(selectedGrade) + " · " + selectedSubject;

        const visible = notesFor(selectedGrade, selectedSubject);
        if (visible.length === 0) {
            const empty = document.createElement("li");
            empty.className = "notes-empty";
            empty.textContent = "No notes for " + selectedSubject + " in " + gradeLabel(selectedGrade) + " yet. Check back soon.";
            notesList.append(empty);
        } else {
            visible.forEach((note) => notesList.append(makeNoteCard(note)));
        }
    }

    if (focusFirst) {
        const first = notesList.querySelector("button");
        (first || levelBack).focus();
    }
}

/* ---------- single note ---------- */

function pdfUrl(file) {
    if (/^(https?:)?\/\//.test(file) || file.startsWith("/")) return file;
    return "/" + file;
}

function makeMessage(text) {
    const message = document.createElement("p");
    message.className = "pdf-message";
    message.textContent = text;
    return message;
}

async function renderPdf(container, note) {
    container.innerHTML = "";

    if (!note.file) {
        container.append(makeMessage("This note has no PDF yet."));
        return;
    }

    const url = encodeURI(pdfUrl(note.file));
    container.append(makeMessage("Loading PDF..."));

    // Is the file really there? (a missing file would show an error page)
    let exists = false;
    try {
        const res = await fetch(url, { method: "HEAD" });
        const type = res.headers.get("content-type") || "";
        exists = res.ok && !/text\/html/i.test(type);
    } catch (e) {
        exists = false;
    }

    // The student may have left this note while we were checking
    if (currentNoteId !== note.id) return;

    container.innerHTML = "";

    if (!exists) {
        container.append(makeMessage("This PDF isn't available yet. Check back soon."));
        return;
    }

    const actions = document.createElement("div");
    actions.className = "pdf-actions";

    const openLink = document.createElement("a");
    openLink.className = "back-button";
    openLink.href = url;
    openLink.target = "_blank";
    openLink.rel = "noopener";
    openLink.textContent = "Open in new tab";

    const downloadLink = document.createElement("a");
    downloadLink.className = "back-button";
    downloadLink.href = url;
    downloadLink.download = "";
    downloadLink.textContent = "Download PDF";

    actions.append(openLink, downloadLink);

    const viewer = document.createElement("object");
    viewer.className = "pdf-frame";
    viewer.type = "application/pdf";
    viewer.data = url + "#view=FitH";
    viewer.setAttribute("aria-label", note.title + " (PDF)");

    // Shown only if the browser can't display PDFs inside the page (many phones)
    const fallback = document.createElement("p");
    fallback.className = "pdf-message";
    fallback.textContent = "Your browser can't show this PDF here. Use \"Open in new tab\" or \"Download PDF\" above.";
    viewer.append(fallback);

    container.append(actions, viewer);
}

function showNote(id) {
    const note = notes.find((n) => n.id === id);

    if (!note) {
        console.error(`No note found with id "${id}".`);
        return;
    }

    // "Back to notes" should land on this note's class + subject
    selectedGrade = note.grade;
    selectedSubject = note.subject;
    level = "list";
    renderLevel(false);

    noteTitle.textContent = note.title;
    noteSubject.textContent = `${note.subject} · ${gradeLabel(note.grade)}`;
    renderPdf(noteContent, note);

    notesListView.hidden = true;
    noteDetail.hidden = false;
    noteBack.focus();
    currentNoteId = id;
    if (typeof setLastNote === "function") setLastNote(id);
    updateReadButton();
}

function showNotesList() {
    noteDetail.hidden = true;
    notesListView.hidden = false;
    currentNoteId = null;
}

function resetToClasses() {
    level = "grades";
    selectedGrade = null;
    selectedSubject = null;
    renderLevel(false);
    showNotesList();
}

function updateReadButton() {
    if (!noteRead || !currentNoteId) return;
    const read = typeof isNoteRead === "function" && isNoteRead(currentNoteId);
    noteRead.setAttribute("aria-pressed", String(read));
    noteRead.textContent = read ? "Marked as read" : "Mark as read";
}

function openNote(id) {
    if (typeof showViewByName === "function") showViewByName("notes");
    showNote(id);
}

/* ---------- events ---------- */

// Opening the Notes tab always starts at the class tiles
document.addEventListener("viewchange", (event) => {
    if (event.detail === "notes") {
        resetToClasses();
    }
});

noteBack.addEventListener("click", () => {
    showNotesList();
    const first = notesList.querySelector("button");
    if (first) first.focus();
});

levelBack.addEventListener("click", () => {
    if (level === "list") {
        level = "subjects";
        selectedSubject = null;
    } else {
        level = "grades";
        selectedGrade = null;
    }
    renderLevel(true);
});

// One listener handles clicks on every tile and card
notesList.addEventListener("click", (event) => {
    const noteCard = event.target.closest("[data-note-id]");
    if (noteCard) {
        showNote(noteCard.dataset.noteId);
        return;
    }

    const gradeTile = event.target.closest("[data-grade]");
    if (gradeTile) {
        selectedGrade = gradeTile.dataset.grade;
        level = "subjects";
        renderLevel(true);
        return;
    }

    const subjectTile = event.target.closest("[data-subject]");
    if (subjectTile) {
        selectedSubject = subjectTile.dataset.subject;
        level = "list";
        renderLevel(true);
    }
});

if (noteRead) {
    noteRead.addEventListener("click", () => {
        if (currentNoteId && typeof toggleNoteRead === "function") {
            toggleNoteRead(currentNoteId);
            updateReadButton();
        }
    });
}

renderLevel(false);
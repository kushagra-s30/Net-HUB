const notes = [
    {
        id: "intro-programming",
        title: "Introduction to Programming",
        subject: "Programming",
        content: [
            { type: "heading", text: "What is a program?" },
            { type: "paragraph", text: "A program is a set of instructions that a computer follows, one step at a time." },
            { type: "heading", text: "Why learn it?" },
            { type: "list", items: ["Automate boring work", "Build apps and websites", "Solve problems logically"] }
        ]
    },
    {
        id: "Mat",
        title: "Variables and Data Types",
        subject: "Programming",
        content: [
            { type: "heading", text: "Variables" },
            { type: "paragraph", text: "A variable is a named place to store a value." },
            { type: "code", text: "let age = 18;\nlet name = \"Asha\";\nconsole.log(name, age);" },
            { type: "heading", text: "Common data types" },
            { type: "list", items: ["Number", "String (text)", "Boolean (true or false)"] }
        ]
    },
    {
        id: "limits-basics",
        title: "Limits: The Basics",
        subject: "Maths",
        content: [
            { type: "heading", text: "Idea of a limit" },
            { type: "paragraph", text: "A limit describes the value a function approaches as the input gets closer to a point." }
        ]
    }
];

const notesList = document.getElementById("notes-list");

function renderNotesList() {
    notesList.innerHTML = "";

    notes.forEach((note) => {
        const item = document.createElement("li");
        const card = document.createElement("button");
        card.className = "card";
        card.dataset.noteId = note.id;

        const title = document.createElement("strong");
        title.textContent = note.title;

        const subject = document.createElement("span");
        subject.textContent = note.subject;

        card.append(title, subject);
        item.append(card);
        notesList.append(item);
    });
}

renderNotesList();
const notesListView = document.getElementById("notes-list-view");
const noteDetail = document.getElementById("note-detail");
const noteTitle = document.getElementById("note-title");
const noteSubject = document.getElementById("note-subject");
const noteContent = document.getElementById("note-content");
const noteBack = document.getElementById("note-back");
const noteRead = document.getElementById("note-read");
let currentNoteId = null;

function showNote(id) {
    const note = notes.find((n) => n.id === id);

    if (!note) {
        console.error(`No note found with id "${id}".`);
        return;
    }

    noteTitle.textContent = note.title;
    noteSubject.textContent = note.subject;
    renderContent(noteContent, note.content);

    notesListView.hidden = true;
    noteDetail.hidden = false;
    noteBack.focus();
    currentNoteId = id;
    if (typeof setLastNote === "function") setLastNote(id);
    updateReadButton();

    function renderContent(container, blocks) {
        container.innerHTML = "";

        blocks.forEach((block) => {
            let element;

            if (block.type === "heading") {
                element = document.createElement("h3");
                element.textContent = block.text;
            } else if (block.type === "paragraph") {
                element = document.createElement("p");
                element.textContent = block.text;
            } else if (block.type === "list") {
                element = document.createElement("ul");
                block.items.forEach((text) => {
                    const li = document.createElement("li");
                    li.textContent = text;
                    element.append(li);
                });
            } else if (block.type === "code") {
                element = document.createElement("pre");
                const code = document.createElement("code");
                code.textContent = block.text;
                element.append(code);
            } else {
                console.error(`Unknown block type "${block.type}".`);
                return;
            }

            container.append(element);
        });
    }
}

function showNotesList() {
    noteDetail.hidden = true;
    notesListView.hidden = false;
    currentNoteId = null;
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

// One listener on the list handles clicks on every card
document.addEventListener("viewchange", (event) => {
    if (event.detail === "notes") {
        showNotesList();
    }
});

noteBack.addEventListener("click", showNotesList);

notesList.addEventListener("click", (event) => {
    const card = event.target.closest("[data-note-id]");
    if (card) showNote(card.dataset.noteId);
});

if (noteRead) {
    noteRead.addEventListener("click", () => {
        if (currentNoteId && typeof toggleNoteRead === "function") {
            toggleNoteRead(currentNoteId);
            updateReadButton();
        }
    });
}
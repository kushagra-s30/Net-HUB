/* ==========================================================
   NotHub - data.js
   All learning content lives here. To add new content,
   copy an existing item, change the text, and save.
   Rules:
   - every "id" must be unique within its list
   - "answer" in a DPP question is the position of the correct
     option, starting from 0 (0 = first option, 1 = second...)
   ========================================================== */

/* ---------- NOTES: subjects -> chapters -> paragraphs ---------- */
const SUBJECTS = [
    {
        id: "physics",
        name: "Physics",
        chapters: [
            {
                id: "newtons-laws",
                title: "Newton's Laws of Motion",
                content: [
                    "First law: an object stays at rest or keeps moving in a straight line at constant speed unless a net force acts on it. This property is called inertia.",
                    "Second law: the net force on an object equals its mass times its acceleration (F = ma). The same force gives a lighter object a bigger acceleration.",
                    "Third law: when object A pushes on object B, B pushes back on A with an equal force in the opposite direction."
                ]
            },
            {
                id: "work-energy",
                title: "Work and Energy",
                content: [
                    "Work is done when a force moves an object in the direction of the force: W = F x d x cos(theta).",
                    "Kinetic energy is the energy of motion: KE = 1/2 x m x v^2.",
                    "Energy cannot be created or destroyed, only changed from one form to another."
                ]
            }
        ]
    },
    {
        id: "maths",
        name: "Maths",
        chapters: [
            {
                id: "quadratic-equations",
                title: "Quadratic Equations",
                content: [
                    "A quadratic equation has the form ax^2 + bx + c = 0, where a is not 0.",
                    "Its roots are given by x = (-b +/- sqrt(b^2 - 4ac)) / 2a.",
                    "The discriminant D = b^2 - 4ac tells you the nature of the roots: D > 0 gives two real roots, D = 0 gives one repeated root, and D < 0 gives no real roots."
                ]
            }
        ]
    }
];

/* ---------- DPP: Daily Practice Problems (multiple choice) ---------- */
const DPPS = [
    {
        id: "dpp-physics-1",
        subjectId: "physics",
        title: "Newton's Laws - DPP 1",
        questions: [
            {
                id: "q1",
                text: "Which law of motion is also called the law of inertia?",
                options: ["First law", "Second law", "Third law", "Law of gravitation"],
                answer: 0,
                explanation: "Newton's first law says an object keeps its state of rest or motion unless a net force acts on it. That resistance to change is inertia."
            },
            {
                id: "q2",
                text: "A force of 20 N acts on a 4 kg object. What is its acceleration?",
                options: ["2 m/s^2", "5 m/s^2", "80 m/s^2", "16 m/s^2"],
                answer: 1,
                explanation: "Use F = ma, so a = F / m = 20 / 4 = 5 m/s^2."
            },
            {
                id: "q3",
                text: "A book rests on a table. Which force pair is an action-reaction pair?",
                options: [
                    "Weight of the book and normal force on the book",
                    "Weight of the book and the pull of the book on the Earth",
                    "Normal force and friction",
                    "Weight of the book and friction"
                ],
                answer: 1,
                explanation: "Action-reaction forces act on different objects. The Earth pulls the book down, and the book pulls the Earth up with an equal force."
            }
        ]
    },
    {
        id: "dpp-maths-1",
        subjectId: "maths",
        title: "Quadratic Equations - DPP 1",
        questions: [
            {
                id: "q1",
                text: "What is the discriminant of x^2 - 5x + 6 = 0?",
                options: ["1", "25", "49", "-1"],
                answer: 0,
                explanation: "D = b^2 - 4ac = 25 - 24 = 1."
            },
            {
                id: "q2",
                text: "What are the roots of x^2 - 5x + 6 = 0?",
                options: ["1 and 6", "2 and 3", "-2 and -3", "-1 and 6"],
                answer: 1,
                explanation: "x^2 - 5x + 6 = (x - 2)(x - 3), so the roots are 2 and 3."
            }
        ]
    }
];

/* ---------- PUZZLES ---------- */
const PUZZLES = [
    {
        id: "memory-physics-units",
        title: "Match the Unit",
        type: "match",
        description: "Match each physical quantity with its SI unit.",
        pairs: [
            { left: "Force", right: "Newton" },
            { left: "Energy", right: "Joule" },
            { left: "Power", right: "Watt" },
            { left: "Pressure", right: "Pascal" }
        ]
    }
];
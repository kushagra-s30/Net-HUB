import os
import re
import sqlite3
from datetime import datetime, timezone

from flask import Flask, g, jsonify, request, session
from werkzeug.security import check_password_hash, generate_password_hash

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "nothub.db")

app = Flask(__name__, static_folder="public", static_url_path="")
app.config.update(
    # Set NOTHUB_SECRET as an environment variable when you deploy.
    SECRET_KEY=os.environ.get("NOTHUB_SECRET", "dev-only-change-me"),
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
)

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


# ---------- Database ----------
def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
    return g.db


@app.teardown_appcontext
def close_db(exc):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    with sqlite3.connect(DB_PATH) as db:
        db.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE COLLATE NOCASE,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )


def public_user(row):
    return {"id": row["id"], "name": row["name"], "email": row["email"]}


def current_user():
    user_id = session.get("user_id")
    if user_id is None:
        return None
    return get_db().execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()


def error(message, status):
    return jsonify({"error": message}), status


# ---------- Pages ----------
@app.get("/")
def home():
    return app.send_static_file("index.html")


# ---------- API ----------
@app.post("/api/register")
def register():
    data = request.get_json(silent=True) or {}
    name = str(data.get("name", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))

    if not 1 <= len(name) <= 50:
        return error("Please enter your name (up to 50 characters).", 400)
    if not EMAIL_RE.match(email) or len(email) > 120:
        return error("Please enter a valid email address.", 400)
    if not 8 <= len(password) <= 128:
        return error("Password must be 8 to 128 characters long.", 400)

    db = get_db()
    try:
        cursor = db.execute(
            "INSERT INTO users (name, email, password_hash, created_at) VALUES (?, ?, ?, ?)",
            (name, email, generate_password_hash(password), datetime.now(timezone.utc).isoformat()),
        )
        db.commit()
    except sqlite3.IntegrityError:
        return error("An account with this email already exists.", 409)

    session.clear()
    session["user_id"] = cursor.lastrowid
    return jsonify({"user": public_user(current_user())}), 201


@app.post("/api/login")
def login():
    data = request.get_json(silent=True) or {}
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))

    row = get_db().execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    if row is None or not check_password_hash(row["password_hash"], password):
        return error("Incorrect email or password.", 401)

    session.clear()
    session["user_id"] = row["id"]
    return jsonify({"user": public_user(row)})


@app.post("/api/logout")
def logout():
    session.clear()
    return jsonify({"ok": True})


@app.get("/api/me")
def me():
    user = current_user()
    return jsonify({"user": public_user(user) if user else None})


init_db()

if __name__ == "__main__":
    app.run(debug=True)
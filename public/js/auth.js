/* ==========================================================
   NotHub - auth.js  (load it on index.html, about.html, help.html)

   What it does
   - Log in pop-up:   Email + Password
   - Sign up pop-up:  First name, Middle name (optional), Last name,
                      Email, Password, Confirm password
   - Log out button, and a greeting with the user's first name
   - Remembers the login after a page refresh (the server keeps
     a session cookie, we just ask GET /api/me on load)

   Flask API used:
     GET  /api/me         -> who is logged in?
     POST /api/register   -> { name, email, password }
     POST /api/login      -> { email, password }
     POST /api/logout

   Your topbar elements are found by id (or by data attribute):
     #login-btn   or [data-auth="login"]     opens Log in
     #signup-btn  or [data-auth="signup"]    opens Sign up
     #logout-btn  or [data-auth="logout"]    logs out
     #auth-buttons (or [data-auth-show="out"])  shown only when logged OUT
     #auth-user    (or [data-auth-show="in"])   shown only when logged IN
     #auth-name    (or [data-auth-name])        gets the user's first name

   Other scripts can react to changes:
     document.addEventListener("authchange", (e) => console.log(e.detail));
   (e.detail is the user object after login, or null after logout)
   ========================================================== */
(function () {
    // Styles live inside this file, so the pop-up looks right even without auth.css
    const AUTH_CSS = `
/* NotHub - login / sign-up pop-up and topbar buttons */

.auth-backdrop {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 9999;
    display: none;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    padding: 16px;
    background: rgba(0, 0, 0, 0.5);
    -webkit-backdrop-filter: blur(3px);
    backdrop-filter: blur(3px);
}

.auth-backdrop.is-open {
    display: flex;
}

.auth-modal {
    --auth-accent: var(--accent, #3b6cf0);
    position: relative;
    box-sizing: border-box;
    width: min(420px, 100%);
    max-height: 92vh;
    overflow-y: auto;
    padding: 28px 24px 22px;
    border-radius: 16px;
    background: #fff;
    color: #16181d;
    font-family: inherit;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35);
    animation: auth-pop 0.18s ease-out;
}

@keyframes auth-pop {
    from { opacity: 0; transform: translateY(10px) scale(0.97); }
    to { opacity: 1; transform: none; }
}

@media (prefers-reduced-motion: reduce) {
    .auth-modal { animation: none; }
}

html[data-theme="dark"] .auth-modal {
    background: #1b1d24;
    color: #eceef2;
}

.auth-modal h2 {
    margin: 0 0 16px;
    font-size: 1.25rem;
}

.auth-form {
    display: grid;
    gap: 14px;
    margin: 0;
}

.auth-form label {
    display: grid;
    gap: 6px;
    font-size: 0.9rem;
}

.auth-form [hidden] {
    display: none;
}

.auth-form input {
    box-sizing: border-box;
    width: 100%;
    font: inherit;
    padding: 10px 12px;
    color: inherit;
    background: transparent;
    border: 1px solid rgba(128, 128, 128, 0.5);
    border-radius: 10px;
}

.auth-error {
    margin: 0;
    font-size: 0.875rem;
    color: #d93025;
}

.auth-error[hidden] {
    display: none;
}

html[data-theme="dark"] .auth-error {
    color: #ff8a80;
}

.auth-submit,
.auth-btn {
    --auth-accent: var(--accent, #3b6cf0);
    font: inherit;
    font-weight: 600;
    color: #fff;
    background: var(--auth-accent);
    border: 0;
    border-radius: 10px;
    padding: 8px 16px;
    cursor: pointer;
}

.auth-submit {
    padding: 11px 16px;
}

.auth-submit:hover,
.auth-btn:hover {
    filter: brightness(1.08);
}

.auth-submit:disabled {
    opacity: 0.6;
    cursor: wait;
}

.auth-switch {
    margin: 16px 0 0;
    font-size: 0.9rem;
    text-align: center;
}

/* "Create an account" / "Log in" switch: plain text link, no box, no matter what your global button styles are */
.auth-modal .auth-switch .auth-link {
    display: inline !important;
    width: auto !important;
    height: auto !important;
    min-width: 0 !important;
    min-height: 0 !important;
    margin: 0 0 0 4px !important;
    padding: 0 !important;
    background: none !important;
    border: 0 !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    -webkit-backdrop-filter: none !important;
    backdrop-filter: none !important;
    font: inherit;
    font-weight: 600;
    text-transform: none !important;
    letter-spacing: normal !important;
    color: var(--accent, #3b6cf0);
    cursor: pointer;
}

.auth-modal .auth-switch .auth-link::before,
.auth-modal .auth-switch .auth-link::after {
    content: none !important;
}

.auth-modal .auth-switch .auth-link:hover {
    text-decoration: underline;
}

.auth-modal .auth-switch .auth-link:focus-visible {
    outline: 2px solid var(--accent, #3b6cf0);
    outline-offset: 2px;
}

.auth-close {
    position: absolute;
    top: 10px;
    right: 12px;
    font-size: 1rem;
    color: inherit;
    background: none;
    border: 0;
    cursor: pointer;
    opacity: 0.7;
}

.auth-submit:focus-visible,
.auth-btn:focus-visible,
.auth-close:focus-visible,
.auth-form input:focus-visible {
    outline: 2px solid var(--accent, #3b6cf0);
    outline-offset: 2px;
}

/* ---------- optional topbar helpers (used by the snippet / fallback button) ---------- */

.auth-box,
.auth-actions {
    display: flex;
    align-items: center;
    gap: 10px;
}

.auth-actions {
    margin-left: auto; /* pushes the group to the right of a flex topbar */
}

.auth-floating {
    position: fixed;
    top: 14px;
    right: 68px;
    z-index: 40;
}

.auth-hello {
    font-size: 0.9rem;
    max-width: 140px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.auth-btn-ghost {
    font: inherit;
    font-weight: 600;
    color: inherit;
    background: transparent;
    border: 1px solid rgba(128, 128, 128, 0.5);
    border-radius: 10px;
    padding: 8px 16px;
    cursor: pointer;
}

.auth-btn-ghost:hover {
    background: rgba(128, 128, 128, 0.15);
}

@media (max-width: 600px) {
    .auth-actions .auth-hello { display: none; }
    .auth-actions .auth-btn,
    .auth-actions .auth-btn-ghost { padding: 6px 12px; }
}

/* The hidden attribute must always win over your own button styles */
[data-auth-show][hidden],
#auth-buttons[hidden],
#auth-user[hidden],
#login-btn[hidden],
#signup-btn[hidden],
#logout-btn[hidden] {
    display: none !important;
}
`;

    function injectStyles() {
        if (document.getElementById("nothub-auth-styles")) return;
        const style = document.createElement("style");
        style.id = "nothub-auth-styles";
        style.textContent = AUTH_CSS;
        document.head.append(style);
    }

    const SEL = {
        login: '#login-btn, [data-auth="login"]',
        signup: '#signup-btn, [data-auth="signup"]',
        logout: '#logout-btn, [data-auth="logout"]',
        showOut: '#auth-buttons, [data-auth-show="out"]',
        showIn: '#auth-user, [data-auth-show="in"]',
        name: '#auth-name, [data-auth-name]',
    };

    function init() {
        injectStyles();
        let user = null;
        let mode = "login"; // "login" or "register"

        /* ---------- talking to the server ---------- */

        async function api(path, method, body) {
            try {
                const res = await fetch(path, {
                    method: method || "GET",
                    headers: body ? { "Content-Type": "application/json" } : undefined,
                    body: body ? JSON.stringify(body) : undefined,
                });
                let data = {};
                try {
                    data = await res.json();
                } catch (e) {
                    /* no JSON body, that is fine */
                }
                return { ok: res.ok, status: res.status, data };
            } catch (e) {
                return {
                    ok: false,
                    status: 0,
                    data: { error: "Can't reach the server. Is app.py running?" },
                };
            }
        }

        // Backends name things differently, so be flexible here
        function pickUser(data) {
            const u = data && (data.user || data);
            return u && (u.name || u.email) ? u : null;
        }

        function pickError(result) {
            const fromServer = result.data && (result.data.error || result.data.message);
            if (fromServer) return fromServer;
            if (result.status === 401) return "Wrong email or password.";
            if (result.status === 409) return "An account with this email already exists.";
            return "Something went wrong. Please try again.";
        }

        async function fetchUser() {
            const me = await api("/api/me");
            return me.ok ? pickUser(me.data) : null;
        }

        function firstName(u) {
            return String(u.name || u.email || "").trim().split(/\s+/)[0];
        }

        function setUser(next) {
            user = next;
            render();
            document.dispatchEvent(new CustomEvent("authchange", { detail: user }));
        }

        /* ---------- topbar: show / hide the right buttons ---------- */

        const hasOwnButtons = document.querySelector(SEL.login + "," + SEL.signup + "," + SEL.logout) !== null;

        // Only used when the page has none of your own buttons
        const box = document.createElement("div");
        box.className = "auth-box";

        function render() {
            if (!hasOwnButtons) {
                box.innerHTML = "";
                if (user) {
                    const hello = document.createElement("span");
                    hello.className = "auth-hello";
                    hello.textContent = firstName(user);
                    const out = document.createElement("button");
                    out.type = "button";
                    out.className = "auth-btn";
                    out.dataset.auth = "logout";
                    out.textContent = "Log out";
                    box.append(hello, out);
                } else {
                    const inBtn = document.createElement("button");
                    inBtn.type = "button";
                    inBtn.className = "auth-btn";
                    inBtn.dataset.auth = "login";
                    inBtn.textContent = "Log in";
                    box.append(inBtn);
                }
            }

            const loggedIn = Boolean(user);
            document.querySelectorAll(SEL.showOut + "," + SEL.login + "," + SEL.signup).forEach((n) => {
                n.hidden = loggedIn;
            });
            document.querySelectorAll(SEL.showIn + "," + SEL.logout).forEach((n) => {
                n.hidden = !loggedIn;
            });
            document.querySelectorAll(SEL.name).forEach((n) => {
                n.textContent = loggedIn ? firstName(user) : ""; // textContent keeps names safe
            });
        }

        if (!hasOwnButtons) {
            const slot = document.getElementById("auth-slot");
            if (slot) {
                slot.append(box);
            } else {
                box.classList.add("auth-floating");
                document.body.append(box);
            }
        }

        // One click listener for every login / signup / logout button
        document.addEventListener("click", async (e) => {
            const target = e.target;
            if (!target || !target.closest) return;

            if (target.closest(SEL.login)) {
                e.preventDefault();
                openModal("login");
            } else if (target.closest(SEL.signup)) {
                e.preventDefault();
                openModal("register");
            } else if (target.closest(SEL.logout)) {
                e.preventDefault();
                await api("/api/logout", "POST");
                setUser(null);
            }
        });

        /* ---------- the pop-up ---------- */

        const backdrop = document.createElement("div");
        backdrop.className = "auth-backdrop";
        backdrop.innerHTML = `
            <div class="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
                <h2 id="auth-title">Log in</h2>
                <form class="auth-form" novalidate>
                    <label class="auth-signup-only">First name
                        <input name="first" type="text" maxlength="50" autocomplete="given-name">
                    </label>
                    <label class="auth-signup-only">Middle name (optional)
                        <input name="middle" type="text" maxlength="50" autocomplete="additional-name">
                    </label>
                    <label class="auth-signup-only">Last name
                        <input name="last" type="text" maxlength="50" autocomplete="family-name">
                    </label>
                    <label>Email
                        <input name="email" type="email" autocomplete="email">
                    </label>
                    <label>Password
                        <input name="password" type="password" maxlength="128">
                    </label>
                    <label class="auth-signup-only">Confirm password
                        <input name="confirm" type="password" maxlength="128" autocomplete="new-password">
                    </label>
                    <p class="auth-error" role="alert" hidden></p>
                    <button type="submit" class="auth-submit">Log in</button>
                </form>
                <p class="auth-switch">
                    <span class="auth-switch-text"></span>
                    <button type="button" class="auth-link"></button>
                </p>
                <button type="button" class="auth-close" aria-label="Close">✕</button>
            </div>
        `;
        document.body.append(backdrop);

        const form = backdrop.querySelector(".auth-form");
        const titleEl = backdrop.querySelector("#auth-title");
        const signupOnly = backdrop.querySelectorAll(".auth-signup-only");
        const errorEl = backdrop.querySelector(".auth-error");
        const submitBtn = backdrop.querySelector(".auth-submit");
        const switchText = backdrop.querySelector(".auth-switch-text");
        const switchBtn = backdrop.querySelector(".auth-link");

        function isLoginMode() {
            return mode === "login";
        }

        function showError(message) {
            errorEl.textContent = message;
            errorEl.hidden = !message;
        }

        function setMode(next) {
            mode = next;
            const isLogin = isLoginMode();
            titleEl.textContent = isLogin ? "Log in" : "Create your account";
            submitBtn.textContent = isLogin ? "Log in" : "Sign up";
            signupOnly.forEach((row) => {
                row.hidden = isLogin;
            });
            form.elements.password.autocomplete = isLogin ? "current-password" : "new-password";
            switchText.textContent = isLogin ? "New here?" : "Already have an account?";
            switchBtn.textContent = isLogin ? "Create an account" : "Log in";
            showError("");
        }

        function focusFirstField() {
            (isLoginMode() ? form.elements.email : form.elements.first).focus();
        }

        function openModal(nextMode) {
            form.reset();
            setMode(nextMode);
            backdrop.classList.add("is-open");
            document.body.style.overflow = "hidden";
            focusFirstField();
        }

        function closeModal() {
            backdrop.classList.remove("is-open");
            document.body.style.overflow = "";
            form.reset();
            showError("");
        }

        switchBtn.addEventListener("click", () => {
            setMode(isLoginMode() ? "register" : "login");
            focusFirstField();
        });

        backdrop.querySelector(".auth-close").addEventListener("click", closeModal);
        backdrop.addEventListener("click", (e) => {
            if (e.target === backdrop) closeModal();
        });
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") closeModal();
        });

        /* ---------- checking the form, then calling the server ---------- */

        const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        // Returns an error message, or "" when everything is fine
        function validate(v) {
            if (!isLoginMode()) {
                if (!v.first) return "Please enter your first name.";
                if (!v.last) return "Please enter your last name.";
                if (v.fullName.length > 50) return "Your full name must be 50 characters or fewer.";
            }
            if (!v.email) return "Please enter your email.";
            if (!EMAIL_PATTERN.test(v.email)) return "Please enter a valid email address.";
            if (!v.password) return "Please enter your password.";
            if (!isLoginMode()) {
                if (v.password.length < 8) return "Password must be at least 8 characters.";
                if (v.password.length > 128) return "Password must be 128 characters or fewer.";
                if (v.password !== v.confirm) return "The two passwords do not match.";
            }
            return "";
        }

        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            showError("");

            const f = form.elements;
            const first = f.first.value.trim();
            const middle = f.middle.value.trim();
            const last = f.last.value.trim();
            const values = {
                first,
                last,
                fullName: [first, middle, last].filter(Boolean).join(" "),
                email: f.email.value.trim(),
                password: f.password.value,
                confirm: f.confirm.value,
            };

            const problem = validate(values);
            if (problem) return showError(problem);

            submitBtn.disabled = true;
            const result = isLoginMode()
                ? await api("/api/login", "POST", { email: values.email, password: values.password })
                : await api("/api/register", "POST", {
                      name: values.fullName,
                      email: values.email,
                      password: values.password,
                  });
            submitBtn.disabled = false;

            if (!result.ok) return showError(pickError(result));

            // Sign-up may not log you in by itself, so ask the server who we are now
            let loggedIn = await fetchUser();

            // Still not logged in after sign-up? Log in with the same details.
            if (!loggedIn && !isLoginMode()) {
                const login = await api("/api/login", "POST", {
                    email: values.email,
                    password: values.password,
                });
                if (login.ok) loggedIn = await fetchUser();
            }

            if (!loggedIn) return showError("Logged in, but could not load your account. Try refreshing.");

            closeModal();
            setUser(loggedIn);
        });

        /* ---------- start up: is someone already logged in? ---------- */

        render();
        fetchUser().then((found) => {
            if (found) setUser(found);
        });
    }

    // Works whether the script is in <head> or at the end of <body>
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
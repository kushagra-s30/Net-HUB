/* ==========================================================
   NotHub - auth.js  (same file on index.html, about.html, help.html)

   Talks to the Flask API:
     GET  /api/me         -> who is logged in?
     POST /api/register   -> create account
     POST /api/login      -> log in
     POST /api/logout     -> log out

   Connect your own topbar buttons with these attributes:
     data-auth="login"      opens the Log in pop-up
     data-auth="signup"     opens the Sign up pop-up
     data-auth="logout"     logs the user out
     data-auth-show="out"   visible only when logged OUT (Log in / Sign up buttons)
     data-auth-show="in"    visible only when logged IN  (Log out button, greeting)
     data-auth-name         its text becomes the user's name

   No data-auth buttons on the page? A simple Log in / Log out
   button is created for you instead.

   Other scripts can listen for changes:
     document.addEventListener("authchange", (e) => console.log(e.detail));
   (e.detail is the user object after login, or null after logout)
   ========================================================== */
(function () {
    function init() {
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
                return { ok: res.ok, data };
            } catch (e) {
                return { ok: false, data: { error: "Can't reach the server. Is app.py running?" } };
            }
        }

        // Backends name things differently, so be flexible here
        function pickUser(data) {
            const u = data && (data.user || data);
            return u && (u.name || u.email) ? u : null;
        }

        function pickError(data) {
            return (data && (data.error || data.message)) || "Something went wrong. Please try again.";
        }

        async function fetchUser() {
            const me = await api("/api/me");
            return me.ok ? pickUser(me.data) : null;
        }

        function setUser(next) {
            user = next;
            render();
            document.dispatchEvent(new CustomEvent("authchange", { detail: user }));
        }

        /* ---------- the topbar buttons ---------- */

        // Did you put your own data-auth buttons in the HTML?
        const hasOwnButtons = document.querySelector("[data-auth]") !== null;

        // Only used when the page has no data-auth buttons
        const box = document.createElement("div");
        box.className = "auth-box";

        function render() {
            document.querySelectorAll("[data-auth-show]").forEach((node) => {
                const showWhenLoggedIn = node.dataset.authShow === "in";
                node.hidden = showWhenLoggedIn !== Boolean(user);
            });

            document.querySelectorAll("[data-auth-name]").forEach((node) => {
                node.textContent = user ? user.name || user.email : "";
            });

            if (hasOwnButtons) return;

            box.innerHTML = "";
            if (user) {
                const hello = document.createElement("span");
                hello.className = "auth-hello";
                hello.textContent = user.name || user.email; // textContent keeps names safe
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

        if (!hasOwnButtons) {
            const slot = document.getElementById("auth-slot");
            if (slot) {
                slot.append(box);
            } else {
                box.classList.add("auth-floating");
                document.body.append(box);
            }
        }

        // One click listener for every data-auth button on the page
        document.addEventListener("click", async (e) => {
            const button = e.target.closest("[data-auth]");
            if (!button) return;

            const action = button.dataset.auth;
            if (action === "login" || action === "signup") {
                e.preventDefault();
                openModal(action === "signup" ? "register" : "login");
            } else if (action === "logout") {
                e.preventDefault();
                await api("/api/logout", "POST");
                setUser(null);
            }
        });

        /* ---------- the login / sign-up pop-up ---------- */

        const backdrop = document.createElement("div");
        backdrop.className = "auth-backdrop";
        backdrop.innerHTML = `
            <div class="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
                <h2 id="auth-title">Log in</h2>
                <form class="auth-form" novalidate>
                    <label class="auth-name-row">Name
                        <input name="name" type="text" maxlength="50" autocomplete="name">
                    </label>
                    <label>Email
                        <input name="email" type="email" autocomplete="email" required>
                    </label>
                    <label>Password
                        <input name="password" type="password" minlength="8" maxlength="128" required>
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
        const nameRow = backdrop.querySelector(".auth-name-row");
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
            nameRow.hidden = isLogin;
            form.elements.password.autocomplete = isLogin ? "current-password" : "new-password";
            switchText.textContent = isLogin ? "New here?" : "Already have an account?";
            switchBtn.textContent = isLogin ? "Create an account" : "Log in";
            showError("");
        }

        function focusFirstField() {
            (isLoginMode() ? form.elements.email : form.elements.name).focus();
        }

        function openModal(nextMode) {
            form.reset();
            setMode(nextMode);
            backdrop.classList.add("is-open");
            focusFirstField();
        }

        function closeModal() {
            backdrop.classList.remove("is-open");
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

        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            showError("");

            const email = form.elements.email.value.trim();
            const password = form.elements.password.value;
            const name = form.elements.name.value.trim();

            // Quick checks for instant feedback (the server checks again)
            if (!isLoginMode() && !name) return showError("Please enter your name.");
            if (!email) return showError("Please enter your email.");
            if (!password) return showError("Please enter your password.");
            if (!isLoginMode() && password.length < 8) {
                return showError("Password must be at least 8 characters.");
            }

            submitBtn.disabled = true;
            const result = isLoginMode()
                ? await api("/api/login", "POST", { email, password })
                : await api("/api/register", "POST", { name, email, password });
            submitBtn.disabled = false;

            if (!result.ok) return showError(pickError(result.data));

            // Sign-up may not log you in by itself, so ask the server who we are now
            let loggedIn = await fetchUser();

            // Still not logged in after sign-up? Log in with the same details.
            if (!loggedIn && !isLoginMode()) {
                const login = await api("/api/login", "POST", { email, password });
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
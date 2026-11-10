(function () {
    const SETTINGS_KEY = "nothub-settings";
    const defaults = { theme: "system", accent: "blue" };

    const sections = {
        theme: {
            title: "Theme",
            options: [["system", "System default"], ["light", "Light"], ["dark", "Dark"]],
        },
        accent: {
            title: "Accent color",
            options: [["blue", "Blue"], ["purple", "Purple"], ["green", "Green"], ["orange", "Orange"]],
        },
    };

    const dots = { blue: "#3b6cf0", purple: "#7c3aed", green: "#059669", orange: "#ea580c" };
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)");

    function loadSettings() {
        try {
            return { ...defaults, ...JSON.parse(localStorage.getItem(SETTINGS_KEY)) };
        } catch (e) {
            return { ...defaults };
        }
    }

    function applySettings(s) {
        const root = document.documentElement;
        const theme = s.theme === "system" ? (systemDark.matches ? "dark" : "light") : s.theme;
        root.dataset.theme = theme;
        root.dataset.accent = s.accent;
        root.removeAttribute("data-font");
    }

    const settings = loadSettings();
    applySettings(settings);

    // If the computer switches between light and dark, follow it (only in System default)
    systemDark.addEventListener("change", () => {
        if (settings.theme === "system") applySettings(settings);
    });

    function save() {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        applySettings(settings);
    }

    function labelFor(key) {
        const found = sections[key].options.find((o) => o[0] === settings[key]);
        return found ? found[1] : "";
    }

    // Three-line menu button
    const toggle = document.createElement("button");
    toggle.className = "settings-toggle";
    toggle.setAttribute("aria-label", "Open settings");
    toggle.setAttribute("aria-expanded", "false");
    toggle.innerHTML = `
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"
         stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">
        <path d="M10.43 5.18L10.66 2.49L13.34 2.49L13.57 5.18A7 7 0 0 1 15.71 6.06L17.78 4.33L19.67 6.22L17.94 8.29A7 7 0 0 1 18.82 10.43L21.51 10.66L21.51 13.34L18.82 13.57A7 7 0 0 1 17.94 15.71L19.67 17.78L17.78 19.67L15.71 17.94A7 7 0 0 1 13.57 18.82L13.34 21.51L10.66 21.51L10.43 18.82A7 7 0 0 1 8.29 17.94L6.22 19.67L4.33 17.78L6.06 15.71A7 7 0 0 1 5.18 13.57L2.49 13.34L2.49 10.66L5.18 10.43A7 7 0 0 1 6.06 8.29L4.33 6.22L6.22 4.33L8.29 6.06A7 7 0 0 1 10.43 5.18Z"/>
        <circle cx="12" cy="12" r="3.2"/>
    </svg>
`;

    const overlay = document.createElement("div");
    overlay.className = "settings-overlay";

    // Drawer
    const panel = document.createElement("aside");
    panel.className = "settings-panel";
    panel.setAttribute("aria-label", "Settings");
    panel.innerHTML = `
        <div class="settings-head">
            <button class="settings-back" aria-label="Back" hidden>←</button>
            <h2 class="settings-title">Settings</h2>
            <button class="settings-close" aria-label="Close settings">✕</button>
        </div>
        <div class="settings-body"></div>
    `;

    const body = panel.querySelector(".settings-body");
    const title = panel.querySelector(".settings-title");
    const back = panel.querySelector(".settings-back");

    // Reset pop-up (centered on the page)
    const modal = document.createElement("div");
    modal.className = "settings-modal-backdrop";
    modal.innerHTML = `
        <div class="settings-modal" role="dialog" aria-modal="true" aria-labelledby="reset-title">
            <h2 id="reset-title">Reset my progress?</h2>
            <p>This will erase all your progress (read notes and streak). Your settings will be kept.</p>
            <div class="settings-modal-actions">
                <button class="settings-cancel">Cancel</button>
                <button class="settings-confirm">Yes, erase</button>
            </div>
        </div>
    `;

    function setHeader(text, showBack) {
        title.textContent = text;
        back.hidden = !showBack;
    }

    // Screen 1: the list of settings
    function showMain() {
        setHeader("Settings", false);
        body.innerHTML = "";

        Object.keys(sections).forEach((key) => {
            const item = document.createElement("button");
            item.className = "settings-item";
            item.innerHTML = `
                <span>${sections[key].title}</span>
                <span class="settings-value">${labelFor(key)} ›</span>
            `;
            item.addEventListener("click", () => showOptions(key));
            body.appendChild(item);
        });

        const reset = document.createElement("button");
        reset.className = "settings-item settings-item-danger";
        reset.innerHTML = "<span>Reset my progress</span>";
        reset.addEventListener("click", () => {
            setOpen(false);
            setModal(true);
        });
        body.appendChild(reset);
    }

    // Screen 2: the options of one setting
    function showOptions(key) {
        setHeader(sections[key].title, true);
        body.innerHTML = "";

        sections[key].options.forEach(([value, text]) => {
            const option = document.createElement("button");
            option.className = "settings-option";
            option.setAttribute("aria-pressed", String(settings[key] === value));

            const dot = key === "accent"
                ? `<span class="settings-dot" style="background:${dots[value]}"></span>`
                : "";
            option.innerHTML = `<span class="settings-option-label">${dot}${text}</span>`;

            option.addEventListener("click", () => {
                settings[key] = value;
                save();
                showOptions(key);
            });
            body.appendChild(option);
        });
    }

    function setOpen(open) {
        if (open) showMain();
        panel.classList.toggle("is-open", open);
        overlay.classList.toggle("is-open", open);
        toggle.setAttribute("aria-expanded", String(open));
    }

    function setModal(open) {
        modal.classList.toggle("is-open", open);
    }

    back.addEventListener("click", showMain);
    toggle.addEventListener("click", () => setOpen(!panel.classList.contains("is-open")));
    overlay.addEventListener("click", () => setOpen(false));
    panel.querySelector(".settings-close").addEventListener("click", () => setOpen(false));

    modal.addEventListener("click", (e) => {
        if (e.target === modal) setModal(false);
    });
    modal.querySelector(".settings-cancel").addEventListener("click", () => setModal(false));
    modal.querySelector(".settings-confirm").addEventListener("click", () => {
        const keep = localStorage.getItem(SETTINGS_KEY);
        localStorage.clear();
        if (keep) localStorage.setItem(SETTINGS_KEY, keep);
        location.reload();
    });

    document.addEventListener("keydown", (e) => {
        if (e.key !== "Escape") return;
        setModal(false);
        setOpen(false);
    });

    showMain();
    document.body.append(toggle, overlay, panel, modal);
})();
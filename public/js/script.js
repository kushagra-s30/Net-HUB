const navButtons = document.querySelectorAll("[data-nav]");
const views = document.querySelectorAll("main > section[id^='view-']");
const nav = document.querySelector("nav");
const indicator = document.querySelector(".nav-indicator");
const brand = document.getElementById("brand");

// Slide the highlight pill under the active tab
function moveIndicator() {
    const active = nav.querySelector("[data-nav][aria-pressed='true']");

    if (!active) {
        indicator.style.opacity = "0";
        return;
    }

    indicator.style.opacity = "1";
    indicator.style.width = `${active.offsetWidth}px`;
    indicator.style.transform = `translateX(${active.offsetLeft}px)`;
}

function showViewByName(name) {
    const view = document.getElementById(`view-${name}`);

    if (!view) {
        console.error(`No view found for "${name}".`);
        return;
    }

    views.forEach((section) => {
        section.hidden = section !== view;
    });

    navButtons.forEach((navButton) => {
        navButton.setAttribute("aria-pressed", String(navButton.dataset.nav === name));
    });

    moveIndicator();
    window.scrollTo(0, 0);
    document.dispatchEvent(new CustomEvent("viewchange", { detail: name }));
}

navButtons.forEach((button) => {
    button.addEventListener("click", () => showViewByName(button.dataset.nav));
    button.setAttribute(
        "aria-pressed",
        String(document.getElementById(`view-${button.dataset.nav}`)?.hidden === false)
    );
});

brand.addEventListener("click", () => showViewByName("home"));

// Open the tab named in the address, e.g. index.html#notes
const startView = window.location.hash.slice(1);
if (startView && document.getElementById(`view-${startView}`)) {
    showViewByName(startView);
}

// Place the pill without animation on first load, then enable the slide
moveIndicator();
requestAnimationFrame(() => indicator.classList.add("is-ready"));
window.addEventListener("resize", moveIndicator);

if (document.fonts) {
    document.fonts.ready.then(moveIndicator);
}
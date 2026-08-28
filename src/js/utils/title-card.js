// Adds a close button to the page's title card (the floating glass header)
// that collapses it to a small pill fixed at top-center, showing only the
// title text - the same close/collapse-to-a-pill idea the toolbars use
// (which collapse to bottom-center), mirrored to the top and in a smaller
// size than the toolbar's own pill. Self-initializing: works on any page
// that loads this script and has a header carrying data-title-card /
// data-close-title, plus a sibling data-open-title pill.
const AUTO_CLOSE_MS = 10000;

function init() {
    const card = document.querySelector('[data-title-card]');
    const closeButton = card && card.querySelector('[data-close-title]');
    const openButton = document.querySelector('[data-open-title]');
    if (!card || !closeButton || !openButton) return;

    const titleEl = card.querySelector('h1');
    if (titleEl) {
        openButton.textContent = titleEl.innerText.replace(/\s+/g, ' ').trim();
    }

    let autoCloseTimer = null;
    const collapse = () => {
        card.classList.add('title-card--collapsed');
        openButton.classList.add('visible');
    };
    const scheduleAutoClose = () => {
        clearTimeout(autoCloseTimer);
        autoCloseTimer = setTimeout(collapse, AUTO_CLOSE_MS);
    };

    closeButton.addEventListener('click', () => {
        clearTimeout(autoCloseTimer);
        collapse();
    });

    openButton.addEventListener('click', () => {
        card.classList.remove('title-card--collapsed');
        openButton.classList.remove('visible');
        scheduleAutoClose();
    });

    // Card starts open on page load - auto-close it the same way a manual
    // reopen does, so the title never lingers indefinitely over the work.
    scheduleAutoClose();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

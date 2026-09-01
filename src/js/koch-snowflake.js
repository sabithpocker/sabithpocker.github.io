// Drives the single <mm-kochsnowflake grid-cols grid-rows> element in
// koch-snowflake.html: a grid of Koch snowflakes tiling the page, each
// independently recursed. Grid size is directly toolbar-controlled; per-tile
// recursion depth wanders under a toolbar-set ceiling via 1D Perlin noise
// sampled at a different phase per tile (row/col offset) - the same desync
// approach used for the Koch curve grid and the Sierpinski tiling - so
// snowflakes grow and shrink their detail independently instead of the whole
// grid popping between levels in lockstep.

import PerlinNoise from "./perlin.js";

const NOISE_SPEED = 0.12; // noise-time units per real second at 1x speed
const RENDER_FPS = 15; // grid rebuild/redraw rate - noise phase still advances every rAF tick, only the (relatively expensive) full-grid rebuild is throttled

function init() {
    const snowflake = document.querySelector('[data-snowflake-el]');
    const controls = document.querySelector('[data-snowflake-controls]');
    if (!snowflake || !controls) return;

    const colsInput = controls.querySelector('[data-grid-cols]');
    const colsValue = controls.querySelector('[data-grid-cols-value]');
    const rowsInput = controls.querySelector('[data-grid-rows]');
    const rowsValue = controls.querySelector('[data-grid-rows-value]');
    const maxLevelsInput = controls.querySelector('[data-max-levels]');
    const maxLevelsValue = controls.querySelector('[data-max-levels-value]');
    const animSpeedInput = controls.querySelector('[data-anim-speed]');
    const animSpeedValue = controls.querySelector('[data-anim-speed-value]');
    const playPauseButton = controls.querySelector('[data-play-pause]');
    const closeButton = controls.querySelector('[data-close-controls]');
    const openButton = document.querySelector('[data-open-controls]');

    const noise = new PerlinNoise();
    let maxLevels = parseInt(maxLevelsInput.value, 10);
    let speed = parseFloat(animSpeedInput.value);
    let playing = true;
    let noiseTime = Math.random() * 1000;

    // Hex-packed rows are spaced by cellW * sqrt(3)/2 (see paintGrid() in
    // mm-kochsnowflake.js), not height/rows, so a fixed markup default only
    // fills the intended viewport size. Compute the row count needed to fill
    // the actual viewport height on load, the same approach used for the
    // Sierpinski tiling; the Grid Rows slider still overrides it afterward.
    const rect = snowflake.getBoundingClientRect();
    const initialCols = parseInt(colsInput.value, 10);
    const cellW = rect.width / initialCols;
    const rowSpacing = cellW * (Math.sqrt(3) / 2);
    const rowsMax = parseInt(rowsInput.max, 10);
    const autoRows = Math.min(rowsMax, Math.max(2, Math.ceil(rect.height / rowSpacing)));
    snowflake.gridRows = autoRows;
    rowsInput.value = autoRows;
    rowsValue.textContent = autoRows;

    snowflake.tileDepthFn = (row, col) => {
        const phase = row * 0.6 + col * 0.37;
        const n = noise.noise1(noiseTime + phase); // 0..1
        return n * maxLevels;
    };

    let lastTime = performance.now();
    let lastRenderTime = 0;
    const renderIntervalMs = 1000 / RENDER_FPS;
    function tick(now) {
        const deltaSec = (now - lastTime) / 1000;
        lastTime = now;

        if (playing && speed > 0) {
            noiseTime += deltaSec * NOISE_SPEED * speed;
            if (now - lastRenderTime >= renderIntervalMs) {
                lastRenderTime = now;
                snowflake.render();
            }
        }
        requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    colsInput.addEventListener('input', (e) => {
        colsValue.textContent = e.target.value;
        snowflake.gridCols = parseInt(e.target.value, 10);
        snowflake.render();
    });

    rowsInput.addEventListener('input', (e) => {
        rowsValue.textContent = e.target.value;
        snowflake.gridRows = parseInt(e.target.value, 10);
        snowflake.render();
    });

    maxLevelsInput.addEventListener('input', (e) => {
        maxLevels = parseInt(e.target.value, 10);
        maxLevelsValue.textContent = maxLevels;
    });

    animSpeedInput.addEventListener('input', (e) => {
        speed = parseFloat(e.target.value);
        animSpeedValue.textContent = `${speed.toFixed(1)}x`;
    });

    playPauseButton.addEventListener('click', () => {
        playing = !playing;
        playPauseButton.textContent = playing ? 'Pause' : 'Play';
    });

    closeButton.addEventListener('click', () => {
        controls.classList.add('collapsed');
        openButton.classList.add('visible');
    });

    openButton.addEventListener('click', () => {
        controls.classList.remove('collapsed');
        openButton.classList.remove('visible');
    });
}

window.onload = setTimeout(init, 314);

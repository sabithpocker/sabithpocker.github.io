// Drives the single <mm-kochcode grid-cols grid-rows> element in
// koch-code.html: a lattice of horizontal/vertical grid edges where every
// edge is itself a Koch curve (see MMKochCode.paintGrid()), rather than the
// page's earlier approach of tiling many independent Koch-curve elements.
// Grid size (columns/rows) is directly toolbar-controlled; per-edge Koch
// recursion depth ("Max Detail") sets a ceiling that each edge's own depth
// wanders under independently via 1D Perlin noise, sampled at a different
// phase per edge (offset by row+col, and by horizontal vs. vertical) so
// the grid ripples unevenly instead of the whole thing popping between
// levels in lockstep - that per-edge desync is what actually reads as
// "organic" rather than a global level count feeding smooth noise ever did.

import PerlinNoise from "./perlin.js";

const NOISE_SPEED = 0.12; // noise-time units per real second at 1x speed
const RENDER_FPS = 15; // grid rebuild/redraw rate - noise phase still advances every rAF tick, only the (relatively expensive) full-grid rebuild is throttled

function init() {
    const koch = document.querySelector('[data-koch-el]');
    const controls = document.querySelector('[data-koch-controls]');
    if (!koch || !controls) return;

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

    // Each edge samples the same noise field at its own phase offset (its
    // grid position, plus a fixed split between horizontal/vertical edges)
    // so neighboring edges drift in and out of sync with each other instead
    // of the entire grid changing depth as one unit.
    koch.edgeDepthFn = (row, col, horizontal) => {
        const phase = (row * 0.6 + col * 0.37) + (horizontal ? 0 : 41.3);
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
                koch.render();
            }
        }
        requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    colsInput.addEventListener('input', (e) => {
        colsValue.textContent = e.target.value;
        koch.gridCols = parseInt(e.target.value, 10);
        koch.render();
    });

    rowsInput.addEventListener('input', (e) => {
        rowsValue.textContent = e.target.value;
        koch.gridRows = parseInt(e.target.value, 10);
        koch.render();
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

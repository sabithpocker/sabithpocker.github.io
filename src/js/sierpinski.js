// Drives the single <mm-sierpinski grid-cols grid-rows> element in
// sierpinski-fractal.html: a grid of equilateral triangles (checkerboard
// up/down orientation, gapped apart) where each tile is independently
// Sierpinski-subdivided. Grid size and gap are directly toolbar-controlled;
// per-tile recursion depth wanders under a toolbar-set ceiling via 1D Perlin
// noise sampled at a different phase per tile (row/col offset), the same
// desync approach used for the Koch grid, so tiles grow/shrink their detail
// independently instead of the whole grid popping between levels at once.

import PerlinNoise from "./perlin.js";

const NOISE_SPEED = 0.12; // noise-time units per real second at 1x speed
const RENDER_FPS = 15; // grid rebuild/redraw rate - noise phase still advances every rAF tick, only the (relatively expensive) full-grid rebuild is throttled

function init() {
    const sierpinski = document.querySelector('[data-sierpinski-el]');
    const controls = document.querySelector('[data-sierpinski-controls]');
    if (!sierpinski || !controls) return;

    const colsInput = controls.querySelector('[data-grid-cols]');
    const colsValue = controls.querySelector('[data-grid-cols-value]');
    const rowsInput = controls.querySelector('[data-grid-rows]');
    const rowsValue = controls.querySelector('[data-grid-rows-value]');
    const gapInput = controls.querySelector('[data-gap]');
    const gapValue = controls.querySelector('[data-gap-value]');
    const maxDepthInput = controls.querySelector('[data-max-depth]');
    const maxDepthValue = controls.querySelector('[data-max-depth-value]');
    const animSpeedInput = controls.querySelector('[data-anim-speed]');
    const animSpeedValue = controls.querySelector('[data-anim-speed-value]');
    const playPauseButton = controls.querySelector('[data-play-pause]');
    const closeButton = controls.querySelector('[data-close-controls]');
    const openButton = document.querySelector('[data-open-controls]');

    const noise = new PerlinNoise();
    let maxDepth = parseInt(maxDepthInput.value, 10);
    let speed = parseFloat(animSpeedInput.value);
    let playing = true;
    let noiseTime = Math.random() * 1000;

    // The row count needed to fill the viewport depends on its aspect ratio
    // (triangle row height is derived from side = width/cols), so a fixed
    // markup default only fills the intended viewport size. Compute it from
    // the actual element dimensions on load, so the tessellation packs the
    // full page regardless of viewport shape; the Grid Rows slider still
    // lets the user override it afterward.
    const rect = sierpinski.getBoundingClientRect();
    const cols = parseInt(colsInput.value, 10);
    const side = rect.width / cols;
    const rowHeight = side * (Math.sqrt(3) / 2);
    const rowsMax = parseInt(rowsInput.max, 10);
    const autoRows = Math.min(rowsMax, Math.max(2, Math.ceil(rect.height / rowHeight)));
    sierpinski.gridRows = autoRows;
    rowsInput.value = autoRows;
    rowsValue.textContent = autoRows;

    sierpinski.tileDepthFn = (row, col) => {
        const phase = row * 0.6 + col * 0.37;
        const n = noise.noise1(noiseTime + phase); // 0..1
        return n * maxDepth;
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
                sierpinski.render(now);
            }
        }
        requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    colsInput.addEventListener('input', (e) => {
        colsValue.textContent = e.target.value;
        sierpinski.gridCols = parseInt(e.target.value, 10);
        sierpinski.render(performance.now());
    });

    rowsInput.addEventListener('input', (e) => {
        rowsValue.textContent = e.target.value;
        sierpinski.gridRows = parseInt(e.target.value, 10);
        sierpinski.render(performance.now());
    });

    gapInput.addEventListener('input', (e) => {
        gapValue.textContent = `${e.target.value}%`;
        sierpinski.gap = parseFloat(e.target.value) / 100;
        sierpinski.render(performance.now());
    });

    maxDepthInput.addEventListener('input', (e) => {
        maxDepth = parseInt(e.target.value, 10);
        maxDepthValue.textContent = maxDepth;
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

// Drives the <mm-mandelbrot> element in mandelbrot.html as a "Fractal
// Family" instrument: the Power slider generalizes the classic z^2 + c
// iteration to z^n + c (n=2 is the familiar Mandelbrot set; n=3/4/5 give
// increasingly different-looking structures; fractional/negative n get
// stranger still - see mm-mandelbrot.js's cpow()). Organic Power Drift
// sweeps n across that whole range via 1D Perlin noise, the same
// organic-animation approach used across the rest of the site, so the page
// visibly morphs between "unrelated-looking" fractal families on its own -
// the point being made is that they all come from the same formula.

import PerlinNoise from "./perlin.js";

const DRIFT_SPEED_UNIT = 0.03; // noise-time units per real second at 1x drift speed
const POWER_MIN = -2;
const POWER_MAX = 6;

function init() {
    const mandelbrot = document.querySelector('[data-mandelbrot-el]');
    const controls = document.querySelector('[data-mandelbrot-controls]');
    if (!mandelbrot || !controls) return;

    const powerInput = controls.querySelector('[data-power]');
    const powerValue = controls.querySelector('[data-power-value]');
    const iterationsInput = controls.querySelector('[data-iterations]');
    const iterationsValue = controls.querySelector('[data-iterations-value]');
    const escapeInput = controls.querySelector('[data-escape-radius]');
    const escapeValue = controls.querySelector('[data-escape-radius-value]');
    const driftToggle = controls.querySelector('[data-drift-toggle]');
    const driftSpeedInput = controls.querySelector('[data-drift-speed]');
    const driftSpeedValue = controls.querySelector('[data-drift-speed-value]');
    const resetButton = controls.querySelector('[data-reset-view]');
    const closeButton = controls.querySelector('[data-close-controls]');
    const openButton = document.querySelector('[data-open-controls]');

    const noise = new PerlinNoise();
    let driftTime = Math.random() * 1000;

    // The component's own default center/zoom (set in its constructor) is a
    // deep-zoom "seahorse valley" point meant for the old auto-zoom demo -
    // override to a standard whole-set framing for this instrument page.
    mandelbrot.centerX = -0.5;
    mandelbrot.centerY = 0;
    mandelbrot.zoomFactor = 1;

    function syncFromControls() {
        mandelbrot.power = parseFloat(powerInput.value);
        mandelbrot.iterations = parseInt(iterationsInput.value, 10);
        mandelbrot.escapeRadius = parseFloat(escapeInput.value);
    }
    syncFromControls();
    powerInput.disabled = driftToggle.checked;
    mandelbrot.render();

    powerInput.addEventListener('input', (e) => {
        powerValue.textContent = parseFloat(e.target.value).toFixed(2);
        if (!driftToggle.checked) {
            mandelbrot.power = parseFloat(e.target.value);
            mandelbrot.render();
        }
    });

    iterationsInput.addEventListener('input', (e) => {
        iterationsValue.textContent = e.target.value;
        mandelbrot.iterations = parseInt(e.target.value, 10);
        mandelbrot.render();
    });

    escapeInput.addEventListener('input', (e) => {
        escapeValue.textContent = e.target.value;
        mandelbrot.escapeRadius = parseFloat(e.target.value);
        mandelbrot.render();
    });

    driftSpeedInput.addEventListener('input', (e) => {
        driftSpeedValue.textContent = `${parseFloat(e.target.value).toFixed(1)}x`;
    });

    driftToggle.addEventListener('change', (e) => {
        powerInput.disabled = e.target.checked;
        if (!e.target.checked) {
            mandelbrot.power = parseFloat(powerInput.value);
            mandelbrot.render();
        }
    });

    resetButton.addEventListener('click', () => {
        mandelbrot.centerX = -0.5;
        mandelbrot.centerY = 0;
        mandelbrot.zoomFactor = 1;
        mandelbrot.render();
    });

    let lastTime = performance.now();
    function tick(now) {
        const deltaSec = (now - lastTime) / 1000;
        lastTime = now;

        if (driftToggle.checked) {
            const speed = parseFloat(driftSpeedInput.value);
            driftTime += deltaSec * DRIFT_SPEED_UNIT * speed;
            const n = noise.noise1(driftTime); // 0..1
            const power = POWER_MIN + n * (POWER_MAX - POWER_MIN);
            mandelbrot.power = power;
            powerInput.value = power.toFixed(2);
            powerValue.textContent = power.toFixed(2);
            mandelbrot.render();
        }
        requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

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

// Drives the <mm-phoenix> element in phoenix.html: wires every "instrument"
// parameter (c, p, iterations, escape radius, palette, symmetry) straight
// through to the component, plus an optional "Organic Drift" mode that
// wanders c around its slider value via 1D Perlin noise (two channels, one
// per component, at different phases) - the same organic-animation approach
// used across the rest of the site - so the fractal keeps morphing on its
// own instead of only responding to manual slider changes.

import PerlinNoise from "./perlin.js";

const DRIFT_SPEED_UNIT = 0.05; // noise-time units per real second at 1x drift speed
const DRIFT_AMPLITUDE = 0.18; // max +/- wander around the slider's c value

function init() {
    const phoenix = document.querySelector('[data-phoenix-el]');
    const controls = document.querySelector('[data-phoenix-controls]');
    if (!phoenix || !controls) return;

    const cRealInput = controls.querySelector('[data-c-real]');
    const cRealValue = controls.querySelector('[data-c-real-value]');
    const cImagInput = controls.querySelector('[data-c-imag]');
    const cImagValue = controls.querySelector('[data-c-imag-value]');
    const pRealInput = controls.querySelector('[data-p-real]');
    const pRealValue = controls.querySelector('[data-p-real-value]');
    const pImagInput = controls.querySelector('[data-p-imag]');
    const pImagValue = controls.querySelector('[data-p-imag-value]');
    const iterationsInput = controls.querySelector('[data-iterations]');
    const iterationsValue = controls.querySelector('[data-iterations-value]');
    const escapeInput = controls.querySelector('[data-escape-radius]');
    const escapeValue = controls.querySelector('[data-escape-radius-value]');
    const paletteSelect = controls.querySelector('[data-palette]');
    const symmetryInput = controls.querySelector('[data-symmetry]');
    const symmetryValue = controls.querySelector('[data-symmetry-value]');
    const rotationInput = controls.querySelector('[data-rotation]');
    const rotationValue = controls.querySelector('[data-rotation-value]');
    const driftToggle = controls.querySelector('[data-drift-toggle]');
    const driftSpeedInput = controls.querySelector('[data-drift-speed]');
    const driftSpeedValue = controls.querySelector('[data-drift-speed-value]');
    const resetButton = controls.querySelector('[data-reset-view]');
    const closeButton = controls.querySelector('[data-close-controls]');
    const openButton = document.querySelector('[data-open-controls]');

    const noise = new PerlinNoise();
    let driftTime = Math.random() * 1000;
    let baseCReal = parseFloat(cRealInput.value);
    let baseCImag = parseFloat(cImagInput.value);

    function syncAllFromControls() {
        phoenix.cReal = baseCReal;
        phoenix.cImag = baseCImag;
        phoenix.pReal = parseFloat(pRealInput.value);
        phoenix.pImag = parseFloat(pImagInput.value);
        phoenix.iterations = parseInt(iterationsInput.value, 10);
        phoenix.escapeRadius = parseFloat(escapeInput.value);
        phoenix.paletteIndex = parseInt(paletteSelect.value, 10);
        phoenix.symmetry = parseInt(symmetryInput.value, 10);
        phoenix.rotation = parseFloat(rotationInput.value) * Math.PI / 180;
    }
    syncAllFromControls();
    // The c sliders are only meaningful as a direct control while Organic
    // Drift is off - keep them disabled from the start if the checkbox's
    // initial (markup) state is checked, matching what toggling it on later
    // does.
    cRealInput.disabled = driftToggle.checked;
    cImagInput.disabled = driftToggle.checked;
    phoenix.render();

    cRealInput.addEventListener('input', (e) => {
        baseCReal = parseFloat(e.target.value);
        cRealValue.textContent = baseCReal.toFixed(3);
        if (!driftToggle.checked) {
            phoenix.cReal = baseCReal;
            phoenix.render();
        }
    });

    cImagInput.addEventListener('input', (e) => {
        baseCImag = parseFloat(e.target.value);
        cImagValue.textContent = baseCImag.toFixed(3);
        if (!driftToggle.checked) {
            phoenix.cImag = baseCImag;
            phoenix.render();
        }
    });

    pRealInput.addEventListener('input', (e) => {
        const v = parseFloat(e.target.value);
        pRealValue.textContent = v.toFixed(3);
        phoenix.pReal = v;
        phoenix.render();
    });

    pImagInput.addEventListener('input', (e) => {
        const v = parseFloat(e.target.value);
        pImagValue.textContent = v.toFixed(3);
        phoenix.pImag = v;
        phoenix.render();
    });

    iterationsInput.addEventListener('input', (e) => {
        iterationsValue.textContent = e.target.value;
        phoenix.iterations = parseInt(e.target.value, 10);
        phoenix.render();
    });

    escapeInput.addEventListener('input', (e) => {
        escapeValue.textContent = e.target.value;
        phoenix.escapeRadius = parseFloat(e.target.value);
        phoenix.render();
    });

    paletteSelect.addEventListener('change', (e) => {
        phoenix.paletteIndex = parseInt(e.target.value, 10);
        phoenix.render();
    });

    symmetryInput.addEventListener('input', (e) => {
        symmetryValue.textContent = e.target.value;
        phoenix.symmetry = parseInt(e.target.value, 10);
        phoenix.render();
    });

    rotationInput.addEventListener('input', (e) => {
        rotationValue.textContent = `${e.target.value}°`;
        phoenix.rotation = parseFloat(e.target.value) * Math.PI / 180;
        phoenix.render();
    });

    driftSpeedInput.addEventListener('input', (e) => {
        driftSpeedValue.textContent = `${parseFloat(e.target.value).toFixed(1)}x`;
    });

    driftToggle.addEventListener('change', (e) => {
        cRealInput.disabled = e.target.checked;
        cImagInput.disabled = e.target.checked;
        if (!e.target.checked) {
            phoenix.cReal = baseCReal;
            phoenix.cImag = baseCImag;
            phoenix.render();
        }
    });

    resetButton.addEventListener('click', () => {
        phoenix.centerX = 0;
        phoenix.centerY = 0;
        phoenix.zoom = 1;
        phoenix.render();
    });

    let lastTime = performance.now();
    function tick(now) {
        const deltaSec = (now - lastTime) / 1000;
        lastTime = now;

        if (driftToggle.checked) {
            const speed = parseFloat(driftSpeedInput.value);
            driftTime += deltaSec * DRIFT_SPEED_UNIT * speed;
            phoenix.cReal = baseCReal + (noise.noise1(driftTime) - 0.5) * 2 * DRIFT_AMPLITUDE;
            phoenix.cImag = baseCImag + (noise.noise1(driftTime + 500) - 0.5) * 2 * DRIFT_AMPLITUDE;
            phoenix.time += deltaSec;
            phoenix.render();
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

// Drives the <mm-attractor> element in attractors.html. The point of this
// page is exploration, not precision - Clifford and De Jong are both 2D
// maps controlled entirely by four numbers (a, b, c, d), and small changes
// to any one of them produce a completely different composition. Randomize
// is the primary control; the sliders are there for fine-tuning once
// Randomize lands on something promising.
//
// Organic Drift continuously wanders a/b/c/d via 1D Perlin noise like the
// rest of the site's animations, but with one important difference: every
// other page's organic drift just updates a shader uniform, which is free to
// do every frame. Here, changing any parameter invalidates the whole
// accumulated density histogram - restarting it every frame would mean each
// frame only ever shows a sparse handful of points, never the rich resolved
// image. So the noise itself advances continuously, but a new parameter set
// is only committed (i.e. actually reset() on the component) every couple
// of seconds, giving each one time to fill in first.

import PerlinNoise from "./perlin.js";

const PRESETS = {
    clifford: { a: -1.4, b: 1.6, c: 1.0, d: 0.7 },
    dejong: { a: -2, b: -2, c: -1.2, d: 2 },
};

function init() {
    const attractor = document.querySelector('[data-attractor-el]');
    const controls = document.querySelector('[data-attractor-controls]');
    if (!attractor || !controls) return;

    const typeSelect = controls.querySelector('[data-type]');
    const aInput = controls.querySelector('[data-a]');
    const aValue = controls.querySelector('[data-a-value]');
    const bInput = controls.querySelector('[data-b]');
    const bValue = controls.querySelector('[data-b-value]');
    const cInput = controls.querySelector('[data-c]');
    const cValue = controls.querySelector('[data-c-value]');
    const dInput = controls.querySelector('[data-d]');
    const dValue = controls.querySelector('[data-d-value]');
    const paletteSelect = controls.querySelector('[data-palette]');
    const randomizeButton = controls.querySelector('[data-randomize]');
    const driftToggle = controls.querySelector('[data-drift-toggle]');
    const driftSpeedInput = controls.querySelector('[data-drift-speed]');
    const driftSpeedValue = controls.querySelector('[data-drift-speed-value]');
    const closeButton = controls.querySelector('[data-close-controls]');
    const openButton = document.querySelector('[data-open-controls]');
    const sliderInputs = [aInput, bInput, cInput, dInput];

    function applyParamsToSliders(params) {
        aInput.value = params.a; aValue.textContent = params.a.toFixed(3);
        bInput.value = params.b; bValue.textContent = params.b.toFixed(3);
        cInput.value = params.c; cValue.textContent = params.c.toFixed(3);
        dInput.value = params.d; dValue.textContent = params.d.toFixed(3);
    }

    function syncFromSliders() {
        attractor.a = parseFloat(aInput.value);
        attractor.b = parseFloat(bInput.value);
        attractor.c = parseFloat(cInput.value);
        attractor.d = parseFloat(dInput.value);
    }

    applyParamsToSliders(PRESETS[attractor.type]);
    syncFromSliders();
    attractor.paletteIndex = parseInt(paletteSelect.value, 10);
    attractor.reset();
    sliderInputs.forEach((input) => { input.disabled = driftToggle.checked; });

    typeSelect.addEventListener('change', (e) => {
        attractor.type = e.target.value;
        applyParamsToSliders(PRESETS[attractor.type]);
        syncFromSliders();
        attractor.reset();
    });

    sliderInputs.forEach((input) => {
        input.addEventListener('input', () => {
            aValue.textContent = parseFloat(aInput.value).toFixed(3);
            bValue.textContent = parseFloat(bInput.value).toFixed(3);
            cValue.textContent = parseFloat(cInput.value).toFixed(3);
            dValue.textContent = parseFloat(dInput.value).toFixed(3);
            syncFromSliders();
            attractor.reset();
        });
    });

    paletteSelect.addEventListener('change', (e) => {
        attractor.paletteIndex = parseInt(e.target.value, 10);
        // Palette is purely a recolor of the existing histogram - no need to
        // throw away accumulated detail, just wait for the next scheduled
        // repaint (handled internally by the component's own loop).
    });

    // Not every random (a,b,c,d) is a chaotic attractor - many collapse to a
    // fixed point or a short cycle, which would render as a near-blank
    // image. Keep drawing new picks (scored via the component's cheap
    // throwaway probeSpread simulation) until one actually fills the plane,
    // instead of risking a boring result whenever the button is pressed.
    // Calibrated empirically: known-good attractors scored ~6,000-30,000,
    // fixed points/short cycles scored 0-500. 1,000 leaves a safe margin
    // between the two without rejecting so aggressively that Randomize
    // stalls looking for an unrealistically "perfect" score.
    const MIN_SPREAD_SCORE = 1000;
    const MAX_ATTEMPTS = 40;

    randomizeButton.addEventListener('click', () => {
        const randCoef = () => (Math.random() * 2 - 1) * 3;
        let params, score = 0, attempts = 0;
        do {
            params = { a: randCoef(), b: randCoef(), c: randCoef(), d: randCoef() };
            score = attractor.probeSpread(attractor.type, params.a, params.b, params.c, params.d);
            attempts++;
        } while (score < MIN_SPREAD_SCORE && attempts < MAX_ATTEMPTS);

        applyParamsToSliders(params);
        syncFromSliders();
        attractor.reset();
    });

    // Organic Drift: noise phase advances every rAF tick (so it always feels
    // continuously in motion), but a drifted parameter set is only actually
    // committed - reset() restarting the histogram - every RESET_INTERVAL_MS,
    // and only if it clears the same spread-score bar Randomize uses. If a
    // drifted pick would be boring, skip committing it and just keep
    // accumulating on the current (already-good) image instead - the noise
    // keeps moving underneath and gets re-checked next interval.
    const noise = new PerlinNoise();
    const DRIFT_NOISE_SPEED = 0.06;
    const DRIFT_RANGE = 3; // matches the sliders' -3..3
    const RESET_INTERVAL_MS = 900;
    let driftTime = Math.random() * 1000;
    let lastDriftCommit = 0;
    let lastTime = performance.now();

    function driftedParams(t) {
        const at = (phase) => noise.noise1(t + phase) * 2 * DRIFT_RANGE - DRIFT_RANGE;
        return { a: at(0), b: at(100), c: at(200), d: at(300) };
    }

    driftToggle.addEventListener('change', (e) => {
        sliderInputs.forEach((input) => { input.disabled = e.target.checked; });
        if (!e.target.checked) {
            syncFromSliders();
            attractor.reset();
        }
    });

    driftSpeedInput.addEventListener('input', (e) => {
        driftSpeedValue.textContent = `${parseFloat(e.target.value).toFixed(1)}x`;
    });

    function tick(now) {
        const deltaSec = (now - lastTime) / 1000;
        lastTime = now;

        if (driftToggle.checked) {
            const speed = parseFloat(driftSpeedInput.value);
            driftTime += deltaSec * DRIFT_NOISE_SPEED * speed;

            if (now - lastDriftCommit > RESET_INTERVAL_MS) {
                lastDriftCommit = now;
                const params = driftedParams(driftTime);
                const score = attractor.probeSpread(attractor.type, params.a, params.b, params.c, params.d);
                if (score >= MIN_SPREAD_SCORE) {
                    applyParamsToSliders(params);
                    attractor.a = params.a;
                    attractor.b = params.b;
                    attractor.c = params.c;
                    attractor.d = params.d;
                    attractor.reset();
                }
            }
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

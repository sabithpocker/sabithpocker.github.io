// Drives the <mm-mobiusstrip> element in mobius.html. Twist/Width/Segments
// regenerate the parametric surface directly; Material/Color just swap the
// mesh's material. Organic Drift wanders the auto-rotation speed via 1D
// Perlin noise (rather than a fixed constant spin), the same
// organic-animation approach used across the rest of the site.

import PerlinNoise from "./perlin.js";

function init() {
    const mobius = document.querySelector('[data-mobius-el]');
    const controls = document.querySelector('[data-mobius-controls]');
    if (!mobius || !controls) return;

    const twistInput = controls.querySelector('[data-twist]');
    const twistValue = controls.querySelector('[data-twist-value]');
    const widthInput = controls.querySelector('[data-width]');
    const widthValue = controls.querySelector('[data-width-value]');
    const segmentsInput = controls.querySelector('[data-segments]');
    const segmentsValue = controls.querySelector('[data-segments-value]');
    const materialSelect = controls.querySelector('[data-material]');
    const colorInput = controls.querySelector('[data-color]');
    const colorLabel = controls.querySelector('[data-color-label]');
    const driftToggle = controls.querySelector('[data-drift-toggle]');
    const driftSpeedInput = controls.querySelector('[data-drift-speed]');
    const driftSpeedValue = controls.querySelector('[data-drift-speed-value]');
    const resetButton = controls.querySelector('[data-reset-view]');
    const closeButton = controls.querySelector('[data-close-controls]');
    const openButton = document.querySelector('[data-open-controls]');

    mobius.twist = parseInt(twistInput.value, 10);
    mobius.width = parseFloat(widthInput.value);
    mobius.segments = parseInt(segmentsInput.value, 10);
    mobius.materialMode = materialSelect.value;
    mobius.color = colorInput.value;
    mobius.autoRotate = driftToggle.checked;
    colorLabel.hidden = materialSelect.value === 'normal';

    twistInput.addEventListener('input', (e) => {
        twistValue.textContent = e.target.value;
        mobius.twist = parseInt(e.target.value, 10);
        mobius.rebuildGeometry();
        mobius.rebuildMaterial();
    });

    widthInput.addEventListener('input', (e) => {
        widthValue.textContent = parseFloat(e.target.value).toFixed(2);
        mobius.width = parseFloat(e.target.value);
        mobius.rebuildGeometry();
    });

    segmentsInput.addEventListener('input', (e) => {
        segmentsValue.textContent = e.target.value;
        mobius.segments = parseInt(e.target.value, 10);
        mobius.rebuildGeometry();
    });

    materialSelect.addEventListener('change', (e) => {
        mobius.materialMode = e.target.value;
        colorLabel.hidden = e.target.value === 'normal';
        mobius.rebuildMaterial();
    });

    colorInput.addEventListener('input', (e) => {
        mobius.color = e.target.value;
        mobius.rebuildMaterial();
    });

    driftSpeedInput.addEventListener('input', (e) => {
        driftSpeedValue.textContent = `${parseFloat(e.target.value).toFixed(1)}x`;
    });

    driftToggle.addEventListener('change', (e) => {
        mobius.autoRotate = e.target.checked;
        if (!e.target.checked) mobius.rotateSpeed = 0;
    });

    resetButton.addEventListener('click', () => {
        mobius.resetView();
    });

    closeButton.addEventListener('click', () => {
        controls.classList.add('collapsed');
        openButton.classList.add('visible');
    });

    openButton.addEventListener('click', () => {
        controls.classList.remove('collapsed');
        openButton.classList.remove('visible');
    });

    // Organic Drift: rather than a fixed spin rate, wander the rotation
    // speed (including briefly reversing/pausing) via Perlin noise so the
    // strip's spin feels alive instead of mechanical.
    const noise = new PerlinNoise();
    let noiseTime = Math.random() * 1000;
    let lastTime = performance.now();
    function tick(now) {
        const deltaSec = (now - lastTime) / 1000;
        lastTime = now;
        if (driftToggle.checked) {
            const speed = parseFloat(driftSpeedInput.value);
            noiseTime += deltaSec * 0.15 * speed;
            const n = noise.noise1(noiseTime); // 0..1
            mobius.rotateSpeed = (n - 0.3) * 2.2; // roughly -0.6..1.4, mostly forward
        }
        requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
}

window.onload = setTimeout(init, 314);

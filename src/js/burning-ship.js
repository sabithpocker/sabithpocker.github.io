// Drives the <mm-burningship> element in burning-ship.html. Deliberately
// lighter than the other fractal toolbars (Phoenix, Mandelbrot/Multibrot) -
// this page is framed as a visual experiment to descend into, not an
// instrument to dial in: Iterations and Palette are the only numeric
// controls, and the centerpiece is the Descend toggle, which drives
// mm-burningship.js's own continuous zoom-toward-a-point animation.

function init() {
    const ship = document.querySelector('[data-burningship-el]');
    const controls = document.querySelector('[data-burningship-controls]');
    if (!ship || !controls) return;

    const iterationsInput = controls.querySelector('[data-iterations]');
    const iterationsValue = controls.querySelector('[data-iterations-value]');
    const paletteSelect = controls.querySelector('[data-palette]');
    const descendSpeedInput = controls.querySelector('[data-descend-speed]');
    const descendSpeedValue = controls.querySelector('[data-descend-speed-value]');
    const descendButton = controls.querySelector('[data-descend]');
    const resetButton = controls.querySelector('[data-reset-view]');
    const closeButton = controls.querySelector('[data-close-controls]');
    const openButton = document.querySelector('[data-open-controls]');

    ship.iterations = parseInt(iterationsInput.value, 10);
    ship.paletteIndex = parseInt(paletteSelect.value, 10);
    ship.descentSpeed = parseFloat(descendSpeedInput.value);
    ship.render();

    iterationsInput.addEventListener('input', (e) => {
        iterationsValue.textContent = e.target.value;
        ship.iterations = parseInt(e.target.value, 10);
        ship.render();
    });

    paletteSelect.addEventListener('change', (e) => {
        ship.paletteIndex = parseInt(e.target.value, 10);
        ship.render();
    });

    descendSpeedInput.addEventListener('input', (e) => {
        descendSpeedValue.textContent = `${parseFloat(e.target.value).toFixed(1)}x`;
        ship.descentSpeed = parseFloat(e.target.value);
    });

    descendButton.addEventListener('click', () => {
        if (ship.descending) {
            ship.stopDescent();
            descendButton.textContent = 'Descend';
        } else {
            ship.startDescent();
            descendButton.textContent = 'Surface';
        }
    });

    resetButton.addEventListener('click', () => {
        ship.stopDescent();
        descendButton.textContent = 'Descend';
        ship.centerX = -0.42;
        ship.centerY = -0.38;
        ship.zoom = 0.42;
        ship.iterations = parseInt(iterationsInput.value, 10);
        ship.render();
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

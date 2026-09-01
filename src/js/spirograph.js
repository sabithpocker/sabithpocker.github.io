// Same bounce-between-limits logic as utils/animate-spirograph.js, but kept
// as a controllable loop (speed/pause/paramaters can change live) instead of
// a fire-and-forget recursive call, so the toolbar can drive it.
function init() {
  const spirograph = document.querySelector("[data-spirograph='outer']");
  const controls = document.querySelector("[data-spirograph-controls]");
  if (!spirograph || !controls) return;

  const fixedRadiusInput = controls.querySelector("[data-fixed-radius]");
  const fixedRadiusValue = controls.querySelector("[data-fixed-radius-value]");
  const movingRadiusMinInput = controls.querySelector("[data-moving-radius-min]");
  const movingRadiusMinValue = controls.querySelector("[data-moving-radius-min-value]");
  const movingRadiusMaxInput = controls.querySelector("[data-moving-radius-max]");
  const movingRadiusMaxValue = controls.querySelector("[data-moving-radius-max-value]");
  const movingRadiusLabel = controls.querySelector("[data-moving-radius-label]");
  const movingRadiusInput = controls.querySelector("[data-moving-radius]");
  const movingRadiusValue = controls.querySelector("[data-moving-radius-value]");
  const repeatCountInput = controls.querySelector("[data-repeat-count]");
  const repeatCountValue = controls.querySelector("[data-repeat-count-value]");
  const densityInput = controls.querySelector("[data-density]");
  const densityValue = controls.querySelector("[data-density-value]");
  const animSpeedInput = controls.querySelector("[data-anim-speed]");
  const animSpeedValue = controls.querySelector("[data-anim-speed-value]");
  const playPauseButton = controls.querySelector("[data-play-pause]");
  const copyValuesButton = controls.querySelector("[data-copy-values]");
  const closeButton = controls.querySelector("[data-close-controls]");
  const openButton = document.querySelector("[data-open-controls]");

  // Animated state: r bounces between rMin/rMax (toolbar-controlled), p
  // bounces between 0-500, same as animateSpirograph.
  let r = 45;
  let p = 180;
  let rMin = parseFloat(movingRadiusMinInput.value);
  let rMax = parseFloat(movingRadiusMaxInput.value);
  let rIncrement = 9;
  let pIncrement = 14;
  let speed = parseFloat(animSpeedInput.value);
  let playing = true;

  const step = () => {
    if (playing && speed > 0) {
      if (r + rIncrement * speed > rMax) rIncrement = -Math.abs(rIncrement);
      if (r + rIncrement * speed <= rMin) rIncrement = Math.abs(rIncrement);
      r += rIncrement * speed;
      r = Math.min(rMax, Math.max(rMin, r));

      if (p + pIncrement * speed > 500) pIncrement = -Math.abs(pIncrement);
      if (p + pIncrement * speed <= 0) pIncrement = Math.abs(pIncrement);
      p += pIncrement * speed;

      spirograph.setAttribute("moving-circle-radius", r);
      spirograph.setAttribute("moving-circle-locus-length", p);
      spirograph.render();
      // Keep the (hidden-while-playing) direct radius slider in sync so it
      // starts from the right place the moment the animation is paused.
      movingRadiusInput.value = Math.round(r);
      movingRadiusValue.textContent = Math.round(r);
    }
    window.requestAnimationFrame(step);
  };
  window.requestAnimationFrame(step);

  fixedRadiusInput.addEventListener("input", (e) => {
    fixedRadiusValue.textContent = e.target.value;
    spirograph.R = parseFloat(e.target.value);
    spirograph.render();
  });

  movingRadiusMinInput.addEventListener("input", (e) => {
    rMin = Math.min(parseFloat(e.target.value), rMax);
    movingRadiusMinValue.textContent = rMin;
  });

  movingRadiusMaxInput.addEventListener("input", (e) => {
    rMax = Math.max(parseFloat(e.target.value), rMin);
    movingRadiusMaxValue.textContent = rMax;
  });

  movingRadiusInput.addEventListener("input", (e) => {
    // Only meaningful while paused - step() overwrites r every frame while
    // playing, so this control is hidden until then.
    r = parseFloat(e.target.value);
    movingRadiusValue.textContent = e.target.value;
    spirograph.setAttribute("moving-circle-radius", r);
    spirograph.render();
  });

  repeatCountInput.addEventListener("input", (e) => {
    repeatCountValue.textContent = e.target.value;
    spirograph.reps = parseFloat(e.target.value);
    spirograph.render();
  });

  densityInput.addEventListener("input", (e) => {
    const density = parseFloat(e.target.value) * 0.0001;
    densityValue.textContent = density.toFixed(4);
    spirograph.density = density;
    spirograph.render();
  });

  animSpeedInput.addEventListener("input", (e) => {
    speed = parseFloat(e.target.value);
    animSpeedValue.textContent = `${speed.toFixed(1)}x`;
  });

  playPauseButton.addEventListener("click", () => {
    playing = !playing;
    playPauseButton.textContent = playing ? "Pause" : "Play";
    copyValuesButton.hidden = playing;
    movingRadiusLabel.hidden = playing;
  });

  copyValuesButton.addEventListener("click", async () => {
    const markup = `<mm-spirograph fixed-circle-radius="${spirograph.getAttribute("fixed-circle-radius")}" moving-circle-radius="${spirograph.getAttribute("moving-circle-radius")}" moving-circle-locus-length="${spirograph.getAttribute("moving-circle-locus-length")}" repeat-count="${spirograph.getAttribute("repeat-count")}" density="${spirograph.getAttribute("density")}" frozen="true" data-spirograph="outer"></mm-spirograph>`;
    try {
      await navigator.clipboard.writeText(markup);
      const original = copyValuesButton.textContent;
      copyValuesButton.textContent = "Copied!";
      setTimeout(() => { copyValuesButton.textContent = original; }, 1500);
    } catch (err) {
      console.error("Failed to copy spirograph values:", err);
    }
  });

  closeButton.addEventListener("click", () => {
    controls.classList.add("collapsed");
    openButton.classList.add("visible");
  });

  openButton.addEventListener("click", () => {
    controls.classList.remove("collapsed");
    openButton.classList.remove("visible");
  });
}

window.onload = setTimeout(init, 314);

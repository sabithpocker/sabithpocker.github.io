import PerlinNoise from "./perlin.js";
import organicAnimateSpirograph from "./utils/organic-animate-spirograph.js";
import gradientShader from "./shaders/fragment-shaders/gradient-shader.js";
import fragmentShaderSource from "./shaders/fragment-shaders/fragment-shader-source.js";

function init() {

  const spirographMiddle = document.querySelector("[data-spirograph='middle']");
  const noiseGenerator = new PerlinNoise();
  spirographMiddle.vertexShaderSource = gradientShader;
  spirographMiddle.fragmentShaderSource = fragmentShaderSource;

  organicAnimateSpirograph(
    0.01,
    spirographMiddle,
    690,
    690,
    2,
    3,
    616,
    700,
    0.1,
    1,
    noiseGenerator
  );
  document.querySelector(".highlight__items").style.transition = "all 3140ms ease-in";
  document.querySelector(".highlight__items").style.opacity = "1";

  animateBackgroundHue();
}

// Slowly, organically drifts the landing section's background color via 1D
// Perlin noise instead of a fixed color - hue/saturation/lightness each
// sample the same noise field at their own time scale and phase offset (the
// same desync trick used for the Koch grid animation) so they wander in and
// out of sync with each other rather than pulsing in lockstep. Lightness is
// clamped well below "light" (max ~42%) so the background always stays a
// deep, rich tone - never washes out toward white.
function animateBackgroundHue() {
  const highlight = document.querySelector(".highlight");
  if (!highlight) return;

  const noise = new PerlinNoise();
  const t0 = Math.random() * 1000;
  let time = 0;
  let lastTime = performance.now();

  function tick(now) {
    const deltaSec = (now - lastTime) / 1000;
    lastTime = now;
    time += deltaSec;

    const hue = noise.noise1(t0 + time * 0.02) * 360;
    const saturation = 45 + noise.noise1(t0 + 500 + time * 0.015) * 30; // ~45-75%
    const lightness = 22 + noise.noise1(t0 + 900 + time * 0.011) * 20; // ~22-42%, never light
    highlight.style.backgroundColor = `hsl(${hue.toFixed(1)}, ${saturation.toFixed(1)}%, ${lightness.toFixed(1)}%)`;

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

window.onload = setTimeout(init, 314);

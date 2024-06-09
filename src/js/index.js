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
}
window.onload = setTimeout(init, 314);

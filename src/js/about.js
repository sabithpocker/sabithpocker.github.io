import PerlinNoise from "./perlin.js";
import organicAnimateSpirograph from "./utils/organic-animate-spirograph.js";
import gradientShader from "./shaders/fragment-shaders/gradient-shader.js";
import fragmentShaderSource from "./shaders/fragment-shaders/fragment-shader-about-page.js";

function init() {

  const spirographMiddle = document.querySelector("[data-spirograph='about']");
  const noiseGenerator = new PerlinNoise();
  spirographMiddle.vertexShaderSource = gradientShader;
  spirographMiddle.fragmentShaderSource = fragmentShaderSource;

  organicAnimateSpirograph(
    1000,
    spirographMiddle,
    -1900,
    -80,
    -3,
    30,
    800,
    700,
    10,
    10,
    noiseGenerator
  );
  document.querySelector(".highlight__items").style.transition = "all 3140ms ease-in";
  document.querySelector(".highlight__items").style.opacity = "1";
}
window.onload = setTimeout(init, 314);

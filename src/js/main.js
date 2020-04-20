import PerlinNoise from "./perlin.js";
import animateSpirograph from "./utils/animate-spirograph.js";
import organicAnimateSpirograph from "./utils/organic-animate-spirograph.js";
import gradientShader from "./vertex-shaders/gradient-shader.js";

function init() {
  const spirograph = document.querySelector("[data-spirograph]");
  const noiseGenerator = new PerlinNoise();
  spirograph.vertexShaderSource = gradientShader;
  // animateSpirograph(spirograph, 20, 400, 10, 20);
  organicAnimateSpirograph(
    0.1,
    spirograph,
    -400,
    400,
    -220,
    300,
    10,
    200,
    noiseGenerator
  );
}
window.onload = init;

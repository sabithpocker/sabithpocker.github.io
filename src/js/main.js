import PerlinNoise from "./perlin.js";
import animateSpirograph from "./utils/animate-spirograph.js";
import organicAnimateSpirograph from "./utils/organic-animate-spirograph.js";
import gradientShader from "./vertex-shaders/gradient-shader.js";

function init() {
  const spirograph = document.querySelector("[data-spirograph]");
  const noiseGenerator = new PerlinNoise();
  // spirograph.vertexShaderSource = gradientShader;
  // animateSpirograph(spirograph, 20, 400, 10, 20);
  organicAnimateSpirograph(
    0.1,
    spirograph,
    40,
    1700,
    -20,
    30,
    -200,
    1000,
    noiseGenerator
  );
  // organicAnimateSpirograph(
  //   0.1,
  //   spirograph,
  //   -400,
  //   1500,
  //   -20,
  //   30,
  //   100,
  //   1000,
  //   noiseGenerator
  // );
  document.querySelector(".highlight__items").style.opacity = "1";
}
window.onload = setTimeout(init, 3000);

import PerlinNoise from "./perlin.js";
import animateSpirograph from "./utils/animate-spirograph.js";
import organicAnimateSpirograph from "./utils/organic-animate-spirograph.js";
import organicAnimateSierpinski from "./utils/organic-animate-sierpinski.js";
import gradientShader from "./shaders/fragment-shaders/gradient-shader.js";
import gradientShaderDark from "./shaders/fragment-shaders/gradient-shader-dark.js";
import fragmentShaderSource from "./shaders/fragment-shaders/fragment-shader-source.js";
import fragmentShader2 from "./shaders/fragment-shaders/fragment-shader-2.js";
import vertexShader2 from "./shaders/vertex-shaders/vertex-shader-2.js";
// Option 2: Import just the parts you need.

import Three from 'https://cdn.skypack.dev/three@0.138.0';

function init() {
  // sierpinski diffusion experiemnt
  const sierpinski = document.querySelector("[data-spirograph='sierpinski']");
  sierpinski.vertexShaderSource = gradientShader;
  sierpinski.fragmentShaderSource = fragmentShaderSource;
  organicAnimateSierpinski(sierpinski);

  //standalone difusion experiement
  const shaderCanvas = document.querySelector("[data-canvas='shader-canvas']");
  shaderCanvas.vertexShaderSource = vertexShader2;
  shaderCanvas.fragmentShaderSource = fragmentShader2;
  shaderCanvas.color = 'rgba(255,2,255,1)';
  // organicAnimateSierpinski(sierpinski);

  const spirograph = document.querySelector("[data-spirograph='outer']");
  spirograph.style.opacity = 0.5;
  const spirographMiddle = document.querySelector("[data-spirograph='middle']");
  const noiseGenerator = new PerlinNoise();
  // spirograph.vertexShaderSource = gradientShaderDark;
  spirographMiddle.vertexShaderSource = gradientShader;
  spirographMiddle.fragmentShaderSource = fragmentShaderSource;

  // const density = 0.08;
  // const reps = 10;
  // spirograph.density = density * 0.01;
  // spirographMiddle.density = density;
  // spirograph.reps = reps;
  // spirographMiddle.reps = reps;
  // animateSpirograph(spirograph, 20, 400, 10, 20);
  // organicAnimateSpirograph(
  //   .314,
  //   spirograph,
  //   -400,
  //   1700,
  //   -30,
  //   30,
  //   -900,
  //   1200,
  //   0.01,
  //   0.005,
  //   noiseGenerator
  // );
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
  document.querySelector(".highlight__items").style.transition = "all 3140ms ease-in";
  document.querySelector(".highlight__items").style.opacity = "1";

}
window.onload = setTimeout(init, 314);

import PerlinNoise from "./perlin.js";

function init() {
  const spirograph = document.querySelector("[data-spirograph-one]");
  spirograph.vertexShaderSource = `#version 300 es

  // an attribute is an input (in) to a vertex shader.
  // It will receive data from a buffer
  in vec2 a_position;
  
  // Used to pass in the resolution of the canvas
  uniform vec2 u_resolution;
  
  out vec4 v_color;

  // all shaders have a main function
  void main() {
  
    // convert the position from pixels to 0.0 to 1.0
    vec2 zeroToOne = a_position / u_resolution;
  
    // convert from 0->1 to 0->2
    vec2 zeroToTwo = zeroToOne * 2.0;
  
    // convert from 0->2 to -1->+1 (clipspace)
    vec2 clipSpace = zeroToTwo - 1.0;
  
    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);

    // Convert from clipspace to colorspace.
    // Clipspace goes -1.0 to +1.0
    // Colorspace goes from 0.0 to 1.0
    v_color = vec4(1, 0.5, 1, 1) * gl_Position;
  }
  `;
  const noiseGenerator = new PerlinNoise();

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

function animateSpirograph(spirograph, r, p, rIncrement, pIncrement) {
  let v = r;
  if (v + rIncrement > 500) rIncrement = -Math.abs(rIncrement);
  if (v + rIncrement <= 0) rIncrement = Math.abs(rIncrement);
  v = v + rIncrement;
  r = v;
  let w = p;
  if (w + pIncrement > 500) pIncrement = -Math.abs(pIncrement);
  if (w + pIncrement <= 0) pIncrement = Math.abs(pIncrement);
  w = w + pIncrement;
  p = w;
  spirograph.setAttribute("moving-circle-radius", r);
  spirograph.setAttribute("moving-circle-locus-length", p);
  window.requestAnimationFrame(() =>
    animateSpirograph(spirograph, r, p, rIncrement, pIncrement)
  );
}

function scale(num, in_min, in_max, out_min, out_max) {
  return ((num - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;
}

function organicAnimateSpirograph(
  time,
  spirograph,
  RMin,
  RMax,
  rMin,
  rMax,
  pMin,
  pMax,
  noiseGenerator
) {
  const increment = noiseGenerator.noise1(time);
  const increment2 = noiseGenerator.noise1(time + 10000);
  // console.log(time / 100000, increment);

  const R = scale(increment, 0, 1, RMin, RMax);
  const r = scale(increment2, 0, 1, rMin, rMax);
  const p = scale(increment, 0, 1, pMin, pMax);

  spirograph.R = R;
  spirograph.r = r;
  spirograph.p = p;
  spirograph.reps = 90;
  spirograph.render();

  window.requestAnimationFrame(() =>
    organicAnimateSpirograph(
      time + 0.000001,
      spirograph,
      RMin,
      RMax,
      rMin,
      rMax,
      pMin,
      pMax,
      noiseGenerator
    )
  );
}

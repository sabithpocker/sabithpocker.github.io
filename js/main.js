import PerlinNoise from "./perlin.js";

function init() {
  const spirograph = document.querySelector("[data-spirograph-one]");
  const R = parseFloat(spirograph.getAttribute("fixed-circle-radius"));
  const reps = parseFloat(spirograph.getAttribute("repeat-count"));
  const r = parseFloat(spirograph.getAttribute("moving-circle-radius"));
  const p = parseFloat(spirograph.getAttribute("moving-circle-locus-length"));
  const noiseGenerator = new PerlinNoise();
  // animateSpirograph(
  //   spirograph,
  //   r,
  //   p,
  //   0.05 * window.devicePixelRatio,
  //   0.05 * window.devicePixelRatio
  // );

  organicAnimateSpirograph(
    0.1,
    spirograph,
    -400,
    400,
    -20,
    100,
    100,
    -30,
    noiseGenerator
  );

  // second
  // const spirograph2 = document.querySelector("[data-spirograph-two]");
  // const R2 = parseFloat(spirograph2.getAttribute("fixed-circle-radius"));
  // const reps2 = parseFloat(spirograph2.getAttribute("repeat-count"));
  // const r2 = parseFloat(spirograph2.getAttribute("moving-circle-radius"));
  // const p2 = parseFloat(spirograph2.getAttribute("moving-circle-locus-length"));
  // animateSpirograph(
  //   spirograph,
  //   r,
  //   p,
  //   0.05 * window.devicePixelRatio,
  //   0.05 * window.devicePixelRatio
  // );

  // organicAnimateSpirograph(
  //   0,
  //   spirograph2,
  //   -600,
  //   600,
  //   -500,
  //   500,
  //   -200,
  //   +200,
  //   noiseGenerator
  // );
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
  spirograph.reps = 150;
  spirograph.render();

  window.requestAnimationFrame(() =>
    organicAnimateSpirograph(
      time + 0.0001,
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

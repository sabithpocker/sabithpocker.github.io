function init() {
  const spirograph = document.querySelector("mm-spirograph");
  const r = parseFloat(spirograph.getAttribute("moving-circle-radius"));
  const p = parseFloat(spirograph.getAttribute("moving-circle-locus-length"));
  animateSpirograph(
    spirograph,
    r,
    p,
    0.0001 * window.devicePixelRatio,
    0.1 * window.devicePixelRatio
  );
}
window.onload = init;

function animateSpirograph(spirograph, r, p, rIncrement, pIncrement) {
  let v = r;
  if (v + rIncrement > 100) rIncrement = -Math.abs(rIncrement);
  if (v + rIncrement <= 0) rIncrement = Math.abs(rIncrement);
  v = v + rIncrement;
  r = v;
  let w = p;
  if (w + pIncrement > 100) pIncrement = -Math.abs(pIncrement);
  if (w + pIncrement <= 0) pIncrement = Math.abs(pIncrement);
  w = w + pIncrement;
  p = w;
  spirograph.setAttribute("moving-circle-radius", r);
  spirograph.setAttribute("moving-circle-locus-length", p);
  window.requestAnimationFrame(() =>
    animateSpirograph(spirograph, r, p, rIncrement, pIncrement)
  );
}

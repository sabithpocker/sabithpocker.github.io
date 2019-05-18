function init() {
  const spirograph = document.querySelector("mm-spirograph");
  const r = parseFloat(spirograph.getAttribute("moving-circle-radius"));
  animateSpirograph(spirograph, r, 0.0001 * window.devicePixelRatio);
}
window.onload = init;

function animateSpirograph(spirograph, r, increment) {
  let v = r;
  if (v + increment > 100) increment = -Math.abs(increment);
  if (v + increment <= 0) increment = Math.abs(increment);
  v = v + increment;
  r = v;
  spirograph.setAttribute("moving-circle-radius", r);
  window.requestAnimationFrame(() =>
    animateSpirograph(spirograph, r, increment)
  );
}

const animateSpirograph = (spirograph, r, p, rIncrement, pIncrement) => {
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
  spirograph.render();

  window.requestAnimationFrame(() =>
    animateSpirograph(spirograph, r, p, rIncrement, pIncrement)
  );
};

export default animateSpirograph;

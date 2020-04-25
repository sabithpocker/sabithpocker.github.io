const organicAnimateSpirograph = (
  time,
  spirograph,
  RMin,
  RMax,
  rMin,
  rMax,
  pMin,
  pMax,
  noiseGenerator
) => {
  const scale = (num, in_min, in_max, out_min, out_max) =>
    ((num - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;
  const increment = noiseGenerator.noise1(time);
  const increment2 = noiseGenerator.noise1(time + 10000);
  // console.log(time / 100000, increment);

  const R = scale(increment, 0, 1, RMin, RMax);
  const r = scale(increment2, 0, 1, rMin, rMax);
  const p = scale(increment, 0, 1, pMin, pMax);

  spirograph.R = R;
  spirograph.r = r;
  spirograph.p = p;
  spirograph.reps = 10;
  spirograph.render();

  window.requestAnimationFrame(() =>
    organicAnimateSpirograph(
      time + 0.0000001,
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
};

export default organicAnimateSpirograph;

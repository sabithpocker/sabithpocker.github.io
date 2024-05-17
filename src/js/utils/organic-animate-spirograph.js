const organicAnimateSpirograph = (
  time,
  spirograph,
  RMin,
  RMax,
  rMin,
  rMax,
  pMin,
  pMax,
  dMin,
  dMax,
  noiseGenerator,
  timestamp
) => {
  const scale = (num, in_min, in_max, out_min, out_max) =>
    ((num - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;
  const increment = noiseGenerator.noise1(time);
  const increment2 = noiseGenerator.noise1(time + 10000);
  const increment3 = noiseGenerator.noise1(time + 100);
  // console.log(time / 100000, increment);



  if (Math.ceil(time * 10000000) % 3 === 0) {
    const R = scale(increment, 0, 1, RMin, RMax);
    const r = scale(increment2, 0, 1, rMin, rMax);
    const p = scale(increment, 0, 1, pMin, pMax);
    // const d = scale(increment3, 0, 1, dMin, dMax);
    const d = dMin;
    spirograph.R = R;
    spirograph.r = r;
    spirograph.p = p;
    spirograph.desity = d;
    spirograph.render(timestamp);
  }
  // console.log(time);0.10223184703674987

  window.requestAnimationFrame((timestamp) => {
    organicAnimateSpirograph(
      time + 0.000001 * (increment + increment2),
      spirograph,
      RMin,
      RMax,
      rMin,
      rMax,
      pMin,
      pMax,
      dMin,
      dMax,
      noiseGenerator,
      timestamp
    )
  }
  );
};

export default organicAnimateSpirograph;

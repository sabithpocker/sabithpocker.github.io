const organicAnimateSierpinski = (
  sierpinski,
  timestamp
) => {
  sierpinski.render(timestamp);

  window.requestAnimationFrame((timestamp) => {
    organicAnimateSierpinski(
      sierpinski,
      timestamp
    )
  });
};

export default organicAnimateSierpinski;

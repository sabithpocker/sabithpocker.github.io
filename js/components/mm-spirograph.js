class Spirograph extends HTMLElement {
  get r() {
    return parseFloat(this.getAttribute("r"));
  }

  set r(newValue) {
    this.setAttribute("r", newValue);
  }
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.rootElement = null;
    this.shadowRoot.innerHTML = `
        <style>
          .mm-spirograph-root {
            display: flex;
            height: 100%;
            width: 100%;
          }
        </style>
        <div class="mm-spirograph-root" data-content><svg></svg></div>
        `;
  }
  connectedCallback() {
    console.log("connected", this.r + 1);
    this.rootElement = this.shadowRoot.querySelector("[data-content]");
    this.createSpirograph(
      this.rootElement,
      100,
      10,
      30,
      100,
      "rgba(255,255,255,1)",
      1,
      "none"
    );
  }
  disconnectedCallback() {}

  createSpirograph(id, R, r, p, reps, stroke, strokeWidth, fill) {
    // parametric equations

    //x(t)=(R+r)cos(t) + p*cos((R+r)t/r)
    const x = t => (R + r) * Math.cos(t) + p * Math.cos((R + r) * (t / r));
    //y(t)=(R+r)sin(t) + p*sin((R+r)t/r)
    const y = t => (R + r) * Math.sin(t) + p * Math.sin((R + r) * (t / r));

    const s = d3
      .select(this.rootElement)
      .select("svg")
      .attr("width", "100%")
      .attr("height", "100%");

    const w = this.rootElement.clientWidth;
    const h = this.rootElement.clientHeight;

    const lineFunction = d3
      .line()
      .x(d => x(d) + w / 2)
      .y(d => y(d) + h / 2)
      .curve(d3.curveCatmullRom.alpha(0.9));

    s.append("path")
      .attr("d", lineFunction(d3.range(0, reps, 0.1)))
      .attr("stroke", stroke)
      .attr("stroke-width", strokeWidth)
      .attr("fill", fill);
  }
}
customElements.define("mm-spirograph", Spirograph);

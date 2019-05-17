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
    this.shadowRoot.innerHTML = `
        <style>
          .mm-spirograph-root {
            display: flex;
            height: 100%;
            width: 100%;
          }
        </style>
        <div class="mm-spirograph-root" data-content></div>
        `;
  }
  connectedCallback() {
    console.log("connected", this.r + 1);
    this.createSpirograph(
      "vis",
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

    const pulse = () => {
      var pa = s.select("path");
      (function repeat() {
        pa = pa
          .transition()
          .duration(20000)
          .delay(1000)
          .attr("d", function() {
            var count = 1000;
            v = r;
            if (v + increment > count) increment = -0.5;
            if (v + increment < 0) increment = 0.5;
            v = v + increment;
            r = v;
            return lineFunction(d3.range(0, reps, 0.1));
          })
          .ease(d3.easeLinear)
          .on("end", repeat);
      })();
    };

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.id = id;
    this.shadowRoot.querySelector("[data-content]").appendChild(svg);
    const s = d3
      .select(this.shadowRoot)
      .select("#" + id)
      .attr("width", "100%")
      .attr("height", "100%");

    console.log(s, "s");
    const w = this.shadowRoot.getElementById(id).clientWidth;
    const h = this.shadowRoot.getElementById(id).clientHeight;
    console.log(w, h);
    const increment = -1;
    let v;

    const lineFunction = d3
      .line()
      .x(function(d) {
        return x(d) + w / 2;
      })
      .y(function(d) {
        return y(d) + h / 2;
      })
      .curve(d3.curveCatmullRom.alpha(0.5));

    s.append("path")
      .attr("d", lineFunction(d3.range(0, reps, 0.1)))
      .attr("stroke", stroke)
      .attr("stroke-width", strokeWidth)
      .attr("fill", fill)
      .each(pulse);
  }
}
customElements.define("mm-spirograph", Spirograph);

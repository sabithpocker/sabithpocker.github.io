/**
 * A custom component that renders a spirograph
 */
class SvgSpirograph extends HTMLElement {
  /**
   * devicePixelRatio
   */
  get ratio() {
    return window.devicePixelRatio;
  }
  /**
   * Returns parsed value of fixed-circle-radius
   */
  get R() {
    return this.ratio * parseFloat(this.getAttribute("fixed-circle-radius"));
  }

  /**
   * Sets value of fixed-circle-radius back to element
   */
  set R(newValue) {
    this.setAttribute("fixed-circle-radius", newValue);
  }

  /**
   * Returns parsed value of moving-circle-radius
   */
  get r() {
    return this.ratio * parseFloat(this.getAttribute("moving-circle-radius"));
  }

  /**
   * Sets value of moving-circle-radius back to element
   */
  set r(newValue) {
    this.setAttribute("moving-circle-radius", newValue);
  }

  /**
   * Returns parsed value of moving-circle-locus-length
   */
  get p() {
    return (
      this.ratio * parseFloat(this.getAttribute("moving-circle-locus-length"))
    );
  }

  /**
   * Sets value of moving-circle-locus-length back to element
   */
  set p(newValue) {
    this.setAttribute("moving-circle-locus-length", newValue);
  }

  /**
   * Returns parsed value of repeat-count
   */
  get reps() {
    return parseFloat(this.getAttribute("repeat-count"));
  }

  /**
   * Sets value of repeat-count back to element
   */
  set reps(newValue) {
    this.setAttribute("repeat-count", newValue);
  }

  /**
   * Declaring the attributes that re observed for value change
   */
  static get observedAttributes() {
    return [
      "fixed-circle-radius",
      "moving-circle-radius",
      "moving-circle-locus-length",
      "repeat-count"
    ];
  }
  /**
   * Constructor function
   */
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
          path {
            stroke: var(--stroke-color, #FFFFFF);
            stroke-width: var(--stroke-width, 1px);
            fill: var(--fill-color, none);
            animation: var(--animation, glow infinite 10s ease-in);
          }
          
          @keyframes glow {
            0% {
              stroke: var(--stroke-start-color, rgb(248, 7, 196));
            }
            50% {
              stroke: var(--stroke-halfway-color, rgb(105, 9, 134));
            }
            100% {
              stroke: var(--stroke-end-color, rgb(248, 7, 196));
            }
          }

        </style>
        <div class="mm-spirograph-root" data-content><svg><path></path></svg></div>
        `;
  }

  /**
   * Callback when the element is mounted to DOM
   */
  connectedCallback() {
    this.createSpirographFromAttributes();
  }

  createSpirographFromAttributes() {
    this.createSpirograph(this.R, this.r, this.p, this.reps);
  }

  /**
   * Call back when an onserved attribute is changed
   * @param {*} name - Name of the attribute
   * @param {*} oldValue - oldValue of the attribute
   * @param {*} newValue  - newValue of the attribute
   */
  attributeChangedCallback(name, oldValue, newValue) {
    // TODO: use something like rxjs debounce time?
    this.createSpirographFromAttributes();
  }

  /**
   * Callback when the element is disconnected from DOM
   */
  disconnectedCallback() {}

  /**
   * Creates an SVG spirograph and appends to SVG element in rootElement
   * @param {*} R - Radius of outer circle
   * @param {*} r - Radius of inner circle
   * @param {*} p - Length from center to locus in inner circle
   * @param {*} reps - Number or repitions to make
   * @param {*} stroke - stroke color
   * @param {*} strokeWidth - stroke width
   * @param {*} fill - fill color
   */
  createSpirograph(R, r, p, reps) {
    const rootElement = this.shadowRoot.querySelector("[data-content]");

    // parametric equations
    //x(t)=(R+r)cos(t) + p*cos((R+r)t/r)
    const x = t => (R + r) * Math.cos(t) + p * Math.cos((R + r) * (t / r));
    //y(t)=(R+r)sin(t) + p*sin((R+r)t/r)
    const y = t => (R + r) * Math.sin(t) + p * Math.sin((R + r) * (t / r));

    const s = d3
      .select(rootElement)
      .select("svg")
      .attr("width", "100%")
      .attr("height", "100%");

    const w = rootElement.clientWidth;
    const h = rootElement.clientHeight;

    const lineFunction = d3
      .line()
      .x(d => x(d) + w / 2)
      .y(d => y(d) + h / 2)
      .curve(d3.curveCatmullRom.alpha(0.5));

    s.select("path").attr("d", lineFunction(d3.range(0, reps, 0.1)));
  }
}
customElements.define("mm-svg-spirograph", SvgSpirograph);

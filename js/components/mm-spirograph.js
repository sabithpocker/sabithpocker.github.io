/**
 * A custom component that renders a spirograph
 * https://css-tricks.com/simulating-mouse-movement/
 */
class Spirograph extends HTMLElement {
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
    return this._R === null
      ? parseFloat(this.getAttribute("fixed-circle-radius"))
      : this._R;
  }

  /**
   * Sets value of fixed-circle-radius back to element
   */
  set R(newValue) {
    this._R = this.ratio * parseFloat(newValue);
    this.setAttribute("fixed-circle-radius", newValue);
  }

  /**
   * Returns parsed value of moving-circle-radius
   */
  get r() {
    return this._r === null
      ? parseFloat(this.getAttribute("moving-circle-radius"))
      : this._r;
  }

  /**
   * Sets value of moving-circle-radius back to element
   */
  set r(newValue) {
    this._r = this.ratio * parseFloat(newValue);
    this.setAttribute("moving-circle-radius", newValue);
  }

  /**
   * Returns parsed value of moving-circle-locus-length
   */
  get p() {
    return this._p === null
      ? parseFloat(this.getAttribute("moving-circle-locus-length"))
      : this._p;
  }

  /**
   * Sets value of moving-circle-locus-length back to element
   */
  set p(newValue) {
    this._p = this.ratio * parseFloat(newValue);
    this.setAttribute("moving-circle-locus-length", newValue);
  }

  /**
   * Returns parsed value of repeat-count
   */
  get reps() {
    return this._reps === null
      ? parseFloat(this.getAttribute("repeat-count"))
      : this._reps;
  }

  /**
   * Sets value of repeat-count back to element
   */
  set reps(newValue) {
    this._reps = parseFloat(newValue);
    this.setAttribute("repeat-count", newValue);
  }

  get frozen() {
    return this._frozen === null ? this.getAttribute("frozen") : this._frozen;
  }

  set frozen(newValue) {
    this._frozen = newValue;
    this.setAttribute("frozen", newValue);
  }

  static get observedAttributes() {
    return [
      "fixed-circle-radius",
      "moving-circle-radius",
      "moving-circle-locus-length",
      "repeat-count",
      "frozen"
    ];
  }

  /**
   * Vertex Shader Program for WebGL
   */
  get vertexShaderSource() {
    return this._vertexShaderSource === null
      ? `#version 300 es

    // an attribute is an input (in) to a vertex shader.
    // It will receive data from a buffer
    in vec2 a_position;
    
    // Used to pass in the resolution of the canvas
    uniform vec2 u_resolution;
    
    out vec4 v_color;

    // all shaders have a main function
    void main() {
    
      // convert the position from pixels to 0.0 to 1.0
      vec2 zeroToOne = a_position / u_resolution;
    
      // convert from 0->1 to 0->2
      vec2 zeroToTwo = zeroToOne * 2.0;
    
      // convert from 0->2 to -1->+1 (clipspace)
      vec2 clipSpace = zeroToTwo - 1.0;
    
      gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);

      // Convert from clipspace to colorspace.
      // Clipspace goes -1.0 to +1.0
      // Colorspace goes from 0.0 to 1.0
      v_color = gl_Position * 0.8 + 0.4;
    }
    `
      : this._vertexShaderSource;
  }

  /**
   * Set a vertex shader source
   */

  set vertexShaderSource(newValue) {
    this._vertexShaderSource = newValue;
  }
  /**
   * Fragment Shader Progrm for WebGL
   */
  get fragmentShaderSource() {
    return this._fragmentShaderSource === null
      ? `#version 300 es
  
    precision mediump float;

    in vec4 v_color;

    uniform vec4 u_color;
    
    // we need to declare an output for the fragment shader
    out vec4 outColor;
    
    void main() {
      outColor = v_color;
    }
    `
      : this._fragmentShaderSource;
  }

  /**
   * Set fragment shader source
   */

  set fragmentShaderSource(newValue) {
    this._fragmentShaderSource = newValue;
  }

  /**
   * Constructor function
   */
  constructor() {
    super();
    this._R = null;
    this._p = null;
    this._r = null;
    this._reps = null;
    this._frozen = null;
    this._vertexShaderSource = null;
    this._fragmentShaderSource = null;

    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
      <canvas data-canvas></canvas>
      <style>
      :host {
        display: grid;
        justify-items: center;
        align-content: center;
      }
      canvas {
        width: 100%;
        height: 100%;
      }
      `;

    // Get A WebGL context
    const canvas = this.shadowRoot.querySelector("[data-canvas]");
    this.gl = canvas.getContext("webgl2");
    this.program = this.getProgram();

    // Tell it to use our program (pair of shaders)
    this.gl.useProgram(this.program);

    // look up where the vertex data needs to go.
    this.positionAttributeLocation = this.gl.getAttribLocation(
      this.program,
      "a_position"
    );
    // look up uniform locations
    this.resolutionUniformLocation = this.gl.getUniformLocation(
      this.program,
      "u_resolution"
    );

    this.colorLocation = this.gl.getUniformLocation(this.program, "u_color");

    // Create a buffer and put three 2d clip space points in it
    const positionBuffer = this.gl.createBuffer();

    // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
  }

  /**
   * Render a spirograph using webGL
   * @param {*} R Outer circle radius
   * @param {*} r inner circle radius
   * @param {*} p inner circle locus length
   * @param {*} reps repeat count
   */
  createSpirograph(R, r, p, reps) {
    const positions = this.getSpirographPoints(R, r, p, reps);

    const numberOfPoints = positions.length / 2;

    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array(positions),
      this.gl.STATIC_DRAW
    );

    // Create a vertex array object (attribute state)
    const vao = this.gl.createVertexArray();

    // and make it the one we're currently working with
    this.gl.bindVertexArray(vao);

    // Pass in the canvas resolution so we can convert from
    // pixels to clipspace in the shader
    this.gl.uniform2f(
      this.resolutionUniformLocation,
      this.gl.canvas.width,
      this.gl.canvas.height
    );

    // Turn on the attribute
    this.gl.enableVertexAttribArray(this.positionAttributeLocation);

    // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    const size = 2; // 2 components per iteration
    const type = this.gl.FLOAT; // the data is 32bit floats
    const normalize = false; // don't normalize the data
    const stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
    const offset = 0; // start at the beginning of the buffer
    this.gl.vertexAttribPointer(
      this.positionAttributeLocation,
      size,
      type,
      normalize,
      stride,
      offset
    );

    // Tell Webthis.GL how to convert from clip space to pixels
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);

    // Clear the canvas
    this.gl.clearColor(0, 0, 0, 0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    // Bind the attribute/buffer set we want.
    this.gl.bindVertexArray(vao);

    // Set a color.
    this.gl.uniform4f(this.colorLocation, 0.1, 0.2, 0.1, 1);

    // draw
    const primitiveType = this.gl.LINE_STRIP;
    const draw_offset = 0;
    const count = numberOfPoints;
    this.gl.drawArrays(primitiveType, draw_offset, count);
  }

  /**
   * Creates and returns a program from shader sources
   * TODO: Make the function pure
   */
  getProgram() {
    // create GLSL shaders, upload the GLSL source, compile the shaders
    const vertexShader = this.createShader(
      this.gl,
      this.gl.VERTEX_SHADER,
      this.vertexShaderSource
    );
    const fragmentShader = this.createShader(
      this.gl,
      this.gl.FRAGMENT_SHADER,
      this.fragmentShaderSource
    );

    // Link the two shaders into a program
    return this.createProgram(this.gl, vertexShader, fragmentShader);
  }

  /**
   * Create a shader from source
   * @param {*} gl WebGL context
   * @param {*} type Vertex or Fragment
   * @param {*} source Source of shader program
   */
  createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
      return shader;
    } else {
      gl.deleteShader(shader);
    }
  }

  /**
   * Create a rendering program from shaders
   * @param {*} gl WebGL Context
   * @param {*} vertexShader vertexShader
   * @param {*} fragmentShader fragmentShader
   */
  createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
      return program;
    }

    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
  }

  /**
   * resize canvas depending on devicePixelRatio
   * @param {*} canvas The canvas to be resized
   */
  resize(canvas) {
    const cssToRealPixels = window.devicePixelRatio || 1;

    // Lookup the size the browser is displaying the canvas in CSS pixels
    // and compute a size needed to make our drawingbuffer match it in
    // device pixels.
    const displayWidth = Math.floor(canvas.clientWidth * cssToRealPixels);
    const displayHeight = Math.floor(canvas.clientHeight * cssToRealPixels);

    // Check if the canvas is not the same size.
    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      // Make the canvas the same size
      canvas.width = displayWidth;
      canvas.height = displayHeight;
    }
  }

  /**
   * Callback when the element is mounted to DOM
   */
  connectedCallback() {
    this.resize(this.gl.canvas);
    this.createSpirographFromAttributes();
  }

  /**
   * Callback on attribute change event
   */
  createSpirographFromAttributes() {
    this.createSpirograph(this.R, this.r, this.p, this.reps);
  }

  /**
   * A public function that can be called
   * when using frozen mode
   */
  render() {
    this.createSpirograph(this.R, this.r, this.p, this.reps);
  }

  /**
   * Call back when an onserved attribute is changed
   * @param {*} name - Name of the attribute
   * @param {*} oldValue - oldValue of the attribute
   * @param {*} newValue  - newValue of the attribute
   */
  attributeChangedCallback(name, oldValue, newValue) {
    if (!this.frozen) {
      this.createSpirographFromAttributes();
    }
  }

  /**
   * Generate an array within the range
   * @param {*} start Starting number
   * @param {*} stop Ending number
   * @param {*} step Increment for each step
   */
  range(start, stop, step) {
    if (typeof stop === "undefined") {
      // one param defined
      stop = start;
      start = 0;
    }

    if (typeof step === "undefined") {
      step = 1;
    }

    if ((step > 0 && start >= stop) || (step < 0 && start <= stop)) {
      return [];
    }

    var result = [];
    for (let i = start; step > 0 ? i < stop : i > stop; i += step) {
      result.push(i);
    }

    return result;
  }
  /**
   * Callback when the element is disconnected from DOM
   */
  disconnectedCallback() {}

  /**
   * Ramer Douglas Peucker algorithm to get rid of unnecessary points
   * @param {*} points
   * @param {*} start
   * @param {*} end
   * @param {*} epsilon
   * @param {*} newPoints
   */
  simplifyPoints(points, start, end, epsilon, newPoints) {
    const outPoints = newPoints || [];

    // find the most distance point from the endpoints
    const s = points[start];
    const e = points[end - 1];
    let maxDistSq = 0;
    let maxNdx = 1;
    for (let i = start + 1; i < end - 1; ++i) {
      const distSq = this.distanceToSegmentSq(points[i], s, e);
      if (distSq > maxDistSq) {
        maxDistSq = distSq;
        maxNdx = i;
      }
    }
    // if that point is too far
    if (Math.sqrt(maxDistSq) > epsilon) {
      // split
      this.simplifyPoints(points, start, maxNdx + 1, epsilon, outPoints);
      this.simplifyPoints(points, maxNdx, end, epsilon, outPoints);
    } else {
      // add the 2 end points
      outPoints.push(s, e);
    }

    return outPoints;
  }

  /**
   * function that computes the distance squared from a point to a line segment
   * @param {*} p
   * @param {*} v
   * @param {*} w
   */
  distanceToSegmentSq(p, v, w) {
    const l2 = this.distanceSq(v, w);
    if (l2 === 0) {
      return this.distanceSq(p, v);
    }
    let t =
      ((p[0] - v[0]) * (w[0] - v[0]) + (p[1] - v[1]) * (w[1] - v[1])) / l2;
    t = Math.max(0, Math.min(1, t));
    return this.distanceSq(p, this.lerp(v, w, t));
  }

  /**
   * Linear Interpolation
   * @param {*} a
   * @param {*} b
   * @param {*} t
   */
  lerp(a, b, t) {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  }

  /**
   * compute the distance squared between a and b
   * @param {*} a
   * @param {*} b
   */
  distanceSq(a, b) {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    return dx * dx + dy * dy;
  }

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
  getSpirographPoints(R, r, p, reps) {
    // parametric equations
    //x(t)=(R+r)cos(t) + p*cos((R+r)t/r)
    const x = t => (R + r) * Math.cos(t) + p * Math.cos((R + r) * (t / r));
    //y(t)=(R+r)sin(t) + p*sin((R+r)t/r)
    const y = t => (R + r) * Math.sin(t) + p * Math.sin((R + r) * (t / r));

    const w = this.gl.canvas.width;
    const h = this.gl.canvas.height;
    const array = this.range(0, reps, 0.08);
    // const array = this.range(0, reps, 0.1).map(
    //   t => t + this.noiseGenerator.noise1(t) * 10
    // );
    const allPoints = array.map(t => [x(t) + w / 2, y(t) + h / 2]);
    return this.simplifyPoints(allPoints, 0, allPoints.length, 1).flat();
  }
}
customElements.define("mm-spirograph", Spirograph);

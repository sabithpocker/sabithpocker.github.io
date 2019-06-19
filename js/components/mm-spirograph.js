/**
 * A custom component that renders a spirograph
 */
class Spirograph extends HTMLElement {
  get perm() {
    return [
      151,
      160,
      137,
      91,
      90,
      15,
      131,
      13,
      201,
      95,
      96,
      53,
      194,
      233,
      7,
      225,
      140,
      36,
      103,
      30,
      69,
      142,
      8,
      99,
      37,
      240,
      21,
      10,
      23,
      190,
      6,
      148,
      247,
      120,
      234,
      75,
      0,
      26,
      197,
      62,
      94,
      252,
      219,
      203,
      117,
      35,
      11,
      32,
      57,
      177,
      33,
      88,
      237,
      149,
      56,
      87,
      174,
      20,
      125,
      136,
      171,
      168,
      68,
      175,
      74,
      165,
      71,
      134,
      139,
      48,
      27,
      166,
      77,
      146,
      158,
      231,
      83,
      111,
      229,
      122,
      60,
      211,
      133,
      230,
      220,
      105,
      92,
      41,
      55,
      46,
      245,
      40,
      244,
      102,
      143,
      54,
      65,
      25,
      63,
      161,
      1,
      216,
      80,
      73,
      209,
      76,
      132,
      187,
      208,
      89,
      18,
      169,
      200,
      196,
      135,
      130,
      116,
      188,
      159,
      86,
      164,
      100,
      109,
      198,
      173,
      186,
      3,
      64,
      52,
      217,
      226,
      250,
      124,
      123,
      5,
      202,
      38,
      147,
      118,
      126,
      255,
      82,
      85,
      212,
      207,
      206,
      59,
      227,
      47,
      16,
      58,
      17,
      182,
      189,
      28,
      42,
      223,
      183,
      170,
      213,
      119,
      248,
      152,
      2,
      44,
      154,
      163,
      70,
      221,
      153,
      101,
      155,
      167,
      43,
      172,
      9,
      129,
      22,
      39,
      253,
      19,
      98,
      108,
      110,
      79,
      113,
      224,
      232,
      178,
      185,
      112,
      104,
      218,
      246,
      97,
      228,
      251,
      34,
      242,
      193,
      238,
      210,
      144,
      12,
      191,
      179,
      162,
      241,
      81,
      51,
      145,
      235,
      249,
      14,
      239,
      107,
      49,
      192,
      214,
      31,
      181,
      199,
      106,
      157,
      184,
      84,
      204,
      176,
      115,
      121,
      50,
      45,
      127,
      4,
      150,
      254,
      138,
      236,
      205,
      93,
      222,
      114,
      67,
      29,
      24,
      72,
      243,
      141,
      128,
      195,
      78,
      66,
      215,
      61,
      156,
      180,
      151,
      160,
      137,
      91,
      90,
      15,
      131,
      13,
      201,
      95,
      96,
      53,
      194,
      233,
      7,
      225,
      140,
      36,
      103,
      30,
      69,
      142,
      8,
      99,
      37,
      240,
      21,
      10,
      23,
      190,
      6,
      148,
      247,
      120,
      234,
      75,
      0,
      26,
      197,
      62,
      94,
      252,
      219,
      203,
      117,
      35,
      11,
      32,
      57,
      177,
      33,
      88,
      237,
      149,
      56,
      87,
      174,
      20,
      125,
      136,
      171,
      168,
      68,
      175,
      74,
      165,
      71,
      134,
      139,
      48,
      27,
      166,
      77,
      146,
      158,
      231,
      83,
      111,
      229,
      122,
      60,
      211,
      133,
      230,
      220,
      105,
      92,
      41,
      55,
      46,
      245,
      40,
      244,
      102,
      143,
      54,
      65,
      25,
      63,
      161,
      1,
      216,
      80,
      73,
      209,
      76,
      132,
      187,
      208,
      89,
      18,
      169,
      200,
      196,
      135,
      130,
      116,
      188,
      159,
      86,
      164,
      100,
      109,
      198,
      173,
      186,
      3,
      64,
      52,
      217,
      226,
      250,
      124,
      123,
      5,
      202,
      38,
      147,
      118,
      126,
      255,
      82,
      85,
      212,
      207,
      206,
      59,
      227,
      47,
      16,
      58,
      17,
      182,
      189,
      28,
      42,
      223,
      183,
      170,
      213,
      119,
      248,
      152,
      2,
      44,
      154,
      163,
      70,
      221,
      153,
      101,
      155,
      167,
      43,
      172,
      9,
      129,
      22,
      39,
      253,
      19,
      98,
      108,
      110,
      79,
      113,
      224,
      232,
      178,
      185,
      112,
      104,
      218,
      246,
      97,
      228,
      251,
      34,
      242,
      193,
      238,
      210,
      144,
      12,
      191,
      179,
      162,
      241,
      81,
      51,
      145,
      235,
      249,
      14,
      239,
      107,
      49,
      192,
      214,
      31,
      181,
      199,
      106,
      157,
      184,
      84,
      204,
      176,
      115,
      121,
      50,
      45,
      127,
      4,
      150,
      254,
      138,
      236,
      205,
      93,
      222,
      114,
      67,
      29,
      24,
      72,
      243,
      141,
      128,
      195,
      78,
      66,
      215,
      61,
      156,
      180
    ];
  }
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
   * Vertex Shader Program for WebGL
   */
  get vertexShaderSource() {
    return `#version 300 es

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
      v_color = gl_Position * 0.5 + 0.5;
    }
    `;
  }

  /**
   * Fragment Shader Progrm for WebGL
   */
  get fragmentShaderSource() {
    return `#version 300 es
  
    precision mediump float;

    in vec4 v_color;

    uniform vec4 u_color;
    
    // we need to declare an output for the fragment shader
    out vec4 outColor;
    
    void main() {
      outColor = v_color;
    }
    `;
  }

  /**
   * Constructor function
   */
  constructor() {
    super();
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
   * No idea what this is
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
    const array = this.range(0, reps, 0.1).map(t => t + this.noise1(t));
    const allPoints = array.map(t => [x(t) + w / 2, y(t) + h / 2]);
    return this.simplifyPoints(allPoints, 0, allPoints.length, 1).flat();
  }
  //---------------------------------------------------------------------
  /** 1D float Perlin noise, SL "noise()"
   */
  noise1(x) {
    let ix0, ix1;
    let fx0, fx1;
    let s, n0, n1;

    ix0 = Math.floor(x); // Integer part of x
    fx0 = x - ix0; // Fractional part of x
    fx1 = fx0 - 1.0;
    ix1 = (ix0 + 1) & 0xff;
    ix0 = ix0 & 0xff; // Wrap to 0..255

    s = this.fade(fx0);

    n0 = this.grad1(this.perm[ix0], fx0);
    n1 = this.grad1(this.perm[ix1], fx1);
    return this.scale(0.188 * this.lerp2(s, n0, n1));
  }
  //---------------------------------------------------------------------
  /** 2D float Perlin noise.
   */
  noise2(x, y) {
    let ix0, iy0, ix1, iy1;
    let fx0, fy0, fx1, fy1;
    let s, t, nx0, nx1, n0, n1;

    ix0 = Math.floor(x); // Integer part of x
    iy0 = Math.floor(y); // Integer part of y
    fx0 = x - ix0; // Fractional part of x
    fy0 = y - iy0; // Fractional part of y
    fx1 = fx0 - 1.0;
    fy1 = fy0 - 1.0;
    ix1 = (ix0 + 1) & 0xff; // Wrap to 0..255
    iy1 = (iy0 + 1) & 0xff;
    ix0 = ix0 & 0xff;
    iy0 = iy0 & 0xff;

    t = this.fade(fy0);
    s = this.fade(fx0);

    nx0 = this.grad2(this.perm[ix0 + this.perm[iy0]], fx0, fy0);
    nx1 = this.grad2(this.perm[ix0 + this.perm[iy1]], fx0, fy1);
    n0 = this.lerp2(t, nx0, nx1);

    nx0 = this.grad2(this.perm[ix1 + this.perm[iy0]], fx1, fy0);
    nx1 = this.grad2(this.perm[ix1 + this.perm[iy1]], fx1, fy1);
    n1 = this.lerp2(t, nx0, nx1);

    return this.scale(0.507 * this.lerp2(s, n0, n1));
  }
  grad1(hash, x) {
    let h = hash & 15;
    let grad = 1.0 + (h & 7); // Gradient value 1.0, 2.0, ..., 8.0
    if (h & 8) grad = -grad; // and a random sign for the gradient
    return grad * x; // Multiply the gradient with the distance
  }

  fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  lerp2(t, a, b) {
    return a + t * (b - a);
  }

  scale(n) {
    return (1 + n) / 2;
  }

  grad2(hash, x, y) {
    let h = hash & 7; // Convert low 3 bits of hash code
    let u = h < 4 ? x : y; // into 8 simple gradient directions,
    let v = h < 4 ? y : x; // and compute the dot product with (x,y).
    return (h & 1 ? -u : u) + (h & 2 ? -2.0 * v : 2.0 * v);
  }
}
customElements.define("mm-spirograph", Spirograph);

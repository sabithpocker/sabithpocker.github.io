/**
 * A custom component that renders a Sierpinski Fractal
 */
class Sierpinski extends HTMLElement {
  /**
   * Constructor function
   */
  constructor() {
    super();
    this.simpleShader = null;
    this.vertexShaderSource = `
        attribute vec2 a_position;
        varying vec4 v_color;
        uniform vec2 u_resolution;
       
        void main() {
          // convert the position from pixels to 0.0 to 1.0
          vec2 zeroToOne = a_position / u_resolution;
       
          // convert from 0->1 to 0->2
          vec2 zeroToTwo = zeroToOne * 2.0;
       
          // convert from 0->2 to -1->+1 (clipspace)
          vec2 clipSpace = zeroToTwo - 1.0;
       
          gl_Position = vec4(clipSpace, 0, 1);
      
          v_color = vec4(0.5, 0.5, 0.5, 1);
        }
        `;
    this.fragmentShaderSource = `
        // fragment shaders don't have a default precision so we need
        // to pick one. mediump is a good default
        precision mediump float;
        uniform vec4 u_color;
        varying vec4 v_color;
        void main() {
          // gl_FragColor is a special variable a fragment shader
          // is responsible for setting
          gl_FragColor = v_color; // return redish-purple
        }
        `;

    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
        <canvas data-canvas></canvas>
        <style>
        :host {
          display: grid;
        }
        canvas {
          width: 100%;
          min-height: 100%;
        }
        `;
    // this.initializeWebGL();
  }
  /**
   * Callback when the element is mounted to DOM
   */
  connectedCallback() {
    this.initializeWebGL();
    this.drawSierpinski();
  }
  initializeWebGL() {
    // Get A WebGL context
    const canvas = this.shadowRoot.querySelector("[data-canvas]");
    this.gl = canvas.getContext("webgl");
    // this.clearCanvas([1, 0, 1, 1], this.gl);
    const program = this.getProgram(
      this.gl,
      this.vertexShaderSource,
      this.fragmentShaderSource
    );
    const positionAttributeLocation = this.gl.getAttribLocation(
      program,
      "a_position"
    );
    const resolutionUniformLocation = this.gl.getUniformLocation(
      program,
      "u_resolution"
    );
    const colorUniformLocation = this.gl.getUniformLocation(program, "u_color");
    const positionBuffer = this.gl.createBuffer();

    this.simpleShader = {
      program: program,
      positionAttributeLocation: positionAttributeLocation,
      resolutionUniformLocation: resolutionUniformLocation,
      colorUniformLocation: colorUniformLocation,
      positionBuffer: positionBuffer,
    };

    this.gl.useProgram(program);
    this.resize(this.gl.canvas);
    // Tell Webthis.GL how to convert from clip space to pixels
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
    // set the resolution
    this.gl.uniform2f(
      resolutionUniformLocation,
      this.gl.canvas.width,
      this.gl.canvas.height
    );
    // Set a random color.
    this.gl.uniform4f(colorUniformLocation, 0.1, 0.2, 0.5, 1);
    this.gl.enableVertexAttribArray(positionAttributeLocation);
    // Bind the position buffer.
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
  }

  drawSierpinski() {
    console.log("draw sierpinski");
    const width = this.gl.canvas.width;
    const height = this.gl.canvas.height;
    const side = Math.min(width, height) - 100;
    const altitude = (Math.sqrt(3) / 2) * side;
    const center = { x: width / 2, y: altitude / 2 };
    const points = this.getEquilateralPoints(center, side);
    const childPoints = this.getChildTrianglePoints(points, 5);
    childPoints.forEach((points) =>
      this.drawTriangle(this.simpleShader, ...points)
    );
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
  clearCanvas(color = [0, 0, 0, 0], gl) {
    // Clear the canvas
    gl.clearColor(...color);
    gl.clear(gl.COLOR_BUFFER_BIT);
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
  createProgram(gl, vertexShader, fragmentShader) {
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    var success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
      return program;
    }

    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
  }

  getEquilateralPoints(center, side) {
    return [
      center.x,
      center.y + (Math.sqrt(3) / 3) * side,
      center.x - side / 2,
      center.y - (Math.sqrt(3) / 6) * side,
      center.x + side / 2,
      center.y - (Math.sqrt(3) / 6) * side,
    ];
  }

  getChildTrianglePoints(points, depth = 0) {
    if (depth === 0) {
      return [
        [
          points[0],
          points[1],
          (points[0] + points[2]) / 2,
          (points[1] + points[3]) / 2,
          (points[0] + points[4]) / 2,
          (points[1] + points[5]) / 2,
        ],
        [
          points[2],
          points[3],
          (points[0] + points[2]) / 2,
          (points[1] + points[3]) / 2,
          (points[2] + points[4]) / 2,
          (points[3] + points[5]) / 2,
        ],
        [
          points[4],
          points[5],
          (points[0] + points[4]) / 2,
          (points[1] + points[5]) / 2,
          (points[2] + points[4]) / 2,
          (points[3] + points[5]) / 2,
        ],
      ];
    } else {
      const xpoints = [...this.getChildTrianglePoints(points, depth - 1)];
      return xpoints.reduce(
        (acc, point) => [...acc, ...this.getChildTrianglePoints(point)],
        []
      );
    }
  }

  drawTriangle(shader, x1, y1, x2, y2, x3, y3) {
    // setRectangle(gl,600,600,100,100);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array([x1, y1, x2, y2, x3, y3]),
      this.gl.STATIC_DRAW
    );

    // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    const size = 2; // 2 components per iteration
    const type = this.gl.FLOAT; // the data is 32bit floats
    const normalize = false; // don't normalize the data
    const stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
    const offset = 0; // start at the beginning of the buffer
    this.gl.vertexAttribPointer(
      shader.positionAttributeLocation,
      size,
      type,
      normalize,
      stride,
      offset
    );

    this.renderTriangle(this.gl);
  }

  renderTriangle(gl) {
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 3;
    gl.drawArrays(primitiveType, offset, count);
  }
}
customElements.define("mm-sierpinski", Sierpinski);

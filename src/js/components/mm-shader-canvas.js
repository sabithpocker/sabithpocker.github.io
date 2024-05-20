class ShaderCanvas extends HTMLElement {
    /**
     * devicePixelRatio
     */
    get ratio() {
        return window.devicePixelRatio || 1;
    }

    static get observedAttributes() {
        return ['vertex-shader', 'fragment-shader', 'color'];
    }

    constructor() {
        super();
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

        // Get canvas element
        const canvas = this.shadowRoot.querySelector('canvas');

        // Get WebGL2 context
        const gl = canvas.getContext('webgl2');
        if (!gl) {
            console.error('WebGL2 not supported');
            return;
        }

        this._vertexShaderSource = null;
        this._fragmentShaderSource = null;
        this._color = '#000000';
        this.canvas = canvas;
        this.gl = gl;

        this.initializeWebGL();
        this.updateCanvasSize();
        this.render(0);
    }

    createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (success) {
            return shader;
        }
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
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
        console.error(gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
    }

    // Utility function to convert hex color to RGB
    hexToRgb(hex) {
        const bigint = parseInt(hex.slice(1), 16);
        const r = ((bigint >> 16) & 255) / 255;
        const g = ((bigint >> 8) & 255) / 255;
        const b = (bigint & 255) / 255;
        return [r, g, b];
    }

    updateCanvasSize() {
        const ratio = this.ratio;
        this.canvas.width = this.canvas.clientWidth * ratio;
        this.canvas.height = this.canvas.clientHeight * ratio;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    initializeWebGL() {
        const gl = this.gl;

        // Define shaders
        const vertexShaderSource = this.vertexShaderSource;
        const fragmentShaderSource = this.fragmentShaderSource;

        const vertexShader = this.createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

        // Create program
        this.program = this.createProgram(gl, vertexShader, fragmentShader);

        // Look up the locations of the attributes and uniforms
        this.positionAttributeLocation = gl.getAttribLocation(this.program, 'a_position');
        this.colorUniformLocation = gl.getUniformLocation(this.program, 'u_color');
        this.resolutionUniformLocation = gl.getUniformLocation(this.program, 'u_resolution');
        this.timeUniformLocation = gl.getUniformLocation(this.program, 'u_time'); // Add this line

        // Create a buffer to put positions in
        this.positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    }

    render(timestamp) {
        const gl = this.gl;

        // Define positions in pixel space to cover the entire canvas
        const positions = [
            0, 0,
            gl.canvas.width, 0,
            0, gl.canvas.height,
            0, gl.canvas.height,
            gl.canvas.width, 0,
            gl.canvas.width, gl.canvas.height,
        ];

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

        // Tell WebGL how to take data from the buffer and supply it to the attribute
        gl.enableVertexAttribArray(this.positionAttributeLocation);
        gl.vertexAttribPointer(this.positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

        // Tell WebGL to use our program
        gl.useProgram(this.program);

        // Set the resolution uniform
        gl.uniform2f(this.resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

        // Set the color uniform
        const color = this.color || [1, 0, 0, 1];
        gl.uniform4f(this.colorUniformLocation, color[0], color[1], color[2], color[3]);

        // Set the time uniform
        gl.uniform1f(this.timeUniformLocation, timestamp * 0.001); // Convert to seconds

        // Clear the canvas
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Draw the rectangle
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        requestAnimationFrame(this.render.bind(this));
    }

    get vertexShaderSource() {
        return this._vertexShaderSource || `#version 300 es
            in vec4 a_position;
            void main() {
                gl_Position = a_position;
            }
        `;
    }

    set vertexShaderSource(newValue) {
        this._vertexShaderSource = newValue;
        this.initializeWebGL();
    }

    get fragmentShaderSource() {
        return this._fragmentShaderSource || `#version 300 es
        precision mediump float;
        uniform vec4 u_color;
        uniform float u_time; // Add this line
        out vec4 outColor;
        void main() {
            outColor = u_color;
        }
        `;
    }

    set fragmentShaderSource(newValue) {
        this._fragmentShaderSource = newValue;
        this.initializeWebGL();
    }

    set color(value) {
        this._color = this.hexToRgb(value);
        this.initializeWebGL();
    }

    get color() {
        return this._color;
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'vertex-shader') {
            this.vertexShaderSource = newValue;
        } else if (name === 'fragment-shader') {
            this.fragmentShaderSource = newValue;
        } else if (name === 'color') {
            this.color = newValue;
        }

        this.initializeWebGL();
        this.updateCanvasSize();
        this.render(0);
    }

    connectedCallback() {
        this.updateCanvasSize();
        window.addEventListener('resize', () => {
            this.updateCanvasSize();
        });
        requestAnimationFrame(this.render.bind(this));
    }
}

customElements.define('mm-shader-canvas', ShaderCanvas);

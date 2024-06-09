import fragmentShaderSource from "../shaders/fragment-shaders/fragment-shader-source.js";
import gradientShader from "../shaders/fragment-shaders/gradient-shader.js";

class Sierpinski extends HTMLElement {
    constructor() {
        super();
        this.simpleShader = null;
        this.defaultVertexShaderSource = gradientShader || `
        attribute vec2 a_position;
        varying vec4 v_color;
        uniform vec2 u_resolution;
        uniform float u_time;
       
        void main() {
          vec2 zeroToOne = a_position / u_resolution;
          vec2 zeroToTwo = zeroToOne * 2.0;
          vec2 clipSpace = zeroToTwo - 1.0;
          gl_Position = vec4(clipSpace, 0, 1);
          v_color = vec4(0.5 + 0.5 * sin(u_time), 0.5 + 0.5 * cos(u_time), 0.5, 1);
        }
        `;
        this.defaultFragmentShaderSource = fragmentShaderSource || `
        precision mediump float;
        uniform vec4 u_color;
        varying vec4 v_color;
        void main() {
          gl_FragColor = v_color;
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
        </style>
        `;
    }

    connectedCallback() {
        const depth = parseInt(this.getAttribute('depth')) || 5;
        const minSideLength = parseInt(this.getAttribute('min-side-length')) || 500;
        const maxSideLength = parseInt(this.getAttribute('max-side-length')) || 600;
        const color = this.getAttribute('color') || '0.1, 0.2, 0.5';

        this.vertexShaderSource = this.getAttribute('vertex-shader-source') || this.defaultVertexShaderSource;
        this.fragmentShaderSource = this.getAttribute('fragment-shader-source') || this.defaultFragmentShaderSource;

        this.initializeWebGL();
        this.drawSierpinski(depth, minSideLength, maxSideLength, color);
        this.render(0);
    }

    initializeWebGL() {
        const canvas = this.shadowRoot.querySelector("[data-canvas]");
        this.resize(canvas);
        this.gl = canvas.getContext("webgl2");

        const program = this.getProgram(this.gl, this.vertexShaderSource, this.fragmentShaderSource);

        const positionAttributeLocation = this.gl.getAttribLocation(program, 'a_position');
        const resolutionUniformLocation = this.gl.getUniformLocation(program, 'u_resolution');
        const colorUniformLocation = this.gl.getUniformLocation(program, 'u_color');
        this.timeLocation = this.gl.getUniformLocation(program, 'u_time');
        const positionBuffer = this.gl.createBuffer();

        this.simpleShader = {
            program: program,
            positionAttributeLocation: positionAttributeLocation,
            resolutionUniformLocation: resolutionUniformLocation,
            colorUniformLocation: colorUniformLocation,
            positionBuffer: positionBuffer
        };

        this.gl.useProgram(program);
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
        this.gl.uniform2f(resolutionUniformLocation, this.gl.canvas.width, this.gl.canvas.height);
        this.gl.uniform4f(colorUniformLocation, 0.1, 0.2, 0.5, 1);
        this.gl.enableVertexAttribArray(positionAttributeLocation);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
    }

    drawSierpinski(depth, minSideLength, maxSideLength, color) {
        const width = this.gl.canvas.width;
        const height = this.gl.canvas.height;
        const side = height;
        const altitude = (Math.sqrt(3) / 2) * side;
        const center = { x: width / 2, y: altitude / 2 };
        const points = this.getEquilateralPoints(center, side);
        const childPoints = this.getChildTrianglePoints(points, depth);
        const colorArray = color.split(',').map(parseFloat);

        childPoints.forEach(points => this.drawTriangle(this.simpleShader, ...points, colorArray));
    }

    getRandomSideLength(min, max) {
        return Math.random() * (max - min) + min;
    }

    getProgram(gl, vertexShaderSource, fragmentShaderSource) {
        const vertexShader = this.createShader(this.gl, this.gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.createShader(this.gl, this.gl.FRAGMENT_SHADER, fragmentShaderSource);

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
            console.error(gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
        }
    }

    clearCanvas(color = [0, 0, 0, 0], gl) {
        gl.clearColor(...color);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }

    resize(canvas) {
        const cssToRealPixels = window.devicePixelRatio || 1;
        const displayWidth = Math.floor(canvas.clientWidth * cssToRealPixels);
        const displayHeight = Math.floor(canvas.clientHeight * cssToRealPixels);

        if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
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

        console.error(gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
    }

    getEquilateralPoints(center, side) {
        return [
            center.x, center.y + ((Math.sqrt(3) / 3) * side),
            center.x - (side / 2), center.y - ((Math.sqrt(3) / 6) * side),
            center.x + (side / 2), center.y - ((Math.sqrt(3) / 6) * side)
        ];
    }

    getChildTrianglePoints(points, depth = 0) {
        if (depth === 0) {
            return [[
                points[0], points[1],
                (points[0] + points[2]) / 2, (points[1] + points[3]) / 2,
                (points[0] + points[4]) / 2, (points[1] + points[5]) / 2
            ], [
                points[2], points[3],
                (points[0] + points[2]) / 2, (points[1] + points[3]) / 2,
                (points[2] + points[4]) / 2, (points[3] + points[5]) / 2
            ], [
                points[4], points[5],
                (points[0] + points[4]) / 2, (points[1] + points[5]) / 2,
                (points[2] + points[4]) / 2, (points[3] + points[5]) / 2
            ]];
        } else {
            const xpoints = [...this.getChildTrianglePoints(points, depth - 1)];
            return xpoints.reduce((acc, point) => [...acc, ...this.getChildTrianglePoints(point)], []);
        }
    }

    drawTriangle(shader, x1, y1, x2, y2, x3, y3) {
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([
            x1, y1,
            x2, y2,
            x3, y3
        ]), this.gl.STATIC_DRAW);

        const size = 2;
        const type = this.gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        this.gl.vertexAttribPointer(shader.positionAttributeLocation, size, type, normalize, stride, offset);

        this.renderTriangle(this.gl);
    }

    renderTriangle(gl) {
        var primitiveType = gl.TRIANGLES;
        var offset = 0;
        var count = 3;
        gl.drawArrays(primitiveType, offset, count);
    }

    render(timestamp) {
        this.clearCanvas([0, 0, 0, 0], this.gl);
        this.gl.uniform1f(this.timeLocation, timestamp / 2500.0);
        const depth = parseInt(this.getAttribute('depth')) || 5;
        const minSideLength = parseInt(this.getAttribute('min-side-length')) || 500;
        const maxSideLength = parseInt(this.getAttribute('max-side-length')) || 600;
        const color = this.getAttribute('color') || '0.1, 0.2, 0.5';
        this.drawSierpinski(depth, minSideLength, maxSideLength, color);
        // requestAnimationFrame(this.render.bind(this));
    }
}

customElements.define("mm-sierpinski", Sierpinski);

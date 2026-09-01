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
        this.depth = parseInt(this.getAttribute('depth')) || 5;
        this.color = this.getAttribute('color') || '0.1, 0.2, 0.5';
        // Grid mode: when both are set, render() tiles the canvas with a grid
        // of equilateral triangles (each its own Sierpinski subdivision, with
        // a gap between them) instead of one big triangle - see
        // drawSierpinskiGrid().
        this.gridCols = this.hasAttribute('grid-cols') ? parseInt(this.getAttribute('grid-cols')) : null;
        this.gridRows = this.hasAttribute('grid-rows') ? parseInt(this.getAttribute('grid-rows')) : null;
        this.gap = this.hasAttribute('gap') ? parseFloat(this.getAttribute('gap')) / 100 : 0.15;

        this.vertexShaderSource = this.getAttribute('vertex-shader-source') || this.defaultVertexShaderSource;
        this.fragmentShaderSource = this.getAttribute('fragment-shader-source') || this.defaultFragmentShaderSource;

        this.initializeWebGL();
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

    drawSierpinski(depth, color) {
        const width = this.gl.canvas.width;
        const height = this.gl.canvas.height;
        const side = Math.min(width, height) * 0.75;
        const altitude = (Math.sqrt(3) / 2) * side;
        const center = width < height ? { x: width / 2, y: altitude + (side / 4) } : { x: width / 2, y: altitude - (side / 4) };
        const points = this.getEquilateralPoints(center, side);
        const childPoints = this.getChildTrianglePoints(points, depth);
        const colorArray = color.split(',').map(parseFloat);

        this.drawTrianglesBatch(childPoints.flat(), colorArray);
    }

    // Tiles the canvas with a genuine edge-to-edge triangular tessellation
    // (the {3,6} tiling: each row is a strip of alternating up/down
    // equilateral triangles that share edges with their neighbors, covering
    // the plane with no gaps), then shrinks every triangle toward its own
    // centroid by `gap` for a thin, uniform seam - a packed tiling with
    // breathing room, not independent tiles floating in oversized cells.
    // Each tile is independently Sierpinski-subdivided to depthAt(row, j) (a
    // per-tile depth override, e.g. driven by an external noise-based
    // animation loop - see sierpinski.js - falling back to the flat
    // `this.depth` when not set). All resulting sub-triangles across every
    // tile are batched into a single buffer/draw call, since a real grid at
    // any meaningful depth can produce tens of thousands of tiny triangles -
    // one draw call per triangle would make the toolbar's live sliders
    // unusably slow.
    drawSierpinskiGrid() {
        const width = this.gl.canvas.width;
        const height = this.gl.canvas.height;
        const cols = Math.max(1, this.gridCols);
        const rows = Math.max(1, this.gridRows);
        const side = width / cols;
        const rowHeight = side * (Math.sqrt(3) / 2);
        const gap = Math.min(0.6, Math.max(0, this.gap));
        const colorArray = (this.color || '0.1, 0.2, 0.5').split(',').map(parseFloat);
        const depthAt = this.tileDepthFn || (() => this.depth);

        const triangles = [];
        for (let row = 0; row < rows; row++) {
            const yTop = row * rowHeight;
            const yBottom = yTop + rowHeight;
            if (yTop > height) break;

            // Starts one triangle early (j = -1, a "down" triangle centered
            // on x = 0) so the left edge is capped by a clipped half-triangle
            // matching the one the row already produces on the right (the
            // last "down" triangle's base extends half a side past `width`)
            // - without this the row is missing exactly that left-edge half.
            for (let j = -1; j < cols * 2; j++) {
                const x0 = j * (side / 2);
                const pointingUp = j % 2 === 0;
                const base = pointingUp
                    ? [x0, yBottom, x0 + side, yBottom, x0 + side / 2, yTop]
                    : [x0, yTop, x0 + side, yTop, x0 + side / 2, yBottom];
                const gapped = this.shrinkTowardCentroid(base, gap);
                const depth = Math.max(0, Math.round(depthAt(row, j)));
                this.getChildTrianglePoints(gapped, depth).forEach(t => triangles.push(...t));
            }
        }

        this.drawTrianglesBatch(triangles, colorArray);
    }

    // Moves each vertex of a triangle toward its own centroid by `gap`
    // (0..1) - shrinking a triangle this way, rather than toward some outer
    // cell's center, leaves a symmetric seam on every edge so neighboring
    // tiles in a tessellation stay evenly spaced instead of drifting apart.
    shrinkTowardCentroid(points, gap) {
        const cx = (points[0] + points[2] + points[4]) / 3;
        const cy = (points[1] + points[3] + points[5]) / 3;
        const scale = 1 - gap;
        return [
            cx + (points[0] - cx) * scale, cy + (points[1] - cy) * scale,
            cx + (points[2] - cx) * scale, cy + (points[3] - cy) * scale,
            cx + (points[4] - cx) * scale, cy + (points[5] - cy) * scale,
        ];
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

    // Batched version of drawTriangle(): uploads every triangle's vertices in
    // one buffer and issues a single drawArrays(TRIANGLES,...) call instead
    // of one bufferData+drawArrays pair per triangle.
    drawTrianglesBatch(flatPoints, colorArray = []) {
        if (flatPoints.length === 0) return;
        if (colorArray.length >= 3) {
            this.gl.uniform4f(this.simpleShader.colorUniformLocation, colorArray[0], colorArray[1], colorArray[2], colorArray[3] ?? 1);
        }
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(flatPoints), this.gl.STATIC_DRAW);
        this.gl.vertexAttribPointer(this.simpleShader.positionAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.drawArrays(this.gl.TRIANGLES, 0, flatPoints.length / 2);
    }

    render(timestamp) {
        this.clearCanvas([0, 0, 0, 0], this.gl);
        this.gl.uniform1f(this.timeLocation, (timestamp || 0) / 2500.0);
        if (this.gridCols && this.gridRows) {
            this.drawSierpinskiGrid();
        } else {
            this.drawSierpinski(this.depth, this.color || '0.1, 0.2, 0.5');
        }
    }
}

customElements.define("mm-sierpinski", Sierpinski);

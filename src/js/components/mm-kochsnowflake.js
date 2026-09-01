// Koch Snowflake web component: an equilateral triangle whose three sides
// are each recursively subdivided into a Koch curve bumping outward, the
// classic closed Koch snowflake shape - as opposed to mm-kochcode.js, which
// tiles a grid with individual open Koch-curve edges. Shares the same WebGL
// boilerplate/subdivision technique as mm-kochcode.js, kept as an
// independent component (matching this codebase's convention of
// self-contained per-component WebGL setup, e.g. mm-sierpinski.js) rather
// than bolted onto it as another mode.

const fragmentShaderSource = `
  precision highp float;
  uniform vec4 u_color;
  void main() {
    gl_FragColor = u_color;
  }`;
const vertexShaderSource = `
  attribute vec2 a_position;
  uniform vec4 u_color;
  uniform vec2 u_resolution;

  void main() {
    vec2 zeroToOne = a_position / u_resolution;
    vec2 zeroToTwo = zeroToOne * 2.0;
    vec2 clipSpace = zeroToTwo - 1.0;
    gl_Position = vec4(clipSpace, 0, 1);
  }
  `;

// Bright, saturated swatches only - no dark/brown/muddy tones - reads well
// tiled across a whole grid against the black background.
const paletteHex = [
    '#00e5ff', '#7cffcb', '#ffe066', '#ff6f91', '#a685e2', '#5ee7df', '#ff9f45', '#c58cff'
];

function hexToRgbA(hex) {
    var c;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        c = hex.substring(1).split('');
        if (c.length == 3) {
            c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c = '0x' + c.join('');
        return { r: (c >> 16) & 255, g: (c >> 8) & 255, b: c & 255, a: 1 };
    }
    throw new Error('Bad Hex');
}
function getColorRBGA(rgba) {
    return [rgba.r / 255, rgba.g / 255, rgba.b / 255, rgba.a];
}

// Classic Koch subdivision: given a segment [Ax,Ay,Bx,By], returns the 4
// sub-segments with the middle point bumped out along the segment's
// perpendicular (V). Traversing a polygon's edges in a consistent winding
// order and applying this same subdivision to each makes every edge bump to
// the same (outward) side.
function generateChildren(points) {
    const [Ax, Ay, Bx, By] = points;
    const [Ux, Uy] = [Bx - Ax, By - Ay];
    // Sign chosen (and verified in-browser) to bump outward for the
    // clockwise-on-screen vertex winding getTrianglePoints()/
    // getSnowflakeSegments() produce below.
    const [Vx, Vy] = [By - Ay, Ax - Bx];

    const Px = Ax + (1 / 3) * Ux, Py = Ay + (1 / 3) * Uy;
    const [Qx, Qy] = [Ax + (1 / 2) * Ux + (Math.sqrt(3) / 6) * Vx, Ay + (1 / 2) * Uy + (Math.sqrt(3) / 6) * Vy];
    const [Rx, Ry] = [Ax + (2 / 3) * Ux, Ay + (2 / 3) * Uy];

    return [
        [Ax, Ay, Px, Py],
        [Px, Py, Qx, Qy],
        [Qx, Qy, Rx, Ry],
        [Rx, Ry, Bx, By]
    ];
}

class MMKochSnowflake extends HTMLElement {
    static get observedAttributes() {
        return ['levels', 'grid-cols', 'grid-rows'];
    }

    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        this.canvas = document.createElement('canvas');
        this.canvas.classList.add('l__canvas');
        shadow.innerHTML = `<style>
        :host {
          display: grid;
        }
        canvas {
          width: 100%;
          min-height: 100%;
        }
        </style>`;
        shadow.appendChild(this.canvas);

        this.RGBAPalette = paletteHex.map(hex => getColorRBGA(hexToRgbA(hex)));
        this.levels = this.hasAttribute('levels') ? parseInt(this.getAttribute('levels')) : 3;
        this.paletteIndex = 0;
        // Grid mode: when both are set, paint() tiles the canvas with many
        // small snowflakes (see paintGrid()) instead of one big centered one.
        this.gridCols = this.hasAttribute('grid-cols') ? parseInt(this.getAttribute('grid-cols')) : null;
        this.gridRows = this.hasAttribute('grid-rows') ? parseInt(this.getAttribute('grid-rows')) : null;
    }

    connectedCallback() {
        this.initialize(this.canvas);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'levels') {
            this.levels = parseInt(newValue) || 0;
        } else if (name === 'grid-cols') {
            this.gridCols = newValue ? parseInt(newValue) : null;
        } else if (name === 'grid-rows') {
            this.gridRows = newValue ? parseInt(newValue) : null;
        }
        // observedAttributes fires this for attributes present in the initial
        // markup before connectedCallback ever runs, when this.gl doesn't
        // exist yet - only repaint once WebGL is actually initialized.
        if (this.gl) {
            this.paint(this.gl, this.simpleShader);
        }
    }

    initialize(canvas) {
        const { gl, simpleShader } = this.initializeWebGL(canvas);
        this.gl = gl;
        this.simpleShader = simpleShader;
        this.paint(gl, simpleShader);
    }

    getWebGLContext(canvas) {
        const gl = canvas.getContext('webgl', { antialias: true });
        if (!gl) {
            console.error('WEBGL not available');
        }
        return gl;
    }

    resize(gl) {
        const realToCSSPixels = window.devicePixelRatio;
        const displayWidth = Math.floor(gl.canvas.clientWidth * realToCSSPixels);
        const displayHeight = Math.floor(gl.canvas.clientHeight * realToCSSPixels);
        if (gl.canvas.width !== displayWidth || gl.canvas.height !== displayHeight) {
            gl.canvas.width = displayWidth;
            gl.canvas.height = displayHeight;
        }
    }

    clearCanvas(gl, color = [0, 0, 0, 1]) {
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(...color);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }

    createProgram(gl, vertexShader, fragmentShader) {
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
            return program;
        }
        console.error(gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
    }

    createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            return shader;
        }
        console.log('Create Shader ERROR: ', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
    }

    changeColor(r = 0, g = 0, b = 0, a = 1) {
        this.gl.uniform4f(this.simpleShader.colorUniformLocation, r, g, b, a);
    }

    initializeWebGL(canvas, color = [0, 0, 0, 1]) {
        const gl = this.getWebGLContext(canvas);
        this.resize(gl);
        this.clearCanvas(gl, color);
        const program = this.createProgram(
            gl,
            this.createShader(gl, gl.VERTEX_SHADER, vertexShaderSource),
            this.createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)
        );
        const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
        const resolutionUniformLocation = gl.getUniformLocation(program, 'u_resolution');
        const colorUniformLocation = gl.getUniformLocation(program, 'u_color');
        const positionBuffer = gl.createBuffer();
        const simpleShader = {
            program, positionAttributeLocation, resolutionUniformLocation, colorUniformLocation, positionBuffer
        };
        gl.useProgram(program);
        gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
        gl.uniform4f(colorUniformLocation, 0, 0, 0, 1);
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

        return { gl, simpleShader };
    }

    // Triangle vertices in a consistent winding so generateChildren() bumps
    // every edge outward (empirically confirmed, not just assumed - see the
    // in-browser render check when this was built).
    getTrianglePoints(center, side) {
        const r = side / Math.sqrt(3);
        return [
            [center.x, center.y - r],
            [center.x + side / 2, center.y + r / 2],
            [center.x - side / 2, center.y + r / 2],
        ];
    }

    getSnowflakeSegments(center, side, depth) {
        const verts = this.getTrianglePoints(center, side);
        const edges = [
            [...verts[0], ...verts[1]],
            [...verts[1], ...verts[2]],
            [...verts[2], ...verts[0]],
        ];
        let segments = [];
        edges.forEach(edge => {
            let subs = [edge];
            for (let i = 0; i < depth; i++) {
                subs = subs.reduce((acc, s) => acc.concat(generateChildren(s)), []);
            }
            segments = segments.concat(subs);
        });
        return segments;
    }

    paint(gl, simpleShader) {
        if (this.gridCols && this.gridRows) {
            this.paintGrid(gl, simpleShader);
            return;
        }
        this.clearCanvas(gl, [0, 0, 0, 1]);
        const width = gl.canvas.width;
        const height = gl.canvas.height;
        const side = Math.min(width, height) * 0.8;
        const center = { x: width / 2, y: height / 2 };
        const segments = this.getSnowflakeSegments(center, side, Math.max(0, this.levels));

        this.changeColor(...this.RGBAPalette[this.paletteIndex % this.RGBAPalette.length]);
        this.drawLines(gl, simpleShader, segments);
    }

    // Tiles the canvas with a grid of small snowflakes, each independently
    // recursed to depthAt(row, col) (a per-tile override, e.g. driven by an
    // external noise-based animation loop - see koch-snowflake.js - falling
    // back to the flat `this.levels` when not set). All segments sharing a
    // palette color are batched into one buffer/draw call, since a full grid
    // at real depth can produce tens of thousands of tiny segments - one
    // draw call per segment would make the toolbar's live sliders unusably
    // slow.
    paintGrid(gl, simpleShader) {
        this.clearCanvas(gl, [0, 0, 0, 1]);

        const width = gl.canvas.width;
        const height = gl.canvas.height;
        const cols = Math.max(1, this.gridCols);
        const rows = Math.max(1, this.gridRows);
        // Hexagonal packing: rows are offset by half a column width from
        // their neighbors and spaced by cellW * sqrt(3)/2 instead of cellW,
        // so every tile's 6 nearest neighbors (same row left/right, plus 2
        // above and 2 below) all sit exactly cellW away - the same tight,
        // equal-spacing arrangement circle/hex packing uses, letting the
        // snowflakes' points nestle into their neighbors' gaps instead of
        // floating in the middle of an oversized square cell.
        const cellW = width / cols;
        const rowSpacing = cellW * (Math.sqrt(3) / 2);
        const side = cellW * 0.95;
        const palette = this.RGBAPalette;
        const depthAt = this.tileDepthFn || (() => this.levels);

        const buckets = new Map(); // paletteColorIndex -> flat [x1,y1,x2,y2,...] segments
        for (let row = 0; row < rows; row++) {
            const y = (row + 0.5) * rowSpacing;
            if (y - side > height) break;

            const offsetRow = row % 2 === 1;
            const xStart = offsetRow ? -cellW / 2 : 0;
            const tilesInRow = offsetRow ? cols + 1 : cols;

            for (let col = 0; col < tilesInRow; col++) {
                const center = { x: xStart + (col + 0.5) * cellW, y };
                const depth = Math.max(0, Math.round(depthAt(row, col)));
                const segments = this.getSnowflakeSegments(center, side, depth);
                const key = (row + col) % palette.length;
                const bucket = buckets.get(key) || [];
                segments.forEach(s => bucket.push(...s));
                buckets.set(key, bucket);
            }
        }

        buckets.forEach((flatSegments, colorIndex) => {
            this.changeColor(...palette[colorIndex]);
            this.drawLinesFlat(gl, simpleShader, flatSegments);
        });
    }

    // Batched line draw: uploads every segment's endpoints in one buffer and
    // issues a single drawArrays(LINES,...) call.
    drawLines(gl, shader, segments) {
        const flat = [];
        segments.forEach(s => flat.push(...s));
        this.drawLinesFlat(gl, shader, flat);
    }

    drawLinesFlat(gl, shader, flatPoints) {
        if (flatPoints.length === 0) return;
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flatPoints), gl.STATIC_DRAW);
        gl.vertexAttribPointer(shader.positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.LINES, 0, flatPoints.length / 2);
    }

    // Public hook for external animation loops (mirrors mm-kochcode.js's
    // render()) - call after changing this.levels/gridCols/gridRows/
    // tileDepthFn as properties to redraw without a setAttribute round-trip.
    render() {
        this.paint(this.gl, this.simpleShader);
    }
}

customElements.define('mm-kochsnowflake', MMKochSnowflake);

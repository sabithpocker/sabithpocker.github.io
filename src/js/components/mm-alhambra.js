import PerlinNoise from "../perlin.js";

// Custom debounce function
function debounce(func, wait) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, wait);
    };
}

const defaultPattern = `point1,point2
5,80
54,80
15,54
15,39
39,77
0,77
0,13
1,13
1,74
53,74
16,53
16,40
40,75
4,75
6,67
33,67
9,33
9,47
47,66
3,66
3,19
2,19
2,69
34,69
10,34
10,48
48,72
7,72
7,20
31,61
31,64
15,64
24,54
24,48
48,63
32,63
32,62
16,62
16,59
25,59
25,57
9,57
9,61
15,58
26,58
26,60
10,60`;
class PointsRenderer {
    constructor(pointsCanvas, points, options = {}) {
        this.pointsCanvas = pointsCanvas;
        this.canvas = this.pointsCanvas;
        this.points = points;
        this.isDrawingEnabled = false;
        this.selectedPoints = [];
        this.lineConnections = new Set();
        this.options = {
            dotRadius: 3,
            dotColor: [1.0, 0.4, 0.4, 0.7],
            hoverColor: [1.0, 0.8, 0.4, 0.9],
            selectedColor: [0.4, 1.0, 0.4, 0.9],
            lineColor: [0.0, 1.0, 0.0, 0.8],
            lineWidth: 2, // Add default line width
            hoverScale: 1.5,
            zIndex: 999,
            onLineAdded: null,
            onExportCSV: null,
            onImportCSV: null,
            onDrawingStateChanged: null,
            ...options
        };
        this.gl = this.pointsCanvas.getContext('webgl2', {
            antialias: true,
            alpha: true
        });
        this.setupGL();
        this.setupInteraction();
        this.importFromCSV(defaultPattern);
    }

    setDrawingMode(enabled) {
        this.isDrawingEnabled = enabled;
        if (!enabled) {
            // Clear current drawing state
            this.selectedPoints = [];
            this.updateSelectedStates();
            this.render();
        }
        // Update cursor style
        this.updateCursor();
        // Notify parent component
        if (this.options.onDrawingStateChanged) {
            this.options.onDrawingStateChanged(enabled);
        }
    }
    updateCursor() {
        if (this.isDrawingEnabled) {
            if (this.hoveredPointIndex !== -1) {
                this.canvas.style.cursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%23ffffff" stroke-width="2"><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8" stroke-dasharray="2"/></svg>') 12 12, crosshair`;
            } else {
                this.canvas.style.cursor = 'crosshair';
            }
        } else {
            this.canvas.style.cursor = this.hoveredPointIndex !== -1 ? 'pointer' : 'default';
        }
    }
    // Export lines to CSV format
    exportToCSV() {
        const lines = Array.from(this.lineConnections).map(connection => {
            const [index1, index2] = connection.split(',');
            return `${index1},${index2}`;
        });
        return 'point1,point2\n' + lines.join('\n');
    }
    // Import lines from CSV format
    importFromCSV(csvContent) {
        this.lineConnections.clear();
        this.selectedPoints = [];

        // Skip header and split into lines
        const lines = csvContent.split('\n').slice(1);

        lines.forEach(line => {
            if (line.trim()) {
                const [index1, index2] = line.split(',').map(Number);
                if (!isNaN(index1) && !isNaN(index2)) {
                    // Add to connections
                    this.lineConnections.add(`${index1},${index2}`);
                    // Add to selected points if not already there
                    if (!this.selectedPoints.includes(index1)) {
                        this.selectedPoints.push(index1);
                    }
                    if (!this.selectedPoints.includes(index2)) {
                        this.selectedPoints.push(index2);
                    }
                    // Draw the line
                    const point1 = this.points[index1];
                    const point2 = this.points[index2];
                    if (this.options.onLineAdded) {
                        this.options.onLineAdded(point1, point2);
                    }
                }
            }
        });

        this.updateSelectedStates();
        this.render();
    }

    setupGL() {
        const gl = this.gl;
        if (!this.gl) {
            console.error('WebGL2 not supported');
            return;
        }

        // Create shaders for points
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, `#version 300 es
            layout(location = 0) in vec2 a_position;
            layout(location = 1) in float a_isHovered;
            layout(location = 2) in float a_isSelected;
            
            uniform vec2 u_resolution;
            uniform float u_pointSize;
            uniform float u_hoverScale;
            
            out float v_isHovered;
            out float v_isSelected;
            
            void main() {
                vec2 clipSpace = (a_position / u_resolution) * 2.0 - 1.0;
                gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
                
                v_isHovered = a_isHovered;
                v_isSelected = a_isSelected;
                
                gl_PointSize = u_pointSize * (1.0 + (u_hoverScale - 1.0) * a_isHovered);
            }
        `);
        gl.compileShader(vertexShader);

        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, `#version 300 es
            precision highp float;
            
            uniform vec4 u_dotColor;
            uniform vec4 u_hoverColor;
            uniform vec4 u_selectedColor;
            
            in float v_isHovered;
            in float v_isSelected;
            out vec4 fragColor;
            
            void main() {
                vec2 center = gl_PointCoord - vec2(0.5);
                float dist = length(center);
                float alpha = smoothstep(0.5, 0.45, dist);
                
                vec4 color = mix(
                    mix(u_dotColor, u_selectedColor, v_isSelected),
                    u_hoverColor,
                    v_isHovered
                );
                fragColor = vec4(color.rgb, color.a * alpha);
            }
        `);
        gl.compileShader(fragmentShader);

        // Create line shaders
        const lineVertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(lineVertexShader, `#version 300 es
            layout(location = 0) in vec2 a_position;
            
            uniform vec2 u_resolution;
            
            void main() {
                vec2 clipSpace = (a_position / u_resolution) * 2.0 - 1.0;
                gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
            }
        `);
        gl.compileShader(lineVertexShader);

        const lineFragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(lineFragmentShader, `#version 300 es
            precision highp float;
            
            uniform vec4 u_lineColor;
            out vec4 fragColor;
            
            void main() {
                fragColor = u_lineColor;
            }
        `);
        gl.compileShader(lineFragmentShader);

        // Create programs
        this.pointProgram = gl.createProgram();
        gl.attachShader(this.pointProgram, vertexShader);
        gl.attachShader(this.pointProgram, fragmentShader);
        gl.linkProgram(this.pointProgram);

        this.lineProgram = gl.createProgram();
        gl.attachShader(this.lineProgram, lineVertexShader);
        gl.attachShader(this.lineProgram, lineFragmentShader);
        gl.linkProgram(this.lineProgram);

        // Get uniform locations for points
        this.pointUniformLocations = {
            resolution: gl.getUniformLocation(this.pointProgram, 'u_resolution'),
            pointSize: gl.getUniformLocation(this.pointProgram, 'u_pointSize'),
            hoverScale: gl.getUniformLocation(this.pointProgram, 'u_hoverScale'),
            dotColor: gl.getUniformLocation(this.pointProgram, 'u_dotColor'),
            hoverColor: gl.getUniformLocation(this.pointProgram, 'u_hoverColor'),
            selectedColor: gl.getUniformLocation(this.pointProgram, 'u_selectedColor')
        };

        // Get uniform locations for lines
        this.lineUniformLocations = {
            resolution: gl.getUniformLocation(this.lineProgram, 'u_resolution'),
            lineColor: gl.getUniformLocation(this.lineProgram, 'u_lineColor')
        };

        // Create buffers for points
        this.positionBuffer = gl.createBuffer();
        this.hoverBuffer = gl.createBuffer();
        this.selectedBuffer = gl.createBuffer();
        this.lineBuffer = gl.createBuffer();

        // Create vertex arrays
        this.pointVAO = gl.createVertexArray();
        gl.bindVertexArray(this.pointVAO);

        // Set up position attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        const positions = new Float32Array(this.points.flatMap(p => [p.x, p.y]));
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

        // Set up hover attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, this.hoverBuffer);
        const hoverData = new Float32Array(this.points.length);
        gl.bufferData(gl.ARRAY_BUFFER, hoverData, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 0, 0);

        // Set up selected attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, this.selectedBuffer);
        const selectedData = new Float32Array(this.points.length);
        gl.bufferData(gl.ARRAY_BUFFER, selectedData, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 1, gl.FLOAT, false, 0, 0);

        // Create line VAO
        this.lineVAO = gl.createVertexArray();
        gl.bindVertexArray(this.lineVAO);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.lineBuffer);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

        gl.bindVertexArray(null);
    }

    updateSelectedStates() {
        const gl = this.gl;
        const selectedData = new Float32Array(this.points.length);

        this.selectedPoints.forEach(index => {
            selectedData[index] = 1.0;
        });

        gl.bindBuffer(gl.ARRAY_BUFFER, this.selectedBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, selectedData);
    }

    updateLineBuffer() {
        const gl = this.gl;
        const dpr = window.devicePixelRatio || 1;
        if (this.selectedPoints.length < 2) return;

        const lineVertices = [];
        for (let i = 1; i < this.selectedPoints.length; i++) {
            const p1 = this.points[this.selectedPoints[i - 1]];
            const p2 = this.points[this.selectedPoints[i]];
            lineVertices.push(p1.x / dpr, p1.y / dpr, p2.x / dpr, p2.y / dpr);
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.lineBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lineVertices), gl.DYNAMIC_DRAW);
    }

    handleClick(event) {
        if (!this.isDrawingEnabled) return;

        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const x = (event.clientX - rect.left) * dpr;
        const y = (event.clientY - rect.top) * dpr;

        const clickedIndex = this.findPointUnderCursor(x, y);
        if (clickedIndex !== -1) {
            const clickedPoint = this.points[clickedIndex];

            if (this.selectedPoints.length > 0) {
                const lastIndex = this.selectedPoints[this.selectedPoints.length - 1];
                // Store connection with sorted indices for consistency
                const lineKey = [lastIndex, clickedIndex].sort((a, b) => a - b).join(',');
                this.lineConnections.add(lineKey);

                // Call the callback with both points
                if (this.options.onLineAdded) {
                    const lastPoint = this.points[lastIndex];
                    this.options.onLineAdded(lastPoint, clickedPoint);
                }
            }

            this.selectedPoints.push(clickedIndex);
            this.updateSelectedStates();
            this.render();
        }
    }

    render() {
        const gl = this.gl;
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        // Draw lines with dynamic width
        if (this.selectedPoints.length >= 2) {
            gl.useProgram(this.lineProgram);
            gl.bindVertexArray(this.lineVAO);

            gl.uniform2f(this.lineUniformLocations.resolution, this.canvas.width, this.canvas.height);
            gl.uniform4fv(this.lineUniformLocations.lineColor, this.options.lineColor);

            gl.lineWidth(this.options.lineWidth);
            gl.drawArrays(gl.LINES, 0, (this.selectedPoints.length - 1) * 2);
        }

        // Draw points
        gl.useProgram(this.pointProgram);
        gl.bindVertexArray(this.pointVAO);

        const dpr = window.devicePixelRatio || 1;
        gl.uniform2f(this.pointUniformLocations.resolution, this.canvas.width * dpr, this.canvas.height * dpr);
        gl.uniform1f(this.pointUniformLocations.pointSize, this.options.dotRadius * 2 * dpr);
        gl.uniform1f(this.pointUniformLocations.hoverScale, this.options.hoverScale);
        gl.uniform4fv(this.pointUniformLocations.dotColor, this.options.dotColor);
        gl.uniform4fv(this.pointUniformLocations.hoverColor, this.options.hoverColor);
        gl.uniform4fv(this.pointUniformLocations.selectedColor, this.options.selectedColor);

        gl.drawArrays(gl.POINTS, 0, this.points.length);
        gl.bindVertexArray(null);
    }

    setupInteraction() {
        // Enable pointer events when interaction is needed
        this.canvas.style.pointerEvents = 'auto';

        this.hoveredPointIndex = -1;
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('click', this.handleClick.bind(this));
    }

    handleMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const x = (event.clientX - rect.left) * dpr;
        const y = (event.clientY - rect.top) * dpr;

        const previousHovered = this.hoveredPointIndex;
        this.hoveredPointIndex = this.findPointUnderCursor(x, y);

        if (previousHovered !== this.hoveredPointIndex) {
            this.updateHoverStates();
            this.updateCursor();
            this.render();
        }
    }

    findPointUnderCursor(x, y) {
        const dpr = window.devicePixelRatio || 1;
        const threshold = this.options.dotRadius * 2 * dpr;  // Threshold in logical pixels

        // console.log(x, y, threshold, dpr, this.points);
        return this.points.findIndex(point => {
            // Both point coordinates and mouse coordinates are now in logical pixels
            const dx = point.x - x * dpr;
            const dy = point.y - y * dpr;
            return dx * dx + dy * dy <= threshold * threshold;
        });
    }

    updateHoverStates() {
        const gl = this.gl;
        const hoverData = new Float32Array(this.points.length);

        if (this.hoveredPointIndex !== -1) {
            hoverData[this.hoveredPointIndex] = 1.0;
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.hoverBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, hoverData);
    }

    cleanup() {
        const gl = this.gl;

        // Remove event listeners
        this.canvas.removeEventListener('mousemove', this.handleMouseMove);
        this.canvas.removeEventListener('click', this.handleClick);

        // Clean up WebGL resources
        gl.deleteBuffer(this.positionBuffer);
        gl.deleteBuffer(this.hoverBuffer);
        gl.deleteProgram(this.program);
        gl.deleteVertexArray(this.vao);

        // Remove canvas
        // this.canvas.remove();
    }
}

class AlhambraTiled extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.shadowRoot.innerHTML = `<div class="controls collapsed" data-controls>
            <button type="button" class="controls__close" data-close-controls aria-label="Close toolbar">&times;</button>
            <div class="control-group">
              <label>
                Tile Size:
                <input type="range" min="32" max="1024" value="32" step="32" data-tile-size>
                <span class="tile-size-value">32px</span>
              </label>
              <label>
                Stroke Width:
                <input type="range" min="1" max="20" value="14" step="1" data-stroke-width>
                <span class="stroke-width-value">14px</span>
              </label>
              <label>
                Diffusion Speed:
                <input type="range" min="0" max="5" value="2.5" step="0.1" data-diffusion-speed>
                <span class="diffusion-speed-value">2.5x</span>
              </label>
            </div>
            <div class="control-group">
              <label>
                Line Color:
                <input type="color" value="#5b6fd2" data-line-color>
                <input type="hidden" min="0" max="100" value="30" step="5" data-line-opacity>
              </label>
              <label>
                Guide Color:
                <input type="color" value="#04135d" data-guide-color>
              </label>
              <label>
                Background:
                <input type="color" value="#031c96" data-bg-color>
              </label>
            </div>
            <div class="control-group">
              <label>
                <input type="checkbox" data-perspective-toggle>
                Perspective Drag (impacts performance)
              </label>
            </div>
          </div>
          <button type="button" class="controls__open visible" data-open-controls>Open Toolbar</button>
          <canvas data-canvas></canvas>
          <canvas data-canvas-points style="visibility:hidden"></canvas>
          <style>
            :host {
              display: grid;
              position: relative;
            }
            .controls {
              position: absolute;
              z-index: 99;
              bottom: 10px;
              left: 50%;
              transform: translateX(-50%);
              background: rgba(20, 20, 24, 0.16);
              backdrop-filter: blur(2px) saturate(165%);
              -webkit-backdrop-filter: blur(2px) saturate(165%);
              border: 1px solid rgba(255, 255, 255, 0.28);
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.3);
              padding: 16px;
              border-radius: 24px;
              color: rgba(255, 255, 255, 0.72);
              text-shadow: 0 0 10px rgba(255, 255, 255, 0.3), 0 1px 2px rgba(0, 0, 0, 0.35);
              display: flex;
              flex-direction: column;
              gap: 10px;
              width: 90%;
              max-width: 400px;
              text-align: center;
              transition: opacity 0.3s ease, transform 0.3s ease;
              transform-origin: bottom center;
            }
            .controls.collapsed {
              opacity: 0;
              transform: translateX(-50%) scale(0.85) translateY(10px);
              pointer-events: none;
            }
            .controls__close {
              position: absolute;
              top: 8px;
              right: 8px;
              width: 22px;
              height: 22px;
              display: flex;
              align-items: center;
              justify-content: center;
              background: rgba(255, 255, 255, 0.1);
              border: 1px solid rgba(255, 255, 255, 0.28);
              border-radius: 50%;
              color: inherit;
              font-size: 14px;
              line-height: 1;
              cursor: pointer;
              transition: background 0.2s ease;
            }
            .controls__close:hover {
              background: rgba(255, 255, 255, 0.2);
            }
            .controls__open {
              position: absolute;
              z-index: 99;
              bottom: 10px;
              left: 50%;
              background: rgba(20, 20, 24, 0.16);
              backdrop-filter: blur(2px) saturate(165%);
              -webkit-backdrop-filter: blur(2px) saturate(165%);
              border: 1px solid rgba(255, 255, 255, 0.28);
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.3);
              padding: 10px 22px;
              border-radius: 20px;
              color: rgba(255, 255, 255, 0.72);
              text-shadow: 0 0 10px rgba(255, 255, 255, 0.3), 0 1px 2px rgba(0, 0, 0, 0.35);
              font: inherit;
              cursor: pointer;
              opacity: 0;
              transform: translateX(-50%) scale(0.85);
              pointer-events: none;
              transition: opacity 0.3s ease, transform 0.3s ease;
              transform-origin: bottom center;
            }
            .controls__open.visible {
              opacity: 1;
              transform: translateX(-50%) scale(1);
              pointer-events: auto;
            }
            .controls__open:hover {
              background: rgba(20, 20, 24, 0.3);
            }
            .control-group {
              display: flex;
              flex-wrap: wrap;
              gap: 10px;
              justify-content: center;
            }
            .controls label {
              display: flex;
              align-items: center;
              gap: 8px;
              flex-wrap: wrap;
              justify-content: center;
            }
            input[type="color"] {
              width: 32px;
              height: 32px;
              padding: 0;
              border: 1px solid rgba(255, 255, 255, 0.3);
              border-radius: 50%;
              overflow: hidden;
            }
            input[type="color"]::-webkit-color-swatch-wrapper {
              padding: 0;
              border-radius: 50%;
            }
            input[type="color"]::-webkit-color-swatch {
              border: none;
              border-radius: 50%;
            }
            input[type="color"]::-moz-color-swatch {
              border: none;
              border-radius: 50%;
            }
            input[type="range"],
            input[type="checkbox"] {
              accent-color: rgba(255, 255, 255, 0.85);
            }
            canvas {
              width: 100%;
              min-height: 100%;
              position: absolute;
              left: 0;
              top: 0;
            }
            @media (max-width: 600px) {
              .controls {
                width: 95%;
                left: 50%;
                transform: translateX(-50%);
                bottom: 20px;
                z-index: 99;
                padding: 12px;
                border-radius: 20px;
              }
              .control-group {
                flex-direction: column;
                align-items: center;
              }
              .controls__open {
                bottom: 20px;
              }
            }
          </style>`;

        // Mouse tracking variables
        this.isDragging = false;
        this.lastMouseX = 0.0;
        this.lastMouseY = 0.0;
        // No baked-in tilt by default - Perspective Drag is opt-in (see
        // data-perspective-toggle), so the initial view should render flat
        // until the user explicitly turns it on and drags.
        this.rotationX = 0;
        this.rotationY = 0;
        // Create a debounced function for updating the view matrix
        this.debouncedUpdateView = debounce(function () {
            this.updateViewMatrix();
        }, 50); // roughly 60fps, adjust as needed
        // Add color control properties
        this.lineColorInput = this.shadowRoot.querySelector('[data-line-color]');
        this.guideColorInput = this.shadowRoot.querySelector('[data-guide-color]');
        this.lineOpacityInput = this.shadowRoot.querySelector('[data-line-opacity]');
        this.lineOpacityValue = this.shadowRoot.querySelector('.line-opacity-value');
        this.bgColorInput = this.shadowRoot.querySelector('[data-bg-color]');

        this.lineColor = this.lineColorInput.value;
        this.guideColor = this.guideColorInput.value;
        this.lineOpacity = parseInt(this.lineOpacityInput.value) / 100;
        this.backgroundColor = this.bgColorInput.value;

        this.setupColorControls();

        // Add stroke width properties
        this.strokeWidthInput = this.shadowRoot.querySelector('[data-stroke-width]');
        this.strokeWidthValue = this.shadowRoot.querySelector('.stroke-width-value');
        this.strokeWidth = parseFloat(this.strokeWidthInput.value);

        this.setupStrokeWidthControl();

        // Diffusion speed properties
        this.diffusionSpeedInput = this.shadowRoot.querySelector('[data-diffusion-speed]');
        this.diffusionSpeedValue = this.shadowRoot.querySelector('.diffusion-speed-value');
        this.diffusionSpeed = parseFloat(this.diffusionSpeedInput.value);
        // The toolbar's Diffusion Speed value is a ceiling, not a constant
        // rate - stepSimulation() modulates it with 1D Perlin noise each step
        // (see _diffusionNoiseTime below) so the erosion visibly speeds up and
        // slows down over time instead of crawling at one fixed pace.
        this.diffusionNoise = new PerlinNoise();
        this._diffusionNoiseTime = Math.random() * 1000;

        this.setupDiffusionSpeedControl();
        this.setupToolbarCollapse();

        // Dragging to change perspective forces a full pattern/texture
        // regeneration + sim re-seed on every move (see resetPattern()) -
        // expensive enough that it should stay opt-in rather than run by
        // default just because the mouse moves over the canvas.
        this.perspectiveToggleInput = this.shadowRoot.querySelector('[data-perspective-toggle]');
        this.perspectiveEnabled = this.perspectiveToggleInput.checked;
        this.perspectiveToggleInput.addEventListener('change', (e) => {
            this.perspectiveEnabled = e.target.checked;
            if (!this.perspectiveEnabled) this.isDragging = false;
        });

        this.canvas = this.shadowRoot.querySelector('canvas');
        this.pointsCanvas = this.shadowRoot.querySelector('canvas[data-canvas-points]');
        this.tileSizeInput = this.shadowRoot.querySelector('[data-tile-size]');
        this.tileSizeValue = this.shadowRoot.querySelector('.tile-size-value');
        this.tileSize = parseInt(this.tileSizeInput.value);
        this.selectedLines = new Set();

        this.setupTileSizeControl();

        this.gl = this.canvas.getContext('webgl2', {
            antialias: true,
            alpha: true
        });
        if (!this.gl) {
            console.error('WebGL2 not supported');
            return;
        }

        this.updatePointsCanvasSize(this.pointsCanvas);

        this.pointsRenderer = null;
        this.points = null;
        // Create a hidden canvas for texture generation
        this.textureCanvas = document.createElement('canvas');
        this.textureCanvas.width = 2048;
        this.textureCanvas.height = 2048;
        this.textureCtx = this.textureCanvas.getContext('2d', {
            antialias: true,
            alpha: true
        });

        this.initializeTexture();
        this.initializeWebGL();
        this.updateCanvasSize(this.canvas);

        // titlt & perspective
        // Create perspective matrix
        const fieldOfView = 60 * Math.PI / 180;   // 60 degrees in radians
        const aspect = 1.0; //this.gl.canvas.clientWidth / this.gl.canvas.clientHeight;
        const zNear = 1.0;
        const zFar = 100.0;
        this.projectionMatrix = mat4.create();
        mat4.perspective(this.projectionMatrix, fieldOfView, aspect, zNear, zFar);
        // mat4.perspective(perspectiveMatrix,.6*Math.PI,1,.001,10);

        // Initialize view matrix
        this.viewMatrix = mat4.create();
        // Reset view matrix
        mat4.identity(this.viewMatrix);
        mat4.translate(this.viewMatrix, this.viewMatrix, [0.0, 0.0, -1.0]);
        // Apply uniform 2x scaling
        mat4.scale(this.viewMatrix, this.viewMatrix, [10.0, 10.0, 10.0]);

        // // Limit rotation angles
        // this.rotationX = Math.max(Math.min(this.rotationX, Math.PI / 4), -Math.PI / 4);
        // this.rotationY = Math.max(Math.min(this.rotationY, Math.PI / 4), -Math.PI / 4);

        // // Apply rotations
        // mat4.rotate(this.viewMatrix, this.viewMatrix, 0.0, [1, 0, 0]); // X-axis rotation
        // mat4.rotate(this.viewMatrix, this.viewMatrix, 0.0, [0, 1, 0]); // Y-axis rotation

        this.setupMouseControls();
        this.debouncedUpdateView();
        // this.render();
        // todo: drawing controls to be done as its own panel in a more intuitive way
        // this.setupExportImport();
        // this.setupDrawControls();
    }

    async requestPermission() {
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                const permission = await DeviceOrientationEvent.requestPermission();
                if (permission === 'granted') {
                    window.addEventListener('deviceorientation', this.handleOrientation);
                }
            } catch (error) {
                console.error('Error requesting device orientation permission:', error);
            }
        } else {
            // For non-iOS devices, add the listener directly
            window.addEventListener('deviceorientation', this.handleOrientation);
        }
    }

    // Handle device orientation changes
    handleOrientation(event) {
        const beta = event.beta * Math.PI / 180;  // Convert to radians
        const gamma = event.gamma * Math.PI / 180; // Convert to radians

        // Update rotation angles
        this.rotationX = Math.max(Math.min(beta, Math.PI / 4), -Math.PI / 4);
        this.rotationY = Math.max(Math.min(gamma, Math.PI / 4), -Math.PI / 4);

        // Call the debounced update function
        this.debouncedUpdateView();
    }

    // Update view matrix based on current rotation
    updateViewMatrix() {
        // Reset view matrix
        mat4.identity(this.viewMatrix);
        mat4.translate(this.viewMatrix, this.viewMatrix, [0.0, 0.0, -2.0]);

        // Apply uniform 2x scaling
        mat4.scale(this.viewMatrix, this.viewMatrix, [10.0, 10.0, 10.0]);

        // Apply rotations
        mat4.rotate(this.viewMatrix, this.viewMatrix, this.rotationX, [1, 0, 0]); // X-axis rotation
        mat4.rotate(this.viewMatrix, this.viewMatrix, this.rotationY, [0, 1, 0]); // Y-axis rotation

        // console.log('updated view matrix')
        //rerender
        this.resetPattern();
        if (this.pointsRenderer) {
            this.pointsRenderer.lineColor = this.hexToRgba(this.lineColor, this.lineOpacity, true);
            this.pointsRenderer.importFromCSV(defaultPattern);
            this.pointsRenderer.render();
        }
    }

    setupMouseControls() {
        // Mouse event handlers
        // Add mouse event listeners to the canvas
        this.shadowRoot.addEventListener('mousedown', (event) => {
            if (!this.perspectiveEnabled) return;
            this.isDragging = true;
            this.lastMouseX = event.clientX;
            this.lastMouseY = event.clientY;
        });
        this.shadowRoot.addEventListener('mouseup', () => {
            this.isDragging = false;
        });
        this.shadowRoot.addEventListener('mousemove', (event) => {
            if (!this.isDragging) return;

            const deltaX = event.clientX - this.lastMouseX;
            const deltaY = event.clientY - this.lastMouseY;

            // Update rotation angles (scale down the movement for smoother rotation)
            this.rotationY += deltaX * 0.005;
            this.rotationX += deltaY * 0.005;

            // console.log(this.rotationX, this.rotationY);
            // Limit rotation angles
            // this.rotationX = Math.max(Math.min(this.rotationX, Math.PI), -Math.PI);
            // this.rotationY = Math.max(Math.min(this.rotationY, Math.PI), -Math.PI);

            this.lastMouseX = event.clientX;
            this.lastMouseY = event.clientY;

            // Call the debounced update function
            this.debouncedUpdateView();
        });
    }

    setupColorControls() {
        this.lineColorInput.addEventListener('input', (e) => {
            this.lineColor = e.target.value;
            console.log('line color input listener', this.lineColor)
            // this.resetPattern();
            if (this.pointsRenderer) {
                this.pointsRenderer.lineColor = this.hexToRgba(this.lineColor, this.lineOpacity, true);
                this.pointsRenderer.importFromCSV(defaultPattern);
                this.pointsRenderer.render();
            }
        });


        this.guideColorInput.addEventListener('input', (e) => {
            this.guideColor = e.target.value;
            console.log('******guide color changed******', this.guideColor)
            this.resetPattern();
            if (this.pointsRenderer) {
                this.pointsRenderer.lineColor = this.hexToRgba(this.lineColor, this.lineOpacity, true);
                this.pointsRenderer.importFromCSV(defaultPattern);
                this.pointsRenderer.render();
            }
        });

        this.lineOpacityInput.addEventListener('input', (e) => {
            this.lineOpacity = parseInt(e.target.value) / 100;
            this.lineOpacityValue.textContent = `${e.target.value}%`;
            // this.resetPattern();
            if (this.pointsRenderer) {
                this.pointsRenderer.importFromCSV(defaultPattern);
                this.pointsRenderer.render();
            }
        });

        this.bgColorInput.addEventListener('input', (e) => {
            this.backgroundColor = e.target.value;
            console.log("change listener", this, this.backgroundColor, this.lineColor);
            this.resetPattern(); // Regenerate the pattern with the new background color
            if (this.pointsRenderer) {
                this.pointsRenderer.importFromCSV(defaultPattern);
                this.pointsRenderer.render();
            }
        });
    }

    setupStrokeWidthControl() {
        this.strokeWidthInput.addEventListener('input', (e) => {
            this.strokeWidth = parseFloat(e.target.value);
            this.strokeWidthValue.textContent = `${this.strokeWidth}px`;
            this.resetPattern(); // Regenerate pattern with new stroke width
            if (this.pointsRenderer) {
                this.pointsRenderer.importFromCSV(defaultPattern);
                this.pointsRenderer.options.lineWidth = this.strokeWidth;
                this.pointsRenderer.render();
            }
        });
    }

    setupDiffusionSpeedControl() {
        this.diffusionSpeedInput.addEventListener('input', (e) => {
            this.diffusionSpeed = parseFloat(e.target.value);
            this.diffusionSpeedValue.textContent = `${this.diffusionSpeed.toFixed(1)}x`;
        });
    }

    setupToolbarCollapse() {
        const controls = this.shadowRoot.querySelector('[data-controls]');
        const closeButton = this.shadowRoot.querySelector('[data-close-controls]');
        const openButton = this.shadowRoot.querySelector('[data-open-controls]');

        closeButton.addEventListener('click', () => {
            controls.classList.add('collapsed');
            openButton.classList.add('visible');
        });
        openButton.addEventListener('click', () => {
            controls.classList.remove('collapsed');
            openButton.classList.remove('visible');
        });
    }

    // Helper function to convert hex to rgba
    hexToRgba(hex, alpha = 1, array = false) {
        if (!array) {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        } else {
            const r = parseInt(hex.slice(1, 3), 16) / 255;
            const g = parseInt(hex.slice(3, 5), 16) / 255;
            const b = parseInt(hex.slice(5, 7), 16) / 255;
            return [r, g, b, alpha];
        }
    }

    setupDrawControls() {
        const controlsContainer = document.createElement('div');
        controlsContainer.style.cssText = `
            position: absolute;
            bottom: 10px;
            left: 200px;
            display: flex;
            gap: 10px;
            z-index: 1000;
        `;

        const startDrawButton = document.createElement('button');
        startDrawButton.textContent = 'Start Drawing';
        startDrawButton.onclick = () => this.setDrawingMode(true);

        const stopDrawButton = document.createElement('button');
        stopDrawButton.textContent = 'Stop Drawing';
        stopDrawButton.onclick = () => this.setDrawingMode(false);
        stopDrawButton.style.display = 'none';

        this.drawButtons = {
            start: startDrawButton,
            stop: stopDrawButton
        };

        controlsContainer.appendChild(startDrawButton);
        controlsContainer.appendChild(stopDrawButton);
        this.shadowRoot.appendChild(controlsContainer);
    }
    setupTileSizeControl() {
        this.tileSizeInput.addEventListener('input', (e) => {
            this.tileSize = parseInt(e.target.value);
            this.tileSizeValue.textContent = `${this.tileSize}px`;
            this.updatePointsCanvasSize(this.pointsCanvas);
            // The dissolve source mask is seeded from where the lines actually
            // land on screen, which shifts whenever the tile size changes.
            if (this.simSeedProgram) this.seedSimulation();
            this.render();
        });
    }
    setDrawingMode(enabled) {
        if (this.pointsRenderer) {
            this.pointsRenderer.setDrawingMode(enabled);
            this.drawButtons.start.style.display = enabled ? 'none' : 'block';
            this.drawButtons.stop.style.display = enabled ? 'block' : 'none';
        }
    }
    setupExportImport() {
        // Add buttons to the shadow DOM
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            position: absolute;
            bottom: 10px;
            right: 10px;
            display: flex;
            gap: 10px;
            z-index: 1000;
        `;

        const exportButton = document.createElement('button');
        exportButton.textContent = 'Export CSV';
        exportButton.onclick = () => this.exportPattern();

        const importButton = document.createElement('button');
        importButton.textContent = 'Import CSV';
        importButton.onclick = () => this.importPattern();

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.csv';
        fileInput.style.display = 'none';
        fileInput.onchange = (e) => this.handleFileImport(e);

        buttonContainer.appendChild(exportButton);
        buttonContainer.appendChild(importButton);
        buttonContainer.appendChild(fileInput);
        this.shadowRoot.appendChild(buttonContainer);

        this.fileInput = fileInput;
    }

    addLineToPattern(point1, point2) {
        const ctx = this.textureCtx;

        ctx.beginPath();
        // Use the same line color but full opacity for drawn lines
        ctx.strokeStyle = this.hexToRgba(this.lineColor, 0.8);
        ctx.lineWidth = this.strokeWidth;
        ctx.moveTo(point1.x, point1.y);
        ctx.lineTo(point2.x, point2.y);
        ctx.stroke();

        const gl = this.gl;
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.textureCanvas);

        this.render();
    }

    generateTilePattern() {
        const ctx = this.textureCtx;
        const width = this.textureCanvas.width;
        const height = this.textureCanvas.height;

        // Clear the canvas with the current background color
        ctx.fillStyle = this.backgroundColor;
        ctx.fillRect(0, 0, width, height);

        // Update line style with dynamic color and opacity
        ctx.strokeStyle = this.guideColor;
        ctx.lineWidth = this.strokeWidth;
        // console.log("TilePattern GuideColor", this, this.guideColor, ctx.strokeStyle, width, height);
        // ctx.strokeStyle = this.hexToRgba(this.lineColor);//'rgba(255, 255, 255, 0.3)';
        const centerX = width / 2;
        const centerY = height / 2;
        let intersectionPoints = new Set(); // Using Set to avoid duplicate points

        // Helper function to add point to set with rounding to avoid floating point issues
        const addPoint = (x, y) => {
            // Add a small epsilon for floating point comparison
            const epsilon = 0.0001;
            // Expand the boundary check slightly to catch edge points
            if (true || x >= -epsilon && x <= width + epsilon && y >= -epsilon && y <= height + epsilon) {
                // Clamp values to ensure they're within bounds
                const clampedX = Math.max(0, Math.min(width, x));
                const clampedY = Math.max(0, Math.min(height, y));
                // Round to avoid floating point issues
                const roundedX = Math.round(clampedX * 1000) / 1000;
                const roundedY = Math.round(clampedY * 1000) / 1000;
                intersectionPoints.add(`${roundedX},${roundedY}`);
            }
        };

        // Helper function to find line intersection
        const findLineIntersection = (x1, y1, x2, y2, x3, y3, x4, y4) => {
            const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
            if (denominator === 0) return null;

            const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denominator;
            const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denominator;

            if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
                const x = x1 + t * (x2 - x1);
                const y = y1 + t * (y2 - y1);
                return [x, y];
            }
            return null;
        };

        // Helper function to find circle-line intersections
        const findCircleLineIntersections = (cx, cy, r, x1, y1, x2, y2) => {
            const dx = x2 - x1;
            const dy = y2 - y1;
            const a = dx * dx + dy * dy;
            const b = 2 * (dx * (x1 - cx) + dy * (y1 - cy));
            const c = cx * cx + cy * cy + x1 * x1 + y1 * y1 - 2 * (cx * x1 + cy * y1) - r * r;
            const det = b * b - 4 * a * c;

            if (det < 0) return [];
            if (det === 0) {
                const t = -b / (2 * a);
                const x = x1 + t * dx;
                const y = y1 + t * dy;
                if (t >= 0 && t <= 1) return [[x, y]];
                return [];
            }

            const t1 = (-b + Math.sqrt(det)) / (2 * a);
            const t2 = (-b - Math.sqrt(det)) / (2 * a);
            const points = [];

            if (t1 >= 0 && t1 <= 1) points.push([x1 + t1 * dx, y1 + t1 * dy]);
            if (t2 >= 0 && t2 <= 1) points.push([x1 + t2 * dx, y1 + t2 * dy]);
            return points;
        };

        // // Clear canvas with background color
        // ctx.fillStyle = this.backgroundColor;
        // ctx.fillRect(0, 0, width, height);

        // // Set common style for all lines
        // ctx.strokeStyle = this.hexToRgba(this.lineColor, this.lineOpacity);
        // ctx.lineWidth = 1;

        const angle22_5 = Math.tan(22.5 * Math.PI / 180);
        const angle67_5 = Math.tan(67.5 * Math.PI / 180);

        // Store all lines for intersection calculation
        const lines = [
            // Diagonal lines
            [[0, 0], [width, height]],
            [[width, 0], [0, height]],
            // Center cross
            [[centerX, 0], [centerX, height]],
            [[0, centerY], [width, centerY]],
            // 22.5° lines
            [[0, centerY - centerX * angle22_5], [width, centerY + centerX * angle22_5]],
            [[0, centerY + centerX * angle22_5], [width, centerY - centerX * angle22_5]],
            // 67.5° lines
            [[centerX - centerY * angle22_5, 0], [centerX + centerY * angle22_5, height]],
            [[centerX + centerY * angle22_5, 0], [centerX - centerY * angle22_5, height]]
        ];

        // Draw guide lines and collect points
        ctx.beginPath();
        lines.forEach(([[x1, y1], [x2, y2]]) => {
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
        });
        ctx.stroke();

        // Draw square border
        ctx.beginPath();
        ctx.rect(0, 0, width, height);
        ctx.stroke();

        // Calculate and draw circles
        const mainCircleRadius = (Math.min(width, height) / 2);
        ctx.beginPath();
        ctx.arc(centerX, centerY, mainCircleRadius, 0, Math.PI * 2);
        ctx.stroke();

        const diagonalLength = width * Math.sqrt(2);
        const centerCircleRadius = diagonalLength / 8;
        ctx.beginPath();
        ctx.arc(centerX, centerY, centerCircleRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Draw the two squares with extended lines
        const squareSize = centerCircleRadius * Math.sqrt(2);
        const halfSquare = squareSize / 2;

        // First square (aligned) with extended lines
        const squareLines = [
            [[centerX - halfSquare, 0], [centerX - halfSquare, height]],
            [[centerX + halfSquare, 0], [centerX + halfSquare, height]],
            [[0, centerY - halfSquare], [width, centerY - halfSquare]],
            [[0, centerY + halfSquare], [width, centerY + halfSquare]]
        ];

        ctx.beginPath();
        squareLines.forEach(([[x1, y1], [x2, y2]]) => {
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
        });
        ctx.stroke();

        lines.push(...squareLines);

        // Second square (rotated 45 degrees) with extended lines
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(Math.PI / 4);

        const rotatedSquareLines = [
            [[-halfSquare, -width], [-halfSquare, width]],
            [[halfSquare, -width], [halfSquare, width]],
            [[-width, -halfSquare], [width, -halfSquare]],
            [[-width, halfSquare], [width, halfSquare]]
        ];

        ctx.beginPath();
        rotatedSquareLines.forEach(([[x1, y1], [x2, y2]]) => {
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
        });
        ctx.stroke();
        ctx.restore();

        // Transform rotated lines back to original coordinate system
        const cos45 = Math.cos(Math.PI / 4);
        const sin45 = Math.sin(Math.PI / 4);
        const transformedRotatedLines = rotatedSquareLines.map(([[x1, y1], [x2, y2]]) => {
            return [
                [
                    centerX + (x1 * cos45 - y1 * sin45),
                    centerY + (x1 * sin45 + y1 * cos45)
                ],
                [
                    centerX + (x2 * cos45 - y2 * sin45),
                    centerY + (x2 * sin45 + y2 * cos45)
                ]
            ];
        });
        lines.push(...transformedRotatedLines);

        // Calculate cornerCircle radius and draw corner circles
        const halfDiagonal = width * Math.sqrt(2) / 2;
        const cornerCircleRadius = halfDiagonal - mainCircleRadius;

        // Store circles for intersection calculation
        const circles = [
            [centerX, centerY, mainCircleRadius],
            [centerX, centerY, centerCircleRadius],
            [0, 0, cornerCircleRadius],
            [width, 0, cornerCircleRadius],
            [width, height, cornerCircleRadius],
            [0, height, cornerCircleRadius]
        ];
        // Add explicit corner circle edge intersections
        // Top-left corner
        addPoint(cornerCircleRadius, 0); // Top edge intersection
        addPoint(0, cornerCircleRadius); // Left edge intersection

        // Top-right corner
        addPoint(width - cornerCircleRadius, 0); // Top edge intersection
        addPoint(width, cornerCircleRadius); // Right edge intersection

        // Bottom-right corner
        addPoint(width - cornerCircleRadius, height); // Bottom edge intersection
        addPoint(width, height - cornerCircleRadius); // Right edge intersection

        // Bottom-left corner
        addPoint(cornerCircleRadius, height); // Bottom edge intersection
        addPoint(0, height - cornerCircleRadius); // Left edge intersection
        // Draw corner circles
        const cornerAngles = [
            [0, Math.PI / 2],
            [Math.PI / 2, Math.PI],
            [Math.PI, Math.PI * 3 / 2],
            [Math.PI * 3 / 2, Math.PI * 2]
        ];
        const cornerCenters = [[0, 0], [width, 0], [width, height], [0, height]];

        cornerAngles.forEach((angles, i) => {
            ctx.beginPath();
            ctx.arc(cornerCenters[i][0], cornerCenters[i][1], cornerCircleRadius, ...angles);
            ctx.stroke();
        });

        // Draw extended tangent lines
        const intersectOffset = cornerCircleRadius / Math.sqrt(2);
        const corners = [
            { mid1: [0, centerY], mid2: [centerX, 0], intersect: [intersectOffset, intersectOffset] },
            { mid1: [width, centerY], mid2: [centerX, 0], intersect: [width - intersectOffset, intersectOffset] },
            { mid1: [width, centerY], mid2: [centerX, height], intersect: [width - intersectOffset, height - intersectOffset] },
            { mid1: [0, centerY], mid2: [centerX, height], intersect: [intersectOffset, height - intersectOffset] }
        ];

        function extendLine(x1, y1, x2, y2, width, height) {
            const dx = x2 - x1;
            const dy = y2 - y1;
            const m = dy / dx;

            let extendedX, extendedY;
            if (dx > 0) {
                extendedX = width;
                extendedY = y1 + m * (width - x1);
            } else {
                extendedX = 0;
                extendedY = y1 + m * (0 - x1);
            }

            if (extendedY < 0 || extendedY > height) {
                extendedY = dy > 0 ? height : 0;
                extendedX = x1 + (extendedY - y1) / m;
            }

            return [extendedX, extendedY];
        }

        ctx.beginPath();
        corners.forEach(corner => {
            const [endX1, endY1] = extendLine(corner.mid1[0], corner.mid1[1],
                corner.intersect[0], corner.intersect[1],
                width, height);
            ctx.moveTo(corner.mid1[0], corner.mid1[1]);
            ctx.lineTo(endX1, endY1);
            lines.push([[corner.mid1[0], corner.mid1[1]], [endX1, endY1]]);

            const [endX2, endY2] = extendLine(corner.mid2[0], corner.mid2[1],
                corner.intersect[0], corner.intersect[1],
                width, height);
            ctx.moveTo(corner.mid2[0], corner.mid2[1]);
            ctx.lineTo(endX2, endY2);
            lines.push([[corner.mid2[0], corner.mid2[1]], [endX2, endY2]]);
        });
        ctx.stroke();

        // Calculate all intersections
        // Line-line intersections
        for (let i = 0; i < lines.length; i++) {
            for (let j = i + 1; j < lines.length; j++) {
                const intersection = findLineIntersection(
                    lines[i][0][0], lines[i][0][1], lines[i][1][0], lines[i][1][1],
                    lines[j][0][0], lines[j][0][1], lines[j][1][0], lines[j][1][1]
                );
                if (intersection) {
                    addPoint(intersection[0], intersection[1]);
                }
            }
        }

        // Circle-line intersections
        circles.forEach(circle => {
            lines.forEach(line => {
                const intersections = findCircleLineIntersections(
                    circle[0], circle[1], circle[2],
                    line[0][0], line[0][1], line[1][0], line[1][1]
                );
                intersections.forEach(point => addPoint(point[0], point[1]));
            });
        });

        // Convert Set back to array of points
        this.points = Array.from(intersectionPoints).map(point => {
            const [x, y] = point.split(',').map(Number);
            return { x, y };
        });
        // this.drawIntersectionPoints(points);
        // console.log(this.points);
    }

    exportPattern() {
        if (this.pointsRenderer) {
            const csv = this.pointsRenderer.exportToCSV();
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'alhambra_pattern.csv';
            a.click();
            window.URL.revokeObjectURL(url);
        }
    }

    importPattern() {
        this.fileInput.click();
    }

    handleFileImport(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target.result;
                // Reset the pattern
                this.resetPattern();
                // Import the new pattern
                this.pointsRenderer.importFromCSV(content);
            };
            reader.readAsText(file);
        }
    }

    resetPattern() {
        // Clear the texture canvas
        const ctx = this.textureCtx;
        ctx.clearRect(0, 0, this.textureCanvas.width, this.textureCanvas.height);

        // console.log("In reset pattern: bg, line:", this, this.backgroundColor, this.lineColor);
        // Redraw the original pattern with the new background color
        this.generateTilePattern();

        // Update the texture
        const gl = this.gl;

        // uniformMatrix4fv writes into whichever program is currently bound via
        // useProgram - now that stepSimulation() also binds simProgram each
        // frame, this must explicitly rebind this.program first or the write
        // can silently target the wrong program and leave u_matrix zeroed out.
        gl.useProgram(this.program);

        // START TILT
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Combine projection and view matrices
        const pvMatrix = mat4.create();
        mat4.multiply(pvMatrix, this.projectionMatrix, this.viewMatrix);

        // Set the matrix uniform in your shader
        gl.uniformMatrix4fv(this.matrixLocation, false, pvMatrix);

        //stop TITLT
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.textureCanvas);

        // Colors/geometry changed - re-seed the dissolve source mask from the
        // freshly-drawn pattern so the erosion effect restarts from the new lines.
        if (this.simSeedProgram) this.seedSimulation();

        // Render
        // this.render(); // NOT REQUIRED?
    }

    createPointsRenderer(points) {
        // Convert hex color to array of normalized RGB values
        const lineColorRgb = [
            parseInt(this.lineColor.slice(1, 3), 16) / 255,
            parseInt(this.lineColor.slice(3, 5), 16) / 255,
            parseInt(this.lineColor.slice(5, 7), 16) / 255,
        ];

        this.pointsRenderer = new PointsRenderer(this.pointsCanvas, points, {
            dotRadius: 3,
            dotColor: [1.0, 0.4, 0.4, 0.7],
            hoverColor: [1.0, 0.8, 0.4, 0.9],
            hoverScale: 1.5,
            lineWidth: this.strokeWidth,
            lineColor: [...lineColorRgb, 0.8], // Use line color with 0.8 opacity
            onLineAdded: (point1, point2) => {
                this.addLineToPattern(point1, point2);
            },
            onDrawingStateChanged: (enabled) => {
                this.drawButtons.start.style.display = enabled ? 'none' : 'block';
                this.drawButtons.stop.style.display = enabled ? 'block' : 'none';
            }
        });

        this.pointsRenderer.render();
    }


    initializeTexture() {
        // Generate the pattern
        this.generateTilePattern();

        const gl = this.gl;

        // Create and bind texture
        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);

        // Set texture parameters
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        // Upload the image into the texture
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.textureCanvas);

        this.createPointsRenderer(this.points);
    }

    get vertexShaderSource() {
        return `#version 300 es
            in vec4 a_position;
            in vec2 a_texCoord;
            uniform mat4 u_matrix;
            uniform vec2 u_resolution;
            out vec2 v_texCoord;

            void main() {
                vec2 zeroToOne = a_position.xy / u_resolution;
                vec2 clipSpace = (zeroToOne * 2.0 - 1.0) * vec2(1, -1);
                gl_Position = vec4(clipSpace, 0, 1);
                gl_Position = u_matrix * gl_Position;
                v_texCoord = a_texCoord;
            }`;
    }

    get fragmentShaderSource() {
        return `#version 300 es
precision highp float;

in vec2 v_texCoord;
uniform sampler2D u_texture;
uniform sampler2D u_simTexture;
uniform vec2 u_resolution;
uniform float u_tileSize;
uniform vec3 u_backgroundColor;
uniform float u_rdEnabled;
out vec4 outColor;

void main() {
    // Tiled texture sample (the original, crisp render)
    vec2 repeat = u_resolution / u_tileSize;
    vec2 texCoord = fract(v_texCoord * repeat);
    vec4 texColor = texture(u_texture, texCoord);

    // Sample the diffusion field (screen-space, not tiled) - "erosion" grows
    // outward from the pattern's line pixels and erases toward the flat
    // background color as it spreads, i.e. the lines dissolve into the background.
    vec2 screenUV = gl_FragCoord.xy / u_resolution;
    float erosion = texture(u_simTexture, screenUV).r * u_rdEnabled;

    outColor = vec4(mix(texColor.rgb, u_backgroundColor, erosion), texColor.a);
}`;
    }

    // Fullscreen-quad vertex shader shared by the reaction-diffusion simulation pass
    get simVertexShaderSource() {
        return `#version 300 es
            layout(location = 0) in vec2 a_position;
            layout(location = 1) in vec2 a_uv;
            out vec2 v_uv;

            void main() {
                v_uv = a_uv;
                gl_Position = vec4(a_position, 0.0, 1.0);
            }`;
    }

    // Seeds the simulation state from the actual tile pattern: r = 0 (nothing
    // eroded yet), g = a static "source" mask of how much each pixel looks like
    // a drawn line (vs. background) - this is what the diffusion pass grows from.
    get simSeedFragmentShaderSource() {
        return `#version 300 es
precision highp float;

in vec2 v_uv;
uniform sampler2D u_pattern;
uniform vec2 u_resolution;
uniform float u_tileSize;
uniform vec3 u_backgroundColor;
out vec4 outColor;

void main() {
    vec2 repeat = u_resolution / u_tileSize;
    vec2 texCoord = fract(v_uv * repeat);
    vec3 color = texture(u_pattern, texCoord).rgb;
    float lineness = clamp(length(color - u_backgroundColor) * 2.0, 0.0, 1.0);
    outColor = vec4(0.0, lineness, 0.0, 1.0);
}`;
    }

    // Diffusion step: r = erosion amount, g = the static source mask carried
    // through unchanged (where the original lines were). Two phases share this
    // shader: dissolving pins source (line) pixels fully-eroded and lets that
    // spread outward via diffusion (lines fade to background, and - since the
    // source is a fixed boundary rather than competing with diffusion's outward
    // flow - the whole domain eventually reaches it, not a partial equilibrium);
    // reforming releases the pin and decays erosion back toward 0 everywhere
    // (lines return).
    get simFragmentShaderSource() {
        return `#version 300 es
precision highp float;

in vec2 v_uv;
uniform sampler2D u_state;
uniform vec2 u_texel;
uniform float u_diffusion;
uniform float u_reformRate;
uniform float u_mode; // 0 = dissolving, 1 = reforming
uniform float u_dt;
uniform float u_time; // slow-drifting phase for the spatial noise field below
out vec4 outColor;

// Classic 2D Perlin (gradient) noise - Ashima Arts / Stefan Gustavson's
// webgl-noise, permutation-hashed so it needs no texture lookups.
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec2 fade(vec2 t) { return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); }

float cnoise(vec2 P) {
    vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
    vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
    Pi = mod289(Pi);
    vec4 ix = Pi.xzxz;
    vec4 iy = Pi.yyww;
    vec4 fx = Pf.xzxz;
    vec4 fy = Pf.yyww;
    vec4 i = permute(permute(ix) + iy);
    vec4 gx = fract(i * (1.0 / 41.0)) * 2.0 - 1.0;
    vec4 gy = abs(gx) - 0.5;
    vec4 tx = floor(gx + 0.5);
    gx = gx - tx;
    vec2 g00 = vec2(gx.x, gy.x);
    vec2 g10 = vec2(gx.y, gy.y);
    vec2 g01 = vec2(gx.z, gy.z);
    vec2 g11 = vec2(gx.w, gy.w);
    vec4 norm = 1.79284291400159 - 0.85373472095314 *
        vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11));
    g00 *= norm.x;
    g01 *= norm.y;
    g10 *= norm.z;
    g11 *= norm.w;
    float n00 = dot(g00, vec2(fx.x, fy.x));
    float n10 = dot(g10, vec2(fx.y, fy.y));
    float n01 = dot(g01, vec2(fx.z, fy.z));
    float n11 = dot(g11, vec2(fx.w, fy.w));
    vec2 fade_xy = fade(Pf.xy);
    vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
    float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
    return 2.3 * n_xy;
}

void main() {
    vec2 state = texture(u_state, v_uv).rg;
    float c = state.r;
    float source = state.g;

    float lap = 0.0;
    lap += texture(u_state, v_uv + u_texel * vec2(-1.0,  0.0)).r * 0.2;
    lap += texture(u_state, v_uv + u_texel * vec2( 1.0,  0.0)).r * 0.2;
    lap += texture(u_state, v_uv + u_texel * vec2( 0.0, -1.0)).r * 0.2;
    lap += texture(u_state, v_uv + u_texel * vec2( 0.0,  1.0)).r * 0.2;
    lap += texture(u_state, v_uv + u_texel * vec2(-1.0, -1.0)).r * 0.05;
    lap += texture(u_state, v_uv + u_texel * vec2( 1.0, -1.0)).r * 0.05;
    lap += texture(u_state, v_uv + u_texel * vec2(-1.0,  1.0)).r * 0.05;
    lap += texture(u_state, v_uv + u_texel * vec2( 1.0,  1.0)).r * 0.05;
    lap -= c;

    // Diffusion coefficient is spatially varied by a slow-drifting 2D Perlin
    // field instead of being uniform across the whole texture - some regions
    // erode/reform faster than others, so the dissolve grows in uneven,
    // organic patches rather than a perfectly even spread.
    float n = cnoise(v_uv * 4.0 + u_time);
    float diffusionMult = mix(0.25, 1.75, 0.5 + 0.5 * n);

    float delta = mix(0.0, -u_reformRate, u_mode);
    float newC = clamp(c + u_dt * (u_diffusion * diffusionMult * lap + delta), 0.0, 1.0);

    // Pin source (line) pixels fully-eroded during dissolve. This needs to be
    // a hard, fast pin (not a slow pull) - a slow pull is diffusion's outward
    // flow to fight against, which settles into the same kind of partial
    // equilibrium a growth term did (never actually reaching fully dissolved,
    // no matter how long it runs). A hard pin is a true fixed boundary, so
    // diffusion has something solid to spread from and genuinely reaches
    // every pixel over time instead of plateauing.
    float src = step(0.1, source);
    if (src > 0.5 && u_mode < 0.5) {
        newC = 1.0;
    }

    outColor = vec4(newC, source, 0.0, 1.0);
}`;
    }

    createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    createProgram(gl, vertexShader, fragmentShader) {
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error(gl.getProgramInfoLog(program));
            gl.deleteProgram(program);
            return null;
        }
        return program;
    }

    initializeWebGL() {
        const gl = this.gl;

        // Create shaders and program
        const vertexShader = this.createShader(gl, gl.VERTEX_SHADER, this.vertexShaderSource);
        const fragmentShader = this.createShader(gl, gl.FRAGMENT_SHADER, this.fragmentShaderSource);
        this.program = this.createProgram(gl, vertexShader, fragmentShader);

        // Get locations
        this.positionLocation = gl.getAttribLocation(this.program, 'a_position');
        this.rdEnabledLocation = gl.getUniformLocation(this.program, 'u_rdEnabled');
        this.matrixLocation = gl.getUniformLocation(this.program, 'u_matrix');
        this.texCoordLocation = gl.getAttribLocation(this.program, 'a_texCoord');
        this.resolutionLocation = gl.getUniformLocation(this.program, 'u_resolution');
        this.tileSizeLocation = gl.getUniformLocation(this.program, 'u_tileSize');
        this.textureLocation = gl.getUniformLocation(this.program, 'u_texture');
        this.simTextureLocation = gl.getUniformLocation(this.program, 'u_simTexture');
        this.backgroundColorLocation = gl.getUniformLocation(this.program, 'u_backgroundColor');

        // Reaction-diffusion is on by default; set to false to freeze the simulation
        // and show only the plain tiled render (skips the sim step entirely).
        this.reactionDiffusionEnabled = true;

        // Create buffers
        this.positionBuffer = gl.createBuffer();
        this.texCoordBuffer = gl.createBuffer();

        // Set up texture coordinates
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            0.0, 0.0,
            1.0, 0.0,
            0.0, 1.0,
            0.0, 1.0,
            1.0, 0.0,
            1.0, 1.0,
        ]), gl.STATIC_DRAW);

        this.initializeSimulation();
    }

    // Sets up the ping-pong framebuffers/textures and shader programs that run
    // the line-dissolve diffusion simulation, independent of canvas size.
    initializeSimulation() {
        const gl = this.gl;

        this.simSize = 256;

        // Diffusion spreads erosion outward from the (pinned, during dissolve)
        // source pixels; reformRate is how fast erosion decays back to 0 once
        // the pin is released. The state texture is 8-bit (1/255 ~= 0.0039 per
        // step), so reformRate must stay comfortably above that or it quantizes
        // to 0 and reform never progresses.
        this.simDiffusion = 0.3;
        this.simReformRate = 0.02;
        this.simDt = 1.0;

        // Loops between dissolving (lines fade to background) and reforming
        // (lines return). Dissolve bounces back to reform once the *actual*
        // average erosion crosses simDissolveTarget (checked periodically via
        // readback, not every step - it's cheap on this small 256x256 texture
        // but still not free), rather than running to full completion.
        // simDissolveSteps is just a safety cap in case that check never fires.
        this.simPhase = 'dissolve';
        this.simElapsedSteps = 0;
        this.simDissolveSteps = 2000;
        this.simReformSteps = 200;
        this.simDissolveTarget = 0.75;
        this.simProgressCheckInterval = 10; // steps between readback checks
        this._simStepsSinceCheck = 0;

        // Real-time pacing: at diffusionSpeed 1x, run this many simulation
        // steps per second (independent of display refresh rate). diffusion=0.3
        // above already converges fully within a few hundred steps, so pacing
        // is controlled here rather than by weakening the physics constants -
        // that path either destabilizes the stencil (too strong) or gets stuck
        // in a slowly-converging transient that never visually finishes within
        // a reasonable step budget (too weak).
        this.simStepsPerSecond = 15;
        this._simStepAccumulator = 0;
        this._simLastStepTime = undefined;
        // Phase driving the shader's spatial diffusion-rate noise field
        // (u_time in simFragmentShaderSource) - drifts slowly and
        // independently of diffusionSpeed, so the noise pattern itself
        // keeps evolving even while paused/slow.
        this._simNoiseFieldTime = Math.random() * 1000;

        // Fullscreen quad geometry shared by the seed and diffusion passes
        this.simVAO = gl.createVertexArray();
        gl.bindVertexArray(this.simVAO);

        const simPosBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, simPosBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1, 1, -1, -1, 1,
            -1, 1, 1, -1, 1, 1,
        ]), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

        const simUvBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, simUvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            0, 0, 1, 0, 0, 1,
            0, 1, 1, 0, 1, 1,
        ]), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);

        gl.bindVertexArray(null);

        const simVertexShader = this.createShader(gl, gl.VERTEX_SHADER, this.simVertexShaderSource);
        const simFragmentShader = this.createShader(gl, gl.FRAGMENT_SHADER, this.simFragmentShaderSource);
        this.simProgram = this.createProgram(gl, simVertexShader, simFragmentShader);

        this.simUniforms = {
            state: gl.getUniformLocation(this.simProgram, 'u_state'),
            texel: gl.getUniformLocation(this.simProgram, 'u_texel'),
            diffusion: gl.getUniformLocation(this.simProgram, 'u_diffusion'),
            reformRate: gl.getUniformLocation(this.simProgram, 'u_reformRate'),
            mode: gl.getUniformLocation(this.simProgram, 'u_mode'),
            dt: gl.getUniformLocation(this.simProgram, 'u_dt'),
            time: gl.getUniformLocation(this.simProgram, 'u_time'),
        };

        const seedVertexShader = this.createShader(gl, gl.VERTEX_SHADER, this.simVertexShaderSource);
        const seedFragmentShader = this.createShader(gl, gl.FRAGMENT_SHADER, this.simSeedFragmentShaderSource);
        this.simSeedProgram = this.createProgram(gl, seedVertexShader, seedFragmentShader);

        this.simSeedUniforms = {
            pattern: gl.getUniformLocation(this.simSeedProgram, 'u_pattern'),
            resolution: gl.getUniformLocation(this.simSeedProgram, 'u_resolution'),
            tileSize: gl.getUniformLocation(this.simSeedProgram, 'u_tileSize'),
            backgroundColor: gl.getUniformLocation(this.simSeedProgram, 'u_backgroundColor'),
        };

        const w = this.simSize, h = this.simSize;
        this.simTextures = [0, 1].map(() => {
            const tex = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            return tex;
        });

        this.simFramebuffers = this.simTextures.map(tex => {
            const fb = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
            return fb;
        });
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        this.simCurrent = 0;
        // Deliberately not seeding here: this.canvas hasn't been sized yet at
        // construction time (the element isn't connected to the DOM, so
        // clientWidth/Height are still 0) - seeding now would bake in the wrong
        // resolution and produce a seed mask misaligned with the real pattern.
        // The textures start zeroed (erosion=0, source=0), which renders as the
        // plain crisp pattern; connectedCallback's ResizeObserver does the real
        // first seed once actual dimensions are known.
    }

    // Renders the actual tile pattern into simTextures[0] to seed the erosion
    // source mask - so the diffusion grows outward from wherever the pattern's
    // lines actually are on screen, not arbitrary points. Call again whenever
    // the canvas size or tile size changes, so the seed stays aligned.
    seedSimulation() {
        const gl = this.gl;
        const bg = this.hexToRgba(this.backgroundColor, 1, true);

        gl.useProgram(this.simSeedProgram);
        gl.bindVertexArray(this.simVAO);
        gl.viewport(0, 0, this.simSize, this.simSize);

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.simFramebuffers[0]);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(this.simSeedUniforms.pattern, 0);
        gl.uniform2f(this.simSeedUniforms.resolution, this.canvas.width, this.canvas.height);
        gl.uniform1f(this.simSeedUniforms.tileSize, this.tileSize);
        gl.uniform3f(this.simSeedUniforms.backgroundColor, bg[0], bg[1], bg[2]);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindVertexArray(null);
        this.simCurrent = 0;

        // A fresh seed means erosion is back at 0 everywhere - restart the
        // cycle from the dissolve phase rather than possibly resuming mid-reform.
        this.simPhase = 'dissolve';
        this.simElapsedSteps = 0;
        this._simStepAccumulator = 0;
        this._simLastStepTime = undefined;
        this._simStepsSinceCheck = 0;
    }

    // Advances the diffusion simulation, ping-ponging between the two state
    // textures/framebuffers. Paced by real elapsed time (simStepsPerSecond x
    // an organic, Perlin-noise-modulated diffusionSpeed) rather than by
    // rendered frame count, so it runs at a watchable but non-mechanical rate
    // regardless of display refresh rate. The diffusion coefficient itself
    // stays fixed - it's already tuned to fully converge within a few hundred
    // steps; pacing controls how long that takes in real seconds.
    stepSimulation() {
        const now = performance.now();
        if (this._simLastStepTime === undefined) this._simLastStepTime = now;
        const elapsedSec = (now - this._simLastStepTime) / 1000;
        this._simLastStepTime = now;

        if (this.diffusionSpeed <= 0) {
            this._simStepAccumulator = 0; // frozen: also pauses the dissolve/reform cycle
            return;
        }

        // Toolbar's Diffusion Speed is a ceiling the noise wanders under
        // (roughly 0.3x-1.3x of it), not a constant rate - keeps the erosion
        // visibly speeding up and slowing down instead of crawling evenly.
        this._diffusionNoiseTime += elapsedSec * 0.25;
        const noiseFactor = 0.3 + this.diffusionNoise.noise1(this._diffusionNoiseTime); // ~0.3..1.3
        const effectiveSpeed = this.diffusionSpeed * noiseFactor;

        this._simStepAccumulator += elapsedSec * this.simStepsPerSecond * effectiveSpeed;
        // Cap the catch-up burst (e.g. after the tab was backgrounded) so a long
        // stall doesn't suddenly fast-forward the cycle by hundreds of steps.
        const iterations = Math.min(Math.floor(this._simStepAccumulator), 30);
        if (iterations <= 0) return;
        this._simStepAccumulator -= iterations;

        const gl = this.gl;
        gl.useProgram(this.simProgram);
        gl.bindVertexArray(this.simVAO);
        gl.viewport(0, 0, this.simSize, this.simSize);

        this._simNoiseFieldTime += elapsedSec * 0.08;

        gl.uniform2f(this.simUniforms.texel, 1 / this.simSize, 1 / this.simSize);
        gl.uniform1f(this.simUniforms.diffusion, this.simDiffusion);
        gl.uniform1f(this.simUniforms.reformRate, this.simReformRate);
        gl.uniform1f(this.simUniforms.dt, this.simDt);
        gl.uniform1f(this.simUniforms.time, this._simNoiseFieldTime);
        gl.uniform1i(this.simUniforms.state, 0);

        for (let i = 0; i < iterations; i++) {
            this.simElapsedSteps += 1;
            // Safety cap: normally the readback check below bounces dissolve
            // back to reform well before this, but guarantees eventual
            // switching even if that check somehow never fires.
            const limit = this.simPhase === 'dissolve' ? this.simDissolveSteps : this.simReformSteps;
            if (this.simElapsedSteps >= limit) {
                this.simPhase = this.simPhase === 'dissolve' ? 'reform' : 'dissolve';
                this.simElapsedSteps = 0;
            }
            gl.uniform1f(this.simUniforms.mode, this.simPhase === 'reform' ? 1.0 : 0.0);

            const src = this.simCurrent;
            const dst = 1 - this.simCurrent;
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.simFramebuffers[dst]);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.simTextures[src]);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
            this.simCurrent = dst;

            // Bounce dissolve back to reform once actual progress crosses the
            // target, rather than running to full completion. Checked every
            // simProgressCheckInterval steps (not every step, since it forces
            // a GPU readback) and stops dissolving immediately within this same
            // batch once it fires, instead of only after the whole batch -
            // otherwise a single call (up to 30 steps) could overshoot well
            // past the target before the check ever ran.
            if (this.simPhase === 'dissolve') {
                this._simStepsSinceCheck += 1;
                if (this._simStepsSinceCheck >= this.simProgressCheckInterval) {
                    this._simStepsSinceCheck = 0;
                    if (this.measureAvgErosion() >= this.simDissolveTarget) {
                        this.simPhase = 'reform';
                        this.simElapsedSteps = 0;
                    }
                }
            }
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindVertexArray(null);
    }

    // Reads back the (small) simulation texture and returns the average
    // erosion value across the whole domain, used to gauge dissolve progress.
    measureAvgErosion() {
        const gl = this.gl;
        const s = this.simSize;
        if (!this._simReadBuf) this._simReadBuf = new Uint8Array(s * s * 4);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.simFramebuffers[this.simCurrent]);
        gl.readPixels(0, 0, s, s, gl.RGBA, gl.UNSIGNED_BYTE, this._simReadBuf);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        let sum = 0;
        const buf = this._simReadBuf;
        for (let i = 0; i < s * s; i++) sum += buf[i * 4];
        return sum / (s * s) / 255;
    }

    updatePointsCanvasSize(canvas) {
        const ratio = window.devicePixelRatio || 1;

        // Use the dynamic tile size
        canvas.style.width = `${this.tileSize}px`;
        canvas.style.height = `${this.tileSize}px`;
        canvas.style.minHeight = `unset`;

        canvas.width = this.tileSize * ratio;
        canvas.height = this.tileSize * ratio;

        canvas.getContext('webgl2').viewport(0, 0, canvas.width, canvas.height);
    }

    updateCanvasSize(canvas) {
        const ratio = window.devicePixelRatio * 2 || 2;
        const width = this.clientWidth || 300;
        const height = this.clientHeight || 300;

        canvas.width = width * ratio;
        canvas.height = height * ratio;
        canvas.getContext('webgl2').viewport(0, 0, canvas.width, canvas.height);
    }

    render() {
        const gl = this.gl;

        // Guard against calls made before initializeWebGL() finishes: some
        // constructor-time paths (e.g. importing the default point pattern)
        // trigger a render before this.program / this.simProgram exist.
        if (!this.program || !this.simProgram) return;

        if (this.reactionDiffusionEnabled) {
            this.stepSimulation();
        }
        // stepSimulation leaves the viewport set to the simulation's small
        // off-screen size; restore it before drawing the main scene.
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);

        gl.useProgram(this.program);

        gl.uniform1f(this.rdEnabledLocation, this.reactionDiffusionEnabled ? 1.0 : 0.0);

        // Clear the canvas with the background color
        const bgColor = this.hexToRgba(this.backgroundColor, 1, true);
        gl.clearColor(bgColor[0], bgColor[1], bgColor[2], bgColor[3]);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform3f(this.backgroundColorLocation, bgColor[0], bgColor[1], bgColor[2]);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            0, 0,
            this.canvas.width, 0,
            0, this.canvas.height,
            0, this.canvas.height,
            this.canvas.width, 0,
            this.canvas.width, this.canvas.height,
        ]), gl.STATIC_DRAW);

        gl.enableVertexAttribArray(this.positionLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, 0, 0);

        gl.enableVertexAttribArray(this.texCoordLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.vertexAttribPointer(this.texCoordLocation, 2, gl.FLOAT, false, 0, 0);

        gl.uniform2f(this.resolutionLocation, gl.canvas.width, gl.canvas.height);
        gl.uniform1f(this.tileSizeLocation, this.tileSize); // Set tile size uniform

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(this.textureLocation, 0);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.simTextures[this.simCurrent]);
        gl.uniform1i(this.simTextureLocation, 1);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    startRenderLoop() {
        // Guard against starting a second concurrent loop (e.g. from a resize
        // observer firing again) which would stack forever and freeze the page.
        if (this.rafId) return;
        const loop = () => {
            this.render();
            this.rafId = requestAnimationFrame(loop);
        };
        this.rafId = requestAnimationFrame(loop);
    }

    stopRenderLoop() {
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }

    connectedCallback() {
        this.resizeObserver = new ResizeObserver(() => {
            this.updateCanvasSize(this.canvas);
            this.updatePointsCanvasSize(this.pointsCanvas);
            // Re-seed the dissolve source mask against the now-correct canvas
            // resolution (it may have been seeded against the pre-resize size).
            if (this.simSeedProgram) this.seedSimulation();
            this.render();
        });
        this.resizeObserver.observe(this);
        this.startRenderLoop();
    }

    disconnectedCallback() {
        this.stopRenderLoop();
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
    }
}

customElements.define('mm-alhambra', AlhambraTiled);
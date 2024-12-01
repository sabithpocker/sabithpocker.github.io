class PointsRenderer {
    constructor(pointsCanvas, points, options = {}) {
        this.pointsCanvas = pointsCanvas;
        this.canvas = this.pointsCanvas;
        this.points = points;
        this.selectedPoints = [];
        this.lineConnections = new Set(); // Store line connections as "index1,index2"
        this.options = {
            dotRadius: 3,
            dotColor: [1.0, 0.4, 0.4, 0.7],
            hoverColor: [1.0, 0.8, 0.4, 0.9],
            selectedColor: [0.4, 1.0, 0.4, 0.9],
            lineColor: [0.0, 1.0, 0.0, 0.8],
            hoverScale: 1.5,
            zIndex: 999,
            onLineAdded: null,
            onExportCSV: null,    // Callback for exporting CSV
            onImportCSV: null,    // Callback for importing CSV
            ...options
        };

        this.gl = this.pointsCanvas.getContext('webgl2');
        this.setupGL();
        this.setupInteraction();
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

        // Draw lines
        if (this.selectedPoints.length >= 2) {
            gl.useProgram(this.lineProgram);
            gl.bindVertexArray(this.lineVAO);

            gl.uniform2f(this.lineUniformLocations.resolution, this.canvas.width, this.canvas.height);
            gl.uniform4fv(this.lineUniformLocations.lineColor, this.options.lineColor);

            gl.lineWidth(2);
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
            this.render();
        }

        this.canvas.style.cursor = this.hoveredPointIndex !== -1 ? 'pointer' : 'default';
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
        this.shadowRoot.innerHTML = `
          <canvas data-canvas></canvas>
          <canvas data-canvas-points></canvas>
          <style>
          :host {
            display: grid;
            position: relative;
          }
          canvas {
            width: 100%;
            min-height: 100%;
            position: absolute;
            left: 0;
            top: 0;
          }
          </style>`;

        this.canvas = this.shadowRoot.querySelector('canvas');
        this.pointsCanvas = this.shadowRoot.querySelector('canvas[data-canvas-points]');
        this.selectedLines = new Set(); // Track selected line pairs

        this.gl = this.canvas.getContext('webgl2');
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
        this.textureCtx = this.textureCanvas.getContext('2d');

        this.initializeTexture();
        this.initializeWebGL();
        this.updateCanvasSize(this.canvas);
        this.render();
        this.setupExportImport();
    }

    setupExportImport() {
        // Add buttons to the shadow DOM
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            position: absolute;
            top: 10px;
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

        // Draw the new line
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)'; // Bright green, semi-transparent
        ctx.lineWidth = 2;
        ctx.moveTo(point1.x, point1.y);
        ctx.lineTo(point2.x, point2.y);
        ctx.stroke();

        // Update WebGL texture
        const gl = this.gl;
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.textureCanvas);

        // Trigger a re-render
        this.render();
    }

    generateTilePattern() {
        const ctx = this.textureCtx;
        const width = this.textureCanvas.width;
        const height = this.textureCanvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        let intersectionPoints = new Set(); // Using Set to avoid duplicate points

        // Helper function to add point to set with rounding to avoid floating point issues
        const addPoint = (x, y) => {
            // Only add points that are within the canvas bounds
            if (x >= 0 && x <= width && y >= 0 && y <= height) {
                const roundedX = Math.round(x * 1000) / 1000;
                const roundedY = Math.round(y * 1000) / 1000;
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

        // Clear canvas with background color
        ctx.fillStyle = '#1a1324';
        ctx.fillRect(0, 0, width, height);

        // Set common style for all lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;

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
        console.log(this.points);
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

        // Redraw the original pattern
        this.generateTilePattern();

        // Update the texture
        const gl = this.gl;
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.textureCanvas);

        // Render
        this.render();
    }

    createPointsRenderer(points) {
        this.pointsRenderer = new PointsRenderer(this.pointsCanvas, points, {
            dotRadius: 3,
            dotColor: [1.0, 0.4, 0.4, 0.7],
            hoverColor: [1.0, 0.8, 0.4, 0.9],
            hoverScale: 1.5,
            onLineAdded: (point1, point2) => {
                this.addLineToPattern(point1, point2);
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
        uniform vec2 u_resolution;
        out vec2 v_texCoord;
        
        void main() {
            vec2 zeroToOne = a_position.xy / u_resolution;
            vec2 clipSpace = (zeroToOne * 2.0 - 1.0) * vec2(1, -1);
            gl_Position = vec4(clipSpace, 0, 1);
            v_texCoord = a_texCoord;
        }`;
    }

    get fragmentShaderSource() {
        return `#version 300 es
        precision highp float;
        
        in vec2 v_texCoord;
        uniform sampler2D u_texture;
        uniform vec2 u_resolution;
        out vec4 outColor;
        
        void main() {
            vec2 repeat = u_resolution / 1024.0;  // 512 is texture size
            vec2 texCoord = fract(v_texCoord * repeat);
            outColor = texture(u_texture, texCoord);
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
        this.texCoordLocation = gl.getAttribLocation(this.program, 'a_texCoord');
        this.resolutionLocation = gl.getUniformLocation(this.program, 'u_resolution');

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
    }

    updateCanvasSize(canvas) {
        const ratio = window.devicePixelRatio || 1;
        const width = this.clientWidth || 300;
        const height = this.clientHeight || 300;

        canvas.width = width * ratio;
        canvas.height = height * ratio;
        canvas.getContext('webgl2').viewport(0, 0, canvas.width, canvas.height);
    }

    updatePointsCanvasSize(canvas) {
        const ratio = window.devicePixelRatio || 1;
        // Match the size of one tile (2048x2048)
        const tileSize = 512;

        // Set the canvas CSS size to match one tile
        canvas.style.width = `${tileSize}px`;
        canvas.style.height = `${tileSize}px`;
        canvas.style.minHeight = `unset`;

        // Set the actual canvas size accounting for device pixel ratio
        canvas.width = tileSize * ratio;
        canvas.height = tileSize * ratio;

        // Update the WebGL viewport
        canvas.getContext('webgl2').viewport(0, 0, canvas.width, canvas.height);
    }

    render() {
        const gl = this.gl;

        // Update position buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            0, 0,
            this.canvas.width, 0,
            0, this.canvas.height,
            0, this.canvas.height,
            this.canvas.width, 0,
            this.canvas.width, this.canvas.height,
        ]), gl.STATIC_DRAW);

        // Set up program
        gl.useProgram(this.program);

        // Set up position attribute
        gl.enableVertexAttribArray(this.positionLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, 0, 0);

        // Set up texCoord attribute
        gl.enableVertexAttribArray(this.texCoordLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.vertexAttribPointer(this.texCoordLocation, 2, gl.FLOAT, false, 0, 0);

        // Set resolution uniform
        gl.uniform2f(this.resolutionLocation, gl.canvas.width, gl.canvas.height);

        // Bind texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);

        // Draw
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    connectedCallback() {
        const resizeObserver = new ResizeObserver(() => {
            this.updateCanvasSize(this.canvas);
            this.updatePointsCanvasSize(this.pointsCanvas);
            this.render();
        });
        resizeObserver.observe(this);
    }

    disconnectedCallback() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
    }
}

customElements.define('mm-alhambra', AlhambraTiled);
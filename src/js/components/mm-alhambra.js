class AlhambraTiled extends HTMLElement {
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
          </style>`;

        this.canvas = this.shadowRoot.querySelector('canvas');
        this.gl = this.canvas.getContext('webgl2');
        if (!this.gl) {
            console.error('WebGL2 not supported');
            return;
        }

        // Create a hidden canvas for texture generation
        this.textureCanvas = document.createElement('canvas');
        this.textureCanvas.width = 2048;  // Size of one tile
        this.textureCanvas.height = 2048;
        this.textureCtx = this.textureCanvas.getContext('2d');

        this.initializeTexture();
        this.initializeWebGL();
        this.updateCanvasSize();
        this.render();
    }
    generateTilePattern() {
        const ctx = this.textureCtx;
        const width = this.textureCanvas.width;
        const height = this.textureCanvas.height;
        const centerX = width / 2;
        const centerY = height / 2;

        // Clear canvas with background color
        ctx.fillStyle = '#1a1324';
        ctx.fillRect(0, 0, width, height);

        // Set common style for all lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;

        // Draw guide lines (16 divisions)
        ctx.beginPath();

        // Original diagonal lines
        ctx.moveTo(0, 0);
        ctx.lineTo(width, height);
        ctx.moveTo(width, 0);
        ctx.lineTo(0, height);

        // Vertical and horizontal lines
        ctx.moveTo(centerX, 0);
        ctx.lineTo(centerX, height);
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);

        // Additional diagonal lines at 22.5° and 67.5° angles
        const angle22_5 = Math.tan(22.5 * Math.PI / 180);
        const angle67_5 = Math.tan(67.5 * Math.PI / 180);

        // 22.5° and 202.5° lines
        ctx.moveTo(0, centerY - centerX * angle22_5);
        ctx.lineTo(width, centerY + centerX * angle22_5);
        ctx.moveTo(0, centerY + centerX * angle22_5);
        ctx.lineTo(width, centerY - centerX * angle22_5);

        // 67.5° and 247.5° lines
        ctx.moveTo(centerX - centerY * angle22_5, 0);
        ctx.lineTo(centerX + centerY * angle22_5, height);
        ctx.moveTo(centerX + centerY * angle22_5, 0);
        ctx.lineTo(centerX - centerY * angle22_5, height);

        ctx.stroke();

        // Draw square border
        ctx.beginPath();
        ctx.rect(0, 0, width, height);
        ctx.stroke();

        // Draw mainCircle
        const mainCircleRadius = (Math.min(width, height) / 2);
        ctx.beginPath();
        ctx.arc(centerX, centerY, mainCircleRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Calculate and draw centerCircle (1/4 of diagonal length)
        const diagonalLength = width * Math.sqrt(2);
        const centerCircleRadius = diagonalLength / 8;
        ctx.beginPath();
        ctx.arc(centerX, centerY, centerCircleRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Draw the two squares with extended lines
        const squareSize = centerCircleRadius * Math.sqrt(2); // Side length for squares inscribed in circle
        const halfSquare = squareSize / 2;

        // First square (aligned) with extended lines
        ctx.beginPath();
        // Vertical lines
        ctx.moveTo(centerX - halfSquare, 0);
        ctx.lineTo(centerX - halfSquare, height);
        ctx.moveTo(centerX + halfSquare, 0);
        ctx.lineTo(centerX + halfSquare, height);
        // Horizontal lines
        ctx.moveTo(0, centerY - halfSquare);
        ctx.lineTo(width, centerY - halfSquare);
        ctx.moveTo(0, centerY + halfSquare);
        ctx.lineTo(width, centerY + halfSquare);
        ctx.stroke();

        // Second square (rotated 45 degrees) with extended lines
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(Math.PI / 4);

        // Draw extended lines
        ctx.beginPath();
        // Vertical lines
        ctx.moveTo(-halfSquare, -width); // Extended beyond tile bounds to ensure coverage
        ctx.lineTo(-halfSquare, width);
        ctx.moveTo(halfSquare, -width);
        ctx.lineTo(halfSquare, width);
        // Horizontal lines
        ctx.moveTo(-width, -halfSquare);
        ctx.lineTo(width, -halfSquare);
        ctx.moveTo(-width, halfSquare);
        ctx.lineTo(width, halfSquare);
        ctx.stroke();

        ctx.restore();

        // Calculate cornerCircle radius
        const halfDiagonal = width * Math.sqrt(2) / 2;
        const cornerCircleRadius = halfDiagonal - mainCircleRadius;

        // Draw cornerCircles in each corner
        // Top-left cornerCircle
        ctx.beginPath();
        ctx.arc(0, 0, cornerCircleRadius, 0, Math.PI / 2);
        ctx.stroke();

        // Top-right cornerCircle
        ctx.beginPath();
        ctx.arc(width, 0, cornerCircleRadius, Math.PI / 2, Math.PI);
        ctx.stroke();

        // Bottom-right cornerCircle
        ctx.beginPath();
        ctx.arc(width, height, cornerCircleRadius, Math.PI, Math.PI * 3 / 2);
        ctx.stroke();

        // Bottom-left cornerCircle
        ctx.beginPath();
        ctx.arc(0, height, cornerCircleRadius, Math.PI * 3 / 2, Math.PI * 2);
        ctx.stroke();

        // Draw extended tangent lines
        ctx.beginPath();

        // Calculate intersection points
        const intersectOffset = cornerCircleRadius / Math.sqrt(2);

        // Function to extend line to border
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

        // Draw extended tangent lines for each corner
        const corners = [
            { mid1: [0, centerY], mid2: [centerX, 0], intersect: [intersectOffset, intersectOffset] },
            { mid1: [width, centerY], mid2: [centerX, 0], intersect: [width - intersectOffset, intersectOffset] },
            { mid1: [width, centerY], mid2: [centerX, height], intersect: [width - intersectOffset, height - intersectOffset] },
            { mid1: [0, centerY], mid2: [centerX, height], intersect: [intersectOffset, height - intersectOffset] }
        ];

        corners.forEach(corner => {
            let [endX1, endY1] = extendLine(corner.mid1[0], corner.mid1[1],
                corner.intersect[0], corner.intersect[1],
                width, height);
            ctx.moveTo(corner.mid1[0], corner.mid1[1]);
            ctx.lineTo(endX1, endY1);

            let [endX2, endY2] = extendLine(corner.mid2[0], corner.mid2[1],
                corner.intersect[0], corner.intersect[1],
                width, height);
            ctx.moveTo(corner.mid2[0], corner.mid2[1]);
            ctx.lineTo(endX2, endY2);
        });

        ctx.stroke();
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

    updateCanvasSize() {
        const ratio = window.devicePixelRatio || 1;
        const width = this.clientWidth || 300;
        const height = this.clientHeight || 300;

        this.canvas.width = width * ratio;
        this.canvas.height = height * ratio;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
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
            this.updateCanvasSize();
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
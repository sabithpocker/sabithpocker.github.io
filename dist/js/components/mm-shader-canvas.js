class ShaderCanvas extends HTMLElement{get ratio(){return window.devicePixelRatio||1}static get observedAttributes(){return["vertex-shader","fragment-shader","color"]}constructor(){super(),this.attachShadow({mode:"open"}),this.shadowRoot.innerHTML="\n          <canvas data-canvas></canvas>\n          <style>\n          :host {\n            display: grid;\n          }\n          canvas {\n            width: 100%;\n            min-height: 100%;\n          }\n          ";const t=this.shadowRoot.querySelector("canvas"),e=t.getContext("webgl2");e?(this._vertexShaderSource=null,this._fragmentShaderSource=null,this._color="#000000",this.canvas=t,this.gl=e,this.initializeWebGL(),this.updateCanvasSize(),this.render(0)):console.error("WebGL2 not supported")}createShader(t,e,r){const i=t.createShader(e);t.shaderSource(i,r),t.compileShader(i);if(t.getShaderParameter(i,t.COMPILE_STATUS))return i;console.error(t.getShaderInfoLog(i)),t.deleteShader(i)}createProgram(t,e,r){const i=t.createProgram();t.attachShader(i,e),t.attachShader(i,r),t.linkProgram(i);if(t.getProgramParameter(i,t.LINK_STATUS))return i;console.error(t.getProgramInfoLog(i)),t.deleteProgram(i)}hexToRgb(t){const e=parseInt(t.slice(1),16);return[(e>>16&255)/255,(e>>8&255)/255,(255&e)/255]}updateCanvasSize(){const t=this.ratio;this.canvas.width=this.canvas.clientWidth*t,this.canvas.height=this.canvas.clientHeight*t,this.gl.viewport(0,0,this.canvas.width,this.canvas.height)}initializeWebGL(){const t=this.gl,e=this.vertexShaderSource,r=this.fragmentShaderSource,i=this.createShader(t,t.VERTEX_SHADER,e),o=this.createShader(t,t.FRAGMENT_SHADER,r);this.program=this.createProgram(t,i,o),this.positionAttributeLocation=t.getAttribLocation(this.program,"a_position"),this.colorUniformLocation=t.getUniformLocation(this.program,"u_color"),this.resolutionUniformLocation=t.getUniformLocation(this.program,"u_resolution"),this.timeUniformLocation=t.getUniformLocation(this.program,"u_time"),this.positionBuffer=t.createBuffer(),t.bindBuffer(t.ARRAY_BUFFER,this.positionBuffer)}render(t){const e=this.gl,r=[0,0,e.canvas.width,0,0,e.canvas.height,0,e.canvas.height,e.canvas.width,0,e.canvas.width,e.canvas.height];e.bufferData(e.ARRAY_BUFFER,new Float32Array(r),e.STATIC_DRAW),e.enableVertexAttribArray(this.positionAttributeLocation),e.vertexAttribPointer(this.positionAttributeLocation,2,e.FLOAT,!1,0,0),e.useProgram(this.program),e.uniform2f(this.resolutionUniformLocation,e.canvas.width,e.canvas.height);const i=this.color||[1,0,0,1];e.uniform4f(this.colorUniformLocation,i[0],i[1],i[2],i[3]),e.uniform1f(this.timeUniformLocation,.001*t),e.clear(e.COLOR_BUFFER_BIT),e.drawArrays(e.TRIANGLES,0,6)}get vertexShaderSource(){return this._vertexShaderSource||"#version 300 es\n            in vec4 a_position;\n            void main() {\n                gl_Position = a_position;\n            }\n        "}set vertexShaderSource(t){this._vertexShaderSource=t,this.initializeWebGL()}get fragmentShaderSource(){return this._fragmentShaderSource||"#version 300 es\n        precision mediump float;\n        uniform vec4 u_color;\n        uniform float u_time; // Add this line\n        out vec4 outColor;\n        void main() {\n            outColor = u_color;\n        }\n        "}set fragmentShaderSource(t){this._fragmentShaderSource=t,this.initializeWebGL()}set color(t){this._color=this.hexToRgb(t),this.initializeWebGL()}get color(){return this._color}attributeChangedCallback(t,e,r){"vertex-shader"===t?this.vertexShaderSource=r:"fragment-shader"===t?this.fragmentShaderSource=r:"color"===t&&(this.color=r),this.initializeWebGL(),this.updateCanvasSize(),this.render(100)}connectedCallback(){this.updateCanvasSize()}}customElements.define("mm-shader-canvas",ShaderCanvas);
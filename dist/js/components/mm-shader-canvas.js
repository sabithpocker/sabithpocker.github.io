class ShaderCanvas extends HTMLElement{get ratio(){return window.devicePixelRatio||1}static get observedAttributes(){return["vertex-shader","fragment-shader","color"]}constructor(){super(),this.attachShadow({mode:"open"}),this.shadowRoot.innerHTML="\n          <canvas data-canvas></canvas>\n          <style>\n          :host {\n            display: grid;\n          }\n          canvas {\n            width: 100%;\n            min-height: 100%;\n          }\n          ";const e=this.shadowRoot.querySelector("canvas"),t=e.getContext("webgl2");t?(this._vertexShaderSource=null,this._fragmentShaderSource=null,this._color="#000000",this.canvas=e,this.gl=t,this.initializeWebGL(),this.updateCanvasSize(),this.render(0)):console.error("WebGL2 not supported")}createShader(e,t,r){const i=e.createShader(t);e.shaderSource(i,r),e.compileShader(i);if(e.getShaderParameter(i,e.COMPILE_STATUS))return i;console.error(e.getShaderInfoLog(i)),e.deleteShader(i)}createProgram(e,t,r){const i=e.createProgram();e.attachShader(i,t),e.attachShader(i,r),e.linkProgram(i);if(e.getProgramParameter(i,e.LINK_STATUS))return i;console.error(e.getProgramInfoLog(i)),e.deleteProgram(i)}hexToRgb(e){const t=parseInt(e.slice(1),16);return[(t>>16&255)/255,(t>>8&255)/255,(255&t)/255]}updateCanvasSize(){const e=this.ratio;this.canvas.width=this.canvas.clientWidth*e,this.canvas.height=this.canvas.clientHeight*e,this.gl.viewport(0,0,this.canvas.width,this.canvas.height)}initializeWebGL(){const e=this.gl,t=this.vertexShaderSource,r=this.fragmentShaderSource,i=this.createShader(e,e.VERTEX_SHADER,t),a=this.createShader(e,e.FRAGMENT_SHADER,r);this.program=this.createProgram(e,i,a),this.positionAttributeLocation=e.getAttribLocation(this.program,"a_position"),this.colorUniformLocation=e.getUniformLocation(this.program,"u_color"),this.resolutionUniformLocation=e.getUniformLocation(this.program,"u_resolution"),this.timeUniformLocation=e.getUniformLocation(this.program,"u_time"),this.positionBuffer=e.createBuffer(),e.bindBuffer(e.ARRAY_BUFFER,this.positionBuffer)}render(e){const t=this.gl,r=[0,0,t.canvas.width,0,0,t.canvas.height,0,t.canvas.height,t.canvas.width,0,t.canvas.width,t.canvas.height];t.bufferData(t.ARRAY_BUFFER,new Float32Array(r),t.STATIC_DRAW),t.enableVertexAttribArray(this.positionAttributeLocation),t.vertexAttribPointer(this.positionAttributeLocation,2,t.FLOAT,!1,0,0),t.useProgram(this.program),t.uniform2f(this.resolutionUniformLocation,t.canvas.width,t.canvas.height);const i=this.color||[1,0,0,1];t.uniform4f(this.colorUniformLocation,i[0],i[1],i[2],i[3]),t.uniform1f(this.timeUniformLocation,.001*e),t.clear(t.COLOR_BUFFER_BIT),t.drawArrays(t.TRIANGLES,0,6),requestAnimationFrame(this.render.bind(this))}get vertexShaderSource(){return this._vertexShaderSource||"#version 300 es\n            in vec4 a_position;\n            void main() {\n                gl_Position = a_position;\n            }\n        "}set vertexShaderSource(e){this._vertexShaderSource=e,this.initializeWebGL()}get fragmentShaderSource(){return this._fragmentShaderSource||"#version 300 es\n        precision mediump float;\n        uniform vec4 u_color;\n        uniform float u_time; // Add this line\n        out vec4 outColor;\n        void main() {\n            outColor = u_color;\n        }\n        "}set fragmentShaderSource(e){this._fragmentShaderSource=e,this.initializeWebGL()}set color(e){this._color=this.hexToRgb(e),this.initializeWebGL()}get color(){return this._color}attributeChangedCallback(e,t,r){"vertex-shader"===e?this.vertexShaderSource=r:"fragment-shader"===e?this.fragmentShaderSource=r:"color"===e&&(this.color=r),this.initializeWebGL(),this.updateCanvasSize(),this.render(0)}connectedCallback(){this.updateCanvasSize(),window.addEventListener("resize",(()=>{this.updateCanvasSize()})),requestAnimationFrame(this.render.bind(this))}}customElements.define("mm-shader-canvas",ShaderCanvas);
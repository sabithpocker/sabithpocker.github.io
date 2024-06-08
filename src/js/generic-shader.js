import fragmentShader2 from "./vertex-shaders/fragment-shader-2.js";
import vertexShader2 from "./vertex-shaders/vertex-shader-2.js";




function init() {
  const shaderCanvas = document.querySelector("[data-canvas='shader-canvas']");
  shaderCanvas.vertexShaderSource = vertexShader2;
  shaderCanvas.fragmentShaderSource = fragmentShader2;
  shaderCanvas.color = 'rgba(255,2,255,1)';

  const animateShader = (timestamp) => {
    shaderCanvas.render(timestamp);
    window.requestAnimationFrame((timestamp) => {
      animateShader(timestamp)
    }
    );
  };

  animateShader(100);

}


window.onload = setTimeout(init, 314);

import PerlinNoise from"./perlin.js";import animateSpirograph from"./utils/animate-spirograph.js";import organicAnimateSpirograph from"./utils/organic-animate-spirograph.js";import gradientShader from"./vertex-shaders/gradient-shader.js";import gradientShaderDark from"./vertex-shaders/gradient-shader-dark.js";import fragmentShaderSource from"./vertex-shaders/fragment-shader-source.js";import Three from"https://cdn.skypack.dev/three@0.138.0";function init(){const r=document.querySelector("[data-spirograph='outer']");r.style.opacity=.5;const e=document.querySelector("[data-spirograph='middle']"),t=new PerlinNoise;r.vertexShaderSource=gradientShaderDark,e.vertexShaderSource=gradientShader,e.fragmentShaderSource=fragmentShaderSource,organicAnimateSpirograph(.01,e,690,690,2,3,616,700,.1,1,t),document.querySelector(".highlight__items").style.transition="all 3140ms ease-in",document.querySelector(".highlight__items").style.opacity="1"}window.onload=setTimeout(init,314);
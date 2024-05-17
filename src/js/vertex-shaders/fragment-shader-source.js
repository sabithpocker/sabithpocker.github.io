const fragmentShaderSource = `#version 300 es
precision highp float;
in vec4 v_color;
in vec2 v_fragCoord;
uniform vec2 u_resolution;
uniform sampler2D u_texture;
out vec4 outColor;
uniform float u_time;

void main() {
    vec2 uv =  (v_fragCoord * 2.0 - u_resolution.xy) / u_resolution.y;
    float d = 0.001 / abs(sin(length(uv)*100. + u_time) / 100.);
    vec4 color = vec4(d, d, d, 1.0);
    outColor = color;
}`;

export default fragmentShaderSource;
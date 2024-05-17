const fragmentShaderSource = `#version 300 es
precision highp float;

in vec2 v_fragCoord;
uniform vec2 u_resolution;
uniform float u_time;
out vec4 outColor;

vec3 palette( float t ) {
    vec3 a = vec3(0.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.263,0.416,0.557);

    return a + b*cos( 6.28318*(c*t+d) );
}

void main() {
    vec2 uv = (v_fragCoord * 2.0 - u_resolution.xy) / u_resolution.y;
    float len_uv = length(uv);
    vec3 col = palette(len_uv + u_time);
    float sin_val = sin(len_uv * 100.0 + u_time);
    float d = 0.001 / abs(sin_val / 100.0);
    outColor = vec4(col * d, d);
}`;

export default fragmentShaderSource;
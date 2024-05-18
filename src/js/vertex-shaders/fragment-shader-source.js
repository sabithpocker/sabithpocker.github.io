const fragmentShaderSource = `#version 300 es
precision highp float;

in vec2 v_fragCoord;
uniform vec2 u_resolution;
uniform float u_time;
out vec4 outColor;

vec3 palette(float t) {
    vec3 a = vec3(0.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.263, 0.416, 0.557);

    return a + b * cos(6.28318 * (c * t + d));
}

float rand(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

vec2 perturb(vec2 p, float scale) {
    float angle = rand(p) * 6.28318;
    return vec2(cos(angle), sin(angle)) * scale;
}

vec2 reactionDiffusion(vec2 uv) {
    float dA = 1.0;
    float dB = 0.5;
    float feed = 0.055;
    float kill = 0.062;

    vec2 center = vec2(0.5);
    vec2 p = uv * 2.0 - 1.0;

    float dist = length(p);
    float m = smoothstep(0.0, 0.1, dist);
    float n = 1.0 - smoothstep(0.4, 0.5, dist);

    float t = u_time * 0.1;
    vec2 noise = perturb(uv + t, 0.02) * 0.005;
    
    vec2 val = vec2(m, n) + noise;
    vec2 diffusion = vec2(dA, dB) * (val - uv);

    vec2 reaction = vec2(
        uv.x * uv.y * uv.y - feed * (1.0 - uv.x),
        -uv.x * uv.y * uv.y + (feed + kill) * uv.y
    );

    return val + diffusion + reaction;
}

void main() {
    vec2 uv = (v_fragCoord * 2.0 - u_resolution.xy) / u_resolution.y;
    uv = reactionDiffusion(uv);
    vec3 col = palette(length(uv) + u_time / 5.0);
    vec3 finalColor = vec3(0.14);

    for (float i = 0.0; i < 5.0; i++) {
        uv = fract(uv * 1.5 + i / 10.0) - 0.5;
        float len_uv = length(uv);
        float sin_val = sin(len_uv * 7.0 + u_time / 5.0);
        float d = 0.001 / abs(sin_val / 100.0);
        finalColor += col * d;
    }

    outColor = vec4(finalColor, 1.0);
}`;

export default fragmentShaderSource;
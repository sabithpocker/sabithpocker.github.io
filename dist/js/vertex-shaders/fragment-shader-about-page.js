const fragmentShaderSource="#version 300 es\nprecision highp float;\n\nin vec2 v_fragCoord;\nuniform vec2 u_resolution;\nuniform float u_time;\nout vec4 outColor;\n\nvec3 palette(float t) {\n    vec3 a = vec3(0.5, 0.5, 0.5);\n    vec3 b = vec3(0.5, 0.5, 0.5);\n    vec3 c = vec3(1.0, 1.0, 1.0);\n    vec3 d = vec3(0.263, 0.416, 0.557);\n\n    return a + b * cos(6.28318 * (c * t + d));\n}\n\nfloat rand(vec2 co) {\n    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);\n}\n\nvec2 perturb(vec2 p, float scale) {\n    float angle = rand(p) * 6.28318;\n    return vec2(cos(angle), sin(angle)) * scale;\n}\n\nvec2 reactionDiffusion(vec2 uv) {\n    float dA = 1.0;\n    float dB = 0.6;\n    float feed = 0.035;\n    float kill = 0.065;\n\n    vec2 center = vec2(0.75);\n    vec2 p = uv * 2.0 - 1.0;\n\n    float dist = length(p);\n    float m = smoothstep(0.0, 0.1, dist);\n    float n = 1.0 - smoothstep(0.4, 0.5, dist);\n\n    float t = u_time * 0.1;\n    vec2 noise = perturb(uv + t, 0.02) * 0.005;\n    \n    vec2 val = vec2(m, n);\n    vec2 diffusion = vec2(dA, dB) * (val - uv);\n\n    vec2 reaction = vec2(\n        uv.x * uv.y * uv.y - feed * (1.0 - uv.x),\n        -uv.x * uv.y * uv.y + (feed + kill) * uv.y\n    );\n\n    return val + diffusion + reaction;\n}\n\n// Logistic map function for chaotic zoom\nfloat logisticMap(float x, float r) {\n    return r * x * (1.0 - x);\n}\n\nvoid main() {\n    vec2 uv = (v_fragCoord * 2.0 - u_resolution.xy) / u_resolution.y;\n\n    // Chaotic zoom using logistic map\n    float r = 3.7 + 0.3 * sin(u_time * 0.5); // Control parameter with slight variation\n    float x = fract(u_time * 0.1);\n    x = logisticMap(x, r);\n    float zoom = 1.0 + 0.5 * x;\n    uv *= zoom;\n    vec2 xx = uv;\n    \n    uv = reactionDiffusion(uv);\n    vec3 col = palette(length(uv) + u_time / 5.0);\n    vec3 finalColor = vec3(0.14);\n    for (float i = 0.0; i < 3.0; i++) {\n        uv = fract(uv * 2.0 + i / 100.0) - 0.5;\n        float len_uv = length(uv);\n        float sin_val = sin(len_uv * 20.0 + u_time / 10.0);\n        float d = 0.001 / abs(sin_val / 100.0);\n        finalColor += col * d;\n    }\n\n    outColor = vec4(finalColor, cos(xx.y));\n}\n\n";export default fragmentShaderSource;
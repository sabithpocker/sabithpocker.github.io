const gradientShader = `#version 300 es

#define TARGET_COLOR vec4(0.29, 0.88, 0.31, 1.0) // Define the target color
// Vertex Shader
// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec2 a_position;

// Used to pass in the resolution of the canvas
uniform vec2 u_resolution;

out vec4 v_color;
out vec2 v_fragCoord; // Pass the fragment coordinate to the fragment shader

void main() {
    // convert the position from pixels to 0.0 to 1.0
    vec2 zeroToOne = a_position / u_resolution;

    // convert from 0->1 to 0->2
    vec2 zeroToTwo = zeroToOne * 2.0;

    // convert from 0->2 to -1->+1 (clipspace)
    vec2 clipSpace = zeroToTwo - 1.0;

    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
    v_fragCoord = a_position; // Pass the fragment coordinate to the fragment shader

    // Predefined color for the vertex shader
    v_color = TARGET_COLOR;
}`;

export default gradientShader;

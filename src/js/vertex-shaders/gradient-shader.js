const gradientShader = `#version 300 es

#define TARGET_COLOR vec4(0.29, 0.88, 0.31, 1.0) // Define the target color

// Vertex Shader
in vec2 a_position; // Attribute input to vertex shader, receives data from a buffer

// Used to pass in the resolution of the canvas
uniform vec2 u_resolution;

out vec4 v_color;
out vec2 v_fragCoord; // Pass the fragment coordinate to the fragment shader

void main() {
    // Convert the position from pixels to normalized device coordinates (NDC)
    vec2 clipSpace = (a_position / u_resolution) * 2.0 - 1.0;

    // Set the final position of the vertex
    gl_Position = vec4(clipSpace * vec2(1.0, -1.0), 0.0, 1.0);

    // Pass the fragment coordinate to the fragment shader
    v_fragCoord = a_position;
}
`;

export default gradientShader;

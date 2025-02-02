const gradientShaderDark = `#version 300 es

  // an attribute is an input (in) to a vertex shader.
  // It will receive data from a buffer
  in vec2 a_position;

  // Used to pass in the resolution of the canvas
  uniform vec2 u_resolution;

  out vec4 v_color;

  // all shaders have a main function
  void main() {

    // convert the position from pixels to 0.0 to 1.0
    vec2 zeroToOne = a_position / u_resolution;

    // convert from 0->1 to 0->2
    vec2 zeroToTwo = zeroToOne * 2.0;

    // convert from 0->2 to -1->+1 (clipspace)
    vec2 clipSpace = zeroToTwo - 1.0;

    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);

    // Convert from clipspace to colorspace.
    // Clipspace goes -1.0 to +1.0
    // Colorspace goes from 0.0 to 1.0
    // v_color = vec4(1, 0.5, 1, 1) * gl_Position;
    // v_color = vec4(0.14, 0.59, 0.65, 1);
    v_color = vec4(0.937, 0.423, 0.956, 1) * (gl_Position / 0.314);
  }
  `;

export default gradientShaderDark;

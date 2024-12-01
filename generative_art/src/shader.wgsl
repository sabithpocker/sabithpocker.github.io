@stage(vertex)
fn vs_main() -> @builtin(position) vec4<f32> {
    return vec4<f32>(0.0, 0.0, 0.0, 1.0);
}

@stage(fragment)
fn fs_main(@builtin(position) pos: vec4<f32>) -> @location(0) vec4<f32> {
    // Mandelbrot set computation
    var c = vec2<f32>(pos.x, pos.y);
    var z = vec2<f32>(0.0, 0.0);
    var iter = 0u;
    while (length(z) < 2.0 && iter < 255u) {
        z = vec2<f32>(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
        iter = iter + 1u;
    }
    return vec4<f32>(vec3<f32>(f32(iter) / 255.0), 1.0);
}

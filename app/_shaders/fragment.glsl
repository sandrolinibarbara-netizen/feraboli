uniform sampler2D uTexture;
varying vec2 vUv;

void main() {
    float repUvX = fract(vUv.x * 5.0);
    float availableHeight = max(
        1.0 - abs(vUv.x * 2.0 - 1.0),
        0.0001
    );
    float compressedUvY = clamp(vUv.y / availableHeight, 0.0, 1.0);
    vec4 texture = texture2D(
        uTexture,
        vec2(repUvX, compressedUvY)
    );

    gl_FragColor = texture;
}

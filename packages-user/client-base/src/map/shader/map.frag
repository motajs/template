#version 300 es
precision highp float;
precision highp sampler2DArray;

in vec4 v_texCoord;

out vec4 outColor;

uniform sampler2DArray u_sampler;

void main() {
    vec4 texColor = texture(u_sampler, v_texCoord.xyz);
    float alpha = texColor.a * v_texCoord.a;
    // 低于阈值的透明像素直接 discard 来避免写深度区
    // 这里主要是为了剔除非透明素材的透明像素，如果素材有半透明像素需要单独声明为半透明素材
    if (alpha < 0.004) discard;
    outColor = vec4(texColor.rgb, alpha);
}

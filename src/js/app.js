// Menü geçişi

const menuToggle = document.querySelector(".menu-toggle");
const navMenu = document.querySelector(".nav-menu");

if (menuToggle && navMenu) {
    menuToggle.addEventListener("click", () => {
        navMenu.classList.toggle("active");
    });
}

document.querySelectorAll("nav a").forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
        e.preventDefault();
        const targetId = this.getAttribute("href");
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: "smooth",
            });
        }
        if (navMenu.classList.contains("active")) {
            navMenu.classList.remove("active");
        }
    });
});

(function(){
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) { els.forEach(el=>el.classList.add('active')); return; }

  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if (e.isIntersecting) e.target.classList.add('active');
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });

  els.forEach(el=>io.observe(el));
})();

const themeSwitcher = document.querySelector('.theme-switcher');
const body = document.body;

if (themeSwitcher) themeSwitcher.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    if (body.classList.contains('dark-mode')) {
        localStorage.setItem('theme', 'dark-mode');
    } else {
        localStorage.removeItem('theme');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('theme') === 'dark-mode') {
        body.classList.add('dark-mode');
    }
});

'use strict';

const canvas = document.querySelector('.canvasFluid');
const s = document.querySelector('.main__section');


let config = {
    TEXTURE_DOWNSAMPLE: 1,
    DENSITY_DISSIPATION: 0.98,
    VELOCITY_DISSIPATION: 0.99,
    PRESSURE_DISSIPATION: 0.8,
    PRESSURE_ITERATIONS: 25,
    CURL: 30,
    SPLAT_RADIUS: 0.005
};


let pointers = [];
let splatStack = [];

const { gl, ext } = getWebGLContext(canvas);

function getWebGLContext(canvas) {
    const params = { alpha: true, depth: false, stencil: false, antialias: true };

    let gl = canvas.getContext('webgl2', params);
    const isWebGL2 = !!gl;
    if (!isWebGL2)
        gl = canvas.getContext('webgl', params) || canvas.getContext('experimental-webgl', params);

    let halfFloat;
    let supportLinearFiltering;
    if (isWebGL2) {
        gl.getExtension('EXT_color_buffer_float');
        supportLinearFiltering = gl.getExtension('OES_texture_float_linear');
    } else {
        halfFloat = gl.getExtension('OES_texture_half_float');
        supportLinearFiltering = gl.getExtension('OES_texture_half_float_linear');
    }

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    const halfFloatTexType = isWebGL2 ? gl.HALF_FLOAT : halfFloat.HALF_FLOAT_OES;
    let formatRGBA;
    let formatRG;
    let formatR;

    if (isWebGL2) {
        formatRGBA = getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, halfFloatTexType);
        formatRG = getSupportedFormat(gl, gl.RG16F, gl.RG, halfFloatTexType);
        formatR = getSupportedFormat(gl, gl.R16F, gl.RED, halfFloatTexType);
    } else {
        formatRGBA = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
        formatRG = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
        formatR = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
    }

    return {
        gl,
        ext: {
            formatRGBA,
            formatRG,
            formatR,
            halfFloatTexType,
            supportLinearFiltering
        }
    };


}

function getSupportedFormat(gl, internalFormat, format, type) {
    if (!supportRenderTextureFormat(gl, internalFormat, format, type)) {
        switch (internalFormat) {

            case gl.R16F:
                return getSupportedFormat(gl, gl.RG16F, gl.RG, type);
            case gl.RG16F:
                return getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, type);
            default:
                return null;
        }

    }

    return {
        internalFormat,
        format
    };

}

function supportRenderTextureFormat(gl, internalFormat, format, type) {
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);

    let fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status != gl.FRAMEBUFFER_COMPLETE)
        return false;
    return true;
}

function pointerPrototype() {
    this.id = -1;
    this.x = 0;
    this.y = 0;
    this.dx = 0;
    this.dy = 0;
    this.down = false;
    this.moved = false;
    this.color = [30, 0, 300];
}

pointers.push(new pointerPrototype());

class GLProgram {
    constructor(vertexShader, fragmentShader) {
        this.uniforms = {};
        this.program = gl.createProgram();

        gl.attachShader(this.program, vertexShader);
        gl.attachShader(this.program, fragmentShader);
        gl.linkProgram(this.program);

        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS))
            throw gl.getProgramInfoLog(this.program);

        const uniformCount = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < uniformCount; i++) {
            const uniformName = gl.getActiveUniform(this.program, i).name;
            this.uniforms[uniformName] = gl.getUniformLocation(this.program, uniformName);
        }
    }

    bind() {
        gl.useProgram(this.program);
    }
}


function compileShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
        throw gl.getShaderInfoLog(shader);

    return shader;
};

const baseVertexShader = compileShader(gl.VERTEX_SHADER, `
    precision highp float;
    precision mediump sampler2D;

    attribute vec2 aPosition;
    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform vec2 texelSize;

    void main () {
        vUv = aPosition * 0.5 + 0.5;
        vL = vUv - vec2(texelSize.x, 0.0);
        vR = vUv + vec2(texelSize.x, 0.0);
        vT = vUv + vec2(0.0, texelSize.y);
        vB = vUv - vec2(0.0, texelSize.y);
        gl_Position = vec4(aPosition, 0.0, 1.0);
    }
`);

const clearShader = compileShader(gl.FRAGMENT_SHADER, `
    precision highp float;
    precision mediump sampler2D;

    varying vec2 vUv;
    uniform sampler2D uTexture;
    uniform float value;

    void main () {
        gl_FragColor = value * texture2D(uTexture, vUv);
    }
`);

const displayShader = compileShader(gl.FRAGMENT_SHADER, `
    precision highp float;
    precision mediump sampler2D;

    varying vec2 vUv;
    uniform sampler2D uTexture;

    void main () {
        gl_FragColor = texture2D(uTexture, vUv);
    }
`);

const splatShader = compileShader(gl.FRAGMENT_SHADER, `
    precision highp float;
    precision mediump sampler2D;

    varying vec2 vUv;
    uniform sampler2D uTarget;
    uniform float aspectRatio;
    uniform vec3 color;
    uniform vec2 point;
    uniform float radius;

    void main () {
        vec2 p = vUv - point.xy;
        p.x *= aspectRatio;
        vec3 splat = exp(-dot(p, p) / radius) * color;
        vec3 base = texture2D(uTarget, vUv).xyz;
        gl_FragColor = vec4(base + splat, 1.0);
    }
`);

const advectionManualFilteringShader = compileShader(gl.FRAGMENT_SHADER, `
    precision highp float;
    precision mediump sampler2D;

    varying vec2 vUv;
    uniform sampler2D uVelocity;
    uniform sampler2D uSource;
    uniform vec2 texelSize;
    uniform float dt;
    uniform float dissipation;

    vec4 bilerp (in sampler2D sam, in vec2 p) {
        vec4 st;
        st.xy = floor(p - 0.5) + 0.5;
        st.zw = st.xy + 1.0;
        vec4 uv = st * texelSize.xyxy;
        vec4 a = texture2D(sam, uv.xy);
        vec4 b = texture2D(sam, uv.zy);
        vec4 c = texture2D(sam, uv.xw);
        vec4 d = texture2D(sam, uv.zw);
        vec2 f = p - st.xy;
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    void main () {
        vec2 coord = gl_FragCoord.xy - dt * texture2D(uVelocity, vUv).xy;
        gl_FragColor = dissipation * bilerp(uSource, coord);
        gl_FragColor.a = 1.0;
    }
`);

const advectionShader = compileShader(gl.FRAGMENT_SHADER, `
    precision highp float;
    precision mediump sampler2D;

    varying vec2 vUv;
    uniform sampler2D uVelocity;
    uniform sampler2D uSource;
    uniform vec2 texelSize;
    uniform float dt;
    uniform float dissipation;

    void main () {
        vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
        gl_FragColor = dissipation * texture2D(uSource, coord);
        gl_FragColor.a = 1.0;
    }
`);

const divergenceShader = compileShader(gl.FRAGMENT_SHADER, `
    precision highp float;
    precision mediump sampler2D;

    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uVelocity;

    vec2 sampleVelocity (in vec2 uv) {
        vec2 multiplier = vec2(1.0, 1.0);
        if (uv.x < 0.0) { uv.x = 0.0; multiplier.x = -1.0; }
        if (uv.x > 1.0) { uv.x = 1.0; multiplier.x = -1.0; }
        if (uv.y < 0.0) { uv.y = 0.0; multiplier.y = -1.0; }
        if (uv.y > 1.0) { uv.y = 1.0; multiplier.y = -1.0; }
        return multiplier * texture2D(uVelocity, uv).xy;
    }

    void main () {
        float L = sampleVelocity(vL).x;
        float R = sampleVelocity(vR).x;
        float T = sampleVelocity(vT).y;
        float B = sampleVelocity(vB).y;
        float div = 0.5 * (R - L + T - B);
        gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
    }
`);

const curlShader = compileShader(gl.FRAGMENT_SHADER, `
    precision highp float;
    precision mediump sampler2D;

    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uVelocity;

    void main () {
        float L = texture2D(uVelocity, vL).y;
        float R = texture2D(uVelocity, vR).y;
        float T = texture2D(uVelocity, vT).x;
        float B = texture2D(uVelocity, vB).x;
        float vorticity = R - L - T + B;
        gl_FragColor = vec4(vorticity, 0.0, 0.0, 1.0);
    }
`);

const vorticityShader = compileShader(gl.FRAGMENT_SHADER, `
    precision highp float;
    precision mediump sampler2D;

    varying vec2 vUv;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uVelocity;
    uniform sampler2D uCurl;
    uniform float curl;
    uniform float dt;

    void main () {
        float T = texture2D(uCurl, vT).x;
        float B = texture2D(uCurl, vB).x;
        float C = texture2D(uCurl, vUv).x;
        vec2 force = vec2(abs(T) - abs(B), 0.0);
        force *= 1.0 / length(force + 0.00001) * curl * C;
        vec2 vel = texture2D(uVelocity, vUv).xy;
        gl_FragColor = vec4(vel + force * dt, 0.0, 1.0);
    }
`);

const pressureShader = compileShader(gl.FRAGMENT_SHADER, `
    precision highp float;
    precision mediump sampler2D;

    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uPressure;
    uniform sampler2D uDivergence;

    vec2 boundary (in vec2 uv) {
        uv = min(max(uv, 0.0), 1.0);
        return uv;
    }

    void main () {
        float L = texture2D(uPressure, boundary(vL)).x;
        float R = texture2D(uPressure, boundary(vR)).x;
        float T = texture2D(uPressure, boundary(vT)).x;
        float B = texture2D(uPressure, boundary(vB)).x;
        float C = texture2D(uPressure, vUv).x;
        float divergence = texture2D(uDivergence, vUv).x;
        float pressure = (L + R + B + T - divergence) * 0.25;
        gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
    }
`);

const gradientSubtractShader = compileShader(gl.FRAGMENT_SHADER, `
    precision highp float;
    precision mediump sampler2D;

    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uPressure;
    uniform sampler2D uVelocity;

    vec2 boundary (in vec2 uv) {
        uv = min(max(uv, 0.0), 1.0);
        return uv;
    }

    void main () {
        float L = texture2D(uPressure, boundary(vL)).x;
        float R = texture2D(uPressure, boundary(vR)).x;
        float T = texture2D(uPressure, boundary(vT)).x;
        float B = texture2D(uPressure, boundary(vB)).x;
        vec2 velocity = texture2D(uVelocity, vUv).xy;
        velocity.xy -= vec2(R - L, T - B);
        gl_FragColor = vec4(velocity, 0.0, 1.0);
    }
`);

let textureWidth;
let textureHeight;
let density;
let velocity;
let divergence;
let curl;
let pressure;
initFramebuffers();

const clearProgram = new GLProgram(baseVertexShader, clearShader);
const displayProgram = new GLProgram(baseVertexShader, displayShader);
const splatProgram = new GLProgram(baseVertexShader, splatShader);
const advectionProgram = new GLProgram(baseVertexShader, ext.supportLinearFiltering ? advectionShader : advectionManualFilteringShader);
const divergenceProgram = new GLProgram(baseVertexShader, divergenceShader);
const curlProgram = new GLProgram(baseVertexShader, curlShader);
const vorticityProgram = new GLProgram(baseVertexShader, vorticityShader);
const pressureProgram = new GLProgram(baseVertexShader, pressureShader);
const gradienSubtractProgram = new GLProgram(baseVertexShader, gradientSubtractShader);

function initFramebuffers() {
    textureWidth = gl.drawingBufferWidth >> config.TEXTURE_DOWNSAMPLE;
    textureHeight = gl.drawingBufferHeight >> config.TEXTURE_DOWNSAMPLE;

    const texType = ext.halfFloatTexType;
    const rgba = ext.formatRGBA;
    const rg = ext.formatRG;
    const r = ext.formatR;

    density = createDoubleFBO(2, textureWidth, textureHeight, rgba.internalFormat, rgba.format, texType, ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST);
    velocity = createDoubleFBO(0, textureWidth, textureHeight, rg.internalFormat, rg.format, texType, ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST);
    divergence = createFBO(4, textureWidth, textureHeight, r.internalFormat, r.format, texType, gl.NEAREST);
    curl = createFBO(5, textureWidth, textureHeight, r.internalFormat, r.format, texType, gl.NEAREST);
    pressure = createDoubleFBO(6, textureWidth, textureHeight, r.internalFormat, r.format, texType, gl.NEAREST);
}

function createFBO(texId, w, h, internalFormat, format, type, param) {
    gl.activeTexture(gl.TEXTURE0 + texId);
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);

    let fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.viewport(0, 0, w, h);
    gl.clear(gl.COLOR_BUFFER_BIT);

    return [texture, fbo, texId];
}

function createDoubleFBO(texId, w, h, internalFormat, format, type, param) {
    let fbo1 = createFBO(texId, w, h, internalFormat, format, type, param);
    let fbo2 = createFBO(texId + 1, w, h, internalFormat, format, type, param);

    return {
        get read() {
            return fbo1;
        },
        get write() {
            return fbo2;
        },
        swap() {
            let temp = fbo1;
            fbo1 = fbo2;
            fbo2 = temp;
        }
    };

}

const blit = (() => {
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    return destination => {
        gl.bindFramebuffer(gl.FRAMEBUFFER, destination);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    };
})();

let lastTime = Date.now();
multipleSplats(parseInt(Math.random() * 20) + 5);
update();

function update() {
    resizeCanvas();

    const dt = Math.min((Date.now() - lastTime) / 1000, 0.016);
    lastTime = Date.now();

    gl.viewport(0, 0, textureWidth, textureHeight);

    if (splatStack.length > 0)
        multipleSplats(splatStack.pop());

    advectionProgram.bind();
    gl.uniform2f(advectionProgram.uniforms.texelSize, 1.0 / textureWidth, 1.0 / textureHeight);
    gl.uniform1i(advectionProgram.uniforms.uVelocity, velocity.read[2]);
    gl.uniform1i(advectionProgram.uniforms.uSource, velocity.read[2]);
    gl.uniform1f(advectionProgram.uniforms.dt, dt);
    gl.uniform1f(advectionProgram.uniforms.dissipation, config.VELOCITY_DISSIPATION);
    blit(velocity.write[1]);
    velocity.swap();

    gl.uniform1i(advectionProgram.uniforms.uVelocity, velocity.read[2]);
    gl.uniform1i(advectionProgram.uniforms.uSource, density.read[2]);
    gl.uniform1f(advectionProgram.uniforms.dissipation, config.DENSITY_DISSIPATION);
    blit(density.write[1]);
    density.swap();

    for (let i = 0; i < pointers.length; i++) {
        const pointer = pointers[i];
        if (pointer.moved) {
            splat(pointer.x, pointer.y, pointer.dx, pointer.dy, pointer.color);
            pointer.moved = false;
        }
    }

    curlProgram.bind();
    gl.uniform2f(curlProgram.uniforms.texelSize, 1.0 / textureWidth, 1.0 / textureHeight);
    gl.uniform1i(curlProgram.uniforms.uVelocity, velocity.read[2]);
    blit(curl[1]);

    vorticityProgram.bind();
    gl.uniform2f(vorticityProgram.uniforms.texelSize, 1.0 / textureWidth, 1.0 / textureHeight);
    gl.uniform1i(vorticityProgram.uniforms.uVelocity, velocity.read[2]);
    gl.uniform1i(vorticityProgram.uniforms.uCurl, curl[2]);
    gl.uniform1f(vorticityProgram.uniforms.curl, config.CURL);
    gl.uniform1f(vorticityProgram.uniforms.dt, dt);
    blit(velocity.write[1]);
    velocity.swap();

    divergenceProgram.bind();
    gl.uniform2f(divergenceProgram.uniforms.texelSize, 1.0 / textureWidth, 1.0 / textureHeight);
    gl.uniform1i(divergenceProgram.uniforms.uVelocity, velocity.read[2]);
    blit(divergence[1]);

    clearProgram.bind();
    let pressureTexId = pressure.read[2];
    gl.activeTexture(gl.TEXTURE0 + pressureTexId);
    gl.bindTexture(gl.TEXTURE_2D, pressure.read[0]);
    gl.uniform1i(clearProgram.uniforms.uTexture, pressureTexId);
    gl.uniform1f(clearProgram.uniforms.value, config.PRESSURE_DISSIPATION);
    blit(pressure.write[1]);
    pressure.swap();

    pressureProgram.bind();
    gl.uniform2f(pressureProgram.uniforms.texelSize, 1.0 / textureWidth, 1.0 / textureHeight);
    gl.uniform1i(pressureProgram.uniforms.uDivergence, divergence[2]);
    pressureTexId = pressure.read[2];
    gl.uniform1i(pressureProgram.uniforms.uPressure, pressureTexId);
    gl.activeTexture(gl.TEXTURE0 + pressureTexId);
    for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
        gl.bindTexture(gl.TEXTURE_2D, pressure.read[0]);
        blit(pressure.write[1]);
        pressure.swap();
    }

    gradienSubtractProgram.bind();
    gl.uniform2f(gradienSubtractProgram.uniforms.texelSize, 1.0 / textureWidth, 1.0 / textureHeight);
    gl.uniform1i(gradienSubtractProgram.uniforms.uPressure, pressure.read[2]);
    gl.uniform1i(gradienSubtractProgram.uniforms.uVelocity, velocity.read[2]);
    blit(velocity.write[1]);
    velocity.swap();

    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    displayProgram.bind();
    gl.uniform1i(displayProgram.uniforms.uTexture, density.read[2]);
    blit(null);

    requestAnimationFrame(update);
}

function splat(x, y, dx, dy, color) {
    splatProgram.bind();
    gl.uniform1i(splatProgram.uniforms.uTarget, velocity.read[2]);
    gl.uniform1f(splatProgram.uniforms.aspectRatio, canvas.width / canvas.height);
    gl.uniform2f(splatProgram.uniforms.point, x / canvas.width, 1.0 - y / canvas.height);
    gl.uniform3f(splatProgram.uniforms.color, dx, -dy, 1.0);
    gl.uniform1f(splatProgram.uniforms.radius, config.SPLAT_RADIUS);
    blit(velocity.write[1]);
    velocity.swap();

    gl.uniform1i(splatProgram.uniforms.uTarget, density.read[2]);
    gl.uniform3f(splatProgram.uniforms.color, color[0] * 0.3, color[1] * 0.3, color[2] * 0.3);
    blit(density.write[1]);
    density.swap();
}

function multipleSplats(amount) {
    for (let i = 0; i < amount; i++) {
        const color = [Math.random() * 10, Math.random() * 10, Math.random() * 10];
        const x = canvas.width * Math.random();
        const y = canvas.height * Math.random();
        const dx = 1000 * (Math.random() - 0.5);
        const dy = 1000 * (Math.random() - 0.5);
        splat(x, y, dx, dy, color);
    }
}

function resizeCanvas() {
    if (canvas.width != canvas.clientWidth || canvas.height != canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        initFramebuffers();
    }
}

s.addEventListener('mousemove', e => {
    pointers[0].moved = pointers[0].down;
    pointers[0].dx = (e.clientX - pointers[0].x) * 10.0;
    pointers[0].dy = (e.clientY - pointers[0].y) * 10.0;
    pointers[0].x = e.clientX;
    pointers[0].y = e.clientY;
});

canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    const touches = e.targetTouches;
    for (let i = 0; i < touches.length; i++) {
        let pointer = pointers[i];
        pointer.moved = pointer.down;
        pointer.dx = (touches[i].pageX - pointer.x) * 10.0;
        pointer.dy = (touches[i].pageY - pointer.y) * 10.0;
        pointer.x = touches[i].pageX;
        pointer.y = touches[i].pageY;
    }
}, false);

s.addEventListener('mousemove', () => {
    pointers[0].down = true;
    pointers[0].color = [Math.random() + 0.2, Math.random() + 0.2, Math.random() + 0.2];
});

canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    const touches = e.targetTouches;
    for (let i = 0; i < touches.length; i++) {
        if (i >= pointers.length)
            pointers.push(new pointerPrototype());

        pointers[i].id = touches[i].identifier;
        pointers[i].down = true;
        pointers[i].x = touches[i].pageX;
        pointers[i].y = touches[i].pageY;
        pointers[i].color = [Math.random() + 0.2, Math.random() + 0.2, Math.random() + 0.2];
    }
});

window.addEventListener('mouseleave', () => {
    pointers[0].down = false;
});

window.addEventListener('touchend', e => {
    const touches = e.changedTouches;
    for (let i = 0; i < touches.length; i++)
        for (let j = 0; j < pointers.length; j++)
            if (touches[i].identifier == pointers[j].id)
                pointers[j].down = false;
});


/* ==========================
   Premium interactions (Vusal)
   ========================== */

(function () {
  // ------- Page loader (cinematic) -------
  const loader = document.getElementById("pageLoader");
  const loaderFill = loader ? loader.querySelector(".loader-bar-fill") : null;
  const loaderPercent = loader ? loader.querySelector(".loader-percent") : null;
  const skipBtn = loader ? loader.querySelector(".loader-skip") : null;

  const prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const setProgress = (p) => {
    const clamped = Math.max(0, Math.min(100, p));
    if (loaderFill) loaderFill.style.width = clamped.toFixed(0) + "%";
    if (loaderPercent) loaderPercent.textContent = clamped.toFixed(0) + "%";
    if (loader) loader.style.setProperty("--loader-progress", clamped.toFixed(0) + "%");
  };

  const hideLoader = () => {
    if (!loader) return;
    loader.classList.add("hidden");
    // Remove after fade
    window.setTimeout(() => loader && loader.remove(), 900);
  };

  if (loader) {
    // Start at 0 and animate smoothly
    let p = 0;
    setProgress(0);

    // Show skip after a moment (UX)
    if (skipBtn) {
      skipBtn.disabled = true;
      window.setTimeout(() => { skipBtn.disabled = false; skipBtn.classList.add("show"); }, 1100);
      skipBtn.addEventListener("click", () => hideLoader());
    }

    // Fake progress: quick to ~85, then wait for real load
    let rafId = null;
    let last = performance.now();

    const step = (now) => {
      const dt = Math.min(48, now - last);
      last = now;

      // speed curve
      const target = 88;
      const speed = prefersReduced ? 0.9 : 1.8; // % per ~frame
      if (p < target) {
        p += (speed * dt) / 16.6;
        // ease-out
        p = p - (p * 0.002);
        setProgress(p);
      }

      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);

    const finalize = () => {
      if (rafId) cancelAnimationFrame(rafId);
      // Smoothly go 100
      const start = performance.now();
      const from = Math.min(95, p);
      const dur = prefersReduced ? 120 : 420;

      const fin = (t) => {
        const k = Math.min(1, (t - start) / dur);
        const eased = 1 - Math.pow(1 - k, 3);
        const val = from + (100 - from) * eased;
        setProgress(val);
        if (k < 1) requestAnimationFrame(fin);
        else window.setTimeout(hideLoader, prefersReduced ? 0 : 180);
      };
      requestAnimationFrame(fin);
    };

    // Real load event
    window.addEventListener("load", finalize, { once: true });

    // Safety: never get stuck
    window.setTimeout(() => finalize(), 4500);
  }

  // ------- Neon cursor follower -------

  const neon = document.getElementById("neonCursor");
  if (neon) {
    let x = window.innerWidth / 2, y = window.innerHeight / 2;
    let tx = x, ty = y;
    const speed = 0.18;

    window.addEventListener("pointermove", (e) => {
      tx = e.clientX;
      ty = e.clientY;
    }, { passive: true });

    const animate = () => {
      x += (tx - x) * speed;
      y += (ty - y) * speed;
      neon.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  // ------- 3D tilt cards -------
  const tiltCards = document.querySelectorAll(".tilt-card");
  tiltCards.forEach((card) => {
    let rect;
    const max = 10;

    const onEnter = () => { rect = card.getBoundingClientRect(); };
    const onMove = (e) => {
      if (!rect) rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      const rx = (py - 0.5) * -max;
      const ry = (px - 0.5) * max;
      card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;
    };
    const onLeave = () => { card.style.transform = ""; };

    card.addEventListener("mouseenter", onEnter);
    card.addEventListener("mousemove", onMove);
    card.addEventListener("mouseleave", onLeave);
  });

  // ------- Skills progress on scroll (IntersectionObserver) -------
  const progressBars = document.querySelectorAll(".skill-progress");
  if (progressBars.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const level = Number(el.getAttribute("data-level") || "0");
          el.style.width = Math.max(0, Math.min(100, level)) + "%";
          io.unobserve(el);
        }
      });
    }, { threshold: 0.35 });

    progressBars.forEach((b) => io.observe(b));
  }

  // ------- Voice greeting (TTS) -------
  const speakBtn = document.getElementById("speakBtn");
  function pickVoice(langPrefix) {
    const voices = window.speechSynthesis ? speechSynthesis.getVoices() : [];
    return voices.find(v => (v.lang || "").toLowerCase().startsWith(langPrefix))
        || voices.find(v => (v.lang || "").toLowerCase().startsWith("tr"))
        || voices[0];
  }
  function speak(text) {
    if (!("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    // "az-AZ" hər yerdə olmur, ona görə sınaq+fallback
    u.lang = "az-AZ";
    const v = pickVoice("az");
    if (v) u.voice = v;
    u.rate = 1;
    u.pitch = 1;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }
  if (speakBtn) {
    // iOS/Safari kimi yerlərdə voices yüklənməsi gec olur
    if ("speechSynthesis" in window) speechSynthesis.onvoiceschanged = () => {};
    speakBtn.addEventListener("click", () => {
      speak("Salam, mən Muradov Vüsalam. Front-end developerəm. Portfoliomu gəzməyə başla!");
    });
  }


  // ------- Typing effect (name + title) -------
  const typeTargets = [document.getElementById("intro-name"), document.getElementById("intro-title")].filter(Boolean);
  const typeText = (el, text, opts = {}) => {
    const speed = opts.speed ?? 55;
    const delay = opts.delay ?? 0;
    const keepCaret = opts.caret ?? true;

    if (!el || !text) return;
    const prefers = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefers) return;

    const original = text;
    el.textContent = "";
    if (keepCaret) el.classList.add("typing-caret");

    let i = 0;
    window.setTimeout(() => {
      const tick = () => {
        i += 1;
        el.textContent = original.slice(0, i);
        if (i < original.length) window.setTimeout(tick, speed);
        else window.setTimeout(() => el.classList.remove("typing-caret"), 900);
      };
      tick();
    }, delay);
  };

  if (typeTargets.length) {
    const nameEl = document.getElementById("intro-name");
    const titleEl = document.getElementById("intro-title");
    if (nameEl) typeText(nameEl, nameEl.getAttribute("data-typing") || nameEl.textContent, { speed: 65, delay: 280 });
    if (titleEl) typeText(titleEl, titleEl.getAttribute("data-typing") || titleEl.textContent, { speed: 45, delay: 1200, caret: false });
  }

  // ------- Parallax (subtle) -------
  const parallaxEls = document.querySelectorAll("[data-parallax]");
  if (parallaxEls.length) {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY || window.pageYOffset || 0;
        parallaxEls.forEach((el) => {
          const sp = Number(el.getAttribute("data-parallax") || "0.12");
          el.style.transform = `translate3d(0, ${y * sp * -0.15}px, 0)`;
        });
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // ------- Project gallery modal -------
  const pm = document.getElementById("projectModal");
  const pmMain = document.getElementById("pmMain");
  const pmThumbs = document.getElementById("pmThumbs");
  const pmTitle = document.getElementById("pmTitle");
  const pmDesc = document.getElementById("pmDesc");
  const pmTech = document.getElementById("pmTech");
  const pmLive = document.getElementById("pmLive");
  const pmCopy = document.getElementById("pmCopy");

  let pmImages = [];
  let pmIndex = 0;

  const setPmImage = (i) => {
    if (!pmMain || !pmImages.length) return;
    pmIndex = (i + pmImages.length) % pmImages.length;
    pmMain.src = pmImages[pmIndex];

    if (pmThumbs) {
      pmThumbs.querySelectorAll("button").forEach((b, idx) => {
        b.classList.toggle("active", idx === pmIndex);
      });
    }
  };

  const openPm = (payload) => {
    if (!pm) return;
    pm.classList.add("open");
    pm.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    const title = payload.title || "Project";
    const desc = payload.desc || "";
    const tech = payload.tech || [];
    pmImages = (payload.images || []).filter(Boolean);
    if (!pmImages.length && payload.thumb) pmImages = [payload.thumb];

    if (pmTitle) pmTitle.textContent = title;
    if (pmDesc) pmDesc.textContent = desc;
    if (pmLive) pmLive.href = payload.live || "#";

    if (pmTech) {
      pmTech.innerHTML = "";
      tech.forEach((t) => {
        const chip = document.createElement("span");
        chip.className = "chip";
        chip.textContent = t;
        pmTech.appendChild(chip);
      });
    }

    if (pmThumbs) {
      pmThumbs.innerHTML = "";
      pmImages.forEach((src, idx) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "pm-thumb";
        b.setAttribute("aria-label", `Şəkil ${idx + 1}`);
        b.innerHTML = `<img src="${src}" alt="" loading="lazy" decoding="async" />`;
        b.addEventListener("click", () => setPmImage(idx));
        pmThumbs.appendChild(b);
      });
    }

    setPmImage(0);
  };

  const closePm = () => {
    if (!pm) return;
    pm.classList.remove("open");
    pm.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (pmMain) pmMain.src = "";
    if (pmThumbs) pmThumbs.innerHTML = "";
    pmImages = [];
    pmIndex = 0;
  };

  if (pm) {
    pm.addEventListener("click", (e) => {
      const t = e.target;
      if (t && t.getAttribute && t.getAttribute("data-close") === "1") closePm();
      if (t && t.getAttribute && t.getAttribute("data-pm-prev") === "1") setPmImage(pmIndex - 1);
      if (t && t.getAttribute && t.getAttribute("data-pm-next") === "1") setPmImage(pmIndex + 1);
    });

    window.addEventListener("keydown", (e) => {
      if (!pm.classList.contains("open")) return;
      if (e.key === "Escape") closePm();
      if (e.key === "ArrowLeft") setPmImage(pmIndex - 1);
      if (e.key === "ArrowRight") setPmImage(pmIndex + 1);
    });
  }

  document.querySelectorAll(".project-link").forEach((a) => {
    a.addEventListener("click", (e) => {
      // allow open in new tab with ctrl/cmd/middle click
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;

      const title = a.getAttribute("data-title") || a.textContent.trim();
      const desc = a.getAttribute("data-desc") || "";
      const tech = (a.getAttribute("data-tech") || "").split(",").map(s => s.trim()).filter(Boolean);
      const images = (a.getAttribute("data-images") || "").split(",").map(s => s.trim()).filter(Boolean);
      const live = a.getAttribute("data-live") || a.getAttribute("href") || "#";
      const thumb = (a.querySelector("img") && a.querySelector("img").getAttribute("src")) || "";

      e.preventDefault();
      openPm({ title, desc, tech, images, live, thumb });
    });
  });

  // ------- Toast + Contact validation -------
  const toast = document.getElementById("toast");
  let toastTimer;
  const showToast = (message, type = "info", ms = 2600) => {
    if (!toast) return;
    window.clearTimeout(toastTimer);
    toast.className = `toast toast--${type} open`;
    toast.textContent = message;
    toastTimer = window.setTimeout(() => toast.classList.remove("open"), ms);
  };

  const contactForm = document.querySelector(".contact-form");
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email || "").trim());

  if (contactForm) {
    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = (document.getElementById("contactName")?.value || "").trim();
      const email = (document.getElementById("contactEmail")?.value || "").trim();
      const message = (document.getElementById("contactMessage")?.value || "").trim();

      if (name.length < 2) return showToast("Ad minimum 2 simvol olmalıdır.", "error");
      if (!isValidEmail(email)) return showToast("Email düzgün deyil.", "error");
      if (message.length < 10) return showToast("Mesaj minimum 10 simvol olmalıdır.", "error");

      // Netlify-friendly submit (works on hosting)
      try {
        const formData = new FormData(contactForm);
        const body = new URLSearchParams(formData).toString();

        const res = await fetch(contactForm.getAttribute("action") || window.location.pathname, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body,
        });

        if (res.ok) {
          contactForm.reset();
          showToast("Göndərildi! Tezliklə cavab yazacam ✅", "success", 3200);
        } else {
          showToast("Xəta oldu. Zəhmət olmasa yenidən yoxla.", "error");
        }
      } catch (err) {
        // Offline/local fallback
        contactForm.reset();
        showToast("Local rejimdə göndərildi (hostda tam işləyəcək) ✅", "success", 3200);
      }
    });
  }

  if (pmCopy) {
    pmCopy.addEventListener("click", async () => {
      const url = (pmLive && pmLive.href) || "";
      try {
        await navigator.clipboard.writeText(url);
        showToast("Link kopyalandı ✅", "success");
      } catch {
        showToast("Kopyalama mümkün olmadı.", "error");
      }
    });
  }

  

  // ------- Background particles (lightweight) -------
  const pCanvas = document.getElementById("bgParticles");
  if (pCanvas) {
    const ctx = pCanvas.getContext("2d");
    const DPR = Math.min(2, window.devicePixelRatio || 1);

    let w = 0, h = 0;
    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      pCanvas.width = Math.floor(w * DPR);
      pCanvas.height = Math.floor(h * DPR);
      pCanvas.style.width = w + "px";
      pCanvas.style.height = h + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });

    const count = Math.max(32, Math.min(70, Math.floor((w * h) / 26000)));
    const dots = Array.from({ length: count }).map(() => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: 1.2 + Math.random() * 1.6,
      a: 0.18 + Math.random() * 0.22,
    }));

    let mx = -9999, my = -9999;
    window.addEventListener("mousemove", (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });

    const step = () => {
      ctx.clearRect(0, 0, w, h);

      // soft vignette
      const g = ctx.createRadialGradient(w * 0.5, h * 0.35, 10, w * 0.5, h * 0.35, Math.max(w, h) * 0.75);
      g.addColorStop(0, "rgba(120,255,235,0.05)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      for (const d of dots) {
        d.x += d.vx;
        d.y += d.vy;
        if (d.x < -30) d.x = w + 30;
        if (d.x > w + 30) d.x = -30;
        if (d.y < -30) d.y = h + 30;
        if (d.y > h + 30) d.y = -30;
      }

      // lines
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const a = dots[i], b = dots[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          const max = 130;
          if (dist < max) {
            const alpha = (1 - dist / max) * 0.09;
            ctx.strokeStyle = `rgba(140,255,235,${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // dots
      for (const d of dots) {
        const pulse = 1 + 0.25 * Math.sin((Date.now() / 700) + d.x * 0.01);
        let alpha = d.a;
        const md = Math.hypot(d.x - mx, d.y - my);
        if (md < 160) alpha += (1 - md / 160) * 0.18;
        ctx.fillStyle = `rgba(140,255,235,${alpha})`;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r * pulse, 0, Math.PI * 2);
        ctx.fill();
      }

      requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }
// ------- Mini AI Chat (rule-based) -------
  const chat = document.getElementById("aiChat");
  const chatToggle = document.getElementById("aiChatToggle");
  const chatClose = document.getElementById("aiChatClose");
  const chatForm = document.getElementById("aiChatForm");
  const chatInput = document.getElementById("aiChatInput");
  const chatMessages = document.getElementById("aiChatMessages");

  function addMsg(text, who = "bot") {
    if (!chatMessages) return;
    const div = document.createElement("div");
    div.className = "ai-msg " + who;
    div.textContent = text;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function normalize(s) {
    return (s || "")
      .toLowerCase()
      .replace(/[ə]/g, "e")
      .replace(/[ı]/g, "i")
      .replace(/[ş]/g, "s")
      .replace(/[ç]/g, "c")
      .replace(/[ğ]/g, "g")
      .replace(/[ö]/g, "o")
      .replace(/[ü]/g, "u")
      .trim();
  }

  function answer(q) {
    const t = normalize(q);

    // skills
    if (t.includes("bacariq") || t.includes("skill") || t.includes("neler bil") || t.includes("ne bil")) {
      return "HTML5, CSS3, JavaScript, React, Bootstrap, SASS, Figma və Photopea. İstəsən, layihənə uyğun ən yaxşı stack-i də təklif edə bilərəm.";
    }

    // projects
    if (t.includes("layihe") || t.includes("project") || t.includes("proyekt")) {
      return "Layihələr bölməsində gördüklərin: Digital Dot, Gallery Project, E-commerce Site, Site City, Electronics Store və s. Hansına baxmaq istəyirsən?";
    }

    // contact
    if (t.includes("elaqe") || t.includes("contact") || t.includes("nomre") || t.includes("email") || t.includes("gmail") || t.includes("whatsapp")) {
      return "Əlaqə: WhatsApp/Telefon: +99470 214 83 07 • Email: muradovvusal565@gmail.com • LinkedIn və GitHub linkləri navbarda var.";
    }

    // about / hire
    if (t.includes("haqqinda") || t.includes("about") || t.includes("kim") || t.includes("niye") || t.includes("hire") || t.includes("ise gotur")) {
      return "Mən Baku-da yaşayan Front-end developerəm. Təmiz UI/UX, responsiv dizayn, animasiyalar və performans optimizasiyası fokusumdur. Sürətli öyrənirəm və nəticə yönümlüyəm.";
    }

    // theme
    if (t.includes("dark") || t.includes("light") || t.includes("tema") || t.includes("theme")) {
      return "Yuxarıdakı günəş/ay ikonuna kliklə Dark/Light rejimi dəyişir. İstəsən, keçidi daha da kino kimi edə bilərəm.";
    }

    return "Başa düşdüm 🙂 Bu barədə daha dəqiq de: 'bacarıqlar', 'layihələr' və ya 'əlaqə' yaz. Mən də sənə qısa və konkret cavab verim.";
  }

  function openChat() {
    if (!chat) return;
    chat.classList.add("open");
    chat.setAttribute("aria-hidden", "false");
    if (chatMessages && chatMessages.childElementCount === 0) {
      addMsg("Salam! Mən Mini AI Chatəm. Nə soruşmaq istəyirsən? (Məs: 'Bacarıqların nədir?')", "bot");
    }
    setTimeout(() => chatInput && chatInput.focus(), 50);
  }
  function closeChat() {
    if (!chat) return;
    chat.classList.remove("open");
    chat.setAttribute("aria-hidden", "true");
  }

  if (chatToggle) chatToggle.addEventListener("click", openChat);
  if (chatClose) chatClose.addEventListener("click", closeChat);

  // Quick chips
  document.querySelectorAll(".ai-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const q = chip.getAttribute("data-q") || chip.textContent;
      addMsg(q, "user");
      addMsg(answer(q), "bot");
      openChat();
    });
  });

  if (chatForm) {
    chatForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = (chatInput && chatInput.value) ? chatInput.value.trim() : "";
      if (!q) return;
      addMsg(q, "user");
      addMsg(answer(q), "bot");
      if (chatInput) chatInput.value = "";
    });
  }

  // ESC to close
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeChat();
  });
})();

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const MAX_COLORS = 8;

const frag = `
#define MAX_COLORS ${MAX_COLORS}
uniform vec2 uCanvas;
uniform float uTime;
uniform float uSpeed;
uniform vec2 uRot;
uniform int uColorCount;
uniform vec3 uColors[MAX_COLORS];
uniform int uTransparent;
uniform float uScale;
uniform float uFrequency;
uniform float uWarpStrength;
uniform vec2 uPointer;
uniform float uMouseInfluence;
uniform float uParallax;
uniform float uNoise;
varying vec2 vUv;

void main() {
  float t = uTime * uSpeed;
  vec2 p = vUv * 2.0 - 1.0;
  p += uPointer * uParallax * 0.1;
  vec2 rp = vec2(p.x * uRot.x - p.y * uRot.y, p.x * uRot.y + p.y * uRot.x);
  vec2 q = vec2(rp.x * (uCanvas.x / uCanvas.y), rp.y);
  q /= max(uScale, 0.0001);
  q /= 0.5 + 0.2 * dot(q, q);
  q += 0.2 * cos(t) - 7.56;
  vec2 toward = (uPointer - rp);
  q += toward * uMouseInfluence * 0.2;

    vec3 col = vec3(0.0);
    float a = 1.0;

    if (uColorCount > 0) {
      vec2 s = q;
      vec3 sumCol = vec3(0.0);
      float cover = 0.0;
      for (int i = 0; i < MAX_COLORS; ++i) {
            if (i >= uColorCount) break;
            s -= 0.01;
            vec2 r = sin(1.5 * (s.yx * uFrequency) + 2.0 * cos(s * uFrequency));
            float m0 = length(r + sin(5.0 * r.y * uFrequency - 3.0 * t + float(i)) / 4.0);
            float kBelow = clamp(uWarpStrength, 0.0, 1.0);
            float kMix = pow(kBelow, 0.3);
            float gain = 1.0 + max(uWarpStrength - 1.0, 0.0);
            vec2 disp = (r - s) * kBelow;
            vec2 warped = s + disp * gain;
            float m1 = length(warped + sin(5.0 * warped.y * uFrequency - 3.0 * t + float(i)) / 4.0);
            float m = mix(m0, m1, kMix);
            float w = 1.0 - exp(-6.0 / exp(6.0 * m));
            sumCol += uColors[i] * w;
            cover = max(cover, w);
      }
      col = clamp(sumCol, 0.0, 1.0);
      a = uTransparent > 0 ? cover : 1.0;
    } else {
        vec2 s = q;
        for (int k = 0; k < 3; ++k) {
            s -= 0.01;
            vec2 r = sin(1.5 * (s.yx * uFrequency) + 2.0 * cos(s * uFrequency));
            float m0 = length(r + sin(5.0 * r.y * uFrequency - 3.0 * t + float(k)) / 4.0);
            float kBelow = clamp(uWarpStrength, 0.0, 1.0);
            float kMix = pow(kBelow, 0.3);
            float gain = 1.0 + max(uWarpStrength - 1.0, 0.0);
            vec2 disp = (r - s) * kBelow;
            vec2 warped = s + disp * gain;
            float m1 = length(warped + sin(5.0 * warped.y * uFrequency - 3.0 * t + float(k)) / 4.0);
            float m = mix(m0, m1, kMix);
            col[k] = 1.0 - exp(-6.0 / exp(6.0 * m));
        }
        a = uTransparent > 0 ? max(max(col.r, col.g), col.b) : 1.0;
    }

    if (uNoise > 0.0001) {
      float n = fract(sin(dot(gl_FragCoord.xy + vec2(uTime), vec2(12.9898, 78.233))) * 43758.5453123);
      col += (n - 0.5) * uNoise;
      col = clamp(col, 0.0, 1.0);
    }

    vec3 rgb = (uTransparent > 0) ? col * a : col;
    gl_FragColor = vec4(rgb, a);
}
`;

const vert = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

export default function ColorBends({
    className = '',
    style = {},
    rotation = 45,
    speed = 0.2,
    colors = [],
    transparent = true,
    autoRotate = 0,
    scale = 1,
    frequency = 1,
    warpStrength = 1,
    mouseInfluence = 1,
    parallax = 0.5,
    noise = 0.1
}) {
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const sceneRef = useRef(null);
    const rendererRef = useRef(null);
    const rafRef = useRef(null);
    const materialRef = useRef(null);
    const clockRef = useRef(null);
    const isInitializedRef = useRef(false);
    const rotationRef = useRef(rotation);
    const autoRotateRef = useRef(autoRotate);
    const pointerTargetRef = useRef({ x: 0, y: 0 });
    const pointerCurrentRef = useRef({ x: 0, y: 0 });

    // Track mount state to prevent double initialization in Strict Mode
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        // Delay mount to avoid Strict Mode double-init issues
        const timer = setTimeout(() => {
            setIsMounted(true);
        }, 50);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!isMounted) return;

        const container = containerRef.current;
        if (!container || isInitializedRef.current) return;

        // Create a fresh canvas element to avoid context conflicts
        const canvas = document.createElement('canvas');
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.display = 'block';
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        container.appendChild(canvas);
        canvasRef.current = canvas;

        try {
            const scene = new THREE.Scene();
            sceneRef.current = scene;
            const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

            const geometry = new THREE.PlaneGeometry(2, 2);
            const uColorsArray = Array.from({ length: MAX_COLORS }, () => new THREE.Vector3(0, 0, 0));

            // Initialize colors immediately
            const toVec3 = (hex) => {
                const h = hex.replace('#', '').trim();
                const v =
                    h.length === 3
                        ? [parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16)]
                        : [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
                return new THREE.Vector3(v[0] / 255, v[1] / 255, v[2] / 255);
            };

            const colorArr = (colors || []).filter(Boolean).slice(0, MAX_COLORS).map(toVec3);
            for (let i = 0; i < MAX_COLORS; i++) {
                if (i < colorArr.length) uColorsArray[i].copy(colorArr[i]);
            }

            const material = new THREE.ShaderMaterial({
                vertexShader: vert,
                fragmentShader: frag,
                uniforms: {
                    uCanvas: { value: new THREE.Vector2(1, 1) },
                    uTime: { value: 0 },
                    uSpeed: { value: speed },
                    uRot: { value: new THREE.Vector2(1, 0) },
                    uColorCount: { value: colorArr.length },
                    uColors: { value: uColorsArray },
                    uTransparent: { value: transparent ? 1 : 0 },
                    uScale: { value: scale },
                    uFrequency: { value: frequency },
                    uWarpStrength: { value: warpStrength },
                    uPointer: { value: new THREE.Vector2(0, 0) },
                    uMouseInfluence: { value: mouseInfluence },
                    uParallax: { value: parallax },
                    uNoise: { value: noise }
                },
                premultipliedAlpha: true,
                transparent: true
            });
            materialRef.current = material;

            const mesh = new THREE.Mesh(geometry, material);
            scene.add(mesh);

            const renderer = new THREE.WebGLRenderer({
                canvas: canvas,
                antialias: false,
                powerPreference: 'high-performance',
                alpha: true
            });
            rendererRef.current = renderer;

            renderer.outputColorSpace = THREE.SRGBColorSpace;
            renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
            renderer.setClearColor(0x000000, transparent ? 0 : 1);

            const clock = new THREE.Clock();
            clockRef.current = clock;

            const handleResize = () => {
                if (!container || !renderer) return;
                const w = container.clientWidth || 1;
                const h = container.clientHeight || 1;
                renderer.setSize(w, h, false);
                if (material.uniforms) {
                    material.uniforms.uCanvas.value.set(w, h);
                }
            };

            handleResize();
            window.addEventListener('resize', handleResize);

            isInitializedRef.current = true;

            const loop = () => {
                if (!materialRef.current || !rendererRef.current || !sceneRef.current) return;

                const dt = clock.getDelta();
                const elapsed = clock.elapsedTime;
                material.uniforms.uTime.value = elapsed;

                const deg = (rotationRef.current % 360) + autoRotateRef.current * elapsed;
                const rad = (deg * Math.PI) / 180;
                const c = Math.cos(rad);
                const s = Math.sin(rad);
                material.uniforms.uRot.value.set(c, s);

                const cur = pointerCurrentRef.current;
                const tgt = pointerTargetRef.current;
                const amt = Math.min(1, dt * 8);
                cur.x += (tgt.x - cur.x) * amt;
                cur.y += (tgt.y - cur.y) * amt;
                material.uniforms.uPointer.value.set(cur.x, cur.y);

                renderer.render(scene, camera);
                rafRef.current = requestAnimationFrame(loop);
            };
            rafRef.current = requestAnimationFrame(loop);

            // Cleanup function
            return () => {
                isInitializedRef.current = false;

                if (rafRef.current !== null) {
                    cancelAnimationFrame(rafRef.current);
                    rafRef.current = null;
                }

                window.removeEventListener('resize', handleResize);

                geometry.dispose();
                material.dispose();

                if (renderer) {
                    renderer.dispose();
                    renderer.forceContextLoss();
                    rendererRef.current = null;
                }

                if (canvas && canvas.parentElement) {
                    canvas.parentElement.removeChild(canvas);
                }
                canvasRef.current = null;
                sceneRef.current = null;
                materialRef.current = null;
            };
        } catch (error) {
            console.error('ColorBends initialization error:', error);
        }
    }, [isMounted, colors, speed, scale, frequency, warpStrength, mouseInfluence, parallax, noise, transparent]);

    // Update refs when props change
    useEffect(() => {
        rotationRef.current = rotation;
        autoRotateRef.current = autoRotate;
    }, [rotation, autoRotate]);

    // Update material uniforms when props change
    useEffect(() => {
        const material = materialRef.current;
        if (!material) return;

        material.uniforms.uSpeed.value = speed;
        material.uniforms.uScale.value = scale;
        material.uniforms.uFrequency.value = frequency;
        material.uniforms.uWarpStrength.value = warpStrength;
        material.uniforms.uMouseInfluence.value = mouseInfluence;
        material.uniforms.uParallax.value = parallax;
        material.uniforms.uNoise.value = noise;
        material.uniforms.uTransparent.value = transparent ? 1 : 0;
    }, [speed, scale, frequency, warpStrength, mouseInfluence, parallax, noise, transparent]);

    // Pointer move handler
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handlePointerMove = (e) => {
            const rect = container.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / (rect.width || 1)) * 2 - 1;
            const y = -(((e.clientY - rect.top) / (rect.height || 1)) * 2 - 1);
            pointerTargetRef.current = { x, y };
        };

        // Use window for pointer events since container has pointer-events: none
        window.addEventListener('pointermove', handlePointerMove);
        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className={`w-full h-full relative overflow-hidden ${className}`}
            style={{ ...style, minHeight: '100%', minWidth: '100%' }}
        />
    );
}

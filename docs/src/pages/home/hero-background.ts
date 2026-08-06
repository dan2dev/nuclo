// Hero background: an ambient grid of drifting particles with a click
// (desktop) / touch-down (mobile) "explosion" shockwave. Two renderers share
// one lifecycle (resize/visibility/interaction plumbing below):
//
//   - GL renderer (preferred): all per-particle motion + shading runs on the
//     GPU (vertex shader positions each point, fragment shader shades it).
//     The CPU side just updates a few uniforms and issues one draw call/frame.
//   - Canvas2D renderer (fallback): used when WebGL2 isn't available. Particle
//     motion is a small CPU spring simulation; circles are batched into a
//     handful of Path2D fills instead of one fill() call per particle.
//
// Both renderers consume the same static particle grid (computeParticleGrid)
// so their layout matches exactly.

type ParticleBase = { baseX: number; baseY: number; phase: number; size: number };

type DrawParams = {
  time: number; // seconds
  // Click (desktop) / touch-down (mobile) shockwave: a ring that expands from
  // (explosionX, explosionY) and fades out over EXPLOSION_DURATION seconds.
  explosionActive: boolean;
  explosionX: number;
  explosionY: number;
  explosionElapsed: number; // seconds since the triggering click/touch
};

interface Renderer {
  resize(width: number, height: number, dpr: number): void;
  draw(params: DrawParams): void;
  dispose(): void;
}

const activeCanvases = new WeakSet<HTMLCanvasElement>();

// Tuning for the click/touch "explosion": a gaussian ring travels outward
// from the interaction point at EXPLOSION_SPEED px/sec, pushing nearby dots
// along its front by up to EXPLOSION_PUSH px. Both renderers (GLSL and the
// Canvas2D fallback) implement this same formula independently — keep them
// in sync if these constants change.
const EXPLOSION_DURATION = 0.9; // seconds for the whole effect to fade out
const EXPLOSION_SPEED = 900; // px/sec the ring travels outward
const EXPLOSION_RING_WIDTH = 130; // px; gaussian width of the ring front
const EXPLOSION_PUSH = 70; // px; max outward displacement at the ring's peak

// How long "Get Started" / "View Examples" wait after being clicked before
// actually navigating, so the shockwave has a moment to read before the hero
// unmounts. Short enough to still feel snappy.
export const HERO_CLICK_NAV_DELAY_MS = 220;

function computeParticleGrid(width: number, height: number): ParticleBase[] {
  const gap = width < 640 ? 38 : 46;
  const columns = Math.ceil(width / gap) + 2;
  const rows = Math.ceil(height / gap) + 2;
  const grid: ParticleBase[] = [];

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const phase = row * 1.73 + column * 2.41;
      const stagger = row % 2 === 0 ? 0 : gap * 0.5;
      grid.push({
        baseX: column * gap - gap + stagger,
        baseY: row * gap - gap,
        phase,
        size: 0.8 + ((row * 7 + column * 11) % 5) * 0.22,
      });
    }
  }

  return grid;
}

// ---------------------------------------------------------------------------
// GL renderer
// ---------------------------------------------------------------------------

const VERTEX_SHADER_SRC = `#version 300 es
layout(location = 0) in vec2 aBase;
layout(location = 1) in vec2 aPhaseSize;

uniform vec2 uResolution;
uniform float uTime;
uniform float uDpr;
uniform float uMaxPointSize;
uniform vec2 uExplosionOrigin;
uniform float uExplosionElapsed;
uniform float uExplosionActive;
uniform float uExplosionDuration;
uniform float uExplosionSpeed;
uniform float uExplosionRingWidth;
uniform float uExplosionPush;

out float vAlpha;

void main() {
  float phase = aPhaseSize.x;
  float size = aPhaseSize.y;

  vec2 idle = vec2(sin(uTime * 0.38 + phase), cos(uTime * 0.31 + phase)) * 2.2;
  vec2 pos = aBase + idle;

  // Click/touch shockwave: a gaussian ring expanding from the interaction
  // point, pushing nearby dots outward along its front and fading with time.
  float explosionStrength = 0.0;
  if (uExplosionActive > 0.5) {
    vec2 toExplosion = aBase - uExplosionOrigin;
    float edist = length(toExplosion);
    float front = uExplosionElapsed * uExplosionSpeed;
    float diff = edist - front;
    float pulse = exp(-(diff * diff) / (2.0 * uExplosionRingWidth * uExplosionRingWidth));
    float decay = clamp(1.0 - uExplosionElapsed / uExplosionDuration, 0.0, 1.0);
    explosionStrength = pulse * decay;
    vec2 edir = edist > 0.001 ? toExplosion / edist : vec2(0.0, -1.0);
    pos += edir * explosionStrength * uExplosionPush;
  }

  float shimmer = (sin(uTime * 0.8 + phase) + 1.0) * 0.5;
  vAlpha = 0.13 + shimmer * 0.11 + explosionStrength * 0.55;

  vec2 clip = (pos / uResolution) * 2.0 - 1.0;
  clip.y = -clip.y;
  gl_Position = vec4(clip, 0.0, 1.0);

  float radius = size + explosionStrength * 1.6;
  gl_PointSize = min(radius * 2.0 * uDpr, uMaxPointSize);
}
`;

const FRAGMENT_SHADER_SRC = `#version 300 es
precision mediump float;

in float vAlpha;
out vec4 fragColor;

void main() {
  vec2 centered = gl_PointCoord - vec2(0.5);
  float dist = length(centered) * 2.0;
  float edge = 1.0 - smoothstep(0.78, 1.0, dist);
  if (edge <= 0.0) discard;

  float alpha = vAlpha * edge;
  // Premultiplied + additive (ONE, ONE) blending approximates the softer
  // "screen" composite the Canvas2D renderer uses, without a blend-equation
  // extension.
  vec3 color = vec3(1.0, 1.0, 0.933) * alpha;
  fragColor = vec4(color, alpha);
}
`;

function compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn("[nuclo-docs] hero background: shader compile failed", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createGLRenderer(canvas: HTMLCanvasElement): Renderer | null {
  // NOTE: getContext() permanently binds the canvas to this context type.
  // If this returns null, the canvas is untouched and the caller can safely
  // fall back to canvas.getContext("2d").
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    antialias: true,
    premultipliedAlpha: true,
    powerPreference: "low-power",
  });
  if (!gl) return null;

  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SRC);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SRC);
  const program = vertexShader && fragmentShader ? gl.createProgram() : null;
  if (!program || !vertexShader || !fragmentShader) {
    // Context is already bound to WebGL2, so there's no 2D fallback for this
    // canvas — draw() below will just no-op and the CSS gradient (set by the
    // caller) is what the user sees. This should never happen in practice
    // since the shaders above are static and pre-verified.
    return { resize() {}, draw() {}, dispose() {} };
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn("[nuclo-docs] hero background: shader link failed", gl.getProgramInfoLog(program));
    return { resize() {}, draw() {}, dispose() {} };
  }

  const vao = gl.createVertexArray();
  const buffer = gl.createBuffer();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);
  gl.bindVertexArray(null);

  const uResolution = gl.getUniformLocation(program, "uResolution");
  const uTime = gl.getUniformLocation(program, "uTime");
  const uDpr = gl.getUniformLocation(program, "uDpr");
  const uMaxPointSize = gl.getUniformLocation(program, "uMaxPointSize");
  const uExplosionOrigin = gl.getUniformLocation(program, "uExplosionOrigin");
  const uExplosionElapsed = gl.getUniformLocation(program, "uExplosionElapsed");
  const uExplosionActive = gl.getUniformLocation(program, "uExplosionActive");
  const uExplosionDuration = gl.getUniformLocation(program, "uExplosionDuration");
  const uExplosionSpeed = gl.getUniformLocation(program, "uExplosionSpeed");
  const uExplosionRingWidth = gl.getUniformLocation(program, "uExplosionRingWidth");
  const uExplosionPush = gl.getUniformLocation(program, "uExplosionPush");

  const pointSizeRange = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE) as Float32Array | number[] | null;
  const maxPointSize = Math.max(1, pointSizeRange?.[1] ?? 16);

  let particleCount = 0;
  let dpr = 1;
  let contextLost = false;

  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    contextLost = true;
  });

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE);
  gl.clearColor(0, 0, 0, 0);
  gl.useProgram(program);
  // Explosion tuning constants never change at runtime — set once rather
  // than re-uploading them on every draw call.
  gl.uniform1f(uExplosionDuration, EXPLOSION_DURATION);
  gl.uniform1f(uExplosionSpeed, EXPLOSION_SPEED);
  gl.uniform1f(uExplosionRingWidth, EXPLOSION_RING_WIDTH);
  gl.uniform1f(uExplosionPush, EXPLOSION_PUSH);

  return {
    resize(width, height, nextDpr) {
      if (contextLost) return;
      dpr = nextDpr;
      gl.viewport(0, 0, canvas.width, canvas.height);

      const grid = computeParticleGrid(width, height);
      const data = new Float32Array(grid.length * 4);
      for (let i = 0; i < grid.length; i++) {
        const p = grid[i];
        data[i * 4] = p.baseX;
        data[i * 4 + 1] = p.baseY;
        data[i * 4 + 2] = p.phase;
        data[i * 4 + 3] = p.size;
      }
      particleCount = grid.length;
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

      gl.useProgram(program);
      gl.uniform2f(uResolution, width, height);
    },
    draw({ time, explosionActive, explosionX, explosionY, explosionElapsed }) {
      if (contextLost || particleCount === 0) return;
      gl.useProgram(program);
      gl.uniform1f(uTime, time);
      gl.uniform1f(uDpr, dpr);
      gl.uniform1f(uMaxPointSize, maxPointSize);
      gl.uniform1f(uExplosionActive, explosionActive ? 1 : 0);
      gl.uniform2f(uExplosionOrigin, explosionX, explosionY);
      gl.uniform1f(uExplosionElapsed, explosionElapsed);

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.POINTS, 0, particleCount);
      gl.bindVertexArray(null);
    },
    dispose() {
      gl.deleteProgram(program);
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vao);
      // Free GPU resources immediately rather than waiting on GC — this SPA
      // can mount/unmount the hero (and a fresh WebGL context) many times
      // per session as the user navigates home -> docs -> home again.
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}

// ---------------------------------------------------------------------------
// Canvas2D renderer (fallback for browsers without WebGL2)
// ---------------------------------------------------------------------------

type SimParticle = ParticleBase & { x: number; y: number; vx: number; vy: number };

// Alpha is quantized into buckets so hundreds of particles can be filled with
// a handful of Path2D.fill() calls instead of one beginPath/arc/fill per
// particle — canvas draw calls (not the math) are what actually cost CPU here.
const ALPHA_STEPS = 24;

// Mirrors the GLSL explosion formula in the vertex shader above: a gaussian
// pulse riding the shockwave front, faded out over EXPLOSION_DURATION.
// Returns a 0..1 intensity for the given base position at the given elapsed
// time (0 when there's no active explosion).
function explosionIntensity(
  baseX: number,
  baseY: number,
  explosionX: number,
  explosionY: number,
  explosionElapsed: number,
): number {
  const dx = baseX - explosionX;
  const dy = baseY - explosionY;
  const edist = Math.hypot(dx, dy);
  const front = explosionElapsed * EXPLOSION_SPEED;
  const diff = edist - front;
  const pulse = Math.exp(-(diff * diff) / (2 * EXPLOSION_RING_WIDTH * EXPLOSION_RING_WIDTH));
  const decay = Math.max(0, 1 - explosionElapsed / EXPLOSION_DURATION);
  return pulse * decay;
}

function createCanvas2DRenderer(canvas: HTMLCanvasElement): Renderer | null {
  const context2d = canvas.getContext("2d");
  if (!context2d) return null;
  // Re-bound to a variable typed as non-null at initialization — TS control-flow
  // narrowing from the `if` above doesn't persist into the nested function
  // declarations below, but a fresh const's inferred type does.
  const ctx: CanvasRenderingContext2D = context2d;

  let width = 1;
  let height = 1;
  let particles: SimParticle[] = [];
  let cachedGradient: CanvasGradient | null = null;
  let lastDrawTime: number | null = null;
  const circlePaths = new Map<number, Path2D>();

  function updateParticles(
    delta: number,
    time: number,
    explosionActive: boolean,
    explosionX: number,
    explosionY: number,
    explosionElapsed: number,
  ) {
    for (const particle of particles) {
      const idleX = Math.sin(time * 0.38 + particle.phase) * 2.2;
      const idleY = Math.cos(time * 0.31 + particle.phase) * 2.2;
      let desiredX = particle.baseX + idleX;
      let desiredY = particle.baseY + idleY;

      if (explosionActive) {
        const dx = particle.baseX - explosionX;
        const dy = particle.baseY - explosionY;
        const edist = Math.hypot(dx, dy);
        const push = explosionIntensity(particle.baseX, particle.baseY, explosionX, explosionY, explosionElapsed) * EXPLOSION_PUSH;
        if (edist > 0.001) {
          desiredX += (dx / edist) * push;
          desiredY += (dy / edist) * push;
        }
      }

      particle.vx += (desiredX - particle.x) * 0.052 * delta;
      particle.vy += (desiredY - particle.y) * 0.052 * delta;
      particle.vx *= Math.pow(0.78, delta);
      particle.vy *= Math.pow(0.78, delta);
      particle.x += particle.vx * delta;
      particle.y += particle.vy * delta;
    }
  }

  function paint(
    time: number,
    explosionActive: boolean,
    explosionX: number,
    explosionY: number,
    explosionElapsed: number,
  ) {
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = cachedGradient ?? "#ff5a1a";
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.globalCompositeOperation = "screen";

    circlePaths.clear();

    for (const particle of particles) {
      const shimmer = (Math.sin(time * 0.8 + particle.phase) + 1) * 0.5;
      const explosion = explosionActive
        ? explosionIntensity(particle.baseX, particle.baseY, explosionX, explosionY, explosionElapsed)
        : 0;
      const alpha = 0.13 + shimmer * 0.11 + explosion * 0.55;
      const bucket = Math.round(alpha * ALPHA_STEPS);

      let circlePath = circlePaths.get(bucket);
      if (!circlePath) {
        circlePath = new Path2D();
        circlePaths.set(bucket, circlePath);
      }
      const radius = particle.size + explosion * 1.6;
      circlePath.moveTo(particle.x + radius, particle.y);
      circlePath.arc(particle.x, particle.y, radius, 0, Math.PI * 2);
    }

    for (const [bucket, path] of circlePaths) {
      ctx.fillStyle = `rgba(255,255,238,${bucket / ALPHA_STEPS})`;
      ctx.fill(path);
    }
    ctx.restore();

    ctx.fillStyle = "rgba(87, 12, 0, 0.07)";
    for (let y = 1; y < height; y += 4) ctx.fillRect(0, y, width, 1);
  }

  return {
    resize(nextWidth, nextHeight) {
      width = nextWidth;
      height = nextHeight;
      const grid = computeParticleGrid(width, height);
      particles = grid.map((p) => ({ ...p, x: p.baseX, y: p.baseY, vx: 0, vy: 0 }));

      // Gradient only depends on width/height, so it only needs rebuilding
      // here, not on every animation frame (createLinearGradient() isn't free).
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#ff7a1a");
      gradient.addColorStop(0.48, "#ff4817");
      gradient.addColorStop(1, "#dc2715");
      cachedGradient = gradient;
    },
    draw({ time, explosionActive, explosionX, explosionY, explosionElapsed }) {
      const delta = lastDrawTime === null ? 1 : Math.min(2, (time - lastDrawTime) * 60);
      lastDrawTime = time;
      updateParticles(delta, time, explosionActive, explosionX, explosionY, explosionElapsed);
      paint(time, explosionActive, explosionX, explosionY, explosionElapsed);
    },
    dispose() {},
  };
}

// ---------------------------------------------------------------------------
// Shared lifecycle: resize/visibility/interaction plumbing, used by either
// renderer. The only interactions this hero responds to are a click
// (desktop) or a touch-down (mobile) — both just trigger the explosion.
// ---------------------------------------------------------------------------

export function initHeroBackground(canvas: HTMLCanvasElement) {
  if (activeCanvases.has(canvas)) return;
  activeCanvases.add(canvas);

  const frame = canvas.parentElement;
  if (!frame) return;
  const heroFrame = frame;

  // Static CSS background (gradient + scanlines) so the hero reads correctly
  // even before the first frame is drawn, and stays correct as a graceful
  // fallback in the (extremely unlikely) case the GL renderer's shaders fail
  // to build after the canvas is already bound to a WebGL2 context.
  canvas.style.backgroundImage =
    "repeating-linear-gradient(to bottom, rgba(87,12,0,0.07) 0px, rgba(87,12,0,0.07) 1px, transparent 1px, transparent 4px), " +
    "linear-gradient(135deg, #ff7a1a 0%, #ff4817 48%, #dc2715 100%)";

  const maybeRenderer = createGLRenderer(canvas) ?? createCanvas2DRenderer(canvas);
  if (!maybeRenderer) return;
  // See the ctx/context2d note above — same closure-narrowing limitation.
  const renderer: Renderer = maybeRenderer;

  let width = 1;
  let height = 1;
  let animationFrame = 0;
  let inView = true;
  // Click (desktop) / touch-down (mobile) shockwave state. explosionElapsed
  // is recomputed from explosionStartTime once per rendered frame in
  // simulate(), same cadence as everything else here.
  let explosionActive = false;
  let explosionOriginX = 0;
  let explosionOriginY = 0;
  let explosionStartTime = 0;
  let explosionElapsed = 0;
  // A touch-down already triggered the explosion; skip the synthesized click
  // that follows it so a tap doesn't fire twice.
  let suppressNextClick = false;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const eventController = new AbortController();

  function paintOnce(time: number) {
    renderer.draw({
      time,
      explosionActive, explosionX: explosionOriginX, explosionY: explosionOriginY, explosionElapsed,
    });
  }

  // Kicks off the click/touch shockwave at (x, y) in heroFrame-local
  // coordinates. No-ops under prefers-reduced-motion.
  function triggerExplosion(x: number, y: number) {
    if (reduceMotion) return;
    explosionActive = true;
    explosionOriginX = x;
    explosionOriginY = y;
    explosionStartTime = performance.now();
    explosionElapsed = 0;
  }

  function handleClick(event: MouseEvent) {
    if (suppressNextClick) {
      suppressNextClick = false;
      return;
    }
    const rect = heroFrame.getBoundingClientRect();
    triggerExplosion(event.clientX - rect.left, event.clientY - rect.top);
  }

  function handleTouchDown(event: PointerEvent) {
    if (event.pointerType !== "touch") return;
    suppressNextClick = true;
    const rect = heroFrame.getBoundingClientRect();
    triggerExplosion(event.clientX - rect.left, event.clientY - rect.top);
  }

  function cleanup() {
    cancelAnimationFrame(animationFrame);
    resizeObserver.disconnect();
    connectionObserver.disconnect();
    visibilityObserver.disconnect();
    eventController.abort();
    renderer.dispose();
  }

  function resize() {
    const rect = heroFrame.getBoundingClientRect();
    const nextWidth = Math.max(1, Math.round(rect.width));
    const nextHeight = Math.max(1, Math.round(rect.height));
    if (nextWidth === width && nextHeight === height) return;

    width = nextWidth;
    height = nextHeight;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    renderer.resize(width, height, pixelRatio);
  }

  function simulate(now: number) {
    if (!canvas.isConnected) {
      cleanup();
      return;
    }

    if (!inView) {
      // Scrolled out of the viewport: stop scheduling frames entirely.
      // The IntersectionObserver below restarts the loop once it's visible again.
      animationFrame = 0;
      return;
    }

    if (explosionActive) {
      explosionElapsed = (now - explosionStartTime) / 1000;
      if (explosionElapsed >= EXPLOSION_DURATION) {
        explosionActive = false;
        explosionElapsed = 0;
      }
    }
    paintOnce(now / 1000);
    animationFrame = requestAnimationFrame(simulate);
  }

  const resizeObserver = new ResizeObserver(() => {
    resize();
    if (reduceMotion) paintOnce(0);
  });
  const connectionObserver = new MutationObserver(() => {
    if (!canvas.isConnected) cleanup();
  });
  const visibilityObserver = new IntersectionObserver((entries) => {
    const entry = entries[entries.length - 1];
    inView = entry?.isIntersecting ?? true;
    if (inView && !reduceMotion && animationFrame === 0 && canvas.isConnected) {
      animationFrame = requestAnimationFrame(simulate);
    }
  });
  resizeObserver.observe(heroFrame);
  connectionObserver.observe(document.body, { childList: true, subtree: true });
  visibilityObserver.observe(heroFrame);
  // Explosion trigger: full click on desktop, immediate touch-down on mobile.
  heroFrame.addEventListener("click", handleClick, { signal: eventController.signal });
  heroFrame.addEventListener("pointerdown", handleTouchDown, {
    passive: true,
    signal: eventController.signal,
  });

  resize();
  if (reduceMotion) paintOnce(0);
  else animationFrame = requestAnimationFrame(simulate);

  window.addEventListener("pagehide", cleanup, {
    once: true,
    signal: eventController.signal,
  });
}

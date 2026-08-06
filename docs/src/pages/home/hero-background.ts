// Hero background: an ambient grid of drifting particles that ripple when the
// hero is clicked (desktop) or touched (mobile). Two renderers share one
// lifecycle (resize/visibility/interaction plumbing below):
//
//   - GL renderer (preferred): all per-particle motion + shading runs on the
//     GPU (vertex shader positions each point, fragment shader shades it).
//     The CPU side just updates a few uniforms and issues one draw call/frame.
//   - Canvas2D renderer (fallback): used when WebGL2 isn't available. It
//     evaluates the exact same closed-form motion on the CPU, and batches
//     circles into a handful of Path2D fills instead of one fill() per dot.
//
// Both renderers consume the same static particle grid (computeParticleGrid)
// and the same wave model (see WAVE_* below), so they match exactly.

type ParticleBase = { baseX: number; baseY: number; phase: number; size: number };

// Up to this many ripples can be in flight at once; slots are claimed
// round-robin, so a volley of clicks evicts the oldest ripple rather than
// growing without bound. See the "alternating polarity" note below for how
// this stays contained instead of piling up into one oversized blast.
const MAX_WAVES = 4;

type DrawParams = {
  time: number; // seconds
  // MAX_WAVES × vec4, packed as [originX, originY, elapsedSeconds, sign].
  // sign is 0 while the slot is inactive, +1 for an outward blast, -1 for an
  // inward implosion. Shared verbatim with the GL uniform array, so the CPU
  // packs it once.
  waves: Float32Array;
};

interface Renderer {
  resize(width: number, height: number, dpr: number): void;
  draw(params: DrawParams): void;
  dispose(): void;
}

const activeCanvases = new WeakSet<HTMLCanvasElement>();

// --- Wave model ------------------------------------------------------------
//
// A surface ripple, evaluated in closed form so the vertex shader stays
// stateless (no transform feedback / ping-pong buffers needed):
//
// 1. The crest travels outward at a constant celerity (r = c·t) — that is what
//    makes this a wave rather than a blast. A shock front decelerates as it
//    spends its energy (r ∝ √t) and so rips away almost instantly; a wave
//    keeps its speed, and at WAVE_SPEED you can watch it cross the hero.
//    Inverting it gives each dot's arrival time directly: t = d / c. A dot
//    stays perfectly still until the crest reaches it.
//
// 2. As the wave passes, the dot swings on a lightly damped oscillation
//    (ζ ≈ 0.28), NORM·e^(−DAMP·τ)·sin(OMEGA·τ): out, back past centre, and
//    onward through four visible swings (100%, −40%, 16%, −7%) before it
//    settles. Light damping is what reads as "rolling swell" instead of a
//    single punch-and-stop.
//
// 3. Alternating polarity: triggerWave() flips the sign of each new ripple
//    relative to the last one whenever a previous ripple is still active
//    (blast, implosion, blast, ...). A lone click always gets a clean
//    outward blast. This is what keeps a burst of clicks from summing into
//    one oversized, chaotic mess — opposing ripples partially cancel each
//    other's displacement instead of stacking it.
const WAVE_SPEED = 680; // px/s — constant crest celerity
const WAVE_AMPLITUDE = 40; // px — peak displacement at the wave origin
const WAVE_FALLOFF = 900; // px — amplitude ∝ 1/√(1 + d/FALLOFF) as the ring spreads
const WAVE_OMEGA = 5.6; // rad/s — angular frequency (period ≈ 1.12s)
const WAVE_DAMP = 1.613; // 1/s — envelope decay, ζ ≈ 0.28
const WAVE_NORM = 1.5091; // normalises the response so its first crest is exactly 1
const WAVE_LIFETIME = 5.6; // s — travel across the hero diagonal + settle to sub-pixel

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

/** Formats a number as a GLSL float literal (GLSL rejects `680` where a float is wanted). */
const f = (n: number) => (Number.isInteger(n) ? `${n}.0` : `${n}`);

// The WAVE_* constants are interpolated straight into the shader rather than
// passed as uniforms: one source of truth with the Canvas2D path, and no
// per-frame uniform traffic for values that never change.
const VERTEX_SHADER_SRC = `#version 300 es
layout(location = 0) in vec2 aBase;
layout(location = 1) in vec2 aPhaseSize;

uniform vec2 uResolution;
uniform float uTime;
uniform float uDpr;
uniform float uMaxPointSize;
// xy = origin (px), z = seconds since the tap, w = sign (0 inactive, ±1 live)
uniform vec4 uWaves[${MAX_WAVES}];

out float vAlpha;

void main() {
  float phase = aPhaseSize.x;
  float size = aPhaseSize.y;

  // Ambient drift, with per-particle amplitude so the field breathes instead
  // of swaying in lockstep.
  float driftAmp = 1.9 + 1.1 * sin(phase * 1.7);
  vec2 pos = aBase + vec2(sin(uTime * 0.38 + phase), cos(uTime * 0.31 + phase * 1.3)) * driftAmp;

  // Per-particle character: a little spread in how far each dot rides, and a
  // few degrees of angular jitter. Kept gentle — a wavefront should stay
  // coherent, unlike the chaotic scatter of a blast.
  float variance = 1.0 + 0.15 * sin(phase * 3.7);
  float jitter = 0.10 * sin(phase * 2.3);
  float cj = cos(jitter);
  float sj = sin(jitter);

  float energy = 0.0;
  for (int i = 0; i < ${MAX_WAVES}; i++) {
    vec4 wave = uWaves[i];
    if (abs(wave.w) < 0.5) continue;

    vec2 toParticle = aBase - wave.xy;
    float d = length(toParticle);
    // Constant celerity: the crest reaches this dot at t = d / c.
    float tau = wave.z - d / ${f(WAVE_SPEED)};
    if (tau <= 0.0) continue; // crest hasn't arrived — dot is still at rest

    float resp = ${f(WAVE_NORM)} * exp(-${f(WAVE_DAMP)} * tau) * sin(${f(WAVE_OMEGA)} * tau);
    float amp = ${f(WAVE_AMPLITUDE)} * variance * inversesqrt(1.0 + d / ${f(WAVE_FALLOFF)});

    vec2 dir = d > 0.001 ? toParticle / d : vec2(0.0, -1.0);
    // wave.w (±1) flips an implosion's displacement back toward the origin
    // instead of away from it.
    pos += vec2(dir.x * cj - dir.y * sj, dir.x * sj + dir.y * cj) * (amp * resp * wave.w);
    energy += abs(resp) * variance;
  }
  energy = min(energy, 1.5);

  float shimmer = (sin(uTime * 0.8 + phase) + 1.0) * 0.5;
  vAlpha = 0.13 + shimmer * 0.11 + energy * 0.38;

  vec2 clip = (pos / uResolution) * 2.0 - 1.0;
  clip.y = -clip.y;
  gl_Position = vec4(clip, 0.0, 1.0);

  // Size stays constant through the ripple — only brightness (vAlpha above)
  // signals a wave passing through, so the field doesn't visually "pulse".
  gl_PointSize = min(size * 2.0 * uDpr, uMaxPointSize);
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
  const uWaves = gl.getUniformLocation(program, "uWaves");

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
    draw({ time, waves }) {
      if (contextLost || particleCount === 0) return;
      gl.useProgram(program);
      gl.uniform1f(uTime, time);
      gl.uniform1f(uDpr, dpr);
      gl.uniform1f(uMaxPointSize, maxPointSize);
      gl.uniform4fv(uWaves, waves);

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

// Alpha is quantized into buckets so hundreds of particles can be filled with
// a handful of Path2D.fill() calls instead of one beginPath/arc/fill per
// particle — canvas draw calls (not the math) are what actually cost CPU here.
const ALPHA_STEPS = 24;

function createCanvas2DRenderer(canvas: HTMLCanvasElement): Renderer | null {
  const context2d = canvas.getContext("2d");
  if (!context2d) return null;
  // Re-bound to a variable typed as non-null at initialization — TS control-flow
  // narrowing from the `if` above doesn't persist into the nested function
  // declarations below, but a fresh const's inferred type does.
  const ctx: CanvasRenderingContext2D = context2d;

  let width = 1;
  let height = 1;
  let particles: ParticleBase[] = [];
  let cachedGradient: CanvasGradient | null = null;
  const circlePaths = new Map<number, Path2D>();

  return {
    resize(nextWidth, nextHeight, dpr) {
      width = nextWidth;
      height = nextHeight;
      // The canvas backing store is dpr× the CSS size, but everything below is
      // drawn in CSS px — without this the field renders at 1:1 into the
      // top-left corner and CSS stretches it back up, at half resolution.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = computeParticleGrid(width, height);

      // Gradient only depends on width/height, so it only needs rebuilding
      // here, not on every animation frame (createLinearGradient() isn't free).
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#ff7a1a");
      gradient.addColorStop(0.48, "#ff4817");
      gradient.addColorStop(1, "#dc2715");
      cachedGradient = gradient;
    },
    // Mirrors VERTEX_SHADER_SRC above line for line — keep the two in step.
    draw({ time, waves }) {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = cachedGradient ?? "#ff5a1a";
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.globalCompositeOperation = "screen";
      circlePaths.clear();

      for (const particle of particles) {
        const { baseX, baseY, phase } = particle;
        const driftAmp = 1.9 + 1.1 * Math.sin(phase * 1.7);
        let x = baseX + Math.sin(time * 0.38 + phase) * driftAmp;
        let y = baseY + Math.cos(time * 0.31 + phase * 1.3) * driftAmp;

        const variance = 1 + 0.15 * Math.sin(phase * 3.7);
        const jitter = 0.1 * Math.sin(phase * 2.3);
        const cj = Math.cos(jitter);
        const sj = Math.sin(jitter);

        let energy = 0;
        for (let i = 0; i < MAX_WAVES; i++) {
          const o = i * 4;
          const sign = waves[o + 3];
          if (Math.abs(sign) < 0.5) continue;

          const dx = baseX - waves[o];
          const dy = baseY - waves[o + 1];
          const d = Math.hypot(dx, dy);
          const tau = waves[o + 2] - d / WAVE_SPEED;
          if (tau <= 0) continue;

          const resp = WAVE_NORM * Math.exp(-WAVE_DAMP * tau) * Math.sin(WAVE_OMEGA * tau);
          const amp = (WAVE_AMPLITUDE * variance) / Math.sqrt(1 + d / WAVE_FALLOFF);

          const dirX = d > 0.001 ? dx / d : 0;
          const dirY = d > 0.001 ? dy / d : -1;
          x += (dirX * cj - dirY * sj) * amp * resp * sign;
          y += (dirX * sj + dirY * cj) * amp * resp * sign;
          energy += Math.abs(resp) * variance;
        }
        energy = Math.min(energy, 1.5);

        const shimmer = (Math.sin(time * 0.8 + phase) + 1) * 0.5;
        const bucket = Math.round((0.13 + shimmer * 0.11 + energy * 0.38) * ALPHA_STEPS);

        let circlePath = circlePaths.get(bucket);
        if (!circlePath) {
          circlePath = new Path2D();
          circlePaths.set(bucket, circlePath);
        }
        // Size stays constant through the ripple — only brightness (alpha
        // above) signals a wave passing through, so the field doesn't
        // visually "pulse".
        circlePath.moveTo(x + particle.size, y);
        circlePath.arc(x, y, particle.size, 0, Math.PI * 2);
      }

      for (const [bucket, path] of circlePaths) {
        ctx.fillStyle = `rgba(255,255,238,${bucket / ALPHA_STEPS})`;
        ctx.fill(path);
      }
      ctx.restore();

      ctx.fillStyle = "rgba(87, 12, 0, 0.07)";
      for (let y = 1; y < height; y += 4) ctx.fillRect(0, y, width, 1);
    },
    dispose() {},
  };
}

// ---------------------------------------------------------------------------
// Shared lifecycle: resize/visibility/interaction plumbing, used by either
// renderer. The only interactions this hero responds to are a click
// (desktop) or a touch-down (mobile) — both just start a ripple.
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
  // Live ripples, packed for the GL uniform array (see DrawParams.waves).
  // Slots are claimed round-robin, so a 5th rapid click evicts the oldest.
  const waves = new Float32Array(MAX_WAVES * 4);
  const waveStarts = new Float64Array(MAX_WAVES);
  let nextWaveSlot = 0;
  // The sign given to the most recently triggered ripple, used to alternate
  // polarity — see triggerWave().
  let lastSign = 1;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const eventController = new AbortController();

  function paintOnce(time: number) {
    renderer.draw({ time, waves });
  }

  function hasActiveWave(): boolean {
    for (let i = 0; i < MAX_WAVES; i++) {
      if (Math.abs(waves[i * 4 + 3]) > 0.5) return true;
    }
    return false;
  }

  /**
   * Starts a ripple at (x, y) in heroFrame-local px. No-ops under
   * prefers-reduced-motion. If a previous ripple is still active, this one
   * is given the opposite polarity (an implosion pulling inward instead of
   * another outward blast) so consecutive clicks alternate and partially
   * cancel rather than piling their displacement on top of each other.
   */
  function triggerWave(x: number, y: number) {
    if (reduceMotion) return;
    const sign = hasActiveWave() ? -lastSign : 1;
    lastSign = sign;

    const slot = nextWaveSlot;
    nextWaveSlot = (nextWaveSlot + 1) % MAX_WAVES;
    const offset = slot * 4;
    waves[offset] = x;
    waves[offset + 1] = y;
    waves[offset + 2] = 0;
    waves[offset + 3] = sign;
    waveStarts[slot] = performance.now();
  }

  /** Advances each live ripple's clock, retiring the ones past WAVE_LIFETIME. */
  function advanceWaves(now: number) {
    for (let i = 0; i < MAX_WAVES; i++) {
      const offset = i * 4;
      if (Math.abs(waves[offset + 3]) < 0.5) continue;
      const elapsed = (now - waveStarts[i]) / 1000;
      if (elapsed >= WAVE_LIFETIME) {
        waves[offset + 2] = 0;
        waves[offset + 3] = 0;
        continue;
      }
      waves[offset + 2] = elapsed;
    }
  }

  function waveFromEvent(event: MouseEvent | PointerEvent) {
    const rect = heroFrame.getBoundingClientRect();
    triggerWave(event.clientX - rect.left, event.clientY - rect.top);
  }

  // A touch-down already started a ripple; skip the synthesized click that
  // follows so a tap doesn't fire twice.
  let suppressNextClick = false;

  function handleClick(event: MouseEvent) {
    if (suppressNextClick) {
      suppressNextClick = false;
      return;
    }
    waveFromEvent(event);
  }

  function handleTouchDown(event: PointerEvent) {
    if (event.pointerType !== "touch") return;
    suppressNextClick = true;
    waveFromEvent(event);
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

    advanceWaves(now);
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
  // Ripple trigger: full click on desktop, immediate touch-down on mobile.
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

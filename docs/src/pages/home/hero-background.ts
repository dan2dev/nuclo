type Particle = {
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  phase: number;
};

const activeCanvases = new WeakSet<HTMLCanvasElement>();

function createParticles(width: number, height: number): Particle[] {
  const gap = width < 640 ? 38 : 46;
  const columns = Math.ceil(width / gap) + 2;
  const rows = Math.ceil(height / gap) + 2;
  const particles: Particle[] = [];

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const phase = row * 1.73 + column * 2.41;
      const stagger = row % 2 === 0 ? 0 : gap * 0.5;
      const baseX = column * gap - gap + stagger;
      const baseY = row * gap - gap;
      particles.push({
        baseX,
        baseY,
        x: baseX,
        y: baseY,
        vx: 0,
        vy: 0,
        size: 0.8 + ((row * 7 + column * 11) % 5) * 0.22,
        phase,
      });
    }
  }

  return particles;
}

export function initHeroBackground(canvas: HTMLCanvasElement) {
  if (activeCanvases.has(canvas)) return;
  activeCanvases.add(canvas);

  const frame = canvas.parentElement;
  const context = canvas.getContext("2d");
  if (!frame || !context) return;
  const heroFrame = frame;
  const drawingContext = context;

  let width = 1;
  let height = 1;
  let particles: Particle[] = [];
  let animationFrame = 0;
  let lastTime = performance.now();
  let focusX = 0;
  let focusY = 0;
  let targetFocusX = 0;
  let targetFocusY = 0;
  let effectActive = false;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobileInteraction = window.matchMedia(
    "(max-width: 700px), (hover: none) and (pointer: coarse)",
  );
  const eventController = new AbortController();

  function resetFocus() {
    effectActive = false;
    targetFocusX = width * 0.5;
    targetFocusY = height * 0.72;
  }

  function updateScrollFocus() {
    if (!mobileInteraction.matches) return;

    const rect = heroFrame.getBoundingClientRect();
    const progress = Math.min(1, Math.max(0, -rect.top / Math.max(1, rect.height)));
    targetFocusX = width * (0.18 + progress * 0.64);
    targetFocusY = height * (0.82 - progress * 0.54);
    effectActive = rect.top < window.innerHeight && rect.bottom > 0;

    if (reduceMotion) {
      focusX = targetFocusX;
      focusY = targetFocusY;
      updateParticles(1, performance.now() / 1000);
      draw(performance.now() / 1000);
    }
  }

  function cleanup() {
    cancelAnimationFrame(animationFrame);
    resizeObserver.disconnect();
    connectionObserver.disconnect();
    eventController.abort();
  }

  function resize() {
    const rect = heroFrame.getBoundingClientRect();
    const nextWidth = Math.max(1, Math.round(rect.width));
    const nextHeight = Math.max(1, Math.round(rect.height));
    if (nextWidth === width && nextHeight === height) return;

    width = nextWidth;
    height = nextHeight;
    targetFocusX = focusX = width * 0.5;
    targetFocusY = focusY = height * 0.72;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    drawingContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    particles = createParticles(width, height);
    if (mobileInteraction.matches) updateScrollFocus();
  }

  function updateParticles(delta: number, time: number) {
    for (const particle of particles) {
      const idleX = Math.sin(time * 0.38 + particle.phase) * 2.2;
      const idleY = Math.cos(time * 0.31 + particle.phase) * 2.2;
      let desiredX = particle.baseX + idleX;
      let desiredY = particle.baseY + idleY;

      if (effectActive) {
        const dx = particle.baseX - focusX;
        const dy = particle.baseY - focusY;
        const distance = Math.max(24, Math.hypot(dx, dy));
        const reach = Math.min(260, width * 0.3);
        if (distance < reach) {
          const influence = Math.pow(1 - distance / reach, 2);
          desiredX += (dx / distance) * influence * 34;
          desiredY += (dy / distance) * influence * 34;
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

  function draw(time: number) {
    drawingContext.clearRect(0, 0, width, height);

    const base = drawingContext.createLinearGradient(0, 0, width, height);
    base.addColorStop(0, "#ff7a1a");
    base.addColorStop(0.48, "#ff4817");
    base.addColorStop(1, "#dc2715");
    drawingContext.fillStyle = base;
    drawingContext.fillRect(0, 0, width, height);

    drawingContext.save();
    drawingContext.globalCompositeOperation = "screen";
    for (const particle of particles) {
      const dx = particle.x - focusX;
      const dy = particle.y - focusY;
      const distance = Math.hypot(dx, dy);
      const proximity = effectActive ? Math.max(0, 1 - distance / 210) : 0;
      const shimmer = (Math.sin(time * 0.8 + particle.phase) + 1) * 0.5;
      const alpha = 0.13 + shimmer * 0.11 + proximity * 0.48;
      drawingContext.beginPath();
      drawingContext.arc(particle.x, particle.y, particle.size + proximity * 1.5, 0, Math.PI * 2);
      drawingContext.fillStyle = `rgba(255,255,238,${alpha})`;
      drawingContext.fill();

      if (proximity > 0.34) {
        drawingContext.beginPath();
        drawingContext.moveTo(particle.x, particle.y);
        drawingContext.lineTo(focusX, focusY);
        drawingContext.lineWidth = 0.55;
        drawingContext.strokeStyle = `rgba(255,246,215,${proximity * 0.16})`;
        drawingContext.stroke();
      }
    }
    drawingContext.restore();

    drawingContext.fillStyle = "rgba(87, 12, 0, 0.07)";
    for (let y = 1; y < height; y += 4) drawingContext.fillRect(0, y, width, 1);
  }

  function simulate(now: number) {
    if (!canvas.isConnected) {
      cleanup();
      return;
    }

    resize();
    const delta = Math.min(2, (now - lastTime) / 16.667);
    lastTime = now;
    focusX += (targetFocusX - focusX) * 0.12 * delta;
    focusY += (targetFocusY - focusY) * 0.12 * delta;
    updateParticles(delta, now / 1000);
    draw(now / 1000);
    animationFrame = requestAnimationFrame(simulate);
  }

  function handlePointerMove(event: PointerEvent) {
    if (mobileInteraction.matches) return;

    const rect = heroFrame.getBoundingClientRect();
    targetFocusX = event.clientX - rect.left;
    targetFocusY = event.clientY - rect.top;
    effectActive = true;
    if (reduceMotion) {
      focusX = targetFocusX;
      focusY = targetFocusY;
      updateParticles(1, performance.now() / 1000);
      draw(performance.now() / 1000);
    }
  }

  function handleInteractionModeChange() {
    resetFocus();
    if (mobileInteraction.matches) updateScrollFocus();
    else if (reduceMotion) draw(0);
  }

  const resizeObserver = new ResizeObserver(() => {
    resize();
    if (reduceMotion) draw(0);
  });
  const connectionObserver = new MutationObserver(() => {
    if (!canvas.isConnected) cleanup();
  });
  resizeObserver.observe(heroFrame);
  connectionObserver.observe(document.body, { childList: true, subtree: true });
  document.body.addEventListener("pointermove", handlePointerMove, {
    passive: true,
    signal: eventController.signal,
  });
  document.body.addEventListener("pointerleave", () => {
    if (!mobileInteraction.matches) resetFocus();
  }, { signal: eventController.signal });
  window.addEventListener("scroll", updateScrollFocus, {
    passive: true,
    signal: eventController.signal,
  });
  mobileInteraction.addEventListener("change", handleInteractionModeChange, {
    signal: eventController.signal,
  });

  resize();
  updateScrollFocus();
  if (reduceMotion) draw(0);
  else animationFrame = requestAnimationFrame(simulate);

  window.addEventListener("pagehide", cleanup, {
    once: true,
    signal: eventController.signal,
  });
}

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
  let pointerX = 0;
  let pointerY = 0;
  let targetX = 0;
  let targetY = 0;
  let pointerActive = false;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const eventController = new AbortController();

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
    targetX = pointerX = width * 0.5;
    targetY = pointerY = height * 0.72;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    drawingContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    particles = createParticles(width, height);
  }

  function updateParticles(delta: number, time: number) {
    for (const particle of particles) {
      const idleX = Math.sin(time * 0.38 + particle.phase) * 2.2;
      const idleY = Math.cos(time * 0.31 + particle.phase) * 2.2;
      let desiredX = particle.baseX + idleX;
      let desiredY = particle.baseY + idleY;

      if (pointerActive) {
        const dx = particle.baseX - pointerX;
        const dy = particle.baseY - pointerY;
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

    const glow = drawingContext.createRadialGradient(
      pointerX,
      pointerY,
      0,
      pointerX,
      pointerY,
      Math.max(220, width * 0.34),
    );
    glow.addColorStop(0, "rgba(255, 243, 203, 0.46)");
    glow.addColorStop(0.32, "rgba(255, 184, 73, 0.2)");
    glow.addColorStop(1, "rgba(255, 90, 20, 0)");
    drawingContext.fillStyle = glow;
    drawingContext.fillRect(0, 0, width, height);

    const horizon = drawingContext.createRadialGradient(
      width * 0.5,
      height * 1.1,
      0,
      width * 0.5,
      height * 1.1,
      Math.max(width * 0.5, 340),
    );
    horizon.addColorStop(0, "rgba(255, 255, 226, 0.82)");
    horizon.addColorStop(0.16, "rgba(255, 223, 132, 0.38)");
    horizon.addColorStop(0.52, "rgba(255, 106, 24, 0.08)");
    horizon.addColorStop(1, "rgba(255, 66, 12, 0)");
    drawingContext.fillStyle = horizon;
    drawingContext.fillRect(0, 0, width, height);

    drawingContext.save();
    drawingContext.globalCompositeOperation = "screen";
    for (const particle of particles) {
      const dx = particle.x - pointerX;
      const dy = particle.y - pointerY;
      const distance = Math.hypot(dx, dy);
      const proximity = pointerActive ? Math.max(0, 1 - distance / 210) : 0;
      const shimmer = (Math.sin(time * 0.8 + particle.phase) + 1) * 0.5;
      const alpha = 0.13 + shimmer * 0.11 + proximity * 0.48;
      drawingContext.beginPath();
      drawingContext.arc(particle.x, particle.y, particle.size + proximity * 1.5, 0, Math.PI * 2);
      drawingContext.fillStyle = `rgba(255,255,238,${alpha})`;
      drawingContext.fill();

      if (proximity > 0.34) {
        drawingContext.beginPath();
        drawingContext.moveTo(particle.x, particle.y);
        drawingContext.lineTo(pointerX, pointerY);
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
    pointerX += (targetX - pointerX) * 0.12 * delta;
    pointerY += (targetY - pointerY) * 0.12 * delta;
    updateParticles(delta, now / 1000);
    draw(now / 1000);
    animationFrame = requestAnimationFrame(simulate);
  }

  function handlePointerMove(event: PointerEvent) {
    const rect = heroFrame.getBoundingClientRect();
    targetX = event.clientX - rect.left;
    targetY = event.clientY - rect.top;
    pointerActive = true;
    if (reduceMotion) {
      pointerX = targetX;
      pointerY = targetY;
      updateParticles(1, performance.now() / 1000);
      draw(performance.now() / 1000);
    }
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
  heroFrame.addEventListener("pointermove", handlePointerMove, {
    passive: true,
    signal: eventController.signal,
  });
  heroFrame.addEventListener("pointerleave", () => {
    pointerActive = false;
    targetX = width * 0.5;
    targetY = height * 0.72;
  }, { signal: eventController.signal });

  resize();
  if (reduceMotion) draw(0);
  else animationFrame = requestAnimationFrame(simulate);

  window.addEventListener("pagehide", cleanup, {
    once: true,
    signal: eventController.signal,
  });
}

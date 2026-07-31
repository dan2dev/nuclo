type BlobBody = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  phase: number;
  speed: number;
  driftX: number;
  driftY: number;
  colorA: string;
  colorB: string;
};

const activeCanvases = new WeakSet<HTMLCanvasElement>();

const BLOB_COLORS = [
  ["rgba(255, 177, 55, 0.72)", "rgba(255, 93, 20, 0.34)"],
  ["rgba(255, 116, 27, 0.58)", "rgba(222, 39, 17, 0.42)"],
  ["rgba(255, 195, 74, 0.45)", "rgba(255, 70, 18, 0.30)"],
  ["rgba(210, 35, 18, 0.40)", "rgba(255, 105, 27, 0.48)"],
] as const;

function createBodies(width: number, height: number): BlobBody[] {
  const scale = Math.min(width, height);
  const positions = [
    [0.08, 0.16, 0.34],
    [0.88, 0.16, 0.31],
    [0.77, 0.82, 0.39],
    [0.22, 0.92, 0.27],
    [0.53, 0.47, 0.22],
  ] as const;

  return positions.map(([x, y, radius], index) => {
    const colors = BLOB_COLORS[index % BLOB_COLORS.length]!;
    return {
      x: x * width,
      y: y * height,
      vx: 0,
      vy: 0,
      radius: radius * scale,
      phase: index * 1.37,
      speed: 0.19 + index * 0.025,
      driftX: (0.035 + index * 0.007) * width,
      driftY: (0.045 + (index % 3) * 0.009) * height,
      colorA: colors[0],
      colorB: colors[1],
    };
  });
}

function drawOrganicBlob(
  context: CanvasRenderingContext2D,
  body: BlobBody,
  time: number,
) {
  const points = 12;
  const contour: Array<[number, number]> = [];

  for (let index = 0; index < points; index++) {
    const angle = (index / points) * Math.PI * 2;
    const ripple =
      Math.sin(angle * 3 + time * body.speed * 3.1 + body.phase) * 0.065 +
      Math.sin(angle * 5 - time * body.speed * 2.2 + body.phase * 0.7) * 0.035;
    const radius = body.radius * (1 + ripple);
    contour.push([
      body.x + Math.cos(angle) * radius,
      body.y + Math.sin(angle) * radius,
    ]);
  }

  const first = contour[0]!;
  const last = contour[contour.length - 1]!;
  context.beginPath();
  context.moveTo((last[0] + first[0]) / 2, (last[1] + first[1]) / 2);
  for (let index = 0; index < contour.length; index++) {
    const point = contour[index]!;
    const next = contour[(index + 1) % contour.length]!;
    context.quadraticCurveTo(point[0], point[1], (point[0] + next[0]) / 2, (point[1] + next[1]) / 2);
  }
  context.closePath();

  const gradient = context.createRadialGradient(
    body.x - body.radius * 0.35,
    body.y - body.radius * 0.4,
    body.radius * 0.08,
    body.x,
    body.y,
    body.radius * 1.15,
  );
  gradient.addColorStop(0, body.colorA);
  gradient.addColorStop(1, body.colorB);
  context.fillStyle = gradient;
  context.fill();
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
  let bodies: BlobBody[] = [];
  let animationFrame = 0;
  let lastTime = performance.now();
  let pointerX = 0;
  let pointerY = 0;
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
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    drawingContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    bodies = createBodies(width, height);
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
    drawingContext.globalCompositeOperation = "soft-light";
    for (const body of bodies) drawOrganicBlob(drawingContext, body, time);
    drawingContext.restore();

    const shade = drawingContext.createLinearGradient(0, 0, width, 0);
    shade.addColorStop(0, "rgba(121, 19, 3, 0.18)");
    shade.addColorStop(0.46, "rgba(121, 19, 3, 0.04)");
    shade.addColorStop(1, "rgba(75, 9, 0, 0.12)");
    drawingContext.fillStyle = shade;
    drawingContext.fillRect(0, 0, width, height);
  }

  function simulate(now: number) {
    if (!canvas.isConnected) {
      cleanup();
      return;
    }

    resize();
    const delta = Math.min(2, (now - lastTime) / 16.667);
    lastTime = now;
    const time = now / 1000;

    for (let leftIndex = 0; leftIndex < bodies.length; leftIndex++) {
      const left = bodies[leftIndex]!;
      for (let rightIndex = leftIndex + 1; rightIndex < bodies.length; rightIndex++) {
        const right = bodies[rightIndex]!;
        const dx = right.x - left.x;
        const dy = right.y - left.y;
        const distance = Math.max(1, Math.hypot(dx, dy));
        const softBoundary = (left.radius + right.radius) * 0.46;
        if (distance >= softBoundary) continue;

        const collisionForce = (1 - distance / softBoundary) * 0.075 * delta;
        const normalX = dx / distance;
        const normalY = dy / distance;
        left.vx -= normalX * collisionForce;
        left.vy -= normalY * collisionForce;
        right.vx += normalX * collisionForce;
        right.vy += normalY * collisionForce;
      }
    }

    for (let index = 0; index < bodies.length; index++) {
      const body = bodies[index]!;
      const anchorX = width * ([0.08, 0.88, 0.77, 0.22, 0.53][index] ?? 0.5);
      const anchorY = height * ([0.16, 0.16, 0.82, 0.92, 0.47][index] ?? 0.5);
      const targetX = anchorX + Math.sin(time * body.speed + body.phase) * body.driftX;
      const targetY = anchorY + Math.cos(time * body.speed * 0.83 + body.phase) * body.driftY;

      body.vx += (targetX - body.x) * 0.0018 * delta;
      body.vy += (targetY - body.y) * 0.0018 * delta;

      if (pointerActive) {
        const dx = body.x - pointerX;
        const dy = body.y - pointerY;
        const distance = Math.max(40, Math.hypot(dx, dy));
        const reach = body.radius * 1.35 + 180;
        if (distance < reach) {
          const force = (1 - distance / reach) * 0.34 * delta;
          body.vx += (dx / distance) * force;
          body.vy += (dy / distance) * force;
        }
      }

      body.vx *= Math.pow(0.965, delta);
      body.vy *= Math.pow(0.965, delta);
      body.x += body.vx * delta;
      body.y += body.vy * delta;

      const margin = body.radius * 0.62;
      if (body.x < -margin || body.x > width + margin) body.vx *= -0.72;
      if (body.y < -margin || body.y > height + margin) body.vy *= -0.72;
      body.x = Math.max(-margin - 1, Math.min(width + margin + 1, body.x));
      body.y = Math.max(-margin - 1, Math.min(height + margin + 1, body.y));
    }

    draw(time);
    animationFrame = requestAnimationFrame(simulate);
  }

  function handlePointerMove(event: PointerEvent) {
    const rect = heroFrame.getBoundingClientRect();
    pointerX = event.clientX - rect.left;
    pointerY = event.clientY - rect.top;
    pointerActive = true;
    if (reduceMotion) draw(performance.now() / 1000);
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
  heroFrame.addEventListener("pointerleave", () => { pointerActive = false; }, {
    signal: eventController.signal,
  });

  resize();
  if (reduceMotion) {
    draw(0);
  } else {
    animationFrame = requestAnimationFrame(simulate);
  }

  window.addEventListener("pagehide", cleanup, {
    once: true,
    signal: eventController.signal,
  });
}

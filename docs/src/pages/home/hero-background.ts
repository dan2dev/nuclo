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

type WakePoint = {
  x: number;
  y: number;
  life: number;
};

type PressureWave = {
  x: number;
  y: number;
  radius: number;
  life: number;
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
  const velocityAngle = Math.atan2(body.vy, body.vx);
  const stretch = Math.min(0.13, Math.hypot(body.vx, body.vy) * 0.018);

  for (let index = 0; index < points; index++) {
    const angle = (index / points) * Math.PI * 2;
    const ripple =
      Math.sin(angle * 3 + time * body.speed * 3.1 + body.phase) * 0.065 +
      Math.sin(angle * 5 - time * body.speed * 2.2 + body.phase * 0.7) * 0.035;
    const directionalStretch = Math.cos((angle - velocityAngle) * 2) * stretch;
    const radius = body.radius * (1 + ripple + directionalStretch);
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

function drawConnections(
  context: CanvasRenderingContext2D,
  bodies: BlobBody[],
  width: number,
  time: number,
) {
  context.save();
  context.globalCompositeOperation = "soft-light";

  for (let leftIndex = 0; leftIndex < bodies.length; leftIndex++) {
    const left = bodies[leftIndex]!;
    for (let rightIndex = leftIndex + 1; rightIndex < bodies.length; rightIndex++) {
      const right = bodies[rightIndex]!;
      const dx = right.x - left.x;
      const dy = right.y - left.y;
      const distance = Math.hypot(dx, dy);
      const reach = Math.min(width * 0.68, (left.radius + right.radius) * 1.12);
      if (distance >= reach) continue;

      const strength = 1 - distance / reach;
      const midpointX = (left.x + right.x) / 2;
      const midpointY = (left.y + right.y) / 2;
      const bend = Math.sin(time * 0.7 + left.phase - right.phase) * 34 * strength;
      const normalX = distance > 0 ? -dy / distance : 0;
      const normalY = distance > 0 ? dx / distance : 0;
      const gradient = context.createLinearGradient(left.x, left.y, right.x, right.y);
      gradient.addColorStop(0, `rgba(255, 230, 148, ${0.04 + strength * 0.13})`);
      gradient.addColorStop(0.5, `rgba(255, 136, 55, ${0.08 + strength * 0.18})`);
      gradient.addColorStop(1, `rgba(174, 22, 11, ${0.04 + strength * 0.12})`);

      context.beginPath();
      context.moveTo(left.x, left.y);
      context.quadraticCurveTo(
        midpointX + normalX * bend,
        midpointY + normalY * bend,
        right.x,
        right.y,
      );
      context.lineWidth = 2 + strength * 12;
      context.lineCap = "round";
      context.strokeStyle = gradient;
      context.stroke();
    }
  }

  context.restore();
}

function drawPointerWake(
  context: CanvasRenderingContext2D,
  wake: WakePoint[],
  waves: PressureWave[],
) {
  context.save();
  context.globalCompositeOperation = "screen";

  for (let index = 1; index < wake.length; index++) {
    const previous = wake[index - 1]!;
    const point = wake[index]!;
    const alpha = Math.min(previous.life, point.life) * 0.13;
    context.beginPath();
    context.moveTo(previous.x, previous.y);
    context.lineTo(point.x, point.y);
    context.lineWidth = 5 + point.life * 18;
    context.lineCap = "round";
    context.strokeStyle = `rgba(255, 224, 164, ${alpha})`;
    context.stroke();
  }

  for (const wave of waves) {
    context.beginPath();
    context.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
    context.lineWidth = 2 + wave.life * 4;
    context.strokeStyle = `rgba(255, 235, 184, ${wave.life * 0.2})`;
    context.stroke();
  }

  context.restore();
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
  let pointerVelocityX = 0;
  let pointerVelocityY = 0;
  let pointerActive = false;
  let pointerPressed = false;
  let lastPointerTime = performance.now();
  const pointerWake: WakePoint[] = [];
  const pressureWaves: PressureWave[] = [];
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

    drawConnections(drawingContext, bodies, width, time);

    drawingContext.save();
    drawingContext.globalCompositeOperation = "soft-light";
    for (const body of bodies) drawOrganicBlob(drawingContext, body, time);
    drawingContext.restore();

    drawPointerWake(drawingContext, pointerWake, pressureWaves);

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

    for (let index = pointerWake.length - 1; index >= 0; index--) {
      const point = pointerWake[index]!;
      point.life -= 0.028 * delta;
      if (point.life <= 0) pointerWake.splice(index, 1);
    }
    for (let index = pressureWaves.length - 1; index >= 0; index--) {
      const wave = pressureWaves[index]!;
      wave.radius += (3.8 + wave.radius * 0.012) * delta;
      wave.life -= 0.022 * delta;
      if (wave.life <= 0) pressureWaves.splice(index, 1);
    }
    pointerVelocityX *= Math.pow(0.88, delta);
    pointerVelocityY *= Math.pow(0.88, delta);

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
          const influence = 1 - distance / reach;
          const force = influence * (pointerPressed ? -0.24 : 0.34) * delta;
          body.vx += (dx / distance) * force + pointerVelocityX * influence * 0.018;
          body.vy += (dy / distance) * force + pointerVelocityY * influence * 0.018;
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
    const nextX = event.clientX - rect.left;
    const nextY = event.clientY - rect.top;
    const now = performance.now();
    const elapsed = Math.max(8, now - lastPointerTime);
    pointerVelocityX = Math.max(-42, Math.min(42, (nextX - pointerX) * (16.667 / elapsed)));
    pointerVelocityY = Math.max(-42, Math.min(42, (nextY - pointerY) * (16.667 / elapsed)));
    pointerX = nextX;
    pointerY = nextY;
    lastPointerTime = now;
    pointerActive = true;
    const lastWakePoint = pointerWake[pointerWake.length - 1];
    if (!lastWakePoint || Math.hypot(pointerX - lastWakePoint.x, pointerY - lastWakePoint.y) > 8) {
      pointerWake.push({ x: pointerX, y: pointerY, life: 1 });
      if (pointerWake.length > 24) pointerWake.shift();
    }
    if (reduceMotion) draw(performance.now() / 1000);
  }

  function handlePointerDown(event: PointerEvent) {
    handlePointerMove(event);
    pointerPressed = true;
    pressureWaves.push({ x: pointerX, y: pointerY, radius: 12, life: 1 });
  }

  function handlePointerUp() {
    if (!pointerPressed) return;
    pointerPressed = false;
    pressureWaves.push({ x: pointerX, y: pointerY, radius: 28, life: 0.75 });
    for (const body of bodies) {
      const dx = body.x - pointerX;
      const dy = body.y - pointerY;
      const distance = Math.max(60, Math.hypot(dx, dy));
      const impulse = Math.max(0, 1 - distance / (body.radius + 260)) * 1.8;
      body.vx += (dx / distance) * impulse;
      body.vy += (dy / distance) * impulse;
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
  heroFrame.addEventListener("pointerleave", () => { pointerActive = false; }, {
    signal: eventController.signal,
  });
  heroFrame.addEventListener("pointerdown", handlePointerDown, {
    passive: true,
    signal: eventController.signal,
  });
  heroFrame.addEventListener("pointerup", handlePointerUp, {
    passive: true,
    signal: eventController.signal,
  });
  heroFrame.addEventListener("pointercancel", handlePointerUp, {
    passive: true,
    signal: eventController.signal,
  });
  window.addEventListener("pointerup", handlePointerUp, {
    passive: true,
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

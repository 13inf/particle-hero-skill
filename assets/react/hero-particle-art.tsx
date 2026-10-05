"use client";

import { useEffect, useRef, useState } from "react";

export type ParticleComposition = "corner" | "weave" | "diagonal";
type Particle = { x: number; y: number; rx: number; ry: number; radius: number; alpha: number; heat: number };
type Sample = { x: number; y: number; dark: number };

const hash = (x: number, y: number) => {
  let n = Math.imul(x + 13, 374761393) + Math.imul(y + 19, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
};

export default function HeroParticleArt({ composition }: { composition: ParticleComposition }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = canvas?.closest("section");
    const ctx = canvas?.getContext("2d");
    if (!canvas || !section || !ctx) { setFailed(true); return; }
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const coarse = matchMedia("(hover: none), (pointer: coarse)");
    const mobile = matchMedia("(max-width: 767px)");
    let points: Particle[] = [];
    let samples: Sample[] = [];
    let width = 0, height = 0, frame = 0, last = 0, resizeTimer = 0, scanClock = 0;
    let visible = false, disposed = false, loaded = false;
    let mx = NaN, my = NaN;
    const response = 1;
    let safeX = 0, safeY = 0, safeRX = 1, safeRY = 1;
    let color = "#9bb8fe";
    const isAutomatic = () => !reduced.matches && (coarse.matches || mobile.matches);
    const isStatic = () => reduced.matches;
    const stop = () => {
      cancelAnimationFrame(frame); frame = 0; last = 0;
      canvas.dataset.animating = "false";
    };
    const wake = () => {
      if (!disposed && loaded && visible && !document.hidden && !frame && width > 0) {
        last = 0; frame = requestAnimationFrame(render);
      }
    };
    const fadeAt = (x: number, y: number) => {
      const distance = Math.hypot((x - safeX) / safeRX, (y - safeY) / safeRY);
      const t = Math.max(0, Math.min(1, (distance - .76) / .48));
      return t * t * (3 - 2 * t);
    };
    const addPoint = (x: number, y: number, radius: number, alpha: number) => {
      if (x < -50 || x > width + 50 || y < -50 || y > height + 50) return;
      if (fadeAt(x, y) < .015) return;
      points.push({ x, y, rx: x, ry: y, radius, alpha, heat: 0 });
    };
    const bag = (cx: number, cy: number, size: number, angle: number, opacity: number) => {
      const cos = Math.cos(angle), sin = Math.sin(angle);
      for (const s of samples) {
        const x = s.x * size, y = s.y * size;
        addPoint(cx + x * cos - y * sin, cy + x * sin + y * cos, .7 + s.dark * .82, (.32 + s.dark * .65) * opacity);
      }
    };
    const ribbon = (cx: number, cy: number, length: number, depth: number, angle: number, opacity: number, phase: number) => {
      const cos = Math.cos(angle), sin = Math.sin(angle), gap = mobile.matches ? 7 : 5;
      for (let u = -length / 2; u <= length / 2; u += gap) {
        for (let v = -depth / 2; v <= depth / 2; v += gap) {
          const noise = hash(Math.round(u + length), Math.round(v + depth));
          if (noise < .13) continue;
          const bend = Math.sin(u / 110 + phase) * depth * .17;
          const wave = Math.sin(u / 180 + v / 100 + phase);
          const x = u + Math.sin(v / 36 + phase) * 9, y = v * (.83 + .17 * wave) + bend;
          const edge = Math.pow(Math.max(0, 1 - Math.abs(v) / (depth / 2)), .28);
          const weave = .4 + .6 * Math.abs(Math.sin(u / 47 + v / 70 + phase));
          addPoint(cx + x * cos - y * sin, cy + x * sin + y * cos, .62 + noise * .66, opacity * edge * weave);
        }
      }
    };
    function build() {
      if (!loaded || disposed) return;
      const rect = section!.getBoundingClientRect();
      if (!rect.width || !rect.height) { stop(); return; }
      stop(); width = rect.width; height = rect.height;
      const dpr = Math.min(devicePixelRatio || 1, isAutomatic() ? 1.5 : 1.75);
      canvas!.width = Math.round(width * dpr); canvas!.height = Math.round(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      color = getComputedStyle(section!).getPropertyValue("--color-accent-light").trim() || "#9bb8fe";
      const content = section!.querySelector(".text-center")?.getBoundingClientRect();
      safeX = width / 2;
      safeY = content ? content.top - rect.top + content.height / 2 : height * .52;
      safeRX = Math.min(width * (mobile.matches ? .42 : .30), 450);
      safeRY = content ? content.height * .56 + 18 : height * .32;
      points = [];
      if (composition === "corner") {
        bag(width * .90, height * .78, Math.min(height * .95, width * .52), -.20, .88);
        ribbon(width * .11, height * .23, width * .47, height * .20, .38, .52, .6);
      } else if (composition === "weave") {
        ribbon(width * .09, height * .28, width * .72, height * .25, .46, .72, .2);
        ribbon(width * .92, height * .78, width * .76, height * .28, -.47, .84, 1.6);
      } else {
        bag(width * .55, height * .54, Math.min(height * 1.6, width * (mobile.matches ? 1.5 : 1.14)), -.94, .79);
      }
      const limit = isAutomatic() ? 4400 : 10500;
      if (points.length > limit) {
        const original = points, stride = original.length / limit;
        points = Array.from({ length: limit }, (_, i) => original[Math.floor(i * stride)]);
      }
      canvas!.dataset.particles = String(points.length);
      canvas!.dataset.mode = isStatic() ? "static" : isAutomatic() ? "auto-scan" : "interactive";
      wake();
    }
    function render(time: number) {
      frame = 0;
      if (disposed || !visible || document.hidden) return;
      const automatic = isAutomatic();
      // Touch devices only need 30fps; the scan clock pauses with the canvas.
      if (automatic && last && time - last < 1000 / 30 - 1) {
        frame = requestAnimationFrame(render);
        return;
      }
      const dt = last ? Math.min((time - last) / 1000, .05) : 1 / 60;
      last = time;
      if (automatic) scanClock = (scanClock + dt) % 8;
      const ease = 1 - Math.exp(-7 * dt), fixed = isStatic();
      const radius = Math.min(150, width * .16);
      // A diagonal sweep travels over the bag, then rests before repeating.
      const scanPhase = scanClock / 5.8;
      const scanPosition = -100 + scanPhase * (height + width * .22 + 200);
      const scanBand = Math.max(44, Math.min(70, width * .14));
      let movement = 0;
      ctx!.clearRect(0, 0, width, height); ctx!.fillStyle = color;
      for (const p of points) {
        let tx = p.rx, ty = p.ry, heat = 0;
        if (automatic && scanPhase < 1) {
          const distance = Math.abs(p.ry + p.rx * .22 - scanPosition);
          if (distance < scanBand * 2) {
            heat = Math.exp(-Math.pow(distance / scanBand, 2) * 2);
            const angle = hash(p.rx | 0, p.ry | 0) * Math.PI * 2;
            const force = heat * 16;
            tx += Math.cos(angle) * force;
            ty += Math.sin(angle) * force;
          }
        } else if (!fixed && !automatic && Number.isFinite(mx)) {
          const dx = p.rx - mx, dy = p.ry - my, d = Math.hypot(dx, dy);
          if (d < radius) {
            heat = 1 - d / radius;
            const angle = d > .01 ? Math.atan2(dy, dx) : hash(p.rx | 0, p.ry | 0) * Math.PI * 2;
            const force = (radius - d) * response;
            tx += Math.cos(angle) * force; ty += Math.sin(angle) * force;
          }
        }
        if (fixed) { p.x = p.rx; p.y = p.ry; p.heat = 0; }
        else {
          p.x += (tx - p.x) * ease; p.y += (ty - p.y) * ease; p.heat += (heat - p.heat) * ease;
          movement += Math.abs(tx - p.x) + Math.abs(ty - p.y) + Math.abs(heat - p.heat);
        }
        ctx!.globalAlpha = Math.min(1, p.alpha + (1 - p.alpha) * p.heat) * fadeAt(p.x, p.y);
        ctx!.beginPath(); ctx!.arc(p.x, p.y, p.radius * (1 + p.heat), 0, Math.PI * 2); ctx!.fill();
      }
      ctx!.globalAlpha = 1;
      if (automatic || (!fixed && movement > .15)) frame = requestAnimationFrame(render);
      else last = 0;
      canvas!.dataset.animating = String(!!frame);
    }
    const pointerMove = (e: PointerEvent) => {
      if (isStatic() || isAutomatic()) return;
      const rect = section.getBoundingClientRect(); mx = e.clientX - rect.left; my = e.clientY - rect.top;
      wake();
    };
    const leave = () => { mx = NaN; my = NaN; wake(); };
    const onVisibility = () => { if (document.hidden) stop(); else wake(); };
    const preferenceChange = () => { leave(); build(); };
    const resize = new ResizeObserver(() => { clearTimeout(resizeTimer); resizeTimer = window.setTimeout(build, 100); });
    resize.observe(section);
    const intersect = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) wake(); else stop(); });
    intersect.observe(section);
    section.addEventListener("pointermove", pointerMove);
    section.addEventListener("pointerleave", leave);
    section.addEventListener("pointercancel", leave);
    window.addEventListener("blur", leave);
    document.addEventListener("visibilitychange", onVisibility);
    for (const query of [reduced, coarse, mobile]) query.addEventListener("change", preferenceChange);
    const image = new Image();
    image.onload = () => {
      if (disposed) return;
      try {
        const off = document.createElement("canvas"); off.width = 640; off.height = Math.round(640 * image.height / image.width);
        const oc = off.getContext("2d", { willReadFrequently: true });
        if (!oc) throw new Error("Canvas unavailable");
        oc.drawImage(image, 0, 0, off.width, off.height);
        const data = oc.getImageData(0, 0, off.width, off.height).data;
        let left = off.width, top = off.height, right = 0, bottom = 0;
        for (let y = 0; y < off.height; y += 2) for (let x = 0; x < off.width; x += 2) {
          if (data[(y * off.width + x) * 4] < 150) { left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y); }
        }
        if (bottom <= top) throw new Error("Empty artwork");
        const h = bottom - top, cx = (left + right) / 2, cy = (top + bottom) / 2;
        for (let y = top; y < bottom; y += 2.8) for (let x = left; x < right; x += 2.8) {
          const ix = Math.floor(x), iy = Math.floor(y), dark = 1 - data[(iy * off.width + ix) * 4] / 255;
          if (dark > .18 && hash(ix, iy) < .25 + dark * .95) samples.push({ x: (x - cx) / h, y: (y - cy) / h, dark });
        }
        loaded = true; build();
      } catch { setFailed(true); }
    };
    image.onerror = () => { if (!disposed) setFailed(true); };
    image.src = "/images/hero/particle-bag.webp";
    return () => {
      disposed = true; stop(); clearTimeout(resizeTimer); resize.disconnect(); intersect.disconnect();
      section.removeEventListener("pointermove", pointerMove); section.removeEventListener("pointerleave", leave); section.removeEventListener("pointercancel", leave);
      window.removeEventListener("blur", leave); document.removeEventListener("visibilitychange", onVisibility);
      for (const query of [reduced, coarse, mobile]) query.removeEventListener("change", preferenceChange);
      image.onload = null; image.onerror = null;
    };
  }, [composition]);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden" data-particle-composition={composition}>
      <canvas ref={canvasRef} className="hero-particle-canvas absolute inset-0 h-full w-full" />
      {failed && <img src="/images/hero/particle-bag.webp" alt="" className="absolute -right-8 bottom-0 h-3/4 max-w-[40%] object-contain opacity-25 invert mix-blend-screen" />}
    </div>
  );
}

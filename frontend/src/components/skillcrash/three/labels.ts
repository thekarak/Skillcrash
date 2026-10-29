import * as THREE from "three";

/**
 * Canvas-texture helpers for the SkillCrash Three.js scenes.
 * All text is rendered locally to canvas — no remote font or image assets.
 */

let cachedMonoFamily: string | null = null;

function monoFamily(): string {
  if (cachedMonoFamily) return cachedMonoFamily;
  try {
    const el = document.createElement("div");
    el.className = "font-mono";
    el.style.cssText = "position:absolute;visibility:hidden;";
    document.body.appendChild(el);
    cachedMonoFamily = getComputedStyle(el).fontFamily || "ui-monospace, monospace";
    el.remove();
  } catch {
    cachedMonoFamily = "ui-monospace, Menlo, monospace";
  }
  return cachedMonoFamily;
}

export function monoFont(px: number, weight = 500): string {
  return `${weight} ${px}px ${monoFamily()}`;
}

const SS = 2; // supersample factor for crisp text

export interface LabelOptions {
  color?: string;
  sub?: string;
  subColor?: string;
  letterSpacing?: number;
  px?: number;
  /** world-units of width per 100 canvas pixels of label (default 1.2) */
  worldPer100?: number;
  /** sub-line font size as a ratio of px (default 0.6) */
  subRatio?: number;
}

/** Single (or two-line) monospace label as a THREE.Sprite. */
export function makeLabelSprite(text: string, opts: LabelOptions = {}): THREE.Sprite {
  const px = opts.px ?? 30;
  const color = opts.color ?? "#d6cfc2";
  const subColor = opts.subColor ?? "#98917f";
  const subRatio = opts.subRatio ?? 0.6;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  ctx.font = monoFont(px, 600);
  const mainW = ctx.measureText(text).width;
  let subW = 0;
  if (opts.sub) {
    ctx.font = monoFont(px * subRatio, 400);
    subW = ctx.measureText(opts.sub).width;
  }
  const w = Math.ceil(Math.max(mainW, subW)) + 26;
  const h = Math.ceil(px * (opts.sub ? 2.5 : 1.6));
  canvas.width = w * SS;
  canvas.height = h * SS;
  const c = canvas.getContext("2d")!;
  c.scale(SS, SS);
  c.textAlign = "center";
  c.textBaseline = "middle";
  // soft dark halo keeps type legible over geometry and grid lines
  c.shadowColor = "rgba(12, 10, 8, 0.85)";
  c.shadowBlur = 6;
  c.font = monoFont(px, 600);
  c.fillStyle = color;
  c.fillText(text, w / 2, opts.sub ? h * 0.36 : h * 0.5);
  if (opts.sub) {
    c.font = monoFont(px * subRatio, 400);
    c.fillStyle = subColor;
    c.fillText(opts.sub, w / 2, h * 0.74);
  }
  return finishSprite(canvas, w, h, opts.worldPer100 ?? 1.2);
}

export interface BadgeOptions {
  color?: string;
  bg?: string;
  sub?: string;
  worldPer100?: number;
}

/** Framed status badge (e.g. FAIL / BLOCKED) as a THREE.Sprite. */
export function makeBadgeSprite(text: string, opts: BadgeOptions = {}): THREE.Sprite {
  const color = opts.color ?? "#e0231c";
  const bg = opts.bg ?? "rgba(23, 22, 19, 0.94)";
  const px = 38;
  const canvas = document.createElement("canvas");
  let ctx = canvas.getContext("2d")!;
  ctx.font = monoFont(px, 700);
  const mainW = ctx.measureText(text).width;
  let subW = 0;
  if (opts.sub) {
    ctx.font = monoFont(px * 0.55, 500);
    subW = ctx.measureText(opts.sub).width;
  }
  const padX = 24;
  const w = Math.ceil(Math.max(mainW, subW)) + padX * 2;
  const h = Math.ceil(px * (opts.sub ? 2.1 : 1.55));
  canvas.width = w * SS;
  canvas.height = h * SS;
  ctx = canvas.getContext("2d")!;
  ctx.scale(SS, SS);
  const r = 8;
  ctx.beginPath();
  ctx.roundRect(1, 1, w - 2, h - 2, r);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = color;
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = monoFont(px, 700);
  ctx.fillStyle = color;
  ctx.fillText(text, w / 2, opts.sub ? h * 0.36 : h * 0.5);
  if (opts.sub) {
    ctx.font = monoFont(px * 0.55, 500);
    ctx.fillStyle = "#b5aea1";
    ctx.fillText(opts.sub, w / 2, h * 0.75);
  }
  return finishSprite(canvas, w, h, opts.worldPer100 ?? 1.3);
}

/** SKILL.md document face — title bar + rule lines; redraw via redrawDoc. */
export interface DocFace {
  texture: THREE.CanvasTexture;
  canvas: HTMLCanvasElement;
}

export function makeDocTexture(title: string, lineCount: number, lit = 0): DocFace {
  const w = 300;
  const lineH = 22;
  const h = 60 + lineCount * lineH + 24;
  const canvas = document.createElement("canvas");
  canvas.width = w * SS;
  canvas.height = h * SS;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(SS, SS);
  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  const doc: DocFace = { texture, canvas };
  redrawDoc(doc, title, lineCount, lit);
  return doc;
}

/** Redraw a doc texture with `lit` lines illuminated. */
export function redrawDoc(doc: DocFace, title: string, lineCount: number, lit: number) {
  const w = 300;
  const lineH = 22;
  const h = 60 + lineCount * lineH + 24;
  const ctx = doc.canvas.getContext("2d")!;
  ctx.setTransform(SS, 0, 0, SS, 0, 0);
  ctx.clearRect(0, 0, w, h);
  // parchment paper
  ctx.fillStyle = "#eee8dc";
  ctx.strokeStyle = "#b9ae97";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(0.5, 0.5, w - 1, h - 1, 4);
  ctx.fill();
  ctx.stroke();
  // vermilion masthead with bone title
  ctx.fillStyle = "#e0231c";
  ctx.beginPath();
  ctx.roundRect(10, 10, w - 20, 36, 3);
  ctx.fill();
  ctx.font = monoFont(17, 700);
  ctx.fillStyle = "#fbf6ec";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(title, 24, 29);
  // instruction lines — ink when parsed, faint pencil when not
  for (let i = 0; i < lineCount; i++) {
    const y = 66 + i * lineH;
    const isLit = i < lit;
    ctx.fillStyle = isLit ? "rgba(23, 22, 19, 0.72)" : "rgba(23, 22, 19, 0.14)";
    ctx.fillRect(24, y, (i % 3 === 2 ? 150 : 232) + (i % 2) * 20, 8);
  }
  doc.texture.needsUpdate = true;
}

/** Hex-pattern shield face for the sandbox gate. */
export function makeShieldTexture(): THREE.CanvasTexture {
  const s = 256;
  const canvas = document.createElement("canvas");
  canvas.width = s;
  canvas.height = s;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, s, s);
  ctx.strokeStyle = "rgba(165, 111, 80, 0.6)";
  ctx.lineWidth = 2;
  const r = 26;
  const hexH = Math.sqrt(3) * r;
  for (let row = -1; row * hexH < s + hexH; row++) {
    for (let col = -1; col * (r * 1.5) < s + r * 2; col++) {
      const cx = col * r * 1.5;
      const cy = row * hexH + (col % 2 !== 0 ? hexH / 2 : 0);
      drawHex(ctx, cx, cy, r - 3);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function drawHex(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
}

/** Soft radial glow sprite texture (additive packets / node halos). */
export function makeGlowTexture(): THREE.CanvasTexture {
  const s = 128;
  const canvas = document.createElement("canvas");
  canvas.width = s;
  canvas.height = s;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, "rgba(255, 255, 255, 0.9)");
  g.addColorStop(0.35, "rgba(255, 255, 255, 0.28)");
  g.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  return new THREE.CanvasTexture(canvas);
}

function finishSprite(canvas: HTMLCanvasElement, w: number, h: number, worldPer100: number): THREE.Sprite {
  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  const scale = worldPer100 / 100;
  sprite.scale.set((w * scale), (h * scale), 1);
  return sprite;
}

/** Track disposables for a scene. */
export class DisposalBag {
  private items: Array<{ dispose(): void }> = [];
  add<T extends { dispose(): void }>(item: T): T {
    this.items.push(item);
    return item;
  }
  dispose() {
    for (const item of this.items) {
      try {
        item.dispose();
      } catch {
        /* already disposed */
      }
    }
    this.items = [];
  }
}

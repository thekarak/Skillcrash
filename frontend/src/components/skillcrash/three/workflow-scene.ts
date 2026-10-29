import * as THREE from "three";
import type { SceneController } from "./use-scene";
import {
  DisposalBag,
  makeBadgeSprite,
  makeDocTexture,
  makeGlowTexture,
  makeLabelSprite,
  makeShieldTexture,
  redrawDoc,
  type DocFace,
} from "./labels";

/**
 * WorkflowScene — scroll-driven fly-along of the SkillCrash pipeline.
 *
 * One persistent scene: SKILL.md -> ATTACK -> AGENT + SANDBOX -> JUDGE ->
 * REPLAY rail. The React section feeds scroll progress (0..1); the camera
 * dollies between five keyframes and each cluster plays a stage-specific
 * micro-animation that explains that step of the workflow.
 */

const C = {
  bone: 0xeee8dc,
  accent: 0xa56f50, // copper — system machinery
  red: 0xe0231c,    // vermilion — attacks & failures
  grey: 0x8c867d,
  slate: 0x514a40,
  deep: 0x171613,
};

const X = {
  skill: -6.2,
  attack: -3.1,
  agent: 0.2,
  sandbox: 2.6,
  judge: 5.6,
};

interface Keyframe {
  pos: THREE.Vector3;
  target: THREE.Vector3;
}

const KEYS: Keyframe[] = [
  { pos: new THREE.Vector3(X.skill + 0.3, 0.9, 5.2), target: new THREE.Vector3(X.skill, 0.2, 0) },
  { pos: new THREE.Vector3(X.attack + 0.5, 0.4, 5.8), target: new THREE.Vector3(X.attack, -0.2, 0) },
  { pos: new THREE.Vector3(1.4, 0.6, 6.0), target: new THREE.Vector3(1.3, -0.1, 0) },
  { pos: new THREE.Vector3(X.judge + 0.4, 0.8, 5.6), target: new THREE.Vector3(X.judge, 0.1, 0) },
  { pos: new THREE.Vector3(0, 1.6, 14.6), target: new THREE.Vector3(0, 0, 0) },
];

/**
 * Viewport-aware keyframes: the overlay stage card occupies the left quarter
 * on landscape screens (or the bottom on portrait), so each aspect gets its
 * own framing — stage labels never hide behind the card or clip at edges.
 */
function keyAt(i: number, aspect: number): Keyframe {
  const k = KEYS[Math.min(4, Math.max(0, i))];
  if (aspect >= 2.2) {
    // ultra-wide: pull back far enough that every label clears the overlay card
    if (i === 4) {
      return { pos: new THREE.Vector3(-2.0, 1.6, 13.0), target: new THREE.Vector3(-2.0, 0, 0) };
    }
    return k;
  }
  if (aspect >= 0.95) {
    // landscape: frame each subject right of the full-bleed overlay card
    if (i === 1) {
      return { pos: new THREE.Vector3(-3.9, 0.4, 5.9), target: new THREE.Vector3(-4.3, -0.2, 0) };
    }
    if (i === 2) {
      return { pos: new THREE.Vector3(0.2, 0.6, 6.0), target: new THREE.Vector3(0.1, -0.1, 0) };
    }
    if (i === 3) {
      return { pos: new THREE.Vector3(4.6, 0.8, 5.6), target: new THREE.Vector3(4.4, 0.1, 0) };
    }
    if (i === 4) {
      return { pos: new THREE.Vector3(-4.0, 1.7, 19.0), target: new THREE.Vector3(-4.0, 0, 0) };
    }
    return k;
  }
  // portrait: the card sits at the bottom — bias every view upward
  if (i === 4) {
    return { pos: new THREE.Vector3(0, -1.5, 16.5), target: new THREE.Vector3(0, -3.4, 0) };
  }
  return {
    pos: new THREE.Vector3(k.pos.x, k.pos.y - 0.5, k.pos.z + 0.8),
    target: new THREE.Vector3(k.target.x, k.target.y - 1.15, k.target.z),
  };
}

export interface WorkflowSceneOptions {
  reducedMotion: boolean;
}

export class WorkflowScene implements SceneController {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(42, 1, 0.1, 60);
  private bag = new DisposalBag();

  private docFace!: DocFace;
  private shards: THREE.Mesh[] = [];
  private shardLabels: THREE.Sprite[] = [];
  private packet!: THREE.Group;
  private redPacket!: THREE.Group;
  private agentSandboxCurve!: THREE.CatmullRomCurve3;
  private shieldMat!: THREE.MeshBasicMaterial;
  private rulesPanel!: THREE.Group;
  private failBadge!: THREE.Sprite;
  private blockedBadge!: THREE.Sprite;
  private replayRail!: THREE.Group;
  private replayTicks: THREE.Mesh[] = [];
  private replayLabel!: THREE.Sprite;
  private agentWire!: THREE.LineSegments;
  private judgeRim!: THREE.Mesh;

  private raf = 0;
  private visible = true;
  private disposed = false;
  private lastFrame = 0;
  private time = 0;
  private progress = 0;
  private reducedMotion: boolean;
  private attackWire!: THREE.LineSegments;

  /** Right edge of the overlay stage card, in canvas pixels. */
  private overlayRightPx = 480;
  private viewWpx = 1280;
  private cullLabels: {
    sprite: THREE.Sprite;
    x: () => number;
    y: () => number;
  }[] = [];

  constructor(canvas: HTMLCanvasElement, opts: WorkflowSceneOptions) {
    this.reducedMotion = opts.reducedMotion;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.scene.fog = new THREE.Fog(C.deep, 14, 34);

    this.build();

    if (this.reducedMotion) {
      this.setProgress(0);
      this.renderOnce();
    } else {
      this.lastFrame = performance.now();
      this.raf = requestAnimationFrame(this.tick);
    }
  }

  /* ------------------------------- build ------------------------------- */

  private build() {
    this.scene.add(new THREE.AmbientLight(0xcbbfae, 1.3));
    const dir = new THREE.DirectionalLight(0xfff2e0, 1.75);
    dir.position.set(4, 7, 6);
    this.scene.add(dir);
    const fill = new THREE.DirectionalLight(0xd8c7b2, 0.45);
    fill.position.set(-5, 3, 4);
    this.scene.add(fill);

    // --- SKILL.md doc ---
    this.docFace = makeDocTexture("SKILL.md", 7, 0);
    const docMesh = new THREE.Mesh(
      this.bag.add(new THREE.PlaneGeometry(2.3, 2.3 * (this.docFace.canvas.height / this.docFace.canvas.width))),
      this.bag.add(new THREE.MeshBasicMaterial({ map: this.docFace.texture, transparent: true, side: THREE.DoubleSide }))
    );
    docMesh.position.set(X.skill, 0.55, 0);
    docMesh.rotation.y = 0.28;
    this.scene.add(docMesh);

    // --- ATTACK node + orbiting category shards ---
    const attackWire = new THREE.LineSegments(
      this.bag.add(new THREE.EdgesGeometry(this.bag.add(new THREE.OctahedronGeometry(0.55, 0)))),
      this.bag.add(new THREE.LineBasicMaterial({ color: C.red, transparent: true, opacity: 0.85 }))
    );
    attackWire.position.set(X.attack, 0.1, 0);
    this.scene.add(attackWire);
    this.attackWire = attackWire;

    const categories = ["injection", "destructive", "secret", "path", "conflict"];
    categories.forEach((cat, i) => {
      const shard = new THREE.Mesh(
        this.bag.add(new THREE.TetrahedronGeometry(0.14)),
        this.bag.add(new THREE.MeshBasicMaterial({ color: C.red, transparent: true, opacity: 0.85 }))
      );
      this.shards.push(shard);
      this.scene.add(shard);
      const label = makeLabelSprite(cat, { color: "#d9a988", px: 21, worldPer100: 0.95 });
      this.shardLabels.push(label);
      this.scene.add(label);
      void i;
    });

    // --- AGENT node ---
    this.agentWire = new THREE.LineSegments(
      this.bag.add(new THREE.EdgesGeometry(this.bag.add(new THREE.IcosahedronGeometry(0.6, 0)))),
      this.bag.add(new THREE.LineBasicMaterial({ color: C.accent, transparent: true, opacity: 0.9 }))
    );
    this.agentWire.position.set(X.agent, 0.15, 0);
    this.scene.add(this.agentWire);

    // --- SANDBOX ---
    const sandbox = new THREE.Group();
    sandbox.position.set(X.sandbox, -0.25, -0.3);
    sandbox.add(
      new THREE.LineSegments(
        this.bag.add(new THREE.EdgesGeometry(this.bag.add(new THREE.BoxGeometry(2.1, 1.7, 1.7)))),
        this.bag.add(new THREE.LineBasicMaterial({ color: C.accent, transparent: true, opacity: 1 }))
      )
    );
    // floor + mock tools so the chamber reads as populated machinery
    const sbFloor = new THREE.Mesh(
      this.bag.add(new THREE.BoxGeometry(2.02, 0.05, 1.62)),
      this.bag.add(new THREE.MeshStandardMaterial({ color: 0x2e2a24, emissive: 0x191612, roughness: 0.6, metalness: 0.25 }))
    );
    sbFloor.position.y = -0.8;
    sandbox.add(sbFloor);
    const sbToolMat = this.bag.add(
      new THREE.MeshStandardMaterial({ color: 0x443c31, emissive: 0x241f18, emissiveIntensity: 0.5, roughness: 0.5, metalness: 0.25 })
    );
    ([-0.55, 0.1, 0.6] as const).forEach((tx, i) => {
      const s = 0.24 + i * 0.04;
      const cube = new THREE.Mesh(this.bag.add(new THREE.BoxGeometry(s, s, s)), sbToolMat);
      cube.position.set(tx, -0.8 + s / 2 + 0.03, i % 2 === 0 ? 0.25 : -0.3);
      sandbox.add(cube);
    });
    const shieldTex = this.bag.add(makeShieldTexture());
    this.shieldMat = this.bag.add(
      new THREE.MeshBasicMaterial({ map: shieldTex, color: 0xc08a66, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false })
    );
    const shield = new THREE.Mesh(this.bag.add(new THREE.PlaneGeometry(1.95, 1.7)), this.shieldMat);
    shield.rotation.y = -Math.PI / 2;
    shield.position.x = -1.08;
    sandbox.add(shield);
    this.scene.add(sandbox);

    // agent -> sandbox curve for packets
    this.agentSandboxCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(X.agent + 0.55, 0, 0),
      new THREE.Vector3((X.agent + X.sandbox) / 2, 0.32, 0.25),
      new THREE.Vector3(X.sandbox - 1.32, -0.25, -0.3),
    ]);
    const tube = new THREE.Mesh(
      this.bag.add(new THREE.TubeGeometry(this.agentSandboxCurve, 32, 0.018, 6, false)),
      this.bag.add(new THREE.MeshBasicMaterial({ color: C.slate, transparent: true, opacity: 0.5 }))
    );
    this.scene.add(tube);

    const glow = this.bag.add(makeGlowTexture());
    this.packet = this.makePacket(C.accent, glow, 0.07);
    this.redPacket = this.makePacket(C.red, glow, 0.085);
    this.scene.add(this.packet, this.redPacket);

    // --- JUDGE + rules panel ---
    const judgeMesh = new THREE.Mesh(
      this.bag.add(new THREE.CylinderGeometry(0.5, 0.5, 0.8, 6)),
      this.bag.add(new THREE.MeshStandardMaterial({ color: 0x2e2a24, emissive: 0x241f1a, flatShading: true, roughness: 0.4, metalness: 0.3 }))
    );
    judgeMesh.position.set(X.judge, 0.25, 0);
    this.scene.add(judgeMesh);
    this.judgeRim = new THREE.Mesh(
      this.bag.add(new THREE.TorusGeometry(0.72, 0.025, 8, 6)),
      this.bag.add(new THREE.MeshBasicMaterial({ color: C.red, transparent: true, opacity: 0 }))
    );
    this.judgeRim.rotation.x = Math.PI / 2;
    this.judgeRim.position.copy(judgeMesh.position);
    this.scene.add(this.judgeRim);

    this.rulesPanel = this.buildRulesPanel();
    this.rulesPanel.position.set(X.judge - 0.2, 1.85, 0.6);
    this.scene.add(this.rulesPanel);

    // --- connecting rail (full pipeline) + replay ticks ---
    const railCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(X.skill, -1.35, 0.2),
      new THREE.Vector3(X.attack, -1.55, 0.1),
      new THREE.Vector3(1.3, -1.45, 0),
      new THREE.Vector3(X.judge, -1.4, 0.1),
    ]);
    this.scene.add(
      new THREE.Mesh(
        this.bag.add(new THREE.TubeGeometry(railCurve, 64, 0.014, 6, false)),
        this.bag.add(new THREE.MeshBasicMaterial({ color: C.slate, transparent: true, opacity: 0.55 }))
      )
    );
    this.replayRail = new THREE.Group();
    for (let i = 0; i < 12; i++) {
      const t = i / 11;
      const tick = new THREE.Mesh(
        this.bag.add(new THREE.BoxGeometry(0.07, 0.07, 0.07)),
        this.bag.add(new THREE.MeshBasicMaterial({ color: C.accent, transparent: true, opacity: 0.25 }))
      );
      tick.position.copy(railCurve.getPoint(t));
      tick.position.y -= 0.35;
      this.replayTicks.push(tick);
      this.replayRail.add(tick);
    }
    this.scene.add(this.replayRail);
    this.replayLabel = makeLabelSprite("EXECUTION REPLAY", { sub: "recorded trace", color: "#d6cfc2", px: 21 });
    this.replayLabel.position.set(0, -2.35, 0);
    this.scene.add(this.replayLabel);

    // --- badges ---
    this.blockedBadge = makeBadgeSprite("BLOCKED", { sub: "secret-file policy" });
    this.blockedBadge.position.set(X.sandbox, 1.25, -0.3);
    this.blockedBadge.material.opacity = 0;
    this.scene.add(this.blockedBadge);

    this.failBadge = makeBadgeSprite("FAIL", { sub: "R1 violated on attempt" });
    this.failBadge.position.set(X.judge, -1.0, 0);
    this.failBadge.material.opacity = 0;
    this.scene.add(this.failBadge);

    // labels for stages 1-3 nodes
    const l1 = makeLabelSprite("SKILL.MD", { color: "#d6cfc2", px: 22, worldPer100: 1.0 });
    l1.position.set(X.skill, -1.05, 0);
    const l2 = makeLabelSprite("ATTACK PROMPTS", { color: "#e8695f", px: 22, worldPer100: 1.0 });
    l2.position.set(X.attack, -1.1, 0);
    const l3 = makeLabelSprite("GEMMA 4 AGENT", { color: "#d9a988", px: 22, worldPer100: 1.0 });
    l3.position.set(X.agent, -0.85, 0);
    const l4 = makeLabelSprite("MOCK SANDBOX", { color: "#d6cfc2", px: 22, worldPer100: 1.0 });
    l4.position.set(X.sandbox, -1.5, -0.3);
    const l5 = makeLabelSprite("DETERMINISTIC JUDGE", { color: "#d6cfc2", px: 22, worldPer100: 1.0 });
    l5.position.set(X.judge, -0.85, 0);
    this.scene.add(l1, l2, l3, l4, l5);

    // register labels for overlay-aware culling (fade instead of clip)
    this.cullLabels = [
      { sprite: l1, x: () => X.skill, y: () => -1.05 },
      { sprite: l2, x: () => X.attack, y: () => -1.1 },
      { sprite: l3, x: () => X.agent, y: () => -0.85 },
      { sprite: l4, x: () => X.sandbox, y: () => -1.5 },
      { sprite: l5, x: () => X.judge, y: () => -0.85 },
      ...this.shardLabels.map((s, idx) => ({
        sprite: s,
        x: () => this.shards[idx].position.x,
        y: () => this.shards[idx].position.y + 0.28,
      })),
    ];
  }

  private buildRulesPanel(): THREE.Group {
    const group = new THREE.Group();
    const mk = (text: string, color: string, y: number) => {
      const s = makeLabelSprite(text, { color, px: 21, worldPer100: 1.15 });
      s.position.y = y;
      group.add(s);
      return s;
    };
    mk("R1  no secret access   ✓", "#8fbb81", 0.22);
    mk("R2  attempt = violation ✗", "#ef7d70", -0.22);
    return group;
  }

  private makePacket(color: number, glowTex: THREE.Texture, size: number): THREE.Group {
    const group = new THREE.Group();
    const glow = new THREE.Sprite(
      this.bag.add(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending }))
    );
    glow.scale.setScalar(0.5);
    group.add(glow);
    group.add(
      new THREE.Mesh(
        this.bag.add(new THREE.SphereGeometry(size, 10, 10)),
        this.bag.add(new THREE.MeshBasicMaterial({ color }))
      )
    );
    return group;
  }

  /* ------------------------------ animation ------------------------------ */

  private stageOf(p: number): { stage: number; local: number } {
    const s = Math.min(4, Math.floor(p * 5));
    return { stage: s, local: Math.min(1, p * 5 - s) };
  }

  private update(dt: number) {
    this.time += dt;
    const { stage, local } = this.stageOf(this.progress);
    const ease = (x: number) => x * x * (3 - 2 * x);

    // camera
    const k = keyAt(stage, this.camera.aspect);
    const kNext = keyAt(stage + 1, this.camera.aspect);
    const blend = this.reducedMotion ? (local > 0.5 ? 1 : 0) : ease(local);
    const pos = k.pos.clone().lerp(kNext.pos, blend);
    const target = k.target.clone().lerp(kNext.target, blend);
    if (!this.reducedMotion) {
      pos.x += Math.sin(this.time * 0.18) * 0.1;
      pos.y += Math.cos(this.time * 0.23) * 0.06;
    }
    // cinematic transition: dolly out mid-flight so the whole pipeline stays
    // framed while the camera pans — no label passes under the overlay card
    const arc = Math.sin(blend * Math.PI);
    pos.z += arc * 4.2;
    target.x -= arc * 1.1;
    this.camera.position.copy(pos);
    this.camera.lookAt(target);
    this.cullLabelsForView(target.x, target.y, pos.z);

    // stage animations
    this.attackWire.rotation.y += dt * (stage === 1 ? 1.4 : 0.3);
    this.agentWire.rotation.y += dt * (stage === 2 ? 1.1 : 0.25);
    this.judgeRim.rotation.z += dt * 0.5;

    // LOAD: rows light with local progress (looping gently when idle)
    const loadLit = stage === 0 ? Math.round(ease(local) * 7) : 7;
    redrawDoc(this.docFace, "SKILL.md", 7, loadLit);

    // ATTACK: shards orbit, spread wider when active
    const shardActive = stage === 1;
    const spread = shardActive ? 1.2 : 1.0;
    this.shards.forEach((shard, i) => {
      const a = this.time * (shardActive ? 0.9 : 0.35) + (i * Math.PI * 2) / 5;
      const r = spread * (0.95 + (i % 2) * 0.25);
      shard.position.set(X.attack + Math.cos(a) * r, 0.1 + Math.sin(a * 1.4) * 0.5, Math.sin(a) * r * 0.5);
      shard.rotation.y += dt * 2;
      const mat = shard.material as THREE.MeshBasicMaterial;
      mat.opacity = shardActive ? 0.95 : 0.35;
      mat.userData.baseOpacity = shardActive ? 0.95 : 0.25;
      const label = this.shardLabels[i];
      label.position.set(shard.position.x, shard.position.y + 0.28, shard.position.z);
      label.material.userData.baseOpacity = shardActive ? 0.95 : 0.25;
    });

    // EXECUTE: packets flow agent -> sandbox; red one blocked periodically
    const execActive = stage === 2;
    const cycleT = (this.time * 0.55) % 1;
    this.packet.visible = execActive || stage >= 3;
    if (this.packet.visible) {
      this.packet.position.copy(this.agentSandboxCurve.getPoint(cycleT));
    }
    const redT = (this.time * 0.4 + 0.5) % 1;
    const redBlockedAt = 0.9;
    this.redPacket.visible = execActive;
    if (execActive) {
      if (redT < redBlockedAt) {
        this.redPacket.position.copy(this.agentSandboxCurve.getPoint(ease(redT / redBlockedAt) * redBlockedAt));
        this.shieldMat.opacity = 0.22;
        this.blockedBadge.material.opacity = Math.max(0, this.blockedBadge.material.opacity - dt * 2);
      } else {
        this.redPacket.position.copy(this.agentSandboxCurve.getPoint(redBlockedAt));
        const flashP = (redT - redBlockedAt) / (1 - redBlockedAt);
        this.shieldMat.opacity = 0.22 + Math.sin(Math.min(1, flashP) * Math.PI) * 0.6;
        this.blockedBadge.material.opacity = Math.min(1, flashP * 4) * (1 - Math.max(0, flashP - 0.75) * 4);
      }
    } else if (stage >= 3) {
      this.blockedBadge.material.opacity = stage === 3 || stage === 4 ? Math.min(1, this.blockedBadge.material.opacity + dt * 2) : 0;
    } else {
      this.blockedBadge.material.opacity = Math.max(0, this.blockedBadge.material.opacity - dt * 2);
      this.shieldMat.opacity = 0.22;
    }

    // JUDGE: rim + fail badge on stage 3+
    const judgeActive = stage >= 3;
    (this.judgeRim.material as THREE.MeshBasicMaterial).opacity = judgeActive ? 0.9 : Math.max(0, (this.judgeRim.material as THREE.MeshBasicMaterial).opacity - dt);
    this.rulesPanel.children.forEach((child) => {
      const mat = (child as THREE.Sprite).material as THREE.SpriteMaterial;
      // hidden outside the judge stage so it never half-clips at close-ups
      mat.opacity = judgeActive ? 0.95 : Math.max(0, mat.opacity - dt * 1.5);
    });
    this.failBadge.material.opacity = stage >= 3 ? Math.min(1, this.failBadge.material.opacity + dt * 1.5) : Math.max(0, this.failBadge.material.opacity - dt * 2);

    // REPLAY: rail + label appear only at the pull-back stage, so neither
    // half-clips behind the progress rail during close-ups
    const replayActive = stage === 4;
    this.replayLabel.material.opacity = replayActive
      ? Math.min(1, this.replayLabel.material.opacity + dt * 1.5)
      : Math.max(0, this.replayLabel.material.opacity - dt * 2);
    const litTicks = replayActive ? Math.round(ease(local) * 12) : 0;
    this.replayTicks.forEach((tick, i) => {
      const mat = tick.material as THREE.MeshBasicMaterial;
      const on = i < litTicks;
      mat.opacity = on ? 0.95 : 0.25;
      mat.color.setHex(on ? C.accent : C.slate);
    });
  }

  /* --------------------------- label culling --------------------------- */

  /**
   * Fade stage labels out BEFORE they reach the overlay card or the viewport
   * edge, so a fly-along camera never shows a half-cut label. Static stage
   * labels and the orbiting shard labels both register here.
   */
  private cullLabelsForView(cx: number, cy: number, camZ: number) {
    const portrait = this.camera.aspect < 0.95;
    const vhWorld = 2 * camZ * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    const vwWorld = vhWorld * this.camera.aspect;
    const cardRight = Math.min(0.55, this.overlayRightPx / Math.max(1, this.viewWpx));
    for (const l of this.cullLabels) {
      const sx = (l.x() - cx) / vwWorld + 0.5; // 0..1 across the canvas
      const sy = (l.y() - cy) / vhWorld + 0.5;
      let f: number;
      if (portrait) {
        // the stage card is bottom-anchored — fade labels entering its band
        f = Math.min(
          THREE.MathUtils.clamp((0.62 - sy) / 0.1, 0, 1),
          THREE.MathUtils.clamp((0.97 - sx) / 0.07, 0, 1),
          THREE.MathUtils.clamp((sx - 0.03) / 0.07, 0, 1)
        );
      } else {
        f = Math.min(
          THREE.MathUtils.clamp((sx - (cardRight + 0.02)) / 0.06, 0, 1),
          THREE.MathUtils.clamp((0.985 - sx) / 0.06, 0, 1)
        );
      }
      const mat = l.sprite.material as THREE.SpriteMaterial;
      const base =
        (mat.userData.baseOpacity as number | undefined) ?? 1;
      mat.opacity = base * f;
    }
  }

  /* ------------------------------ controller ------------------------------ */

  /** Report the overlay stage card's right edge (canvas px) for label culling. */
  setOverlayRightPx(px: number) {
    this.overlayRightPx = px;
    if (this.reducedMotion) {
      this.update(0);
      this.renderOnce();
    }
  }

  resize(width: number, height: number) {
    this.renderer.setSize(width, height, false);
    this.viewWpx = width;
    this.camera.aspect = width / Math.max(1, height);
    this.camera.fov = this.camera.aspect < 0.95 ? 52 : 42;
    this.camera.updateProjectionMatrix();
    if (this.reducedMotion) this.renderOnce();
  }

  setVisible(visible: boolean) {
    if (this.disposed || this.reducedMotion) return;
    if (visible && !this.visible) {
      this.lastFrame = performance.now();
      this.raf = requestAnimationFrame(this.tick);
    }
    if (!visible && this.visible) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
    this.visible = visible;
  }

  setProgress(p: number) {
    this.progress = THREE.MathUtils.clamp(p, 0, 1);
    if (this.reducedMotion) {
      this.update(0);
      this.renderOnce();
    }
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      mesh.geometry?.dispose?.();
      const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else mat?.dispose();
    });
    this.bag.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss?.();
  }

  private tick = (now: number) => {
    if (this.disposed || !this.visible) return;
    const dt = Math.min((now - this.lastFrame) / 1000, 0.05);
    this.lastFrame = now;
    this.update(dt);
    this.renderer.render(this.scene, this.camera);
    this.raf = requestAnimationFrame(this.tick);
  };

  private renderOnce() {
    this.renderer.render(this.scene, this.camera);
  }
}

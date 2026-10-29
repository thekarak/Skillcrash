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
} from "./labels";

/**
 * HeroScene — the SkillCrash execution graph.
 *
 * An original, data-driven 3D diagram of the real pipeline:
 *   SKILL.md -> ATTACK PROMPT -> GEMMA 4 AGENT -> MOCK TOOL SANDBOX -> JUDGE
 *
 * A looping story plays out: the skill loads, a hostile prompt arms, the
 * agent attempts an upload_file(".env") call, the sandbox shield blocks the
 * secret-file operation, and the deterministic judge returns FAIL. The
 * scene explains the product; it is not decoration.
 */

const CYCLE = 13.2;

const PHASE = {
  docLight: [0.0, 2.0],
  ctxPacket: [1.6, 2.7],
  attackArms: [2.0, 3.3],
  atkPacket: [3.3, 4.5],
  agentProcess: [4.5, 5.5],
  toolPacket: [5.5, 6.9],
  block: [6.9, 8.2],
  tracePacket: [8.2, 9.6],
  judgeFail: [9.6, 10.8],
  hold: [10.8, 12.5],
  fade: [12.5, CYCLE],
} as const;

const C = {
  // SkillCrash identity — ink environment, bone forms, vermilion attacks,
  // copper machinery, warm grey support.
  bone: 0xeee8dc,
  accent: 0xa56f50, // copper — system machinery
  red: 0xe0231c,    // vermilion — attacks & failures
  ink: 0xeee8dc,
  grey: 0x8c867d,
  slate: 0x514a40,
  deep: 0x171613,
  green: 0x7ba36f,
};

const POS = {
  skill: new THREE.Vector3(-3.85, 0.75, 0.2),
  attack: new THREE.Vector3(-1.95, -0.5, 0.85),
  agent: new THREE.Vector3(0, 0.2, 0),
  sandbox: new THREE.Vector3(2.0, -0.35, -0.5),
  judge: new THREE.Vector3(4.3, 0.5, 0.3),
};

const BLOCK_POINT = new THREE.Vector3(POS.sandbox.x - 1.15, POS.sandbox.y, POS.sandbox.z);

/**
 * Content bounding box in contentGroup local space (nodes + labels + badges).
 * resize() uses it to fit the whole pipeline into the plate with a safety
 * margin, so stage names never clip at any aspect ratio.
 */
const BOUNDS = { minX: -4.9, maxX: 5.45, minY: -2.6, maxY: 2.8 };
const CONTENT_CENTER = new THREE.Vector3(
  (BOUNDS.minX + BOUNDS.maxX) / 2,
  (BOUNDS.minY + BOUNDS.maxY) / 2,
  0
);

export interface HeroSceneOptions {
  reducedMotion: boolean;
}

interface Packet {
  group: THREE.Group;
  curve: THREE.CatmullRomCurve3;
  from: number;
  to: number;
  color: THREE.Color;
  label?: THREE.Sprite;
  visiblePhase: boolean;
}

export class HeroScene implements SceneController {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private bag = new DisposalBag();

  private contentGroup = new THREE.Group();
  private docFace!: ReturnType<typeof makeDocTexture>;
  private docMesh!: THREE.Mesh;

  private attackCore!: THREE.Mesh;
  private attackWire!: THREE.LineSegments;
  private agentWire!: THREE.LineSegments;
  private agentCore!: THREE.Mesh;
  private sats: THREE.Mesh[] = [];
  private sandboxTools: THREE.Mesh[] = [];
  private shield!: THREE.Mesh;
  private shieldMat!: THREE.MeshBasicMaterial;
  private judgeMesh!: THREE.Mesh;
  private judgeMat!: THREE.MeshStandardMaterial;
  private judgeRim!: THREE.Mesh;

  private paths: {
    tube: THREE.Mesh;
    mat: THREE.MeshBasicMaterial;
    base: number;
    color: number;
  }[] = [];

  private packets: Packet[] = [];
  private toolCallLabel!: THREE.Sprite;
  private blockedBadge!: THREE.Sprite;
  private failBadge!: THREE.Sprite;

  private burst!: THREE.Points;
  private burstVel!: Float32Array;
  private burstLife = -1;

  private dust!: THREE.Points;
  private grid!: THREE.GridHelper;
  private redLight!: THREE.PointLight;

  private raf = 0;
  private visible = true;
  private disposed = false;
  private lastFrame = 0;
  private storyTime = 0;
  private reducedMotion: boolean;

  private pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  private scrollP = 0;
  private onPointerMove = (e: PointerEvent) => {
    this.pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
    this.pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
  };

  constructor(canvas: HTMLCanvasElement, opts: HeroSceneOptions) {
    this.reducedMotion = opts.reducedMotion;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 60);
    this.scene.fog = new THREE.Fog(C.deep, 13, 32);

    this.buildScene();

    if (this.reducedMotion) {
      this.composeStaticStory();
      this.renderOnce();
    } else {
      window.addEventListener("pointermove", this.onPointerMove, { passive: true });
      this.lastFrame = performance.now();
      this.raf = requestAnimationFrame(this.tick);
    }
  }

  /* ------------------------------- build ------------------------------- */

  private buildScene() {
    this.scene.add(this.contentGroup);
    // recentre content so the camera can orbit a stable origin
    this.contentGroup.position.set(-CONTENT_CENTER.x, -CONTENT_CENTER.y, 0);

    // lights — warm studio light over an ink environment
    this.scene.add(new THREE.AmbientLight(0xcbbfae, 1.35));
    const dir = new THREE.DirectionalLight(0xfff2e0, 1.9);
    dir.position.set(4, 7, 6);
    this.scene.add(dir);
    const fill = new THREE.DirectionalLight(0xd8c7b2, 0.5);
    fill.position.set(-5, 3, 4);
    this.scene.add(fill);
    this.redLight = new THREE.PointLight(C.red, 0, 7, 2);
    this.redLight.position.copy(BLOCK_POINT);
    this.scene.add(this.redLight);

    this.buildSkillDoc();
    this.buildAttackNode();
    this.buildAgentNode();
    this.buildSandbox();
    this.buildJudge();
    this.buildPaths();
    this.buildPackets();
    this.buildAmbient();

    // badges (inside contentGroup so they scale with the pipeline)
    this.blockedBadge = makeBadgeSprite("BLOCKED", { sub: "secret-file policy", worldPer100: 1.28 });
    this.blockedBadge.position.set(POS.sandbox.x, POS.sandbox.y + 1.55, POS.sandbox.z);
    this.blockedBadge.material.opacity = 0;
    this.blockedBadge.userData.baseScale = this.blockedBadge.scale.clone();
    this.contentGroup.add(this.blockedBadge);

    this.failBadge = makeBadgeSprite("FAIL", { sub: "R1 violated on attempt", worldPer100: 1.22 });
    this.failBadge.position.set(POS.judge.x - 0.35, POS.judge.y + 1.7, POS.judge.z);
    this.failBadge.material.opacity = 0;
    this.failBadge.userData.baseScale = this.failBadge.scale.clone();
    this.contentGroup.add(this.failBadge);
  }

  private buildSkillDoc() {
    this.docFace = makeDocTexture("SKILL.md", 7, 0);
    const geo = this.bag.add(new THREE.PlaneGeometry(1.85, 1.85 * (this.docFace.canvas.height / this.docFace.canvas.width)));
    const mat = this.bag.add(
      new THREE.MeshBasicMaterial({ map: this.docFace.texture, transparent: true, side: THREE.DoubleSide })
    );
    this.docFace.texture = this.bag.add(this.docFace.texture);
    this.docMesh = new THREE.Mesh(geo, mat);
    this.docMesh.position.copy(POS.skill).add(new THREE.Vector3(0, 0.35, 0));
    this.docMesh.rotation.y = 0.32;
    this.contentGroup.add(this.docMesh);

    const label = makeLabelSprite("SKILL.md", { sub: "parsed rules", color: "#d6cfc2" });
    label.position.copy(POS.skill).add(new THREE.Vector3(0.15, -1.45, 0));
    this.contentGroup.add(label);
  }

  private buildAttackNode() {
    const group = new THREE.Group();
    group.position.copy(POS.attack);

    const wireGeo = this.bag.add(new THREE.OctahedronGeometry(0.62, 0));
    const wireEdges = this.bag.add(new THREE.EdgesGeometry(wireGeo));
    this.attackWire = new THREE.LineSegments(
      wireEdges,
      this.bag.add(new THREE.LineBasicMaterial({ color: C.red, transparent: true, opacity: 1 }))
    );
    group.add(this.attackWire);

    this.attackCore = new THREE.Mesh(
      this.bag.add(new THREE.OctahedronGeometry(0.3, 1)),
      this.bag.add(new THREE.MeshBasicMaterial({ color: C.red, transparent: true, opacity: 0.32 }))
    );
    group.add(this.attackCore);

    this.contentGroup.add(group);

    const label = makeLabelSprite("ATTACK PROMPT", { sub: "adversarial input", color: "#e8695f" });
    label.position.copy(POS.attack).add(new THREE.Vector3(0.05, -1.5, 0));
    this.contentGroup.add(label);
  }

  private buildAgentNode() {
    const group = new THREE.Group();
    group.position.copy(POS.agent);

    const icoGeo = this.bag.add(new THREE.IcosahedronGeometry(0.68, 0));
    const edges = this.bag.add(new THREE.EdgesGeometry(icoGeo));
    this.agentWire = new THREE.LineSegments(
      edges,
      this.bag.add(new THREE.LineBasicMaterial({ color: C.accent, transparent: true, opacity: 1 }))
    );
    group.add(this.agentWire);

    this.agentCore = new THREE.Mesh(
      this.bag.add(new THREE.IcosahedronGeometry(0.34, 1)),
      this.bag.add(
        new THREE.MeshStandardMaterial({
          color: 0x3a2c22,
          emissive: C.accent,
          emissiveIntensity: 0.55,
          transparent: true,
          opacity: 0.95,
          roughness: 0.35,
          metalness: 0.2,
        })
      )
    );
    group.add(this.agentCore);

    for (let i = 0; i < 3; i++) {
      const sat = new THREE.Mesh(
        this.bag.add(new THREE.TetrahedronGeometry(0.11)),
        this.bag.add(new THREE.MeshBasicMaterial({ color: C.accent, transparent: true, opacity: 0.95 }))
      );
      this.sats.push(sat);
      group.add(sat);
    }

    this.contentGroup.add(group);

    const label = makeLabelSprite("AGENT", { sub: "Gemma 4 · simulated", color: "#d9a988" });
    label.position.copy(POS.agent).add(new THREE.Vector3(0, -1.5, 0));
    this.contentGroup.add(label);
  }

  private buildSandbox() {
    const group = new THREE.Group();
    group.position.copy(POS.sandbox);

    // outer frame — corner outline + a mid-cage so the chamber reads as
    // machinery, not a single empty wireframe cube
    const cageMat = this.bag.add(
      new THREE.LineBasicMaterial({ color: C.accent, transparent: true, opacity: 0.5 })
    );
    const HW = 1.0;
    const HD = 0.85;
    // three horizontal rails: floor line, mid line, top line
    for (const y of [-0.85, 0, 0.85]) {
      const rect = new THREE.LineLoop(
        this.bag.add(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-HW, y, -HD),
            new THREE.Vector3(HW, y, -HD),
            new THREE.Vector3(HW, y, HD),
            new THREE.Vector3(-HW, y, HD),
          ])
        ),
        cageMat
      );
      group.add(rect);
    }
    // four corner posts
    group.add(
      new THREE.LineSegments(
        this.bag.add(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-HW, -0.85, -HD), new THREE.Vector3(-HW, 0.85, -HD),
            new THREE.Vector3(HW, -0.85, -HD), new THREE.Vector3(HW, 0.85, -HD),
            new THREE.Vector3(HW, -0.85, HD), new THREE.Vector3(HW, 0.85, HD),
            new THREE.Vector3(-HW, -0.85, HD), new THREE.Vector3(-HW, 0.85, HD),
          ])
        ),
        cageMat
      )
    );
    // strong corner outline on top of the cage
    const cornerGeo = this.bag.add(new THREE.BoxGeometry(2.0, 1.7, 1.7));
    group.add(
      new THREE.LineSegments(
        this.bag.add(new THREE.EdgesGeometry(cornerGeo)),
        this.bag.add(new THREE.LineBasicMaterial({ color: C.accent, transparent: true, opacity: 1 }))
      )
    );

    // floor plate — grounds the chamber, catches tool shadows
    const floor = new THREE.Mesh(
      this.bag.add(new THREE.BoxGeometry(1.94, 0.06, 1.64)),
      this.bag.add(
        new THREE.MeshStandardMaterial({ color: 0x4a4335, emissive: 0x33291c, emissiveIntensity: 0.9, roughness: 0.55, metalness: 0.25 })
      )
    );
    floor.position.y = -0.8;
    group.add(floor);
    // copper floor trim — reads as a machined base
    const trim = new THREE.LineSegments(
      this.bag.add(new THREE.EdgesGeometry(this.bag.add(new THREE.BoxGeometry(1.94, 0.06, 1.64)))),
      this.bag.add(new THREE.LineBasicMaterial({ color: C.accent, transparent: true, opacity: 0.75 }))
    );
    trim.position.y = -0.8;
    group.add(trim);

    // tool rack — a taller server-like block at the back
    const rack = new THREE.Mesh(
      this.bag.add(new THREE.BoxGeometry(0.38, 0.72, 0.34)),
      this.bag.add(
        new THREE.MeshStandardMaterial({ color: 0x7d6b55, emissive: 0x54391f, emissiveIntensity: 0.85, roughness: 0.45, metalness: 0.3 })
      )
    );
    rack.position.set(-0.52, -0.41, -0.46);
    group.add(rack);
    const rackLight = new THREE.Mesh(
      this.bag.add(new THREE.BoxGeometry(0.3, 0.06, 0.05)),
      this.bag.add(new THREE.MeshBasicMaterial({ color: 0xe8b48c }))
    );
    rackLight.position.set(-0.52, -0.16, -0.29);
    group.add(rackLight);

    // mock tools resting on the floor — the six allowlisted utilities
    const toolMat = this.bag.add(
      new THREE.MeshStandardMaterial({ color: 0x8a7862, emissive: 0x6b4a2e, emissiveIntensity: 1.0, roughness: 0.45, metalness: 0.3 })
    );
    const toolSpecs: [number, number, number, number][] = [
      // [x, z, size, y]
      [0.02, 0.3, 0.4, -0.57],
      [0.56, -0.08, 0.32, -0.61],
      [0.6, 0.46, 0.26, -0.64],
      [-0.66, 0.38, 0.3, -0.62],
      [0.1, -0.42, 0.24, -0.65],
    ];
    this.sandboxTools = toolSpecs.map(([x, z, size, y]) => {
      const cube = new THREE.Mesh(this.bag.add(new THREE.BoxGeometry(size, size, size)), toolMat);
      cube.position.set(x, y, z);
      group.add(cube);
      return cube;
    });

    // shield face (facing the agent / -x) — the policy gate
    const shieldTex = this.bag.add(makeShieldTexture());
    shieldTex.repeat.set(1.7, 1.45);
    this.shieldMat = this.bag.add(
      new THREE.MeshBasicMaterial({
        map: shieldTex,
        color: 0xc08a66,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    this.shield = new THREE.Mesh(this.bag.add(new THREE.PlaneGeometry(2.0, 1.72)), this.shieldMat);
    this.shield.rotation.y = -Math.PI / 2;
    this.shield.position.x = -1.02;
    group.add(this.shield);

    this.contentGroup.add(group);

    const label = makeLabelSprite("SANDBOX", { sub: "mock tools · in-memory", color: "#d6cfc2" });
    label.position.copy(POS.sandbox).add(new THREE.Vector3(0, -1.6, 0));
    this.contentGroup.add(label);
  }

  private buildJudge() {
    const group = new THREE.Group();
    group.position.copy(POS.judge);

    this.judgeMat = this.bag.add(
      new THREE.MeshStandardMaterial({
        color: 0x2e2a24,
        emissive: 0x2c231b,
        emissiveIntensity: 0.55,
        roughness: 0.4,
        metalness: 0.35,
        flatShading: true,
      })
    );
    this.judgeMesh = new THREE.Mesh(this.bag.add(new THREE.CylinderGeometry(0.55, 0.55, 0.85, 6)), this.judgeMat);
    this.judgeMesh.scale.setScalar(1.2);
    group.add(this.judgeMesh);

    // pedestal base — gives the judge physical presence
    const base = new THREE.Mesh(
      this.bag.add(new THREE.CylinderGeometry(0.82, 0.92, 0.14, 6)),
      this.bag.add(new THREE.MeshStandardMaterial({ color: 0x332e27, emissive: 0x221e19, flatShading: true, roughness: 0.5, metalness: 0.3 }))
    );
    base.position.y = -0.62;
    group.add(base);
    const baseRim = new THREE.Mesh(
      this.bag.add(new THREE.TorusGeometry(0.88, 0.018, 8, 6)),
      this.bag.add(new THREE.MeshBasicMaterial({ color: C.accent, transparent: true, opacity: 0.55 }))
    );
    baseRim.rotation.x = Math.PI / 2;
    baseRim.position.y = -0.55;
    group.add(baseRim);

    this.judgeRim = new THREE.Mesh(
      this.bag.add(new THREE.TorusGeometry(0.78, 0.028, 8, 6)),
      this.bag.add(new THREE.MeshBasicMaterial({ color: C.red, transparent: true, opacity: 0 }))
    );
    this.judgeRim.rotation.x = Math.PI / 2;
    group.add(this.judgeRim);

    this.contentGroup.add(group);

    // right-anchored so the widest label grows leftward, never past the frame
    const label = makeLabelSprite("DETERMINISTIC JUDGE", { sub: "rule-based verdict", color: "#d6cfc2" });
    label.center.set(1, 0.5);
    label.position.copy(POS.judge).add(new THREE.Vector3(1.05, -1.5, 0));
    this.contentGroup.add(label);
  }

  private curveBetween(a: THREE.Vector3, b: THREE.Vector3, lift: number, side: number): THREE.CatmullRomCurve3 {
    const mid = a.clone().lerp(b, 0.5);
    const dir = b.clone().sub(a).normalize();
    const perp = new THREE.Vector3(-dir.y, dir.x, 0).multiplyScalar(side);
    mid.add(perp.multiplyScalar(0.35)).add(new THREE.Vector3(0, lift, 0));
    return new THREE.CatmullRomCurve3([a, mid, b]);
  }

  private buildPaths() {
    const specs: { a: THREE.Vector3; b: THREE.Vector3; color: number; lift: number; side: number }[] = [
      { a: POS.skill.clone().add(new THREE.Vector3(0.95, -0.1, 0)), b: POS.attack.clone().add(new THREE.Vector3(-0.55, 0.2, 0)), color: C.accent, lift: 0.55, side: 1 },
      { a: POS.attack.clone().add(new THREE.Vector3(0.55, 0.2, 0)), b: POS.agent.clone().add(new THREE.Vector3(-0.7, -0.25, 0)), color: C.red, lift: 0.5, side: -1 },
      { a: POS.agent.clone().add(new THREE.Vector3(0.7, -0.2, 0)), b: BLOCK_POINT.clone(), color: C.red, lift: -0.28, side: 1 },
      { a: POS.sandbox.clone().add(new THREE.Vector3(0, 0.95, 0)), b: POS.judge.clone().add(new THREE.Vector3(-0.45, 0.1, 0)), color: C.accent, lift: 0.75, side: -1 },
    ];
    for (const s of specs) {
      const curve = this.curveBetween(s.a, s.b, s.lift, s.side);
      const geo = this.bag.add(new THREE.TubeGeometry(curve, 48, 0.026, 6, false));
      const mat = this.bag.add(
        new THREE.MeshBasicMaterial({ color: s.color, transparent: true, opacity: 0.42 })
      );
      const tube = new THREE.Mesh(geo, mat);
      this.contentGroup.add(tube);
      this.paths.push({ tube, mat, base: 0.42, color: s.color });
      (this.paths[this.paths.length - 1] as { curve?: THREE.CatmullRomCurve3 }).curve = curve;
    }
  }

  private makePacket(color: number, size = 0.1): THREE.Group {
    const group = new THREE.Group();
    const glowTex = this.bag.add(makeGlowTexture());
    const glow = new THREE.Sprite(
      this.bag.add(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, opacity: 0.75, depthWrite: false, blending: THREE.AdditiveBlending }))
    );
    glow.scale.setScalar(0.72);
    group.add(glow);
    const ball = new THREE.Mesh(
      this.bag.add(new THREE.SphereGeometry(size, 12, 12)),
      this.bag.add(new THREE.MeshBasicMaterial({ color }))
    );
    group.add(ball);
    return group;
  }

  private buildPackets() {
    const glowTex = this.bag.add(makeGlowTexture());
    void glowTex;

    const p1 = this.makePacket(C.accent, 0.085);
    const p2 = this.makePacket(C.red, 0.105);
    const p3 = this.makePacket(C.red, 0.105);
    const p4 = this.makePacket(C.accent, 0.09);

    const curves = this.paths.map((p) => (p as unknown as { curve: THREE.CatmullRomCurve3 }).curve);

    this.packets = [
      { group: p1, curve: curves[0], from: PHASE.ctxPacket[0], to: PHASE.ctxPacket[1], color: new THREE.Color(C.accent), visiblePhase: false },
      { group: p2, curve: curves[1], from: PHASE.atkPacket[0], to: PHASE.atkPacket[1], color: new THREE.Color(C.red), visiblePhase: false },
      { group: p3, curve: curves[2], from: PHASE.toolPacket[0], to: PHASE.toolPacket[1], color: new THREE.Color(C.red), visiblePhase: false },
      { group: p4, curve: curves[3], from: PHASE.tracePacket[0], to: PHASE.tracePacket[1], color: new THREE.Color(C.accent), visiblePhase: false },
    ];
    for (const p of this.packets) {
      p.group.visible = false;
      this.contentGroup.add(p.group);
    }

    // floating label that follows the upload_file packet
    this.toolCallLabel = makeLabelSprite('upload_file(".env")', { color: "#ef7d70", px: 21, worldPer100: 1.3 });
    this.toolCallLabel.material.opacity = 0;
    this.contentGroup.add(this.toolCallLabel);

    // block burst particles
    const N = 26;
    const pos = new Float32Array(N * 3);
    this.burstVel = new Float32Array(N * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const mat = this.bag.add(
      new THREE.PointsMaterial({ color: C.red, size: 0.07, transparent: true, opacity: 0, depthWrite: false })
    );
    this.burst = new THREE.Points(geo, mat);
    this.burst.frustumCulled = false;
    this.scene.add(this.burst);
    this.bag.add(geo);
  }

  private buildAmbient() {
    this.grid = new THREE.GridHelper(34, 34, 0x554c40, 0x2f2921);
    const gm = this.grid.material as THREE.Material;
    gm.transparent = true;
    gm.opacity = 0.7;
    this.grid.position.y = -2.95;
    this.scene.add(this.grid);

    const N = 90;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 24;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 7;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10 - 1;
    }
    const geo = this.bag.add(new THREE.BufferGeometry());
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    this.dust = new THREE.Points(
      geo,
      this.bag.add(new THREE.PointsMaterial({ color: 0x8a8071, size: 0.05, transparent: true, opacity: 0.5, depthWrite: false }))
    );
    this.scene.add(this.dust);
  }

  /* ------------------------------- story ------------------------------- */

  private phase(t: number, a: number, b: number): number {
    return THREE.MathUtils.clamp((t - a) / (b - a), 0, 1);
  }

  private ease(x: number): number {
    return x * x * (3 - 2 * x);
  }

  private updateStory(t: number, dt: number) {
    // 1. document lights up
    const docP = this.phase(t, PHASE.docLight[0], PHASE.docLight[1]);
    const lit = Math.round(this.ease(docP) * 7);
    redrawDoc(this.docFace, "SKILL.md", 7, lit);

    // 2. attack arms
    const armP = this.phase(t, PHASE.attackArms[0], PHASE.attackArms[1]);
    this.attackCore.scale.setScalar(0.6 + armP * 0.85);
    (this.attackCore.material as THREE.MeshBasicMaterial).opacity = 0.22 + armP * 0.4;
    this.attackWire.rotation.y += dt * (0.35 + armP * 1.4);
    this.attackWire.rotation.x = Math.sin(t * 0.5) * 0.18;

    // 3. agent processes
    const procP = this.phase(t, PHASE.agentProcess[0], PHASE.agentProcess[1]);
    this.agentWire.rotation.y += dt * 0.28;
    this.agentCore.rotation.y -= dt * 0.5;
    (this.agentCore.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.55 + procP * 1.3;
    const satT = t * (0.9 + procP * 2.2);
    this.sats.forEach((sat, i) => {
      const a = satT + (i * Math.PI * 2) / 3;
      sat.position.set(Math.cos(a) * 1.05, Math.sin(a * 1.3) * 0.32, Math.sin(a) * 1.05);
      sat.rotation.y += dt * 2;
    });

    // 4. packets
    this.packets.forEach((p, idx) => {
      const prog = this.phase(t, p.from, p.to);
      const active = prog > 0 && prog < 1;
      p.group.visible = active;
      p.visiblePhase = active;
      if (active) {
        const pos = p.curve.getPoint(this.ease(prog));
        p.group.position.copy(pos);
        // path highlight
        const path = this.paths[idx];
        path.mat.opacity = THREE.MathUtils.lerp(path.base, 0.95, active ? 1 : 0);
        path.mat.color.set(p.color);
      } else {
        this.paths[idx].mat.opacity = THREE.MathUtils.lerp(
          this.paths[idx].mat.opacity,
          this.paths[idx].base,
          0.06
        );
        this.paths[idx].mat.color.lerp(new THREE.Color(this.paths[idx].color), 0.08);
      }
    });

    // upload_file label follows packet 3 (idx 2)
    const toolP = this.phase(t, PHASE.toolPacket[0], PHASE.toolPacket[1]);
    if (toolP > 0.05 && toolP < 1) {
      const pos = this.packets[2].curve.getPoint(this.ease(toolP));
      this.toolCallLabel.position.set(pos.x, pos.y + 0.5, pos.z);
      this.toolCallLabel.material.opacity = Math.min(1, toolP * 4) * (1 - Math.max(0, toolP - 0.85) * 4);
    } else {
      this.toolCallLabel.material.opacity = 0;
    }

    // 5. block flash + burst
    const blockP = this.phase(t, PHASE.block[0], PHASE.block[1]);
    const flash = Math.sin(Math.min(blockP, 1) * Math.PI);
    this.shieldMat.opacity = 0.22 + flash * 0.7;
    this.shield.scale.setScalar(1 + flash * 0.1);
    this.redLight.intensity = flash * 9;
    // the tool chamber acknowledges the hit — a short bright pulse
    this.sandboxTools.forEach((cube, i) => {
      const mat = cube.material as THREE.MeshStandardMaterial;
      const pulse = flash * (0.6 + 0.25 * Math.sin(i * 2.1));
      mat.emissiveIntensity = 0.75 + Math.max(0, pulse) * 1.8;
    });
    if (blockP > 0 && this.burstLife < 0) {
      this.spawnBurst();
    }
    if (this.burstLife >= 0) {
      this.updateBurst(dt);
    }
    const blockedVisible = blockP > 0 && t < PHASE.fade[0];
    const badgePop = this.phase(t, PHASE.block[0], PHASE.block[0] + 0.35);
    this.blockedBadge.material.opacity = blockedVisible ? this.ease(badgePop) : Math.max(0, this.blockedBadge.material.opacity - dt * 3);
    const bScale = 0.75 + this.ease(badgePop) * 0.25;
    const bBase = this.blockedBadge.userData.baseScale as THREE.Vector3;
    this.blockedBadge.scale.set(bBase.x * bScale, bBase.y * bScale, 1);

    // 6. judge fail
    const failP = this.phase(t, PHASE.judgeFail[0], PHASE.judgeFail[1]);
    this.judgeMesh.rotation.y += dt * 0.22;
    this.judgeRim.rotation.z += dt * 0.6;
    (this.judgeRim.material as THREE.MeshBasicMaterial).opacity = this.ease(failP) * 0.95;
    this.judgeMat.emissive.setHex(0x2c231b).lerp(new THREE.Color(C.red), this.ease(failP) * 0.8);

    const failVisible = failP > 0 && t < PHASE.fade[0];
    const failPop = this.phase(t, PHASE.judgeFail[0], PHASE.judgeFail[0] + 0.3);
    this.failBadge.material.opacity = failVisible ? this.ease(failPop) : Math.max(0, this.failBadge.material.opacity - dt * 3);
    const fScale = 0.7 + this.ease(failPop) * 0.3;
    const fBase = this.failBadge.userData.baseScale as THREE.Vector3;
    this.failBadge.scale.set(fBase.x * fScale, fBase.y * fScale, 1);

    // 7. fade out for next cycle
    const fadeP = this.phase(t, PHASE.fade[0], PHASE.fade[1]);
    if (fadeP > 0) {
      this.blockedBadge.material.opacity *= 1 - fadeP;
      this.failBadge.material.opacity *= 1 - fadeP;
      this.shieldMat.opacity = 0.22 * (1 - fadeP * 0.35);
    }
    if (t < 0.05) {
      this.burstLife = -1;
      (this.burst.material as THREE.PointsMaterial).opacity = 0;
      this.sandboxTools.forEach((cube) => {
        (cube.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.75;
      });
    }

    // ambient
    this.dust.rotation.y += dt * 0.012;
    this.grid.position.z = Math.sin(t * 0.08) * 0.4;
  }

  private spawnBurst() {
    const pos = this.burst.geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      pos.setXYZ(i, BLOCK_POINT.x, BLOCK_POINT.y, BLOCK_POINT.z);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = 1.6 + Math.random() * 2.4;
      this.burstVel[i * 3] = -Math.abs(Math.sin(phi) * Math.cos(theta)) * speed * 0.7 - 0.4;
      this.burstVel[i * 3 + 1] = Math.cos(phi) * speed;
      this.burstVel[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * speed * 0.6;
    }
    pos.needsUpdate = true;
    this.burstLife = 0;
    (this.burst.material as THREE.PointsMaterial).opacity = 0.95;
  }

  private updateBurst(dt: number) {
    this.burstLife += dt;
    const pos = this.burst.geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      pos.setXYZ(
        i,
        pos.getX(i) + this.burstVel[i * 3] * dt,
        pos.getY(i) + this.burstVel[i * 3 + 1] * dt,
        pos.getZ(i) + this.burstVel[i * 3 + 2] * dt
      );
      this.burstVel[i * 3 + 1] -= dt * 1.4;
    }
    pos.needsUpdate = true;
    (this.burst.material as THREE.PointsMaterial).opacity = Math.max(0, 0.95 - this.burstLife * 0.8);
    if (this.burstLife > 1.4) this.burstLife = -1;
  }

  /** Static composed story frame for reduced-motion users. */
  private composeStaticStory() {
    redrawDoc(this.docFace, "SKILL.md", 7, 7);
    this.attackCore.scale.setScalar(1.35);
    (this.attackCore.material as THREE.MeshBasicMaterial).opacity = 0.5;
    this.sats.forEach((sat, i) => {
      const a = (i * Math.PI * 2) / 3 + 1.2;
      sat.position.set(Math.cos(a) * 1.05, Math.sin(a * 1.3) * 0.32, Math.sin(a) * 1.05);
    });
    // packet frozen at the shield
    this.packets[2].group.visible = true;
    this.packets[2].group.position.copy(this.packets[2].curve.getPoint(0.94));
    this.paths[2].mat.opacity = 0.95;
    this.paths[2].mat.color.set(C.red);
    this.shieldMat.opacity = 0.68;
    this.redLight.intensity = 5;
    this.blockedBadge.material.opacity = 1;
    const bBase = this.blockedBadge.userData.baseScale as THREE.Vector3;
    this.blockedBadge.scale.set(bBase.x, bBase.y, 1);
    this.judgeRim.rotation.x = Math.PI / 2;
    (this.judgeRim.material as THREE.MeshBasicMaterial).opacity = 0.9;
    this.judgeMat.emissive.setHex(0x5a201c);
    this.failBadge.material.opacity = 1;
    const fBase = this.failBadge.userData.baseScale as THREE.Vector3;
    this.failBadge.scale.set(fBase.x, fBase.y, 1);
    this.toolCallLabel.material.opacity = 0;
    this.sandboxTools.forEach((cube, i) => {
      (cube.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.85 + 0.3 * Math.sin(i);
    });
  }

  /* ------------------------------ controller ------------------------------ */

  resize(width: number, height: number) {
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / Math.max(1, height);
    const portrait = this.camera.aspect < 0.95;
    this.camera.fov = portrait ? 50 : 42;

    // Fit the whole pipeline (BOUNDS) into the frame with a safety margin,
    // so it is as large as possible without ever clipping a stage name —
    // at any plate size, from mobile to ultra-wide.
    const z = portrait ? 12.8 : 11.6;
    const vh = 2 * z * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    const vw = vh * this.camera.aspect;
    const boundsW = BOUNDS.maxX - BOUNDS.minX;
    const boundsH = BOUNDS.maxY - BOUNDS.minY;
    const fit = Math.min(vw / boundsW, vh / boundsH) * 0.92;
    this.contentGroup.scale.setScalar(fit);

    // keep the floor grid below the pipeline at every fit scale
    const contentBottom = -CONTENT_CENTER.y + BOUNDS.minY * fit;
    this.grid.position.y = Math.min(-2.95, contentBottom - 0.3);

    this.camera.position.z = z;
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

  setPointer(x: number, y: number) {
    this.pointer.tx = x;
    this.pointer.ty = y;
  }

  setScrollProgress(p: number) {
    this.scrollP = THREE.MathUtils.clamp(p, 0, 1);
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("pointermove", this.onPointerMove);
    this.scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose?.();
      const mat = (mesh as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else mat?.dispose();
    });
    this.bag.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss?.();
  }

  /* -------------------------------- loop -------------------------------- */

  private tick = (now: number) => {
    if (this.disposed || !this.visible) return;
    const dt = Math.min((now - this.lastFrame) / 1000, 0.05);
    this.lastFrame = now;
    this.storyTime = (this.storyTime + dt) % CYCLE;

    this.updateStory(this.storyTime, dt);
    this.updateCamera(this.storyTime, dt);
    this.renderer.render(this.scene, this.camera);
    this.raf = requestAnimationFrame(this.tick);
  };

  private updateCamera(t: number, dt: number) {
    this.pointer.x += (this.pointer.tx - this.pointer.x) * Math.min(1, dt * 3.2);
    this.pointer.y += (this.pointer.ty - this.pointer.y) * Math.min(1, dt * 3.2);

    const portrait = this.camera.aspect < 0.95;
    const baseZ = portrait ? 12.8 : 11.6;
    const swayX = Math.sin(t * 0.1) * 0.16 - this.pointer.x * 0.3;
    const targetX = THREE.MathUtils.clamp(swayX, -0.42, 0.42);
    // camera sits slightly above and looks a touch down — the floor grid
    // reads as foreground depth instead of empty black space
    const targetY = 0.62 + Math.cos(t * 0.13) * 0.1 - this.pointer.y * 0.18;
    const targetZ = baseZ + this.scrollP * 2.4;

    this.camera.position.x += (targetX - this.camera.position.x) * Math.min(1, dt * 2.4);
    this.camera.position.y += (targetY - this.camera.position.y) * Math.min(1, dt * 2.4);
    this.camera.position.z += (targetZ - this.camera.position.z) * Math.min(1, dt * 2.4);
    this.camera.lookAt(0, -0.1, 0);
  }

  private renderOnce() {
    this.camera.position.set(0, 0.62, this.camera.aspect < 0.95 ? 12.8 : 11.6);
    this.camera.lookAt(0, -0.1, 0);
    this.renderer.render(this.scene, this.camera);
  }
}

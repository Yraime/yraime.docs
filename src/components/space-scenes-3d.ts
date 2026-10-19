import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

function smoothstep(a: number, b: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

export class SpaceScene3D {
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;

  // Trou noir
  private blackHoleGroup: THREE.Group;
  private blackHoleModel: THREE.Group | null = null;
  private blackHoleWrapper: THREE.Group | null = null;

  // Horizon, anneaux et étoiles
  private centerHorizon!: THREE.Mesh;
  private photonRingsGroup!: THREE.Group;
  private starField!: THREE.Points;
  private starMaterial!: THREE.ShaderMaterial;

  // Post-traitement plein écran
  private renderTarget!: THREE.WebGLRenderTarget;
  private postScene!: THREE.Scene;
  private postCamera!: THREE.OrthographicCamera;
  private postMaterial!: THREE.ShaderMaterial;
  private postQuad!: THREE.Mesh;

  // Ressources GPU
  private disposables: (
    THREE.Material | THREE.Texture | THREE.BufferGeometry
  )[] = [];

  private width = 1;
  private height = 1;
  private dpr = 1;
  private destroyed = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });

    this.renderer.setPixelRatio(this.dpr);
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(45, 1, 0.5, 9000);

    const ambientLight = new THREE.AmbientLight(0x0a0500, 0.8);
    this.scene.add(ambientLight);

    const accretionLight = new THREE.PointLight(0xff3300, 3.0, 1200, 1.0);
    this.scene.add(accretionLight);

    this.blackHoleGroup = new THREE.Group();
    this.scene.add(this.blackHoleGroup);

    this.initStars();
    this.initBlackHole();
    this.initDistortion();
  }

  /* ---------------------------------------------------------- */
  /* Champ d'étoiles cosmique (aspiré façon Fortnite "The End")  */
  /* ---------------------------------------------------------- */

  private initStars() {
    const starCount = 99000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const seeds = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      const r = 1500 + Math.random() * 3000;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      // Graine aléatoire : décale le moment où chaque étoile commence à être aspirée
      seeds[i] = Math.random();

      const colorType = Math.random();
      if (colorType > 0.8) {
        colors[i * 3] = 0.6; colors[i * 3 + 1] = 0.8; colors[i * 3 + 2] = 1.0;
      } else if (colorType > 0.6) {
        colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.9; colors[i * 3 + 2] = 0.7;
      } else {
        colors[i * 3] = 0.9; colors[i * 3 + 1] = 0.95; colors[i * 3 + 2] = 1.0;
      }
    }

    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    starGeo.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    starGeo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));

    // Shader : l'aspiration est calculée sur le GPU (étoiles = simples points)
    this.starMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uSuck: { value: 0 },
        uSize: { value: 10.2 },
        uScale: { value: 400 },
        uOpacity: { value: 0.85 },
      },
      vertexShader: `
        uniform float uSuck;
        uniform float uSize;
        uniform float uScale;
        uniform float uOpacity;

        attribute vec3 aColor;
        attribute float aSeed;

        varying vec3 vColor;
        varying float vAlpha;

        // Chute "gravitationnelle" : une onde part du trou noir vers l'extérieur,
        // et chaque étoile tombe en ligne droite en accélérant de plus en plus.
        vec3 suckedPos(float suck, out float k) {
          float r = length(position);
          float rn = clamp((r - 1500.0) / 3000.0, 0.0, 1.0); // 0 = proche, 1 = lointaine
          float start = rn * 0.45 + aSeed * 0.1;              // les proches tombent d'abord
          float t = clamp((suck - start) / 0.45, 0.0, 1.0);
          k = t * t * t;                                      // accélération (chute libre)

          // très léger virage tangentiel, juste pour casser la ligne parfaitement droite
          float angle = t * t * (aSeed - 0.5) * 1.2;
          float c = cos(angle);
          float s = sin(angle);
          vec3 p = position;
          p.xy = mat2(c, -s, s, c) * p.xy;
          return p * (1.0 - k);
        }

        void main() {
          float k;
          vec3 p = suckedPos(uSuck, k);

          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;

          float size = uSize * (1.0 + k * 0.4);
          gl_PointSize = mv.z < 0.0 ? max(1.0, size * uScale / max(-mv.z, 1.0)) : 0.0;

          vColor = mix(aColor, vec3(1.0, 0.45, 0.15), k * 0.6) * (1.0 - k * 0.4);
          vAlpha = uOpacity * (1.0 - smoothstep(0.6, 0.95, k));
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.1, d);
          gl_FragColor = vec4(vColor, vAlpha * a);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    this.starField = new THREE.Points(starGeo, this.starMaterial);
    this.starField.frustumCulled = false;
    this.scene.add(this.starField);
    this.disposables.push(starGeo, this.starMaterial);
  }

  /* ---------------------------------------------------------- */
  /* Trou noir                                                  */
  /* ---------------------------------------------------------- */

  private initBlackHole() {
    const horizonGeo = new THREE.SphereGeometry(35, 48, 48);
    const horizonMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    this.centerHorizon = new THREE.Mesh(horizonGeo, horizonMat);
    this.blackHoleGroup.add(this.centerHorizon);
    this.disposables.push(horizonGeo, horizonMat);

    this.photonRingsGroup = new THREE.Group();
    const ringConfigs = [
      { r: 35.8, w: 0.5, color: 0xffe0a0, op: 0.95 },
      { r: 37.2, w: 0.8, color: 0xff5500, op: 0.85 },
      { r: 39.0, w: 0.7, color: 0xff2200, op: 0.75 },
      { r: 40.5, w: 1.0, color: 0xcc1100, op: 0.60 },
      { r: 43.0, w: 1.5, color: 0xaa0000, op: 0.40 },
    ];

    for (const config of ringConfigs) {
      const geometry = new THREE.RingGeometry(
        config.r,
        config.r + config.w,
        128
      );
      const material = new THREE.MeshBasicMaterial({
        color: config.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: config.op,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const ring = new THREE.Mesh(geometry, material);
      ring.position.z = 1.2;
      this.photonRingsGroup.add(ring);
      this.disposables.push(geometry, material);
    }
    this.blackHoleGroup.add(this.photonRingsGroup);

    const loader = new GLTFLoader();
    loader.load(
      "/models/black_hole.glb",
      (gltf) => {
        if (this.destroyed) return;
        const model = gltf.scene;
        const planetNode = model.getObjectByName("Planet");
        if (planetNode) planetNode.visible = false;

        model.position.set(0, 0, 0);
        const baseScale = 400 / 3300;
        const wrapper = new THREE.Group();
        wrapper.add(model);
        wrapper.scale.setScalar(baseScale);
        wrapper.rotation.set(
          0,
          THREE.MathUtils.degToRad(8),
          THREE.MathUtils.degToRad(35)
        );

        model.traverse((child) => {
          if (!(child instanceof THREE.Mesh)) return;
          child.castShadow = true;
          child.receiveShadow = true;
          const materials = Array.isArray(child.material)
            ? child.material
            : [child.material];

          for (const material of materials) {
            material.side = THREE.DoubleSide;
            const mat = material as THREE.MeshStandardMaterial;
            const name = mat.name.toLowerCase();

            if (name.includes("ring")) {
              mat.transparent = true;
              mat.opacity = 1.0;
              mat.depthWrite = false;
              if (mat.map) {
                mat.emissiveMap = mat.map;
                mat.emissive = new THREE.Color(0xff2200);
                mat.emissiveIntensity = 1.6;
              }
            } else if (name.includes("light")) {
              mat.transparent = true;
              mat.depthWrite = false;
              mat.blending = THREE.AdditiveBlending;
              if (mat.map) {
                mat.emissiveMap = mat.map;
                mat.emissive = new THREE.Color(0xff4400);
                mat.emissiveIntensity = 1.8;
              }
            } else if (name.includes("distortion")) {
              mat.transparent = true;
              mat.opacity = 0.2;
              mat.depthWrite = false;
            } else if (
              name.includes("blackoutside") ||
              name.includes("center")
            ) {
              child.visible = false;
            }
          }
        });

        this.blackHoleModel = model;
        this.blackHoleWrapper = wrapper;
        this.blackHoleGroup.add(wrapper);
      },
      undefined,
      (error) => console.warn("Erreur GLTF:", error)
    );
  }

  private initDistortion() {
    this.renderTarget = new THREE.WebGLRenderTarget(1, 1, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      depthBuffer: true,
      stencilBuffer: false,
    });

    this.postScene = new THREE.Scene();
    this.postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    this.postMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: this.renderTarget.texture },
        uStrength: { value: 0 },
        uHorizonRadius: { value: 0.08 },
        uDarkness: { value: 0 },
        uAspect: { value: 1 },
        uTime: { value: 0 },
        uCenter: { value: new THREE.Vector2(0.5, 0.5) },
      },

      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,

      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float uStrength;
        uniform float uHorizonRadius;
        uniform float uDarkness;
        uniform float uAspect;
        uniform float uTime;
        uniform vec2 uCenter;

        varying vec2 vUv;

        void main() {
          vec2 aspect = vec2(uAspect, 1.0);
          vec2 p = (vUv - uCenter) * aspect;

          float r = length(p);
          float safeR = max(r, 0.005);
          vec2 dir = p / safeR;

          float lens = (uStrength * (0.015 + uHorizonRadius * 0.1)) / (safeR * 8.0 + 0.02);
          lens = min(lens, 0.50);

          vec2 warped = vUv - (dir * lens) / aspect;

          float ripple = sin(r * 40.0 - uTime * 4.0) * exp(-r * 3.0) * uStrength * 0.004;
          warped -= (dir * ripple) / aspect;

          vec2 sampleUv = clamp(warped, vec2(0.001), vec2(0.999));
          vec3 color = texture2D(tDiffuse, sampleUv).rgb;

          float ringRadius = uHorizonRadius * (1.0 + uStrength * 0.08);
          float photonRing = exp(-pow((r - ringRadius) * 90.0, 2.0));
          color += vec3(1.0, 0.35, 0.05) * photonRing * (uStrength * 0.5 + 0.2);

          float horizon = smoothstep(uHorizonRadius * 0.85, uHorizonRadius * 1.08, r);
          color *= horizon;

          float finalFade = 1.0 - smoothstep(0.55, 1.0, uDarkness);
          color *= finalFade;

          gl_FragColor = vec4(color, 1.0);
        }
      `,
    });

    this.postQuad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      this.postMaterial
    );
    this.postScene.add(this.postQuad);
    this.disposables.push(this.postQuad.geometry);
  }

  public resize(width: number, height: number) {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.width, this.height, false);
    this.renderTarget.setSize(
      Math.round(this.width * this.dpr),
      Math.round(this.height * this.dpr)
    );

    this.postMaterial.uniforms.uAspect.value = this.width / this.height;

    // Échelle de taille des étoiles (équivalent du sizeAttenuation de PointsMaterial)
    this.starMaterial.uniforms.uScale.value = (this.height * this.dpr) / 2;
  }

  public render(
    now: number,
    space: number,
    hudCtx?: CanvasRenderingContext2D | null
  ) {
    if (this.destroyed) return;

    if (space <= 0.005) {
      this.canvas.style.opacity = "0";
      if (hudCtx) hudCtx.clearRect(0, 0, this.width, this.height);
      return;
    }

    const progress = THREE.MathUtils.clamp(space, 0, 1);
    this.canvas.style.opacity = smoothstep(0.01, 0.12, progress).toFixed(3);

    // Courbe de plongée
    const plunge = Math.pow(progress, 2.0);

    // Phase 1 (0.20 -> 0.75) : on attend un peu, puis les étoiles sont aspirées
    const starSuck = THREE.MathUtils.clamp((progress - 0.2) / 0.55, 0, 1);
    // Phase 2 (0 -> 0.85) : approche lente jusqu'à être collé au trou noir
    const approach = THREE.MathUtils.clamp(progress / 0.85, 0, 1);
    // Phase 3 (0.85 -> 1) : on franchit l'horizon, tout devient noir
    const dive = smoothstep(0.85, 1.0, progress);
    const swallow = smoothstep(0.93, 1.0, progress);

    // 1800 -> 130 (collé) -> 40 (dans l'horizon)
    const camZ = 1800 - approach * 1670 - dive * dive * 90;
    const camY = (1 - approach) * 40;
    const camX = Math.sin(approach * Math.PI * 0.8) * 20 * (1 - approach);

    this.camera.position.set(camX, camY, camZ);
    this.camera.lookAt(0, 0, 0);
    this.camera.rotation.z = Math.sin(now * 0.0003) * 0.008 + plunge * 0.025;

    this.blackHoleGroup.position.set(0, 0, 0);

    if (this.starField) {
      this.starField.rotation.y = now * 0.00003;
      // Aspiration des étoiles pilotée directement par le scroll
      this.starMaterial.uniforms.uSuck.value = starSuck;
    }

    if (this.blackHoleModel) {
      this.blackHoleModel.rotation.y = now * 0.00008;
    }

    const centerPos = new THREE.Vector3(0, 0, 0);
    centerPos.project(this.camera);
    const screenX = (centerPos.x + 1) / 2;
    const screenY = (centerPos.y + 1) / 2;
    this.postMaterial.uniforms.uCenter.value.set(screenX, screenY);

    // Évolution parfaitement linéaire indexée directement sur le "progrès" du scroll
    const camDist = Math.max(this.camera.position.length(), 36);
    const hr = 35;
    const dynamicHorizonRadius =
      0.5 * (hr / Math.sqrt(camDist * camDist - hr * hr)) /
      Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    const distortion = 0.3 + progress * 1.2;

    this.postMaterial.uniforms.uStrength.value = distortion * (1.0 + plunge * 6.0);
    this.postMaterial.uniforms.uHorizonRadius.value = dynamicHorizonRadius;
    this.postMaterial.uniforms.uDarkness.value = swallow;
    this.postMaterial.uniforms.uTime.value = now * 0.001;

    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);

    this.renderer.setRenderTarget(null);
    this.renderer.clear();
    this.renderer.render(this.postScene, this.postCamera);

    if (hudCtx) {
      this.drawHUD(hudCtx, progress, plunge, swallow);
    }
  }

  private drawHUD(
    ctx: CanvasRenderingContext2D,
    space: number,
    plunge: number,
    swallow: number
  ) {
    ctx.clearRect(0, 0, this.width, this.height);
    if (space <= 0.05 || swallow >= 0.95) return;

    const hudAlpha = smoothstep(0.08, 0.2, space) * (1 - smoothstep(0.82, 0.94, space));
    if (hudAlpha < 0.01) return;

    ctx.save();
    ctx.globalAlpha = hudAlpha;

    const cx = this.width / 2;
    const cy = this.height / 2;
    const reticleR = Math.max(20, (1 - plunge) * 45);

    ctx.strokeStyle = "rgba(255, 100, 50, 0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, reticleR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.font = "bold 11px monospace";
    ctx.textAlign = "center";

    if (plunge > 0.4) {
      const alertAlpha = 0.7 + Math.sin(Date.now() * 0.015) * 0.3;
      ctx.fillStyle = `rgba(255, 60, 60, ${alertAlpha})`;
      ctx.fillText(
        "CRITICAL // EVENT HORIZON PENETRATION IMMINENT",
        cx,
        this.height - 42
      );
    } else {
      ctx.fillStyle = "rgba(255, 140, 60, 0.85)";
      ctx.fillText(
        "SUPERMASSIVE BLACK HOLE // GARGANTUA CLASS",
        cx,
        this.height - 42
      );
    }

    ctx.restore();
  }

  public destroy() {
    if (this.destroyed) return;
    this.destroyed = true;

    if (this.blackHoleModel) {
      this.blackHoleModel.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        child.geometry?.dispose();
        const materials = Array.isArray(child.material)
          ? child.material
          : [child.material];
        materials.forEach((material) => material.dispose());
      });
    }

    this.disposables.forEach((item) => item.dispose());
    this.renderTarget.dispose();
    this.postMaterial.dispose();
    this.renderer.dispose();
  }
}
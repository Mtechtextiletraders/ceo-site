/* Abdul Rasheed Gill — "One spindle": a gold ring-spinning spindle in real-time WebGL.
   Chapter 01  The floor        it rises out of the dark under a spotlight; gold fibres spiral in
                                and wind the yarn package on the bobbin while it spins.
   Chapter 02  Parts to machines the spindle explodes into its parts (package, bobbin, ring &
                                traveller, wharve, bolster) with callouts, then rejoins.
   Chapter 03  Whole mills      the camera pulls back and the one spindle becomes a ring frame:
                                rows of gold spindles lighting up into the depth of a mill.
   Scroll progress comes from main.js (window.__sp.p, scrubbed 1:1 by ScrollTrigger). */
import * as THREE from './vendor/three.module.min.js';

(function () {
  const html = document.documentElement;
  const canvas = document.getElementById('spindle');
  if (!canvas || !html.classList.contains('glok')) return;
  const stage = canvas.parentElement;
  const labelsBox = document.getElementById('stLabels');
  const sp = window.__sp || (window.__sp = { p: 0 });
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || !html.classList.contains('motion');
  const lite = innerWidth < 861 || matchMedia('(pointer:coarse)').matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: !lite, alpha: false, powerPreference: 'high-performance' });
  } catch (e) { html.classList.remove('glok'); return; }
  if (!renderer.getContext()) { html.classList.remove('glok'); return; }
  renderer.setClearColor(0x07060a, 1);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, lite ? 1.5 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.localClippingEnabled = true;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x07060a, 0.035);
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 120);

  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---------- environment (procedural studio, for metal reflections) ---------- */
  (() => {
    const env = new THREE.Scene();
    env.background = new THREE.Color(0x050403);
    const box = new THREE.Mesh(new THREE.BoxGeometry(20, 20, 20), new THREE.MeshBasicMaterial({ color: 0x0a0806, side: THREE.BackSide }));
    env.add(box);
    const panel = (w, h, c, x, y, z, ry, rx) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide }));
      m.position.set(x, y, z); m.rotation.set(rx || 0, ry || 0, 0); env.add(m);
    };
    panel(6, 2.2, 0xfff1d0, 0, 9.5, 0, 0, Math.PI / 2);       // top softbox
    panel(1.4, 12, 0xf2c97a, -9.5, 0, -2, Math.PI / 2);        // left warm strip
    panel(1.0, 12, 0xffe2a8, 9.5, 1, 2, -Math.PI / 2);         // right strip
    panel(10, 1, 0x6b4a1c, 0, -4, -9.5, 0);                     // low back bounce
    const pm = new THREE.PMREMGenerator(renderer);
    scene.environment = pm.fromScene(env, 0.02).texture;
    pm.dispose();
  })();

  /* ---------- materials ---------- */
  const gold = new THREE.MeshStandardMaterial({ color: 0xd9b565, metalness: 1, roughness: 0.28, envMapIntensity: 1.25 });
  const goldDark = new THREE.MeshStandardMaterial({ color: 0x9a7432, metalness: 1, roughness: 0.38, envMapIntensity: 1.1 });
  const steel = new THREE.MeshStandardMaterial({ color: 0xe9dcc0, metalness: 1, roughness: 0.2, envMapIntensity: 1.3 });

  // fine-wound yarn texture
  const yarnTex = (() => {
    const c = document.createElement('canvas'); c.width = 256; c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = '#b8914a'; g.fillRect(0, 0, 256, 256);
    for (let i = -256; i < 512; i += 3) {
      g.strokeStyle = `rgba(${245 + Math.random() * 10 | 0},${215 + Math.random() * 25 | 0},${150 + Math.random() * 40 | 0},${0.35 + Math.random() * 0.4})`;
      g.lineWidth = 1 + Math.random() * 1.2;
      g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 90, 256); g.stroke();
    }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(5, 3);
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    return t;
  })();
  const yarnClip = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
  const yarnMat = new THREE.MeshStandardMaterial({ map: yarnTex, color: 0xf3dc9c, metalness: 0.35, roughness: 0.55, emissive: 0x3a2808, emissiveIntensity: 0.6, clippingPlanes: [yarnClip] });

  /* ---------- spindle parts (lathe geometry, Y up, ~5 units tall) ---------- */
  const lathe = (pts, seg) => new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(p[0], p[1])), seg || (lite ? 40 : 72));
  const spindle = new THREE.Group();
  const parts = {};
  const part = (name, mesh, explode, label, labelAt) => {
    const g = new THREE.Group(); g.add(mesh); spindle.add(g);
    parts[name] = { g, explode, label, labelAt: labelAt || new THREE.Vector3() };
    return g;
  };

  // blade: long tapered steel spindle
  part('blade', new THREE.Mesh(lathe([[0, -2.3], [0.06, -2.3], [0.065, 0], [0.05, 2.0], [0.03, 2.55], [0, 2.62]], 32), steel),
    new THREE.Vector3(0, 0, 0), 'Spindle blade', new THREE.Vector3(0.05, 2.3, 0));

  // bobbin: tube around blade
  part('bobbin', new THREE.Mesh(lathe([[0.075, -1.35], [0.2, -1.35], [0.2, -1.2], [0.16, -1.1], [0.12, 2.2], [0.14, 2.32], [0.075, 2.32]]), goldDark),
    new THREE.Vector3(-0.9, 0.5, 0.2), 'Bobbin', new THREE.Vector3(0.14, 2.25, 0));

  // yarn package (cop): cylindrical body with conical top
  const copPts = [[0.12, -1.05], [0.42, -0.95], [0.56, -0.6], [0.58, 0.6], [0.5, 0.95], [0.16, 1.85], [0.12, 1.9]];
  const cop = new THREE.Mesh(lathe(copPts), yarnMat);
  part('yarn', cop, new THREE.Vector3(1.25, 0.55, -0.2), 'Yarn package', new THREE.Vector3(0.58, 0.3, 0));

  // ring + ring rail plate + traveller
  const ringG = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.045, 16, lite ? 64 : 120), gold); ring.rotation.x = Math.PI / 2;
  const flange = new THREE.Mesh(lathe([[0.74, -0.06], [1.1, -0.06], [1.1, -0.02], [0.74, -0.02]]), goldDark);
  const trav = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 8, 20, Math.PI * 1.3), steel);
  ringG.add(ring, flange, trav);
  ringG.position.y = -1.15;
  part('ring', ringG, new THREE.Vector3(-0.1, -0.25, 0.5), 'Ring & traveller', new THREE.Vector3(1.1, -1.15, 0));

  // wharve (whorl): grooved pulley driven by the tape
  part('wharve', new THREE.Mesh(lathe([[0.07, -1.95], [0.3, -1.95], [0.32, -1.88], [0.28, -1.82], [0.32, -1.76], [0.28, -1.7], [0.32, -1.64], [0.3, -1.58], [0.07, -1.58]]), gold),
    new THREE.Vector3(0.2, -0.55, -0.2), 'Wharve', new THREE.Vector3(0.32, -1.76, 0));

  // bolster & base nut
  part('base', new THREE.Mesh(lathe([[0, -3.0], [0.34, -3.0], [0.34, -2.82], [0.22, -2.78], [0.2, -2.2], [0.15, -2.1], [0, -2.1]]), goldDark),
    new THREE.Vector3(-0.1, -0.8, 0.2), 'Bolster', new THREE.Vector3(0.34, -2.9, 0));

  // the running yarn: from the lappet guide above, down to the traveller
  const yarnLineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 3.6, 0), new THREE.Vector3(), new THREE.Vector3()]);
  const yarnLine = new THREE.Line(yarnLineGeo, new THREE.LineBasicMaterial({ color: 0xffe7b0, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
  spindle.add(yarnLine);
  const guide = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.012, 8, 24), steel); guide.position.y = 3.6; guide.rotation.x = Math.PI / 2;
  spindle.add(guide);

  const hero = new THREE.Group(); hero.add(spindle); scene.add(hero);

  /* ---------- glow sprites, spotlight beam, floor pool ---------- */
  const radial = (stops) => {
    const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
    const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128); stops.forEach(([o, col]) => gr.addColorStop(o, col));
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  };
  const haloTex = radial([[0, 'rgba(255,226,160,.55)'], [0.35, 'rgba(217,181,101,.18)'], [1, 'rgba(217,181,101,0)']]);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }));
  halo.scale.set(8, 8, 1); halo.position.set(0, 0.4, -2.2); hero.add(halo);

  const pool = new THREE.Mesh(new THREE.CircleGeometry(4.2, 64), new THREE.MeshBasicMaterial({ map: radial([[0, 'rgba(255,224,160,.5)'], [0.4, 'rgba(217,181,101,.14)'], [1, 'rgba(0,0,0,0)']]), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }));
  pool.rotation.x = -Math.PI / 2; pool.position.y = -3.02; hero.add(pool);

  const beamMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uO: { value: 0 }, uT: { value: 0 } },
    vertexShader: 'varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv=uv; vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }',
    fragmentShader: 'uniform float uO; uniform float uT; varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ float edge=pow(abs(dot(vN,vV)),1.6); float h=smoothstep(0.,.9,vUv.y)*smoothstep(1.,.75,vUv.y); float n=.85+.15*sin(vUv.y*18.-uT*.6+sin(vUv.x*30.)); gl_FragColor=vec4(vec3(1.,.86,.6)*edge*h*n*uO*.22,1.); }'
  });
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 3.6, 12, 48, 1, true), beamMat);
  beam.position.y = 3.0; hero.add(beam);

  /* ---------- lights ---------- */
  const spot = new THREE.SpotLight(0xffe6b8, 0, 30, 0.42, 0.65, 1.2); spot.position.set(0.4, 9, 2.2); spot.target.position.set(0, -0.5, 0);
  hero.add(spot, spot.target);
  const rim = new THREE.DirectionalLight(0xf0c06a, 0); rim.position.set(-4, 2, -5); hero.add(rim);
  const rim2 = new THREE.DirectionalLight(0xfff0d0, 0); rim2.position.set(5, 1, -3); hero.add(rim2);
  scene.add(new THREE.AmbientLight(0x2a1f12, 0.4));

  /* ---------- fibres spiralling onto the package (chapter 1) ---------- */
  const FN = lite ? 900 : 2200;
  const fibGeo = new THREE.BufferGeometry();
  const fpos = new Float32Array(FN * 3), fseed = new Float32Array(FN * 3);
  for (let i = 0; i < FN; i++) { fseed[i * 3] = Math.random(); fseed[i * 3 + 1] = Math.random(); fseed[i * 3 + 2] = Math.random(); }
  fibGeo.setAttribute('position', new THREE.BufferAttribute(fpos, 3));
  fibGeo.setAttribute('seed', new THREE.BufferAttribute(fseed, 3));
  const fibMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uT: { value: 0 }, uO: { value: 0 }, uPx: { value: renderer.getPixelRatio() } },
    vertexShader: `attribute vec3 seed; uniform float uT; uniform float uPx; varying float vA;
      void main(){
        float ph = fract(seed.x + uT*(.08+seed.y*.06));
        float ang = seed.z*6.2831 + ph*14.0 + uT*.6;
        float r = mix(3.4 + seed.y*1.6, 0.58, smoothstep(0.,1.,ph));
        float y = mix(3.5 - seed.z*7.0, mix(-0.9,0.9,seed.x), smoothstep(.2,1.,ph));
        vec3 p = vec3(cos(ang)*r, y, sin(ang)*r);
        vec4 mv = modelViewMatrix*vec4(p,1.);
        gl_Position = projectionMatrix*mv;
        gl_PointSize = (1.2+seed.y*2.4)*uPx*(9./-mv.z);
        vA = smoothstep(0.,.15,ph)*(1.-smoothstep(.85,1.,ph));
      }`,
    fragmentShader: `uniform float uO; varying float vA; void main(){ vec2 c=gl_PointCoord-.5; float d=length(c); if(d>.5) discard; float a=smoothstep(.5,0.,d); gl_FragColor=vec4(vec3(1.,.86,.55)*a*vA*uO,1.); }`
  });
  const fibres = new THREE.Points(fibGeo, fibMat); fibres.frustumCulled = false; spindle.add(fibres);

  /* ---------- background dust (parallax depth) ---------- */
  const DN = lite ? 350 : 900;
  const dGeo = new THREE.BufferGeometry(); const dp = new Float32Array(DN * 3);
  for (let i = 0; i < DN; i++) { dp[i * 3] = (Math.random() - 0.5) * 30; dp[i * 3 + 1] = (Math.random() - 0.5) * 18; dp[i * 3 + 2] = -Math.random() * 30 + 6; }
  dGeo.setAttribute('position', new THREE.BufferAttribute(dp, 3));
  const dust = new THREE.Points(dGeo, new THREE.PointsMaterial({ color: 0xe8c47c, size: lite ? 0.05 : 0.04, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true }));
  scene.add(dust);

  /* ---------- the ring frame: instanced spindles (chapter 3) ---------- */
  const ROWS = 2, PER = lite ? 14 : 22, GAP = 2.0;
  const mini = (() => {
    // simplified spindle (cop + bobbin tip + wharve) merged into one lathe
    return lathe([[0, -3.0], [0.3, -3.0], [0.3, -2.8], [0.2, -2.7], [0.3, -1.95], [0.3, -1.6], [0.12, -1.5], [0.42, -0.95], [0.56, -0.6], [0.58, 0.6], [0.5, 0.95], [0.16, 1.85], [0.12, 2.3], [0.04, 2.6], [0, 2.62]], 20);
  })();
  const instMat = new THREE.MeshStandardMaterial({ color: 0xd9b565, metalness: 0.9, roughness: 0.35, envMapIntensity: 1.1, transparent: true, opacity: 0 });
  const inst = new THREE.InstancedMesh(mini, instMat, ROWS * PER * 2);
  const instData = [];
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), pv = new THREE.Vector3();
  let k = 0;
  for (let side = -1; side <= 1; side += 2) {
    for (let r = 0; r < ROWS; r++) {
      for (let i = 0; i < PER; i++) {
        const x = side * (1 + i) * GAP;
        instData.push({ x, z: -r * 3.2 - 1.2, d: (i + r * 0.5) / PER, k: k++ });
      }
    }
  }
  inst.count = instData.length;
  scene.add(inst);
  // ring rail lines (gold light lines along each row)
  const railMat = new THREE.LineBasicMaterial({ color: 0xd9b565, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const rails = new THREE.Group();
  for (let r = 0; r < ROWS; r++) for (const yy of [-1.15, -1.95]) {
    const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-PER * GAP, yy, -r * 3.2 - 1.2), new THREE.Vector3(PER * GAP, yy, -r * 3.2 - 1.2)]);
    rails.add(new THREE.Line(g, railMat));
  }
  scene.add(rails);

  /* ---------- callout labels (DOM, projected) ---------- */
  const labelEls = {};
  Object.entries(parts).forEach(([n, pt]) => {
    const el = document.createElement('span'); el.className = 'lb'; el.textContent = pt.label; labelsBox.appendChild(el); labelEls[n] = el;
  });

  /* ---------- sizing: object right of copy on desktop, above copy on mobile ---------- */
  let W = 0, H = 0, mobile = false;
  const resize = () => {
    W = stage.clientWidth; H = stage.clientHeight; mobile = W < 861;
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    if (mobile) camera.setViewOffset(W, H, 0, H * 0.13, W, H);
    else camera.setViewOffset(W, H, -W * 0.17, 0, W, H);
    camera.fov = mobile ? 40 : 32;
    camera.updateProjectionMatrix();
    fibMat.uniforms.uPx.value = renderer.getPixelRatio() * (H / 900);
  };
  resize();
  new ResizeObserver(resize).observe(stage);

  /* ---------- frame ---------- */
  const tmp = new THREE.Vector3();
  const linePos = yarnLineGeo.attributes.position;
  let t0 = performance.now(), cp = sp.p || 0, last = -1;
  function frame(time, force) {
    const t = (time - t0) / 1000;
    cp += ((sp.p || 0) - cp) * (reduce ? 1 : 0.14);           // tiny damping on top of 1:1 scrub
    const p = reduce ? 0.5 : cp;

    // chapter weights
    const reveal = sm(0.0, 0.22, p);                        // rise from darkness
    const wind = sm(0.04, 0.34, p);                         // package builds
    const ex = sm(0.36, 0.5, p) * (1 - sm(0.6, 0.7, p));    // explode then rejoin
    const mill = sm(0.68, 0.95, p);                         // ring frame appears

    // lights
    spot.intensity = lerp(0, 260, reveal) * (1 - mill * 0.35);
    rim.intensity = lerp(0.1, 2.4, reveal); rim2.intensity = lerp(0, 1.4, reveal);
    halo.material.opacity = 0.15 + reveal * 0.85 - mill * 0.3;
    pool.material.opacity = reveal * (1 - mill * 0.6);
    beamMat.uniforms.uO.value = reveal * (1 - mill * 0.7); beamMat.uniforms.uT.value = t;

    // hero spindle placement & spin
    hero.position.y = lerp(-2.4, 0, sm(0, 0.2, p));
    spindle.rotation.y = t * 0.35 + p * Math.PI * 3.2;
    spindle.rotation.z = lerp(0.12, 0, reveal) + ex * -0.08;
    yarnTex.offset.x = -t * 1.6;

    // package fills bottom-up
    yarnClip.constant = lerp(-1.1, 2.0, wind) + hero.position.y;
    cop.scale.set(lerp(0.55, 1, wind), 1, lerp(0.55, 1, wind));
    fibMat.uniforms.uT.value = t; fibMat.uniforms.uO.value = sm(0.02, 0.1, p) * (1 - sm(0.3, 0.4, p));

    // explode
    Object.values(parts).forEach((pt) => { pt.g.position.copy(pt.explode).multiplyScalar(ex); });
    yarnLine.visible = ex < 0.05;

    // traveller orbit + running yarn
    const ta = t * 9;
    parts.ring.g.children[0].children[2].position.set(Math.cos(ta) * 0.78, 0.04, Math.sin(ta) * 0.78);
    tmp.set(Math.cos(ta) * 0.78, -1.15 + 0.04, Math.sin(ta) * 0.78);
    linePos.setXYZ(1, tmp.x * 0.5, 1.9, tmp.z * 0.5);
    linePos.setXYZ(2, tmp.x, tmp.y, tmp.z);
    linePos.needsUpdate = true;

    // instanced ring frame
    instMat.opacity = mill;
    inst.visible = mill > 0.001; rails.visible = inst.visible;
    railMat.opacity = mill * 0.55;
    if (inst.visible) {
      for (const d of instData) {
        const on = sm(d.d * 0.7, d.d * 0.7 + 0.3, mill);
        pv.set(d.x, lerp(-4, 0, on), d.z);
        sc.setScalar(lerp(0.2, 1, on));
        q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, t * 2 + d.k);
        m4.compose(pv, q, sc); inst.setMatrixAt(d.k, m4);
      }
      inst.instanceMatrix.needsUpdate = true;
    }

    // camera path
    const orbit = lerp(0, 0.5, sm(0.3, 0.5, p)) - sm(0.6, 0.72, p) * 0.5 + mill * 0.75;
    const dist = lerp(15, 10.5, reveal) + (mobile ? 2.2 : 0) + ex * (mobile ? 4.5 : 3.2) + mill * (mobile ? 9 : 6);
    const cy = lerp(-1.5, 0.4, reveal) + ex * 0.2 + mill * 3.6;
    camera.position.set(Math.sin(orbit) * dist, cy, Math.cos(orbit) * dist);
    camera.lookAt(mill * -2.2, lerp(-0.4, 0.1, reveal) - mill * 1.0, mill * -2.0);
    dust.position.y = p * 3; dust.rotation.y = t * 0.01;

    renderer.render(scene, camera);

    // labels
    const lv = ex > 0.55 && !reduce ? sm(0.55, 0.9, ex) : 0;
    Object.entries(parts).forEach(([n, pt]) => {
      const el = labelEls[n];
      if (lv <= 0 || (mobile && (n === 'blade' || n === 'bobbin'))) { if (el.style.opacity !== '0') el.style.opacity = '0'; return; }
      tmp.copy(pt.labelAt); pt.g.localToWorld(tmp); tmp.project(camera);
      const x = (tmp.x * 0.5 + 0.5) * W, y = (-tmp.y * 0.5 + 0.5) * H;
      el.style.opacity = lv.toFixed(2);
      el.style.transform = `translate3d(${(x + 6).toFixed(1)}px,${(y - 7).toFixed(1)}px,0)`;
    });
  }

  if (reduce) {
    // static frame: reveal done, parts slightly apart, no animation
    sp.p = 0.5; cp = 0.5;
    const draw = () => frame(performance.now(), true);
    draw(); new ResizeObserver(draw).observe(stage);
    return;
  }

  let running = false;
  const loop = (time) => { if (!running) return; frame(time); requestAnimationFrame(loop); };
  const io = new IntersectionObserver(([e]) => {
    const vis = e.isIntersecting;
    if (vis && !running) { running = true; requestAnimationFrame(loop); }
    else if (!vis) running = false;
  }, { rootMargin: '200px 0px' });
  io.observe(stage);
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); running = false; html.classList.remove('glok'); });
  frame(performance.now());
})();

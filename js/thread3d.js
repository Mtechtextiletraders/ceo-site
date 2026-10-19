/* Abdul Rasheed Gill — "The thread": one luminous cotton thread, real-time WebGL.
   01 boll glows, 02 fibres spin into yarn on a spindle, 03 plies split into career strands,
   04 macro flight along the fibres, 05 the thread lays down as a 1988 to 2026 timeline,
   06 it pulls into one clean line under his name. Scroll progress comes from main.js
   (window.__ts.p, scrubbed 1:1 by ScrollTrigger). Without WebGL the SVG fallback stays. */
import * as THREE from './vendor/three.module.min.js';

(function () {
  const html = document.documentElement;
  const canvas = document.getElementById('loom');
  if (!canvas || !html.classList.contains('glok')) return;
  const stage = canvas.parentElement;
  const labelsBox = document.getElementById('tsLabels');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer:coarse)').matches;
  const lite = innerWidth < 760 || coarse;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: !lite, alpha: false, powerPreference: 'high-performance', failIfMajorPerformanceCaveat: false });
  } catch (e) { return; }
  if (!renderer.getContext()) return;
  renderer.setClearColor(0x06080f, 1);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, lite ? 1.5 : 1.75));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 80);

  /* ---------------- shared path maths (mirrored in JS below) ---------------- */
  const PATH = /* glsl */`
    uniform vec3 uA0; uniform vec3 uA1; uniform vec4 uB; uniform vec3 uC0; uniform vec3 uC1;
    uniform float uMAB; uniform float uMBC; uniform float uTime; uniform float uSway;
    uniform float uSpin; uniform float uTwist; uniform float uPlyR; uniform float uSpread; uniform float uN;
    vec3 pathA(float u){ vec3 p = mix(uA0,uA1,u); float s = sin(3.14159*u);
      p.x += sin(u*3.1+uTime*.35)*uSway*s; p.z += cos(u*2.3+uTime*.3)*uSway*.6*s; return p; }
    vec3 pathB(float u){ return vec3(mix(uB.x,uB.y,u), uB.z + sin(u*9.4248)*uB.w, 0.); }
    vec3 pathC(float u){ return mix(uC0,uC1,u); }
    vec3 basePath(float u){
      float m = clamp(uMAB*1.6 - u*.6, 0., 1.); m = m*m*(3.-2.*m);
      return mix(mix(pathA(u), pathB(u), m), pathC(u), uMBC);
    }
    void frameAt(float u, out vec3 N, out vec3 Bn){
      vec3 T = normalize(basePath(u+.002)-basePath(u-.002));
      N = normalize(cross(T, vec3(0.,0.,1.))); Bn = cross(T,N);
    }
    vec3 plyCenter(float k, float u, vec3 N, vec3 Bn){
      float sp = uSpread * pow(sin(3.14159*u), .8);
      float ang = k*6.28318/uN + u*uTwist*(1.-uSpread) - uSpin;
      float R = uPlyR + sp*(.5 + .16*k);
      return basePath(u) + (N*cos(ang) + Bn*sin(ang))*R;
    }`;

  const shared = {
    uA0: { value: new THREE.Vector3(0.22, -1.55, 0) }, uA1: { value: new THREE.Vector3(0, 1.62, 0) },
    uB: { value: new THREE.Vector4(-3, 3, -0.7, 0.05) },
    uC0: { value: new THREE.Vector3(-1.5, -0.6, 0) }, uC1: { value: new THREE.Vector3(1.5, -0.6, 0) },
    uMAB: { value: 0 }, uMBC: { value: 0 }, uTime: { value: 0 }, uSway: { value: 0.06 },
    uSpin: { value: 0 }, uTwist: { value: 70 }, uPlyR: { value: 0.09 }, uSpread: { value: 0 }, uN: { value: 5 }
  };

  /* ---------------- the yarn: 5 plies + a glow sheath ---------------- */
  const SEG_U = lite ? 260 : 420, SEG_V = lite ? 9 : 14;
  const tubeGeo = (() => {
    const g = new THREE.BufferGeometry(), uv = [], idx = [];
    for (let i = 0; i <= SEG_U; i++) for (let j = 0; j <= SEG_V; j++) uv.push(i / SEG_U, j / SEG_V);
    for (let i = 0; i < SEG_U; i++) for (let j = 0; j < SEG_V; j++) {
      const a = i * (SEG_V + 1) + j, b = a + SEG_V + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(uv.length / 2 * 3), 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 100);
    return g;
  })();

  const plyVert = /* glsl */`
    ${PATH}
    uniform float uK; uniform float uR; uniform vec2 uRange;
    varying vec3 vN; varying vec3 vW; varying vec2 vUV;
    void main(){
      float u = mix(uRange.x, uRange.y, uv.x);
      vec3 N, Bn; frameAt(u, N, Bn);
      vec3 c = uK < -.5 ? basePath(u) : plyCenter(uK, u, N, Bn);
      float a = uv.y*6.28318;
      float tip = smoothstep(0., .012, uv.x) * smoothstep(1., .988, uv.x);
      vec3 rd = N*cos(a) + Bn*sin(a);
      vec3 w = c + rd*uR*mix(.3, 1., tip);
      vW = (modelMatrix*vec4(w,1.)).xyz; vN = rd; vUV = vec2(u, uv.y);
      gl_Position = projectionMatrix*viewMatrix*vec4(vW,1.);
    }`;
  const plyFrag = /* glsl */`
    uniform vec3 uCol; uniform float uGlow; uniform float uOpacity; uniform float uLen; uniform float uProg; uniform float uPen;
    varying vec3 vN; varying vec3 vW; varying vec2 vUV;
    float h(float n){ return fract(sin(n)*43758.5453); }
    void main(){
      vec3 V = normalize(cameraPosition - vW); vec3 N = normalize(vN);
      float w = vUV.y*22. + vUV.x*uLen;
      float id = floor(w), fr = fract(w);
      float fib = smoothstep(0.,.5,fr)*smoothstep(1.,.5,fr);
      float aa = clamp(1.4 - fwidth(w)*1.6, 0., 1.);
      float tone = .7 + .3*h(id*1.71);
      float brk = .82 + .18*sin(vUV.x*uLen*2.7 + h(id)*40.);
      float tex = mix(.78, fib*tone*brk*1.15, aa);
      vec3 L = normalize(vec3(.45,.85,.55));
      float dif = clamp(dot(N,L)*.55 + .5, 0., 1.);
      float rim = pow(1. - abs(dot(N,V)), 2.4);
      float spec = pow(max(dot(reflect(-L,N),V), 0.), 22.)*.4*mix(.5, fib, aa);
      vec3 col = uCol*dif*(.35 + .65*tex) + vec3(1.,.56,.26)*rim*.55 + uCol*uGlow + spec;
      float drawn = smoothstep(uProg + .004, uProg - .004, vUV.x);
      float pen = exp(-pow((vUV.x - uProg)*90., 2.))*uPen;
      col = mix(col*.32, col, mix(1., drawn, uPen > 0. ? 1. : 0.)) + vec3(1.,.62,.3)*pen*2.2;
      gl_FragColor = vec4(col, uOpacity);
    }`;
  const haloFrag = /* glsl */`
    uniform vec3 uCol; uniform float uOpacity;
    varying vec3 vN; varying vec3 vW; varying vec2 vUV;
    void main(){
      vec3 V = normalize(cameraPosition - vW);
      float f = pow(abs(dot(normalize(vN), V)), 2.2);
      gl_FragColor = vec4(uCol*f*uOpacity, 1.);
    }`;

  const CREAM = new THREE.Color(0.93, 0.9, 0.83), COPPER = new THREE.Color(0.88, 0.44, 0.18);
  const plies = [];
  for (let k = 0; k < 5; k++) {
    const m = new THREE.ShaderMaterial({
      uniforms: { ...shared, uK: { value: k }, uR: { value: 0.03 }, uRange: { value: new THREE.Vector2(0.98, 1) },
        uCol: { value: (k === 0 ? COPPER : CREAM).clone() }, uGlow: { value: 0.08 }, uOpacity: { value: 1 }, uLen: { value: 700 + k * 23 },
        uProg: { value: 1 }, uPen: { value: 0 } },
      vertexShader: plyVert, fragmentShader: plyFrag, transparent: true
    });
    const mesh = new THREE.Mesh(tubeGeo, m); mesh.frustumCulled = false; mesh.renderOrder = 2;
    scene.add(mesh); plies.push(mesh);
  }
  const haloMat = new THREE.ShaderMaterial({
    uniforms: { ...shared, uK: { value: -1 }, uR: { value: 0.22 }, uRange: { value: new THREE.Vector2(0, 1) }, uCol: { value: new THREE.Color(0.95, 0.55, 0.25) }, uOpacity: { value: 0.35 } },
    vertexShader: plyVert, fragmentShader: haloFrag, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
  });
  const halo = new THREE.Mesh(tubeGeo, haloMat); halo.frustumCulled = false; halo.renderOrder = 3; scene.add(halo);

  /* ---------------- fibres: boll, hairs, drifting dust ---------------- */
  const NP = lite ? 1400 : 3200;
  const pGeo = new THREE.BufferGeometry();
  const aBoll = new Float32Array(NP * 3), aDust = new Float32Array(NP * 3), aSeed = new Float32Array(NP * 4);
  const gauss = () => { let s = 0; for (let i = 0; i < 4; i++) s += Math.random(); return (s - 2) / 2; };
  const lobes = [];
  for (let k = 0; k < 5; k++) { const a = k * 1.2566 + 0.3; lobes.push([Math.cos(a) * 0.3, 0.06 + Math.sin(k * 2.1) * 0.07, Math.sin(a) * 0.3]); }
  for (let i = 0; i < NP; i++) {
    let x, y, z;
    if (Math.random() < 0.84) { const l = lobes[i % 5]; x = l[0] + gauss() * 0.3; y = l[1] + gauss() * 0.27; z = l[2] + gauss() * 0.3; }
    else { const th = Math.random() * 6.283, ph = Math.acos(2 * Math.random() - 1), r = 0.55 + Math.random() * 0.55; x = r * Math.sin(ph) * Math.cos(th); y = r * Math.cos(ph) * 0.8; z = r * Math.sin(ph) * Math.sin(th); }
    aBoll.set([x, y, z], i * 3);
    aDust.set([(Math.random() * 2 - 1) * 7.5, (Math.random() * 2 - 1) * 4, -6 + Math.random() * 9.5], i * 3);
    aSeed.set([Math.random(), Math.random() * 6.283, Math.random(), 0.5 + Math.random() * Math.random() * 1.6], i * 4);
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(aBoll, 3));
  pGeo.setAttribute('aBoll', new THREE.BufferAttribute(aBoll, 3));
  pGeo.setAttribute('aDust', new THREE.BufferAttribute(aDust, 3));
  pGeo.setAttribute('aSeed', new THREE.BufferAttribute(aSeed, 4));
  pGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 100);
  const pMat = new THREE.ShaderMaterial({
    uniforms: { ...shared, uBoll: { value: new THREE.Vector3(0, 1.95, 0) }, uBollS: { value: 1 }, uDrift: { value: 0 },
      uToYarn: { value: 0 }, uToDust: { value: 0 }, uToDust2: { value: 0 }, uPix: { value: 600 }, uSize: { value: 0.05 },
      uRange: { value: new THREE.Vector2(0, 1) }, uAlpha: { value: 1 } },
    vertexShader: /* glsl */`
      ${PATH}
      attribute vec3 aBoll; attribute vec3 aDust; attribute vec4 aSeed;
      uniform vec3 uBoll; uniform float uBollS; uniform float uDrift; uniform float uToYarn; uniform float uToDust; uniform float uToDust2;
      uniform float uPix; uniform float uSize; uniform vec2 uRange;
      varying float vA; varying float vCu;
      void main(){
        float r = aSeed.z;
        vec3 b = uBoll + aBoll*uBollS;
        b += aBoll*uDrift*(.3 + r*1.7) + vec3(sin(uTime*.5+r*20.), cos(uTime*.4+r*13.), sin(uTime*.3+r*7.))*.025*(1. + uDrift*5.);
        float u = mix(uRange.x, uRange.y, aSeed.x);
        vec3 N, Bn; frameAt(u, N, Bn);
        float ang = aSeed.y + u*uTwist - uSpin*.6;
        vec3 y = basePath(u) + (N*cos(ang) + Bn*sin(ang))*(uPlyR*1.6 + .045 + r*r*.16);
        bool hair = r < .5;
        float ty = hair ? smoothstep(r*1.1, r*1.1 + .45, uToYarn) : 0.;
        float dd = hair ? uToDust2 : uToDust;
        float td = smoothstep(fract(r*3.7)*.5, fract(r*3.7)*.5 + .5, dd);
        vec3 d = aDust + vec3(sin(uTime*.07 + r*40.)*.3, 0., cos(uTime*.05 + r*9.)*.2);
        d.y = mod(d.y + uTime*.05*(.4 + r) + 4., 8.) - 4.;
        vec3 p = mix(mix(b, y, ty), d, td);
        vec4 mv = viewMatrix*vec4(p, 1.);
        gl_Position = projectionMatrix*mv;
        float z = max(-mv.z, .001);
        gl_PointSize = clamp(uSize*aSeed.w*uPix/z, 1., 60.);
        vA = (.3 + .7*r) * clamp(1.25 - z*.07, .2, 1.) * smoothstep(.05, .3, z) * mix(1., .55, td);
        vCu = step(.9, fract(r*7.13));
      }`,
    fragmentShader: /* glsl */`
      uniform float uAlpha; varying float vA; varying float vCu;
      void main(){
        float d = length(gl_PointCoord - .5);
        float a = smoothstep(.5, 0., d); a *= a;
        vec3 c = mix(vec3(.93,.9,.83), vec3(.95,.5,.22), vCu);
        gl_FragColor = vec4(c*a*vA*uAlpha, 1.);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
  });
  const points = new THREE.Points(pGeo, pMat); points.frustumCulled = false; points.renderOrder = 4; scene.add(points);

  /* ---------------- glow (spotlight bloom behind the object) ---------------- */
  const glowMat = new THREE.ShaderMaterial({
    uniforms: { uCol: { value: new THREE.Color(0.95, 0.5, 0.22) }, uI: { value: 0.8 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: 'uniform vec3 uCol; uniform float uI; varying vec2 vUv; void main(){ float d = length(vUv-.5)*2.; float a = exp(-d*d*4.)*.8 + exp(-d*d*28.)*.6; a *= smoothstep(1.,.85,d); gl_FragColor = vec4(mix(uCol, vec3(1.,.93,.82), exp(-d*d*30.))*a*uI, 1.); }',
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
  });
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), glowMat); glow.renderOrder = 1; scene.add(glow);

  /* ---------------- spindle: bobbin + yarn package ---------------- */
  const latheMat = (col, stripe) => new THREE.ShaderMaterial({
    uniforms: { uCol: { value: col }, uStripe: { value: stripe }, uOpacity: { value: 1 } },
    vertexShader: 'varying vec3 vN; varying vec3 vW; varying vec3 vL; void main(){ vL = position; vN = normalize(mat3(modelMatrix)*normal); vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }',
    fragmentShader: `uniform vec3 uCol; uniform float uStripe; uniform float uOpacity; varying vec3 vN; varying vec3 vW; varying vec3 vL;
      void main(){ vec3 N = normalize(vN), V = normalize(cameraPosition - vW), L = normalize(vec3(.45,.85,.55));
        float dif = clamp(dot(N,L)*.55+.5,0.,1.); float rim = pow(1.-abs(dot(N,V)),2.5);
        float an = atan(vL.z, vL.x);
        float s = sin(vL.y*340. + an*6.)*.5+.5; float s2 = sin(vL.y*340. - an*6.)*.5+.5;
        float w = mix(1., .7 + .3*max(s,s2), uStripe);
        vec3 c = uCol*dif*w + vec3(1.,.56,.26)*rim*.5;
        gl_FragColor = vec4(c, uOpacity); }`,
    transparent: true
  });
  const spindle = new THREE.Group();
  const pkgProfile = [[0.05, -1.15], [0.27, -1.0], [0.36, -0.75], [0.37, -0.3], [0.33, 0.05], [0.16, 0.32], [0.06, 0.42]].map(([r, y]) => new THREE.Vector2(r, y));
  const pkg = new THREE.Mesh(new THREE.LatheGeometry(pkgProfile, lite ? 36 : 64), latheMat(CREAM.clone().multiplyScalar(0.9), 1));
  const bobProfile = [[0.0, -1.32], [0.075, -1.32], [0.075, -1.18], [0.052, -1.15], [0.042, 0.95], [0.032, 1.02], [0.0, 1.02]].map(([r, y]) => new THREE.Vector2(r, y));
  const bob = new THREE.Mesh(new THREE.LatheGeometry(bobProfile, 28), latheMat(new THREE.Color(0.42, 0.2, 0.08), 0));
  spindle.add(pkg, bob); spindle.scale.setScalar(0.62); spindle.position.set(0.22, -1.86, 0); scene.add(spindle);

  /* ---------------- helpers ---------------- */
  const clamp01 = (x) => Math.min(1, Math.max(0, x));
  const sstep = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const key = (p, ks) => {
    if (p <= ks[0][0]) return ks[0][1];
    for (let i = 1; i < ks.length; i++) if (p <= ks[i][0]) {
      const a = ks[i - 1], b = ks[i], t = sstep(a[0], b[0], p);
      return Array.isArray(a[1]) ? a[1].map((v, j) => v + (b[1][j] - v) * t) : a[1] + (b[1] - a[1]) * t;
    }
    return ks[ks.length - 1][1];
  };
  // JS mirror of the GLSL path (for HTML labels)
  const V3 = THREE.Vector3;
  const u3 = (n) => shared[n].value;
  function basePath(u, out) {
    const A0 = u3('uA0'), A1 = u3('uA1'), B = u3('uB'), C0 = u3('uC0'), C1 = u3('uC1'), t = u3('uTime'), sw = u3('uSway');
    const s = Math.sin(Math.PI * u);
    const ax = A0.x + (A1.x - A0.x) * u + Math.sin(u * 3.1 + t * 0.35) * sw * s;
    const ay = A0.y + (A1.y - A0.y) * u, az = A0.z + (A1.z - A0.z) * u + Math.cos(u * 2.3 + t * 0.3) * sw * 0.6 * s;
    const bx = B.x + (B.y - B.x) * u, by = B.z + Math.sin(u * 9.4248) * B.w;
    let m = clamp01(u3('uMAB') * 1.6 - u * 0.6); m = m * m * (3 - 2 * m);
    const mc = u3('uMBC');
    let x = ax + (bx - ax) * m, y = ay + (by - ay) * m, z = az * (1 - m);
    x += (C0.x + (C1.x - C0.x) * u - x) * mc; y += (C0.y + (C1.y - C0.y) * u - y) * mc; z += (C0.z - z) * mc;
    return out.set(x, y, z);
  }
  const _a = new V3(), _b = new V3(), _T = new V3(), _N = new V3(), _Bn = new V3(), _Z = new V3(0, 0, 1);
  function plyPoint(k, u, out) {
    basePath(u + 0.002, _a); basePath(u - 0.002, _b);
    _T.subVectors(_a, _b).normalize(); _N.crossVectors(_T, _Z).normalize(); _Bn.crossVectors(_T, _N);
    const sp = u3('uSpread') * Math.pow(Math.sin(Math.PI * u), 0.8);
    const ang = k * 6.28318 / 5 + u * u3('uTwist') * (1 - u3('uSpread')) - u3('uSpin');
    const R = u3('uPlyR') + sp * (0.5 + 0.16 * k);
    basePath(u, out);
    return out.addScaledVector(_N, Math.cos(ang) * R).addScaledVector(_Bn, Math.sin(ang) * R);
  }

  /* ---------------- HTML labels: split strands + timeline ticks ---------------- */
  const STRANDS = [
    ['1988', 'Spare parts'], ['', 'Whole machines'], ['50+', 'Complete mills'], ['', innerWidth < 760 ? 'Imports' : 'Imports · Turkey, Egypt, Russia'], ['100+', 'Owners advised']
  ];
  const STRAND_U = [0.36, 0.52, 0.44, 0.6, 0.68];
  const TICKS = [[0.0, '1988', 'M Tech founded'], [0.2, '', 'Spare parts'], [0.4, '', 'Machines'], [0.6, '50+', 'Mills'], [0.8, '', 'Imports'], [1.0, '2026', 'Today']];
  const strandEls = [], tickEls = [];
  if (labelsBox) {
    STRANDS.forEach(([n, t]) => {
      const el = document.createElement('div'); el.className = 'tl';
      el.innerHTML = `<i></i><b></b><span>${n ? `<em>${n}</em> · ` : ''}${t}</span>`;
      labelsBox.appendChild(el); strandEls.push({ el, line: el.querySelector('i'), txt: el.querySelector('span') });
    });
    TICKS.forEach(([, y, t], i) => {
      const el = document.createElement('div'); el.className = 'tk' + (i === 0 ? ' first' : i === TICKS.length - 1 ? ' last' : '');
      el.innerHTML = `<b></b><span>${y ? `<em>${y}</em>` : ''}${t}</span>`;
      labelsBox.appendChild(el); tickEls.push({ el, txt: el.querySelector('span') });
    });
  }

  /* ---------------- layout / resize ---------------- */
  let W = 1, H = 1, mob = false, finalCam = 8.5;
  const finalLine = document.querySelector('.tc-line'), finalCard = document.querySelector('.tc-final');
  function layout() {
    W = Math.max(1, stage.clientWidth); H = Math.max(1, stage.clientHeight);
    mob = W < 760;
    renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.fov = mob ? 42 : 35; camera.updateProjectionMatrix();
    const asp = W / H, tanH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    finalCam = mob ? 9.5 : 8.5;
    const halfH = finalCam * tanH, halfW = halfH * asp;
    // timeline line across the page
    const lineY = mob ? 0.12 : -0.5; // NDC
    shared.uB.value.set(-halfW * (mob ? 0.84 : 0.8), halfW * (mob ? 0.84 : 0.8), lineY * halfH, mob ? 0.03 : 0.05);
    // final clean line under the name (from the real HTML line)
    if (finalLine && finalCard) {
      const x0 = finalCard.offsetLeft + finalLine.offsetLeft, y0 = finalCard.offsetTop + finalLine.offsetTop;
      const w = finalLine.offsetWidth || 400;
      const nx0 = (x0 / W) * 2 - 1, nx1 = ((x0 + w) / W) * 2 - 1, ny = -(y0 / H) * 2 + 1;
      shared.uC0.value.set(nx0 * halfW, ny * halfH, 0); shared.uC1.value.set(nx1 * halfW, ny * halfH, 0);
    }
    pMat.uniforms.uPix.value = H * renderer.getPixelRatio() * 0.5 / tanH;
    pMat.uniforms.uSize.value = mob ? 0.06 : 0.05;
    needs = true;
  }

  /* ---------------- the scene timeline (p: 0..1) ---------------- */
  const look = new V3();
  function apply(p, t) {
    shared.uTime.value = t;
    const ch = (a) => a / 6; // chapter boundary helper
    // camera: [x,y,z, lookX,lookY,lookZ]
    const far = mob ? 1.35 : 1;
    const cam = key(p, [
      [0.0, [0, 1.95, 3.1 * far, 0, 1.92, 0]],
      [0.11, [0.35, 1.9, 3.8 * far, 0, 1.85, 0]],
      [ch(1.5), [0, -0.3, 6.9 * far, 0, -0.38, 0]],
      [ch(2), [1.1, -0.2, 6.6 * far, 0, -0.32, 0]],
      [ch(2.45), [3.7, 0.5, 6.2 * far, 0, 0.1, 0]],
      [ch(2.95), [3.3, 0.45, 6.5 * far, 0, 0.1, 0]],
      [ch(3.3), [0.08, 1.15, 0.52, 0.0, 0.85, 0]],
      [ch(3.85), [0.07, -0.15, 0.44, 0.0, -0.45, 0]],
      [ch(4.3), [0, 0, finalCam, 0, 0, 0]],
      [1, [0, 0, finalCam, 0, 0, 0]]
    ]);
    camera.position.set(cam[0], cam[1], cam[2]); look.set(cam[3], cam[4], cam[5]); camera.lookAt(look);
    // frame the object beside the copy (desktop: right; phone: upper half)
    const off = key(p, [[0, 1], [ch(3.05), 1], [ch(3.3), 0.55], [ch(3.9), 0.55], [ch(4.25), 0], [1, 0]]);
    const ox = mob ? 0 : -0.17 * W * off, oy = mob ? H * key(p, [[0, 0.2], [ch(3.9), 0.2], [ch(4.25), 0], [1, 0]]) : 0;
    camera.setViewOffset(W, H, ox, oy, W, H);

    // yarn shape
    const grow = sstep(0.1, ch(1.55), p);
    shared.uSpin.value = p * 6.283 * 9;
    shared.uPlyR.value = key(p, [[0, 0.11], [ch(1.1), 0.1], [ch(1.8), 0.034], [ch(5), 0.034], [ch(5.55), 0.0015]]);
    shared.uSpread.value = key(p, [[ch(2.1), 0], [ch(2.45), 1], [ch(2.75), 1], [ch(3.05), 0]]);
    shared.uMAB.value = sstep(ch(3.85), ch(4.3), p);
    shared.uMBC.value = sstep(ch(5.02), ch(5.6), p);
    shared.uSway.value = 0.06 * (1 - shared.uMAB.value) * (1 - sstep(ch(3.1), ch(3.3), p) * 0.8);
    const fibR = key(p, [[0, 0.03], [ch(5), 0.03], [ch(5.55), 0.011]]);
    const prog = sstep(ch(4.3), ch(4.95), p), pen = sstep(ch(4.2), ch(4.35), p) * (1 - sstep(ch(4.95), ch(5.15), p));
    const vis = sstep(0.08, 0.13, p);
    plies.forEach((m, k) => {
      const u = m.material.uniforms;
      u.uRange.value.set(1 - grow * 1, 1).x = Math.min(0.985, 1 - grow);
      u.uR.value = fibR;
      u.uOpacity.value = vis;
      u.uGlow.value = 0.06 + (k === 0 ? 0.12 : 0) + sstep(ch(5.1), ch(5.6), p) * 0.5;
      u.uProg.value = prog; u.uPen.value = k === 0 ? pen : 0;
      if (k === 0) u.uCol.value.copy(COPPER); else u.uCol.value.copy(CREAM).lerp(COPPER, sstep(ch(5.1), ch(5.7), p) * 0.75);
    });
    haloMat.uniforms.uRange.value.set(Math.min(0.985, 1 - grow), pen > 0.01 ? Math.max(0.02, prog) : 1);
    haloMat.uniforms.uR.value = key(p, [[0, 0.2], [ch(3.1), 0.2], [ch(3.4), 0.09], [ch(3.85), 0.09], [ch(4.3), 0.16], [ch(5.5), 0.07]]);
    haloMat.uniforms.uOpacity.value = vis * key(p, [[0, 0.35], [ch(3.2), 0.35], [ch(3.4), 0.12], [ch(3.85), 0.12], [ch(4.3), 0.4], [1, 0.45]]);

    // fibres
    const u = pMat.uniforms;
    u.uDrift.value = key(p, [[0, 0], [0.12, 0.35]]);
    u.uBollS.value = 1 - sstep(ch(1.2), ch(1.9), p) * 0.65;
    u.uToYarn.value = sstep(0.11, ch(1.85), p);
    u.uToDust.value = sstep(0.1, ch(1.6), p);
    u.uToDust2.value = sstep(ch(3.75), ch(4.3), p);
    u.uRange.value.set(Math.min(0.985, 1 - grow), 1);
    u.uAlpha.value = key(p, [[0, 0.75], [0.04, 1]]);

    // spindle
    const sv = sstep(0.11, 0.2, p) * (1 - sstep(ch(3.85), ch(4.15), p));
    spindle.visible = sv > 0.01;
    spindle.rotation.y = shared.uSpin.value * 0.5;
    spindle.position.y = -1.86 - (1 - sv) * 0.4;
    pkg.material.uniforms.uOpacity.value = bob.material.uniforms.uOpacity.value = sv;
    const pkgScale = 0.7 + 0.3 * sstep(ch(1.2), ch(2.1), p);
    pkg.scale.set(pkgScale, 1, pkgScale);

    // glow follows the story
    const B = shared.uB.value;
    const gx = key(p, [[0, 0], [ch(4.3), 0], [ch(4.95), B.y], [ch(5.2), 0]]);
    const g = key(p, [
      [0, [0, 1.92, -0.3, 2.6, 0.95]], [0.12, [0, 1.9, -0.3, 3.2, 0.8]], [ch(1.6), [0, 0.2, -1.2, 7, 0.32]],
      [ch(3.1), [0, 0.2, -1.2, 7, 0.32]], [ch(3.4), [0, 0.6, -0.6, 2.5, 0.1]], [ch(3.85), [0, 0.6, -0.6, 2.5, 0.1]],
      [ch(4.3), [B.x, B.z, -0.4, 2.4, 0.55]], [ch(5.1), [0, B.z, -0.4, 2.4, 0.55]], [ch(5.6), [(shared.uC0.value.x + shared.uC1.value.x) / 2, shared.uC0.value.y, -0.8, 5, 0.3]], [1, [(shared.uC0.value.x + shared.uC1.value.x) / 2, shared.uC0.value.y, -0.8, 5, 0.3]]
    ]);
    glow.position.set(p > ch(4.3) && p < ch(5.1) ? gx : g[0], g[1], g[2]);
    glow.scale.setScalar(g[3]); glowMat.uniforms.uI.value = g[4] * (0.9 + 0.1 * Math.sin(t * 1.3));
    glow.quaternion.copy(camera.quaternion);

    camera.updateMatrixWorld();
    placeLabels(p, prog);
  }

  const _p = new V3();
  const toScreen = (v) => { v.project(camera); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H, v.z]; };
  function placeLabels(p, prog) {
    if (!labelsBox || reduce) return;
    const sa = sstep(0.4, 0.43, p) * (1 - sstep(0.475, 0.5, p));
    const cx = toScreen(basePath(0.5, _p))[0];
    strandEls.forEach((s, k) => {
      if (sa < 0.01) { s.el.style.opacity = 0; return; }
      const [x, y] = toScreen(plyPoint(k, STRAND_U[k], _p));
      let left = x < cx - 4;
      const tw = s.txt.offsetWidth || 160, L = mob ? 26 : 54;
      if (left && x - L - 8 - tw < 8) left = false;
      if (!left && x + L + 8 + tw > W - 8) left = true;
      s.line.style.width = L + 'px';
      s.line.style.transform = left ? 'scaleX(-1)' : 'none';
      let tx = left ? (-L - 8 - tw) : (L + 8);
      tx = Math.max(8 - x, Math.min(W - 8 - tw - x, tx));
      s.txt.style.left = tx + 'px';
      s.el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
      s.el.style.opacity = (sa * (0.4 + 0.6 * sstep(0, 0.4, sa))).toFixed(3);
    });
    const ta = sstep(4.25 / 6, 4.4 / 6, p) * (1 - sstep(5.0 / 6, 5.15 / 6, p));
    tickEls.forEach((s, i) => {
      const tu = TICKS[i][0];
      const on = ta * sstep(tu - 0.03, tu + 0.01, prog);
      if (on < 0.01) { s.el.style.opacity = 0; return; }
      const [x, y] = toScreen(basePath(tu, _p));
      s.el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
      s.el.style.opacity = on.toFixed(3);
      const up = mob && i % 2 === 1;
      s.txt.style.top = up ? '-58px' : '18px';
    });
  }

  /* ---------------- run ---------------- */
  let needs = true, visible = true, lastP = -1, t0 = performance.now(), lost = false;
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); lost = true; html.classList.remove('gl-ready'); });
  canvas.addEventListener('webglcontextrestored', () => { lost = false; layout(); html.classList.add('gl-ready'); });
  new ResizeObserver(() => layout()).observe(stage);
  addEventListener('resize', () => { layout(); });
  layout();

  if (reduce || !window.__ts) {
    // static frame: the spun yarn on its spindle
    const draw = () => { layout(); camera.clearViewOffset(); apply(0.3, 0); camera.clearViewOffset(); camera.updateProjectionMatrix(); renderer.render(scene, camera); };
    try { draw(); html.classList.add('gl-ready'); } catch (e) { return; }
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(draw, 150); });
    return;
  }

  let sp = window.__ts.p || 0, first = true, nFrames = 0;
  const frame = (now) => {
    requestAnimationFrame(frame);
    const r = stage.getBoundingClientRect(); visible = r.bottom > -50 && r.top < innerHeight + 50;
    if (!visible || lost) return; nFrames++;
    const target = window.__ts.p || 0;
    sp += (target - sp) * (Math.abs(target - sp) > 0.25 ? 1 : 0.22);
    const t = (now - t0) / 1000;
    apply(sp, t);
    renderer.render(scene, camera);
    if (first) { first = false; html.classList.add('gl-ready'); }
  };
  try { apply(sp, 0); renderer.render(scene, camera); } catch (e) { return; }
  requestAnimationFrame(frame);
})();

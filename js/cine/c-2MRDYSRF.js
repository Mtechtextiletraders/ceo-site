import{A as ue,C as j,G as Te,H as Xe,K as b,N as ke,O as de,P as i,Q as T,R as X,S as Le,T as Ie,U as _e,c as ae,d as ie,h as y,i as u,k as H,l as d,m as z,n as v,p as h,q as ze,r as re,u as se,v as le}from"./c-XNNEWEI2.js";var Ve=`
uniform float uT, uPull, uDraft, uTwist, uFlow, uWind, uX0, uX1, uFront, uFluff;
uniform vec3 uBoll[3];
attribute vec4 aS; // seeds
float h1(float n){ return fract(sin(n*127.1)*43758.5453); }
vec3 h3(float n){ return vec3(h1(n), h1(n+17.3), h1(n+41.9)); }
vec3 sdir(float a, float b){ float th=a*6.28318, ph=acos(2.*b-1.); return vec3(sin(ph)*cos(th), cos(ph), sin(ph)*sin(th)); }
// position of fibre (seeds aS) at param s in [0,1]; returns pos, writes the local "normal" for shading
vec3 fibre(float s, out vec3 nrm, out float fade){
  float id = aS.x*1000.;
  // ---- boll ----
  int b = int(floor(aS.y*2.999));
  vec3 C = b==0 ? uBoll[0] : (b==1 ? uBoll[1] : uBoll[2]);
  float lobe = floor(aS.z*4.);
  float la = lobe*1.5708 + h1(float(b))*1.2;
  vec3 ld = normalize(vec3(cos(la)*.78, .62, sin(la)*.78));
  vec3 lc = C + ld*.30;
  vec3 rd = sdir(h1(id+3.), h1(id+5.));
  float rr = .36*pow(h1(id+7.), .45);
  rr *= 1. + .13*sin(rd.x*7.+rd.y*5.+lobe) * uFluff;
  vec3 p0 = lc + rd*rr;
  vec3 tang = normalize(cross(rd, h3(id+9.)-.5) + 1e-4);
  float flen = .16 + .22*h1(id+11.);
  float curl = (s-.5)*flen;
  vec3 pb = p0 + tang*curl + rd*(sin(s*6.+id)*.025) + cross(tang, rd)*sin(s*3.14159+id)*.035;
  pb += (h3(id+13.)-.5)*.02*sin(uT*.6+id);
  vec3 nb = normalize(pb - C);
  // ---- strand (sliver -> yarn) along +x ----
  float span = uX1 - uX0;
  float xc0 = uX0 + aS.w*span;
  float xc = uX0 + mod(xc0 - uX0 + uFlow, span);
  float slen = .36 + .3*h1(id+19.);
  float x = xc + (s-.5)*slen*(1.-.3*uDraft);
  // drafting front moves right->left; right of it the strand is yarn
  float yk = smoothstep(uFront-.5, uFront+.5, x) * uDraft;
  float R = mix(.24, .028, yk);
  float rad = R*sqrt(h1(id+23.)) * (1. + .25*sin(x*3.+id)*(1.-yk));
  float tw = mix(.15, 34., yk*uTwist);
  float ang = h1(id+29.)*6.28318 + tw*x - uT*uTwist*yk*7.;
  vec3 ps = vec3(x, rad*cos(ang), rad*sin(ang));
  ps.y += sin(x*1.4 + uT*.5)*.04*(1.-yk);
  vec3 ns = normalize(vec3(0., cos(ang), sin(ang)));
  // ---- transition boll -> strand: staggered by fibre, arcs over ----
  float d = aS.w*.55 + h1(id+31.)*.12;
  float m = smoothstep(d, d+.42, uPull);
  vec3 mid = mix(pb, ps, .5) + vec3(0., .55 + .4*h1(id+37.), (h1(id+41.)-.5)*.6);
  vec3 a1 = mix(pb, mid, m), a2 = mix(mid, ps, m);
  vec3 pos = mix(a1, a2, m);
  nrm = normalize(mix(nb, ns, m));
  // flowing ends fade out at the cone and in at the start
  fade = mix(1., smoothstep(uX0, uX0+.6, x) * (1.-smoothstep(uX1-.25, uX1, x)), m);
  return pos;
}`;function $e(We,De){let p=De.lite,t=new Ie(We,{lite:p,bg:395279,exposure:1,shadows:!1,fov:32,near:.05,far:60,bloom:.55,bloomRadius:.7,bloomThreshold:.8}),{scene:n,camera:w}=t,ve=Le(t.renderer,{warmK:4,coolK:2});n.environment=ve,n.environmentIntensity=.7;let fe=[new u(-3.2,-.15,0),new u(-2.35,.55,-.9),new u(-2.15,-.75,.75)],k=-2.6,a=3.05,r={uT:{value:0},uPull:{value:0},uDraft:{value:0},uTwist:{value:0},uFlow:{value:0},uWind:{value:0},uX0:{value:k},uX1:{value:a},uFront:{value:a},uFluff:{value:1},uBoll:{value:fe},uL:{value:new u(.4,.8,.5).normalize()},uI:{value:1},uPix:{value:600}},L=p?4200:11e3,M=6,Ne=new Float32Array(L*M*2*3),ce=new Float32Array(L*M*2*4),me=new Float32Array(L*M*2),E=0;for(let e=0;e<L;e++){let o=Math.random(),c=Math.random(),l=Math.random(),F=Math.random();for(let s=0;s<M;s++)for(let S=0;S<2;S++)ce.set([o,c,l,F],E*4),me[E]=(s+S)/M,E++}let I=new z;I.setAttribute("position",new d(Ne,3)),I.setAttribute("aS",new d(ce,4)),I.setAttribute("aP",new d(me,1));let Be=new h({uniforms:r,transparent:!0,depthWrite:!0,blending:ae,vertexShader:Ve+`
      attribute float aP; uniform vec3 uL; varying float vL; varying float vF; varying float vD;
      void main(){ vec3 n; float fd; vec3 p = fibre(aP, n, fd);
        vec4 mv = modelViewMatrix*vec4(p,1.); gl_Position = projectionMatrix*mv;
        vec3 V = normalize(-mv.xyz); vec3 nv = normalize(mat3(viewMatrix)*n);
        float diff = .5+.5*dot(n, uL);
        float rim = pow(1.-abs(dot(nv, V)), 2.);
        vL = .32 + .68*diff + .55*rim; vF = fd; vD = h1(aS.x*1000.+51.); }`,fragmentShader:`uniform float uI; varying float vL; varying float vF; varying float vD;
      void main(){ vec3 c = mix(vec3(.93,.90,.84), vec3(1.,.97,.92), vD); c *= vL;
        float a = (.38+.4*vD)*vF*uI; if(a<.01) discard; gl_FragColor = vec4(c, a); }`}),he=new se(I,Be);he.frustumCulled=!1,n.add(he);let U=p?1600:4200,O=new z,pe=new Float32Array(U*4);for(let e=0;e<U*4;e++)pe[e]=Math.random();O.setAttribute("position",new d(new Float32Array(U*3),3)),O.setAttribute("aS",new d(pe,4));let Ge=new h({uniforms:r,transparent:!0,depthWrite:!1,blending:ae,vertexShader:Ve+`uniform vec3 uL; uniform float uPix; varying float vL; varying float vA;
      void main(){ vec3 n; float fd; vec3 p = fibre(.5, n, fd);
        vec4 mv = modelViewMatrix*vec4(p,1.); gl_Position = projectionMatrix*mv;
        float m = smoothstep(aS.w*.55, aS.w*.55+.42, uPull);
        gl_PointSize = uPix*mix(.085, .03, m)*(.6+.8*h1(aS.x*1000.+3.))/-mv.z;
        vL = .45 + .55*(.5+.5*dot(n,uL)); vA = fd*(1.-.7*m); }`,fragmentShader:`uniform float uI; varying float vL; varying float vA;
      void main(){ float d = length(gl_PointCoord-.5); if(d>.5) discard;
        float a = smoothstep(.5,.0,d)*.16*vA*uI; gl_FragColor = vec4(vec3(1.,.97,.92)*vL, a); }`}),we=new le(O,Ge);we.frustumCulled=!1,n.add(we);let Re=new b({color:4862756,roughness:.7,metalness:0,sheen:.6,sheenColor:new H(9067066),side:2}),He=new b({color:3811870,roughness:.8}),g=new re;n.add(g),fe.forEach((e,o)=>{for(let l=0;l<5;l++){let F=new Te(.42,24,16,0,1.15,1.35,1.25),s=new v(F,Re);s.position.copy(e).add(new u(0,.08,0)),s.rotation.set(.1*Math.sin(l+o),l*1.2566+o,.08),s.scale.set(1,1.05,1),g.add(s)}let c=new v(new j(.03,.05,1.6,10),He);c.position.copy(e).add(new u(.1,-.95,0)),c.rotation.z=.12,g.add(c)});let ge=new h({uniforms:{...r,uA:{value:0}},transparent:!0,vertexShader:"varying vec3 vP; varying vec3 vN; varying vec3 vV; void main(){ vP=position; vec4 w=modelMatrix*vec4(position,1.); vN=normalize(mat3(modelMatrix)*normal); vV=normalize(cameraPosition-w.xyz); gl_Position=projectionMatrix*viewMatrix*w; }",fragmentShader:`uniform float uA, uT, uFront, uX0, uX1; varying vec3 vP; varying vec3 vN; varying vec3 vV;
      void main(){ float x=vP.y; // cylinder is rotated: local y = world x
        float k = smoothstep(uFront-.2, uFront+.4, x) * (1.-smoothstep(uX1-.25,uX1,x)) * smoothstep(uX0, uX0+.6, x);
        float a = atan(vP.z, vP.x);
        float hel = .5+.5*sin(a*2. - x*34.*1. + uT*7.);
        float l = .55+.45*max(0.,dot(vN, normalize(vec3(.4,.8,.5)))) + .5*pow(1.-abs(dot(vN,vV)),2.);
        vec3 c = mix(vec3(.82,.78,.70), vec3(1.,.97,.9), hel) * l;
        if (k*uA < .01) discard; gl_FragColor = vec4(c, k*uA); }`}),K=new v(new j(.022,.022,a-k,24,64,!0),ge);K.rotation.z=-Math.PI/2,K.position.x=(k+a)/2,n.add(K);let f=new re;f.position.set(a+.75,-.7,0),n.add(f);let je=[new y(.19,-.75),new y(.2,-.75),new y(.1,.75),new y(.09,.75)],Ee=new b({color:14708783,roughness:.55,clearcoat:.4}),xe=new v(new ue(je,48),Ee);f.add(xe);let q=_e({seed:3,angle:.35,cross:!0,lines:1400});q.repeat.set(6,3);let Ue=new b({color:16183782,map:q,roughness:.9,sheen:1,sheenRoughness:.45,sheenColor:new H(16774630),bumpMap:q,bumpScale:.6}),ye=[];for(let e=0;e<=16;e++){let o=e/16;ye.push(new y(T(.62,.36,o)*(1-.06*Math.pow(Math.abs(o-.5)*2,6)),T(-.62,.62,o)))}let _=new v(new ue(ye,p?48:72),Ue);f.add(_),f.rotation.set(.12,0,-.1);let be=new b({color:16777215,metalness:1,roughness:.06}),V=new v(new Xe(.05,.012,12,32),be);n.add(V);let W=new v(new j(.012,.012,2.2,12),be);W.rotation.x=Math.PI/2,W.position.set(a+.1,.2,0),n.add(W);let Me=new Float32Array(4*3),J=new z;J.setAttribute("position",new d(Me,3));let Q=new se(J,new h({transparent:!0,uniforms:{uA:{value:0}},vertexShader:"void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",fragmentShader:"uniform float uA; void main(){ gl_FragColor=vec4(1.,.96,.9,uA); }"}));Q.frustumCulled=!1,n.add(Q);let P=new v(new ze(1,1),new h({transparent:!0,depthWrite:!1,blending:ie,uniforms:{uI:{value:0},uC:{value:new H(14708783)}},vertexShader:"varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }",fragmentShader:"uniform float uI; uniform vec3 uC; varying vec2 vUv; void main(){ float d=length(vUv-.5)*2.; float g=exp(-d*d*3.)*.55+exp(-d*d*14.)*.45; gl_FragColor=vec4(mix(uC, vec3(1.,.9,.75), .35)*g*uI, 1.); }"}));P.scale.set(7,7,1),P.position.set(-2.6,.1,-3.5),n.add(P);let Y=p?220:600,D=new Float32Array(Y*3),Pe=new Float32Array(Y);for(let e=0;e<Y;e++)D[e*3]=(Math.random()-.5)*12,D[e*3+1]=(Math.random()-.5)*6,D[e*3+2]=(Math.random()-.5)*6,Pe[e]=Math.random();let Z=new z;Z.setAttribute("position",new d(D,3)),Z.setAttribute("seed",new d(Pe,1));let N=new h({transparent:!0,depthWrite:!1,blending:ie,uniforms:{uT:{value:0},uI:{value:0},uPix:{value:600}},vertexShader:"attribute float seed; uniform float uT; uniform float uPix; varying float vA; void main(){ vec3 p=position; p.x+=mod(uT*(.05+.1*seed)+6.,12.)-6.; p.y+=sin(uT*.4+seed*30.)*.3; p.x=mod(p.x+6.,12.)-6.; vec4 mv=modelViewMatrix*vec4(p,1.); gl_Position=projectionMatrix*mv; gl_PointSize=uPix*(.008+.02*seed)/-mv.z; vA=.3+.7*seed; }",fragmentShader:"uniform float uI; varying float vA; void main(){ float d=length(gl_PointCoord-.5); if(d>.5) discard; gl_FragColor=vec4(vec3(1.,.95,.88)*smoothstep(.5,0.,d)*uI*vA*.8,1.); }"}),Ae=new le(Z,N);Ae.frustumCulled=!1,n.add(Ae);let A=new ke(16773598,0,30,.5,.7,1.2);A.position.set(-1,7,5),A.target.position.set(-1.5,0,0),n.add(A,A.target);let $=new de(14708783,0);$.position.set(-4,2,-5),n.add($);let ee=new de(9347839,0);ee.position.set(5,1,3),n.add(ee);let te=new u,Fe=0,Se=0,oe=0;function Oe(e,o){let c=Math.min(.05,Math.max(0,o-Se));Se=o;let l=t.W<760,F=i(.16,.5,e),s=i(.42,.62,e),S=i(.5,.7,e),Ce=i(.68,.9,e);r.uT.value=o,r.uPull.value=F,r.uDraft.value=s,r.uTwist.value=S,r.uFront.value=T(a+.6,k+.6,i(.45,.72,e)),Fe+=c*(.05+.5*s),r.uFlow.value=Fe,r.uI.value=i(0,.06,e)*.7+.3,r.uPix.value=t.H*t.renderer.getPixelRatio()*.6,ge.uniforms.uA.value=i(.55,.7,e),g.children.forEach(Ke=>{Ke.material.opacity=1}),g.position.y=-1.2*i(.3,.6,e),g.visible=e<.62,oe+=c*(.4+6*Ce),_.rotation.y=oe,xe.rotation.y=oe;let ne=T(.55,1,Ce);_.scale.set(ne,1,ne),_.visible=!0;let B=i(.6,.72,e);f.visible=B>.01,f.position.y=-.7-(1-B)*1.2;let G=Math.sin(o*2.4)*.5;V.position.set(a+.1,.2,G),V.rotation.y=Math.PI/2,W.visible=V.visible=B>.01;let R=new u(0,0,0).set(-.4*ne,.55,G*.9);f.localToWorld(R),Me.set([a-.05,0,0,a+.1,.2,G,a+.1,.2,G,R.x,R.y,R.z]),J.attributes.position.needsUpdate=!0,Q.material.uniforms.uA.value=B*i(.55,.7,e)*.9;let C=.5+.5*i(0,.06,e);A.intensity=500*C,$.intensity=2.5*C,ee.intensity=.6*C,P.material.uniforms.uI.value=C*X(e,[[0,.9],[.3,.7],[.5,.3],[1,.25]]),P.position.x=X(e,[[0,-2.6],[.4,-2.6],[.7,1.5],[1,3.4]]),N.uniforms.uT.value=o,N.uniforms.uI.value=C,N.uniforms.uPix.value=t.H*t.renderer.getPixelRatio();let m=l?1.45:1,x=X(e,[[0,[-1.6,.6,3*m,-2.6,0,0]],[.14,[-.9,1.3,4.4*m,-2.5,0,0]],[.32,[.6,1.4,6*m,-.6,.3,0]],[.46,[1,.8,5.2*m,.2,0,0]],[.58,[.4,.35,1.7*m,.6,0,0]],[.7,[2,.4,2.3*m,2,0,0]],[.84,[5.6,1.4,4*m,a+.5,-.3,0]],[1,[4.4,1.6,5.6*m,a+.1,-.2,0]]]);w.position.set(x[0],x[1],x[2]),te.set(x[3],x[4],x[5]),w.lookAt(te),l?w.setViewOffset(t.W,t.H,0,t.H*.16,t.W,t.H):w.setViewOffset(t.W,t.H,-t.W*.15,0,t.W,t.H),t.focus=w.position.distanceTo(te),t.aperture=X(e,[[0,1.3],[.14,1],[.4,.5],[.58,1.5],[.7,1.1],[.84,.8],[1,.6]])*(p?.7:1),w.updateMatrixWorld()}return{stage:t,apply:Oe,render:()=>t.render(),resize:(e,o)=>t.setSize(e,o),dispose:()=>{t.dispose(),ve.dispose()},labels:[]}}export{$e as createCotton};

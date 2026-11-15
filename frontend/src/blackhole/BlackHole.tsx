"use client";

import React, { useEffect, useRef } from "react";

interface BlackHoleProps {
  anomaly?: number;
  bpm?: number;
  shiftX?: number;
  className?: string;
}

const VERT = `#version 300 es
void main(){
  vec2 p = vec2(float((gl_VertexID<<1)&2), float(gl_VertexID&2));
  gl_Position = vec4(p*2.0-1.0, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
out vec4 outColor;
uniform vec2  uRes;
uniform float uTime;
uniform float uAnomaly;
uniform float uHeart;
uniform float uShift;
uniform vec2  uMouse;

float h12(vec2 p){ vec3 q=fract(vec3(p.xyx)*.1031); q+=dot(q,q.yzx+33.33); return fract((q.x+q.y)*q.z); }
float h13(vec3 q){ q=fract(q*.1031); q+=dot(q,q.zyx+31.32); return fract((q.x+q.y)*q.z); }

// value noise, periodic along x (so the disk has no seam)
float pnoise(vec2 p, float per){
  vec2 i=floor(p), f=fract(p);
  f=f*f*(3.0-2.0*f);
  float a=h12(vec2(mod(i.x,per),i.y));
  float b=h12(vec2(mod(i.x+1.0,per),i.y));
  float c=h12(vec2(mod(i.x,per),i.y+1.0));
  float d=h12(vec2(mod(i.x+1.0,per),i.y+1.0));
  return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);
}
float vnoise3(vec3 p){
  vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  float n000=h13(i), n100=h13(i+vec3(1,0,0)), n010=h13(i+vec3(0,1,0)), n110=h13(i+vec3(1,1,0));
  float n001=h13(i+vec3(0,0,1)), n101=h13(i+vec3(1,0,1)), n011=h13(i+vec3(0,1,1)), n111=h13(i+vec3(1,1,1));
  return mix(mix(mix(n000,n100,f.x),mix(n010,n110,f.x),f.y),
             mix(mix(n001,n101,f.x),mix(n011,n111,f.x),f.y), f.z);
}

vec3 ramp(float t){
  t=clamp(t,0.0,1.6);
  vec3 c=mix(vec3(0.45,0.07,0.01), vec3(1.0,0.40,0.05), smoothstep(0.0,0.35,t));
  c=mix(c, vec3(1.0,0.74,0.36), smoothstep(0.30,0.70,t));
  c=mix(c, vec3(1.0,0.96,0.88), smoothstep(0.65,1.25,t));
  return c;
}

const float RIN  = 3.0;
const float ROUT = 12.5;

vec3 disk(vec3 p, vec3 v){
  float rr = length(p.xz);
  if(rr<RIN || rr>ROUT) return vec3(0.0);
  float phi = atan(p.z,p.x);
  float ang = uTime*3.0*pow(rr,-1.5);           // Keplerian: inner spins faster
  float PER = 16.0;
  float x = (phi-ang)/6.2831853*PER;
  float y = rr*1.7;
  float n = pnoise(vec2(x,y),PER)*0.50
          + pnoise(vec2(x*2.0,y*2.1),PER*2.0)*0.30
          + pnoise(vec2(x*4.0,y*4.3),PER*4.0)*0.20;
  float contrast = mix(1.0,1.5,uAnomaly);
  float streak = mix(0.35,1.45,clamp((n-0.5)*contrast+0.5,0.0,1.0));

  float prof = pow(RIN/rr,2.2);
  float edge = smoothstep(RIN,RIN+0.3,rr)*(1.0-smoothstep(ROUT-3.5,ROUT,rr));
  float pulse = 1.0 + 0.08*uHeart*(1.0-smoothstep(RIN,8.0,rr));
  float em = prof*edge*streak*pulse;

  // relativistic Doppler beaming
  vec3 tv = normalize(vec3(-p.z,0.0,p.x));
  float beta = 0.45*sqrt(RIN/rr);
  float g = 1.0/(1.0-beta*dot(tv,-v));
  em *= pow(g,2.2);

  float T = pow(RIN/rr,0.7)*g*(1.0+0.22*uAnomaly);
  vec3 c = ramp(T);
  c *= mix(vec3(1.0), vec3(1.0,0.62,0.55), uAnomaly*0.6);
  return c*em*2.0;
}

void main(){
  vec2 uv0 = (gl_FragCoord.xy-0.5*uRes)/uRes.y;
  vec2 uv  = uv0; uv.x -= uShift;

  float tilt = 0.17 + 0.025*sin(uTime*0.07) + uMouse.y*0.04;
  float yaw  = uMouse.x*0.05;
  float D = 15.0;
  vec3 cam = vec3(sin(yaw)*D*cos(tilt), D*sin(tilt), -cos(yaw)*D*cos(tilt));
  vec3 f = normalize(-cam);
  vec3 r = normalize(cross(vec3(0,1,0),f));
  vec3 u = cross(f,r);
  vec3 dir = normalize(f*1.25 + r*uv.x + u*uv.y);

  float b = length(cross(cam,dir)); // impact parameter
  vec3 pos=cam, vel=dir, col=vec3(0.0);
  bool horizon=false;

  for(int i=0;i<150;i++){
    float rr=length(pos);
    if(rr<1.0){ horizon=true; break; }
    if(rr>45.0 && dot(pos,vel)>0.0) break;
    vec3 L=cross(pos,vel);
    float h2=dot(L,L);
    float dt=clamp(0.12*(rr-0.6),0.04,1.2);
    vel=normalize(vel - 1.5*h2*pos/(rr*rr*rr*rr*rr)*dt);
    vec3 np=pos+vel*dt;
    if(pos.y*np.y<0.0){
      float t=pos.y/(pos.y-np.y);
      col+=disk(mix(pos,np,t),vel);
    }
    pos=np;
  }

  if(!horizon){
    vec3 sd=normalize(vel);
    vec3 gcell=sd*260.0;
    vec3 id=floor(gcell);
    float h=h13(id);
    float star=step(0.9965,h)*smoothstep(0.5,0.0,length(fract(gcell)-0.5))*(0.4+0.6*h13(id+7.0));
    col+=vec3(0.85,0.9,1.0)*star*1.3;
    vec3 bandN=normalize(vec3(0.3,1.0,0.2));
    float band=exp(-pow(dot(sd,bandN)*3.5,2.0))*(0.5+0.5*vnoise3(sd*7.0));
    col+=vec3(0.55,0.5,0.6)*band*0.05;
    // razor-thin photon ring
    col+=vec3(1.0,0.9,0.75)*0.9*exp(-abs(b-2.62)*30.0)*(1.0+0.5*uAnomaly);
  }

  col = 1.0-exp(-col*1.15);                 // tone map: highlights roll off, blacks stay black
  col = pow(col,vec3(0.88));
  col *= 1.0-0.35*smoothstep(0.75,1.4,length(uv0));   // vignette at extreme edges only
  col += (h12(gl_FragCoord.xy+fract(uTime)*91.0)-0.5)*0.02;  // film grain
  outColor=vec4(max(col,0.0),1.0);
}`;

declare global {
  interface Window {
    blackHole?: {
      set: (o: { anomaly?: number; bpm?: number; shiftX?: number }) => void;
    };
  }
}

export const BlackHole: React.FC<BlackHoleProps> = ({
  anomaly = 0.2,
  bpm = 69,
  shiftX,
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<{ anomaly: number; bpm: number; shiftX: number }>({
    anomaly,
    bpm,
    shiftX: shiftX !== undefined ? shiftX : typeof window !== "undefined" && window.innerWidth > 900 ? 0.22 : 0.0,
  });

  // Sync props to state and window.blackHole
  useEffect(() => {
    stateRef.current.anomaly = anomaly;
  }, [anomaly]);

  useEffect(() => {
    stateRef.current.bpm = bpm;
  }, [bpm]);

  useEffect(() => {
    if (shiftX !== undefined) {
      stateRef.current.shiftX = shiftX;
    }
  }, [shiftX]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Alias to non-nullable so TypeScript narrows inside nested functions
    const cvs: HTMLCanvasElement = canvas;

    const gl = cvs.getContext("webgl2", {
      antialias: false,
      alpha: false,
      powerPreference: "high-performance",
    });

    if (!gl) {
      console.warn("WebGL2 not supported");
      return;
    }

    const ctx: WebGL2RenderingContext = gl;

    function sh(type: number, src: string) {
      const s = ctx.createShader(type)!;
      ctx.shaderSource(s, src);
      ctx.compileShader(s);
      if (!ctx.getShaderParameter(s, ctx.COMPILE_STATUS)) {
        console.error(ctx.getShaderInfoLog(s));
      }
      return s;
    }

    const prog = ctx.createProgram()!;
    ctx.attachShader(prog, sh(ctx.VERTEX_SHADER, VERT));
    ctx.attachShader(prog, sh(ctx.FRAGMENT_SHADER, FRAG));
    ctx.linkProgram(prog);
    ctx.useProgram(prog);
    ctx.bindVertexArray(ctx.createVertexArray());

    const U = (n: string) => ctx.getUniformLocation(prog, n);
    const uRes = U("uRes");
    const uTime = U("uTime");
    const uAnom = U("uAnomaly");
    const uHeart = U("uHeart");
    const uShift = U("uShift");
    const uMouse = U("uMouse");

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const state = stateRef.current;
    const cur = { anomaly: state.anomaly, bpm: state.bpm };
    let scale = 0.75;
    let mx = 0;
    let my = 0;
    let tmx = 0;
    let tmy = 0;
    let slow = 0;
    let last = performance.now();
    let t = 0;
    let animId: number;

    const onPointerMove = (e: PointerEvent) => {
      tmx = (e.clientX / window.innerWidth) * 2 - 1;
      tmy = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onPointerMove);

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      cvs.width = Math.max(2, Math.floor(window.innerWidth * dpr * scale));
      cvs.height = Math.max(2, Math.floor(window.innerHeight * dpr * scale));
      ctx.viewport(0, 0, cvs.width, cvs.height);
    }
    window.addEventListener("resize", resize);
    resize();

    function frame(now: number) {
      const dtms = now - last;
      last = now;

      // adaptive quality governor
      slow = slow * 0.95 + dtms * 0.05;
      if (slow > 22 && scale > 0.5) {
        scale = Math.max(0.5, scale - 0.05);
        resize();
        slow = 16;
      }

      const dt = Math.min(dtms, 50) / 1000;
      t += dt * (reduce ? 0.15 : 1);
      cur.anomaly += (state.anomaly - cur.anomaly) * 0.04;
      cur.bpm += (state.bpm - cur.bpm) * 0.04;
      mx += (tmx - mx) * 0.04;
      my += (tmy - my) * 0.04;

      const p = ((t * cur.bpm) / 60) % 1;
      const pulse = reduce
        ? 0
        : Math.exp(-p * 14) + 0.55 * Math.exp(-Math.pow((p - 0.28) * 14, 2));

      ctx.uniform2f(uRes, cvs.width, cvs.height);
      ctx.uniform1f(uTime, t);
      ctx.uniform1f(uAnom, cur.anomaly);
      ctx.uniform1f(uHeart, pulse);
      ctx.uniform1f(uShift, state.shiftX);
      ctx.uniform2f(uMouse, reduce ? 0 : mx, reduce ? 0 : my);

      ctx.drawArrays(ctx.TRIANGLES, 0, 3);
      animId = requestAnimationFrame(frame);
    }
    animId = requestAnimationFrame(frame);

    window.blackHole = {
      set(o) {
        Object.assign(state, o);
      },
    };

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", resize);
      ctx.deleteProgram(prog);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 w-full h-full block bg-black z-0 pointer-events-none ${className}`}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        display: "block",
        background: "#000000",
        zIndex: 0,
      }}
    />
  );
};

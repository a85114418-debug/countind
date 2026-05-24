import { useRef, useEffect } from 'react';
import type { VisualEffect } from '../types';

interface Props {
  effect: VisualEffect;
}

interface Particle {
  x: number;
  y: number;
  r: number;
  speed: number;
  opacity: number;
  wobble: number;
  wobbleSpeed: number;
  rotation: number;
  rotationSpeed: number;
  // sakura petal shape
  petalScale: number;
  petalColor: string;
  // rain
  length: number;
}

const SAKURA_COLORS = [
  'rgba(255,183,197,0.9)',
  'rgba(255,154,174,0.85)',
  'rgba(255,204,217,0.8)',
  'rgba(255,143,163,0.9)',
];

function createParticle(w: number, h: number, effect: VisualEffect): Particle {
  const base: Particle = {
    x: Math.random() * w,
    y: Math.random() * -h,
    r: 0,
    speed: 0,
    opacity: 0,
    wobble: 0,
    wobbleSpeed: 0,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: 0,
    petalScale: 0,
    petalColor: '',
    length: 0,
  };

  switch (effect) {
    case 'snow':
      base.r = 2 + Math.random() * 4;
      base.speed = 0.5 + Math.random() * 1.5;
      base.opacity = 0.4 + Math.random() * 0.6;
      base.wobbleSpeed = (Math.random() - 0.5) * 0.02;
      break;
    case 'sakura':
      base.r = 3 + Math.random() * 6;
      base.speed = 0.6 + Math.random() * 2;
      base.opacity = 0.5 + Math.random() * 0.5;
      base.wobbleSpeed = (Math.random() - 0.5) * 0.04;
      base.rotationSpeed = (Math.random() - 0.5) * 0.03;
      base.petalScale = 0.6 + Math.random() * 0.4;
      base.petalColor = SAKURA_COLORS[Math.floor(Math.random() * SAKURA_COLORS.length)];
      break;
    case 'rain':
      base.x = Math.random() * (w + 100) - 50;
      base.y = Math.random() * -h - 10;
      base.r = 1 + Math.random() * 0.5;
      base.speed = 8 + Math.random() * 10;
      base.opacity = 0.15 + Math.random() * 0.25;
      base.length = 10 + Math.random() * 15;
      break;
  }
  return base;
}

const MAX_PARTICLES: Record<string, number> = {
  snow: 100,
  sakura: 50,
  rain: 120,
};

export function ParticleEffect({ effect }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (effect === 'none') {
      particlesRef.current = [];
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const max = MAX_PARTICLES[effect] || 50;
    particlesRef.current = Array.from({ length: max }, () =>
      createParticle(canvas.width, canvas.height, effect)
    );

    let animId: number;

    function drawSnow(p: Particle) {
      ctx!.beginPath();
      ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx!.fillStyle = `rgba(255,255,255,${p.opacity})`;
      ctx!.fill();
      // soft glow
      ctx!.beginPath();
      ctx!.arc(p.x, p.y, p.r * 2, 0, Math.PI * 2);
      ctx!.fillStyle = `rgba(255,255,255,${p.opacity * 0.15})`;
      ctx!.fill();
    }

    function drawSakura(p: Particle) {
      ctx!.save();
      ctx!.translate(p.x, p.y);
      ctx!.rotate(p.rotation);
      const s = p.r * p.petalScale;
      // 5-petal flower shape
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const px = Math.cos(angle) * s * 0.5;
        const py = Math.sin(angle) * s * 0.5;
        ctx!.beginPath();
        ctx!.arc(px, py, s * 0.65, 0, Math.PI * 2);
        ctx!.fillStyle = p.petalColor.replace('0.9', String(p.opacity)).replace('0.85', String(p.opacity)).replace('0.8', String(p.opacity));
        ctx!.fill();
      }
      // center
      ctx!.beginPath();
      ctx!.arc(0, 0, s * 0.25, 0, Math.PI * 2);
      ctx!.fillStyle = `rgba(255,200,200,${p.opacity * 0.7})`;
      ctx!.fill();
      ctx!.restore();
    }

    function drawRain(p: Particle) {
      ctx!.beginPath();
      ctx!.moveTo(p.x, p.y);
      ctx!.lineTo(p.x + 1, p.y + p.length);
      ctx!.strokeStyle = `rgba(180,210,240,${p.opacity})`;
      ctx!.lineWidth = p.r;
      ctx!.lineCap = 'round';
      ctx!.stroke();
    }

    function animate() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.y += p.speed;
        p.x += Math.sin(p.wobble) * 0.8;
        p.wobble += p.wobbleSpeed;
        p.rotation += p.rotationSpeed;

        switch (effect) {
          case 'snow': drawSnow(p); break;
          case 'sakura': drawSakura(p); break;
          case 'rain': drawRain(p); break;
        }

        // reset when off-screen
        if (p.y > canvas.height + 30 || p.x < -50 || p.x > canvas.width + 50) {
          Object.assign(p, createParticle(canvas.width, canvas.height, effect));
          p.y = -30;
        }
      }
      animId = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [effect]);

  if (effect === 'none') return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  );
}

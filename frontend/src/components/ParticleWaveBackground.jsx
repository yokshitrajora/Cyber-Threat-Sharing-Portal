import { useEffect, useRef } from 'react';

export default function ParticleWaveBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Subtle drifting ambient gradient orbs for Synthex glassmorphism depth
    const orbs = [
      { x: width * 0.2, y: height * 0.25, r: 380, color: 'rgba(219, 234, 254, 0.45)', vx: 0.15, vy: 0.1 },
      { x: width * 0.75, y: height * 0.2, r: 420, color: 'rgba(238, 242, 255, 0.55)', vx: -0.12, vy: 0.14 },
      { x: width * 0.5, y: height * 0.7, r: 460, color: 'rgba(224, 231, 255, 0.4)', vx: 0.08, vy: -0.1 },
      { x: width * 0.85, y: height * 0.8, r: 340, color: 'rgba(241, 245, 249, 0.6)', vx: -0.1, vy: -0.12 },
    ];

    let time = 0;

    const render = () => {
      time += 0.003;

      // Base luminous slate-tinted canvas
      ctx.fillStyle = '#edf2f8';
      ctx.fillRect(0, 0, width, height);

      // Render smooth animated glowing ambient orbs
      orbs.forEach((orb) => {
        orb.x += orb.vx;
        orb.y += orb.vy;

        if (orb.x < -100) orb.x = width + 100;
        if (orb.x > width + 100) orb.x = -100;
        if (orb.y < -100) orb.y = height + 100;
        if (orb.y > height + 100) orb.y = -100;

        const g = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.r);
        g.addColorStop(0, orb.color);
        g.addColorStop(1, 'rgba(237, 242, 248, 0)');

        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Subtle diagonal frosted light reflection across the background
      ctx.save();
      const sheenGrad = ctx.createLinearGradient(0, 0, width, height);
      sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
      sheenGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.1)');
      sheenGrad.addColorStop(0.7, 'rgba(240, 245, 255, 0.25)');
      sheenGrad.addColorStop(1, 'rgba(255, 255, 255, 0.4)');
      ctx.fillStyle = sheenGrad;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 block w-full h-full"
    />
  );
}

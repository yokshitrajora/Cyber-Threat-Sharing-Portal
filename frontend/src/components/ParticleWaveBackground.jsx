import { useEffect, useRef } from 'react';

export default function ParticleWaveBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // 3D Parallax Stardust Particles (Layered Z-Depth)
    const particleCount = Math.min(100, Math.floor((width * height) / 12000));
    const particles = [];
    for (let i = 0; i < particleCount; i++) {
      const z = Math.random() * 3 + 0.5;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        z,
        radius: (Math.random() * 1.2 + 0.4) * (z * 0.7),
        alpha: (Math.random() * 0.5 + 0.2) / (z * 0.7),
        speedX: (Math.random() - 0.5) * 0.15 * z,
        speedY: (Math.random() - 0.5) * 0.15 * z,
        pulseSpeed: Math.random() * 0.015 + 0.005,
      });
    }
    // Sort once on creation instead of every frame
    particles.sort((a, b) => a.z - b.z);

    // 3D Infinity Wave Stardust Ribbon Particles (optimized count for 60-120 FPS)
    const waveParticleCount = 280;
    const waveParticles = [];
    for (let i = 0; i < waveParticleCount; i++) {
      waveParticles.push({
        t: Math.random() * Math.PI * 2,
        offsetY: (Math.random() - 0.5) * 60,
        offsetX: (Math.random() - 0.5) * 60,
        speed: 0.0008 + Math.random() * 0.0008,
        size: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.5 + 0.25,
      });
    }

    let time = 0;

    const render = () => {
      time += 0.004;

      // Deep dark 3D luxury gradient background
      const bgGradient = ctx.createRadialGradient(
        width / 2,
        height * 0.4,
        100,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.8
      );
      bgGradient.addColorStop(0, '#0c1019');
      bgGradient.addColorStop(0.5, '#06080d');
      bgGradient.addColorStop(1, '#030407');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // Render Layered 3D Background Particles
      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        p.alpha += Math.sin(time * 2 + p.z) * p.pulseSpeed * 0.08;
        const currentAlpha = Math.max(0.08, Math.min(0.75, p.alpha));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(240, 245, 255, ${currentAlpha})`;
        ctx.fill();
      });

      // Render 3D Floating Infinity Ribbon
      const centerX = width / 2;
      const centerY = height * 0.42;
      const scaleX = Math.min(width * 0.44, 620);
      const scaleY = Math.min(height * 0.26, 250);

      // Ribbon ambient volumetric light glow
      ctx.save();
      ctx.beginPath();
      for (let theta = 0; theta <= Math.PI * 2; theta += 0.05) {
        const x = centerX + scaleX * Math.sin(theta + time * 0.4);
        const y = centerY + scaleY * Math.sin(theta + time * 0.4) * Math.cos(theta + time * 0.4);
        if (theta === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 120;
      ctx.stroke();
      ctx.restore();

      // Ribbon Core Metallic Fluid Strand Layers (3 layers for high performance)
      for (let layer = 0; layer < 3; layer++) {
        ctx.beginPath();
        const layerTime = time * 0.35 + layer * 0.25;
        const layerScaleX = scaleX + layer * 8;
        const layerScaleY = scaleY + layer * 4;

        for (let theta = 0; theta <= Math.PI * 2; theta += 0.04) {
          const waveShift = Math.sin(theta * 3 + layerTime) * 8;
          const x = centerX + layerScaleX * Math.sin(theta) + waveShift;
          const y = centerY + layerScaleY * Math.sin(theta) * Math.cos(theta) + waveShift * 0.5;

          if (theta === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        const alpha = 0.09 - layer * 0.02;
        ctx.strokeStyle = `rgba(245, 248, 255, ${alpha})`;
        ctx.lineWidth = 26 - layer * 6;
        ctx.stroke();
      }

      // Ribbon Stardust Particles - Batched fast rendering
      waveParticles.forEach((wp) => {
        wp.t += wp.speed;
        if (wp.t > Math.PI * 2) wp.t = 0;

        const currentT = wp.t + time * 0.18;
        const baseX = centerX + scaleX * Math.sin(currentT);
        const baseY = centerY + scaleY * Math.sin(currentT) * Math.cos(currentT);

        const x = baseX + wp.offsetX + Math.sin(time + wp.t * 3) * 6;
        const y = baseY + wp.offsetY + Math.cos(time + wp.t * 3) * 6;

        ctx.beginPath();
        ctx.arc(x, y, wp.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${wp.alpha})`;
        ctx.fill();
      });

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

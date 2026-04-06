import { useEffect, useRef } from 'react';
import backgroundVideo from '../assets/videoplayback.mp4';


export default function ParticleBackground() {
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];
    const particleCount = 60;
    const connectionDistance = 150;
    const mouseRadius = 200;

    class Particle {
      constructor() {
        this.init();
      }

      init() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.8;
        this.vy = (Math.random() - 0.5) * 0.8;
        this.size = Math.random() * 4 + 1;
        const types = ['square', 'dot', 'triangle', 'plus'];
        this.type = types[Math.floor(Math.random() * types.length)];
        this.baseColor = Math.random() > 0.8 ? '#ff3e3e' : '#000000'; // Accent Red or Black
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        // Wrap around screen
        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;

        // Mouse interaction (Repulsion)
        const dx = mouseRef.current.x - this.x;
        const dy = mouseRef.current.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < mouseRadius) {
          const force = (mouseRadius - distance) / mouseRadius;
          this.x -= dx * force * 0.02;
          this.y -= dy * force * 0.02;
        }
      }

      draw() {
        ctx.fillStyle = this.baseColor;
        ctx.strokeStyle = this.baseColor;
        ctx.lineWidth = 1.5;
        
        ctx.beginPath();
        if (this.type === 'square') {
          ctx.rect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
          ctx.fill();
        } else if (this.type === 'dot') {
          ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (this.type === 'triangle') {
          ctx.moveTo(this.x, this.y - this.size / 2);
          ctx.lineTo(this.x + this.size / 2, this.y + this.size / 2);
          ctx.lineTo(this.x - this.size / 2, this.y + this.size / 2);
          ctx.closePath();
          ctx.fill();
        } else if (this.type === 'plus') {
          ctx.moveTo(this.x - this.size / 2, this.y);
          ctx.lineTo(this.x + this.size / 2, this.y);
          ctx.moveTo(this.x, this.y - this.size / 2);
          ctx.lineTo(this.x, this.y + this.size / 2);
          ctx.stroke();
        }
      }
    }

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    };

    const drawConnections = () => {
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectionDistance) {
            const opacity = 1 - (distance / connectionDistance);
            ctx.strokeStyle = `rgba(0, 0, 0, ${opacity * 0.2})`;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      
      drawConnections();
      
      animationFrameId = requestAnimationFrame(animate);
    };

    const onMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    resize();
    animate();

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseleave', onMouseLeave);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseleave', onMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Ensure video playback
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(err => {
        console.warn("Video autoplay failed:", err);
      });
    }
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: -1,
      overflow: 'hidden',
      background: 'var(--bg)'
    }}>
      <video
        ref={videoRef}
        src={backgroundVideo}
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: 'translate(-50%, -50%)',
          opacity: 0.4, // Increased visibility
          filter: 'contrast(110%) brightness(0.9)', // More vibrant but still subtle
        }}

      >
        <source src={backgroundVideo} type="video/mp4" />
      </video>

      {/* Particle Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          mixBlendMode: 'multiply', // Blend particles with video
        }}
      />
      
      {/* Vignetee/Grain overlay for better look */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, width: '100%', height: '100%',
        background: 'radial-gradient(circle, transparent 20%, rgba(238, 232, 232, 0.4) 100%)',
        pointerEvents: 'none'
      }} />
    </div>
  );
}

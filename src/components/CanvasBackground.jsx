import React, { useEffect, useRef } from 'react';

const CanvasBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    
    // Universe Objects
    let stars = [];
    let planets = [];
    let asteroids = [];
    let nebulas = [];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Helper: Random Range
    const random = (min, max) => Math.random() * (max - min) + min;

    class Star {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 1.2;
        this.opacity = Math.random() * 0.8;
        this.twinkleSpeed = random(0.002, 0.01);
      }
      update() {
        this.opacity += this.twinkleSpeed;
        if (this.opacity > 0.8 || this.opacity < 0.1) this.twinkleSpeed *= -1;
      }
      draw() {
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(this.opacity)})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    class Planet {
      constructor(isMoon = false, parent = null) {
        this.isMoon = isMoon;
        this.parent = parent;
        this.radius = isMoon ? random(3, 5) : random(20, 50);
        
        const hues = [200, 260, 280, 320, 30, 160]; 
        const hue = hues[Math.floor(Math.random() * hues.length)];
        this.color = isMoon ? '#cbd5e1' : `hsl(${hue}, 70%, 50%)`;
        
        if (isMoon) {
           this.angle = random(0, Math.PI * 2);
           this.orbitRadius = parent.radius + random(15, 30);
           this.speed = random(0.01, 0.03);
           this.x = 0;
           this.y = 0;
        } else {
           this.x = random(0, canvas.width);
           this.y = random(0, canvas.height);
           this.vx = random(-0.1, 0.1);
           this.vy = random(-0.1, 0.1);
        }
      }
      
      update() {
        if (this.isMoon) {
            this.angle += this.speed;
            this.x = this.parent.x + Math.cos(this.angle) * this.orbitRadius;
            this.y = this.parent.y + Math.sin(this.angle) * this.orbitRadius;
        } else {
            this.x += this.vx;
            this.y += this.vy;
            
            // Bounce off edges (slowly)
            if (this.x < -100 || this.x > canvas.width + 100) this.vx *= -1;
            if (this.y < -100 || this.y > canvas.height + 100) this.vy *= -1;
        }
      }

      draw() {
        // Planet Glow
        if (!this.isMoon) {
            const gradient = ctx.createRadialGradient(this.x, this.y, this.radius * 0.5, this.x, this.y, this.radius * 3);
            gradient.addColorStop(0, this.color);
            gradient.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient;
            ctx.globalAlpha = 0.2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        // Planet Body with Gradient
        const bodyGrad = ctx.createRadialGradient(this.x - this.radius/3, this.y - this.radius/3, 0, this.x, this.y, this.radius);
        bodyGrad.addColorStop(0, this.isMoon ? '#f1f5f9' : this.color);
        bodyGrad.addColorStop(1, '#0f172a'); // Dark shadow side

        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Rings for some planets
        if (!this.isMoon && this.radius > 35 && Math.random() > 0.5) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(this.x, this.y, this.radius * 1.6, this.radius * 0.3, Math.PI / 5, 0, Math.PI * 2);
            ctx.stroke();
        }
      }
    }

    class Asteroid {
      constructor() {
        this.x = random(0, canvas.width);
        this.y = random(0, canvas.height);
        this.vx = random(-0.2, 0.2);
        this.vy = random(-0.2, 0.2);
        this.size = random(1.5, 3.5);
        this.vertices = [];
        const numPoints = 5 + Math.floor(Math.random() * 3);
        for(let i=0; i<numPoints; i++) {
            this.vertices.push({
                angle: (i / numPoints) * Math.PI * 2,
                r: this.size * random(0.7, 1.3)
            });
        }
        this.rotation = random(0, Math.PI * 2);
        this.rotSpeed = random(-0.01, 0.01);
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotSpeed;

        if (this.x < -50) this.x = canvas.width + 50;
        if (this.x > canvas.width + 50) this.x = -50;
        if (this.y < -50) this.y = canvas.height + 50;
        if (this.y > canvas.height + 50) this.y = -50;
      }

      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.fillStyle = 'rgba(100, 116, 139, 0.5)'; // Slate 500 transparent
        ctx.beginPath();
        this.vertices.forEach((v, i) => {
            const x = Math.cos(v.angle) * v.r;
            const y = Math.sin(v.angle) * v.r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }
    
    class Nebula {
        constructor() {
            this.x = random(0, canvas.width);
            this.y = random(0, canvas.height);
            this.radius = random(300, 600);
            this.color = random(0, 1) > 0.5 ? 'rgba(139, 92, 246, 0.04)' : 'rgba(6, 182, 212, 0.04)'; // Very subtle
            this.vx = random(-0.03, 0.03);
            this.vy = random(-0.03, 0.03);
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            if (this.x < -this.radius) this.x = canvas.width + this.radius;
            if (this.x > canvas.width + this.radius) this.x = -this.radius;
            if (this.y < -this.radius) this.y = canvas.height + this.radius;
            if (this.y > canvas.height + this.radius) this.y = -this.radius;
        }
        draw() {
             const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
             gradient.addColorStop(0, this.color);
             gradient.addColorStop(1, 'transparent');
             ctx.fillStyle = gradient;
             ctx.beginPath();
             ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
             ctx.fill();
        }
    }

    const init = () => {
      stars = Array.from({ length: 200 }, () => new Star());
      nebulas = Array.from({ length: 3 }, () => new Nebula());
      
      planets = Array.from({ length: 5 }, () => new Planet());
      // Add moons to first two planets
      if(planets.length > 0) planets.push(new Planet(true, planets[0]));
      if(planets.length > 1) planets.push(new Planet(true, planets[1]));
      
      asteroids = Array.from({ length: 25 }, () => new Asteroid());
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw Nebulas (Background)
      nebulas.forEach(n => { n.update(); n.draw(); });

      // Draw Stars
      stars.forEach(s => { s.update(); s.draw(); });
      
      // Draw Planets
      planets.forEach(p => { p.update(); p.draw(); });

      // Draw Asteroids
      asteroids.forEach(a => { a.update(); a.draw(); });

      animationFrameId = requestAnimationFrame(animate);
    };

    init();
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-[120vh] z-0 pointer-events-none" />;
};

export default CanvasBackground;

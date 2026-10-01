import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// Helper to generate high-res canvas textures for each 3D glass module card
function createCardTexture({ title, subtitle, badge, badgeColor, value, status, accentColor }) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');

  // Background - Dark obsidian glass with subtle gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 512, 320);
  bgGrad.addColorStop(0, 'rgba(15, 23, 42, 0.92)');
  bgGrad.addColorStop(1, 'rgba(10, 15, 29, 0.96)');
  
  // Rounded rect path
  const r = 24;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(512 - r, 0);
  ctx.quadraticCurveTo(512, 0, 512, r);
  ctx.lineTo(512, 320 - r);
  ctx.quadraticCurveTo(512, 320, 512 - r, 320);
  ctx.lineTo(r, 320);
  ctx.quadraticCurveTo(0, 320, 0, 320 - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  
  ctx.fillStyle = bgGrad;
  ctx.fill();

  // Subtle luminous border
  ctx.lineWidth = 4;
  ctx.strokeStyle = accentColor || 'rgba(56, 189, 248, 0.4)';
  ctx.stroke();

  // Top Accent Bar
  ctx.fillStyle = accentColor || '#38BDF8';
  ctx.fillRect(32, 28, 48, 4);

  // Top Border Line
  ctx.fillStyle = '#38BDF8';
  ctx.fillRect(0, 0, 512, 2);

  // Badge
  if (badge) {
    ctx.fillStyle = badgeColor || 'rgba(14, 165, 233, 0.2)';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(320, 24, 160, 32, 16) : ctx.rect(320, 24, 160, 32);
    ctx.fill();
    ctx.fillStyle = accentColor || '#38BDF8';
    ctx.font = '600 14px Outfit, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(badge, 400, 46);
  }

  // Title
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 28px Outfit, system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(title, 32, 90);

  // Subtitle
  ctx.fillStyle = '#94A3B8';
  ctx.font = '16px Outfit, system-ui, sans-serif';
  ctx.fillText(subtitle, 32, 126);

  // Value / Metric Highlight
  if (value) {
    ctx.fillStyle = '#F8FAFC';
    ctx.font = 'bold 36px Outfit, system-ui, sans-serif';
    ctx.fillText(value, 32, 210);
  }

  // Status / Footer Info
  if (status) {
    ctx.fillStyle = '#34D399';
    ctx.font = '600 15px Outfit, system-ui, sans-serif';
    ctx.fillText(`● ${status}`, 32, 264);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

export default function HeroPrismCanvas() {
  const mountRef = useRef(null);
  const [webGLSupported, setWebGLSupported] = useState(true);

  useEffect(() => {
    // 1. WebGL Feature Detection
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      if (!gl) {
        setWebGLSupported(false);
        return;
      }
    } catch {
      setWebGLSupported(false);
      return;
    }

    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || 600;
    let height = container.clientHeight || 500;

    // 2. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 9);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 2.0);
    dirLight1.position.set(5, 5, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x34d399, 1.5);
    dirLight2.position.set(-5, -3, 3);
    scene.add(dirLight2);

    // 4. Card Definitions (Invoicing, GST Ledger, Live Stock, Payments)
    const cardData = [
      {
        title: 'GST Tax Invoice',
        subtitle: 'Auto-calculated CGST, SGST & IGST',
        badge: 'TAX READY',
        badgeColor: 'rgba(14, 165, 233, 0.25)',
        accentColor: '#38BDF8',
        value: '₹ 48,250.00',
        status: 'Instantly Downloaded (PDF & Print)',
        pos: [-1.4, 0.7, 0.6],
        rot: [-0.08, 0.18, -0.04],
        floatSpeed: 1.2,
      },
      {
        title: 'Real-Time Stock',
        subtitle: 'Live valuation & instant stock depletion',
        badge: 'ZERO DEFICIT',
        badgeColor: 'rgba(245, 158, 11, 0.25)',
        accentColor: '#FBBF24',
        value: '1,420 Units In Stock',
        status: 'Low stock thresholds active',
        pos: [1.6, 1.0, -0.2],
        rot: [0.06, -0.22, 0.05],
        floatSpeed: 0.9,
      },
      {
        title: 'Auto-Reconciliation',
        subtitle: 'GSTR-1, GSTR-3B & Customer Ledgers',
        badge: '100% ACCURATE',
        badgeColor: 'rgba(52, 211, 153, 0.25)',
        accentColor: '#34D399',
        value: 'GSTR-1 Ready',
        status: 'Sales & Purchases Synchronized',
        pos: [-1.2, -1.2, 0.2],
        rot: [0.12, 0.15, -0.05],
        floatSpeed: 1.4,
      },
      {
        title: 'Payment Links & QR',
        subtitle: 'UPI Dynamic QR on every invoice',
        badge: 'INSTANT PAY',
        badgeColor: 'rgba(99, 102, 241, 0.25)',
        accentColor: '#60A5FA',
        value: '₹ 1,84,300 Collected',
        status: 'Zero payment follow-up friction',
        pos: [1.5, -1.0, 0.8],
        rot: [-0.1, -0.14, 0.03],
        floatSpeed: 1.1,
      },
    ];

    const cardGroup = new THREE.Group();
    scene.add(cardGroup);

    const cardMeshes = [];
    const cardGeometry = new THREE.PlaneGeometry(2.5, 1.56);

    cardData.forEach((data) => {
      const texture = createCardTexture(data);
      const material = new THREE.MeshStandardMaterial({
        map: texture,
        transparent: true,
        roughness: 0.2,
        metalness: 0.1,
        side: THREE.DoubleSide,
      });

      const mesh = new THREE.Mesh(cardGeometry, material);
      mesh.position.set(...data.pos);
      mesh.rotation.set(...data.rot);
      mesh.userData = {
        basePos: [...data.pos],
        baseRot: [...data.rot],
        floatSpeed: data.floatSpeed,
      };

      cardGroup.add(mesh);
      cardMeshes.push(mesh);
    });

    // Star field
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 200;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 15;
      starPositions[i] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i + 2] = r * Math.cos(phi);
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.02,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
    });
    const starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);

    // Ambient ring
    const ringGeometry = new THREE.TorusGeometry(3.5, 0.012, 8, 120);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      opacity: 0.15,
      transparent: true,
    });
    const ambientRing = new THREE.Mesh(ringGeometry, ringMaterial);
    ambientRing.position.z = -1;
    scene.add(ambientRing);

    // 5. Ambient Floating Particles in 3D Space
    const particleCount = 60;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 12;
      particlePositions[i + 1] = (Math.random() - 0.5) * 8;
      particlePositions[i + 2] = (Math.random() - 0.5) * 6;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.04,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);

    // 6. Interactive Mouse & Gyro Parallax
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;

    const handleMouseMove = (event) => {
      const rect = container.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
      mouseX = x;
      mouseY = y;
      targetRotationY = x * 0.35;
      targetRotationX = -y * 0.25;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // 7. Resize Observer
    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || 600;
      height = container.clientHeight || 500;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // 8. Visibility / Offscreen Pause Optimization
    let isVisible = true;
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    }, { threshold: 0.1 });
    observer.observe(container);

    // 9. Animation Loop
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (!isVisible) return;

      const elapsedTime = clock.getElapsedTime();

      // Smooth lerp of cluster rotation towards target
      cardGroup.rotation.y += (targetRotationY - cardGroup.rotation.y) * 0.05;
      cardGroup.rotation.x += (targetRotationX - cardGroup.rotation.x) * 0.05;

      // Individual harmonic floating motion for each card
      cardMeshes.forEach((mesh, idx) => {
        const { basePos, baseRot, floatSpeed } = mesh.userData;
        mesh.position.y = basePos[1] + Math.sin(elapsedTime * floatSpeed + idx * 1.5) * 0.08;
        mesh.position.x = basePos[0] + Math.cos(elapsedTime * (floatSpeed * 0.8) + idx) * 0.04;
        mesh.rotation.z = baseRot[2] + Math.sin(elapsedTime * floatSpeed * 0.7) * 0.02;
      });

      // Subtle particle drift
      particleSystem.rotation.y = elapsedTime * 0.02;

      // Background animations
      starField.rotation.y += 0.003;
      ambientRing.rotation.z += 0.001;

      renderer.render(scene, camera);
    };

    animate();

    // 10. Teardown
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      observer.disconnect();

      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      cardMeshes.forEach((mesh) => {
        mesh.geometry.dispose();
        if (mesh.material.map) mesh.material.map.dispose();
        mesh.material.dispose();
      });
      cardGeometry.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      starGeometry.dispose();
      starMaterial.dispose();
      ringGeometry.dispose();
      ringMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  // Fallback for non-WebGL / mobile low-GPU environments
  if (!webGLSupported) {
    return (
      <div className="relative w-full h-[460px] flex items-center justify-center p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg w-full">
          <div className="bg-slate-900/80 border border-sky-500/30 rounded-2xl p-5 shadow-2xl backdrop-blur-md transform hover:-translate-y-1 transition-all">
            <span className="text-[11px] font-semibold text-sky-400 bg-sky-950/80 px-2.5 py-1 rounded-full uppercase tracking-wider">Tax Ready</span>
            <h4 className="text-white font-bold text-lg mt-3">GST Tax Invoice</h4>
            <p className="text-slate-400 text-xs mt-1">Auto-calculated CGST, SGST & IGST</p>
            <p className="text-white font-bold text-2xl mt-4 font-mono">₹ 48,250.00</p>
            <p className="text-emerald-400 text-xs mt-2 font-medium">● Instant PDF & Print Ready</p>
          </div>
          <div className="bg-slate-900/80 border border-emerald-500/30 rounded-2xl p-5 shadow-2xl backdrop-blur-md transform hover:-translate-y-1 transition-all">
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full uppercase tracking-wider">100% Accurate</span>
            <h4 className="text-white font-bold text-lg mt-3">Auto-Reconciliation</h4>
            <p className="text-slate-400 text-xs mt-1">GSTR-1 & Customer Ledgers</p>
            <p className="text-white font-bold text-2xl mt-4 font-mono">GSTR-1 Ready</p>
            <p className="text-emerald-400 text-xs mt-2 font-medium">● Real-Time Sync</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      className="relative w-full h-[420px] sm:h-[480px] lg:h-[540px] cursor-grab active:cursor-grabbing overflow-hidden flex items-center justify-center"
      aria-label="Interactive 3D Cenvoras Modular Architecture"
    />
  );
}

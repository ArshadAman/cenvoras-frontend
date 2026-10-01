import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

function createAuthBadgeTexture(title, subtitle, metric, color = '#38BDF8') {
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 240;
  const ctx = canvas.getContext('2d');

  // Background
  const grad = ctx.createLinearGradient(0, 0, 400, 240);
  grad.addColorStop(0, 'rgba(15, 23, 42, 0.95)');
  grad.addColorStop(1, 'rgba(9, 14, 26, 0.98)');

  const r = 20;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(400 - r, 0);
  ctx.quadraticCurveTo(400, 0, 400, r);
  ctx.lineTo(400, 240 - r);
  ctx.quadraticCurveTo(400, 240, 400 - r, 240);
  ctx.lineTo(r, 240);
  ctx.quadraticCurveTo(0, 240, 0, 240 - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Glowing stroke
  ctx.lineWidth = 3;
  ctx.strokeStyle = color;
  ctx.stroke();

  // Top pill
  ctx.fillStyle = color;
  ctx.fillRect(24, 20, 36, 4);

  // Title
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
  ctx.fillText(title, 24, 70);

  // Subtitle
  ctx.fillStyle = '#94A3B8';
  ctx.font = '14px system-ui, -apple-system, sans-serif';
  ctx.fillText(subtitle, 24, 104);

  // Metric
  ctx.fillStyle = '#F8FAFC';
  ctx.font = 'bold 30px system-ui, -apple-system, sans-serif';
  ctx.fillText(metric, 24, 170);

  // Live status
  ctx.fillStyle = '#34D399';
  ctx.font = '600 13px system-ui, -apple-system, sans-serif';
  ctx.fillText('● Verified & Encrypted', 24, 210);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

export default function AuthPrismCanvas() {
  const mountRef = useRef(null);
  const [webGLSupported, setWebGLSupported] = useState(true);

  useEffect(() => {
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

    let width = container.clientWidth || 450;
    let height = container.clientHeight || 450;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.5);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x38bdf8, 2.5, 20);
    pointLight.position.set(3, 4, 4);
    scene.add(pointLight);

    const pointLight2 = new THREE.PointLight(0x34d399, 1.8, 20);
    pointLight2.position.set(-3, -3, 3);
    scene.add(pointLight2);

    // 3D Central Geometric Prism Ring / Cube Wireframe
    const geom = new THREE.IcosahedronGeometry(1.6, 1);
    const wireMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.25,
      roughness: 0.1,
    });
    const coreMesh = new THREE.Mesh(geom, wireMat);
    scene.add(coreMesh);

    // Inner glowing sphere
    const sphereGeom = new THREE.SphereGeometry(0.85, 24, 24);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.3,
      metalness: 0.8,
      transparent: true,
      opacity: 0.7,
    });
    const innerSphere = new THREE.Mesh(sphereGeom, sphereMat);
    scene.add(innerSphere);

    // Floating Info Cards
    const cardGroup = new THREE.Group();
    scene.add(cardGroup);

    const cards = [
      {
        title: 'Instant GST Invoicing',
        subtitle: 'Auto-balanced accounting',
        metric: '₹ 1.2M+ Daily Invoiced',
        color: '#38BDF8',
        pos: [-1.1, 1.0, 0.6],
        rot: [-0.05, 0.15, -0.02],
      },
      {
        title: 'Bank-Grade Security',
        subtitle: '256-bit SSL & TLS encryption',
        metric: '100% Data Protection',
        color: '#34D399',
        pos: [1.0, -1.0, 0.4],
        rot: [0.08, -0.18, 0.03],
      },
    ];

    const cardMeshes = [];
    const cardGeo = new THREE.PlaneGeometry(2.3, 1.38);

    cards.forEach((c) => {
      const tex = createAuthBadgeTexture(c.title, c.subtitle, c.metric, c.color);
      const mat = new THREE.MeshStandardMaterial({
        map: tex,
        transparent: true,
        roughness: 0.2,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(cardGeo, mat);
      mesh.position.set(...c.pos);
      mesh.rotation.set(...c.rot);
      mesh.userData = { basePos: [...c.pos], baseRot: [...c.rot] };
      cardGroup.add(mesh);
      cardMeshes.push(mesh);
    });

    let targetRotY = 0;
    let targetRotX = 0;

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetRotY = x * 0.4;
      targetRotX = -y * 0.3;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || 450;
      height = container.clientHeight || 450;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    let isVisible = true;
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    }, { threshold: 0.1 });
    observer.observe(container);

    let animId;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (!isVisible) return;
      const t = clock.getElapsedTime();

      coreMesh.rotation.x = t * 0.15;
      coreMesh.rotation.y = t * 0.2;
      innerSphere.rotation.y = -t * 0.1;

      cardGroup.rotation.y += (targetRotY - cardGroup.rotation.y) * 0.05;
      cardGroup.rotation.x += (targetRotX - cardGroup.rotation.x) * 0.05;

      cardMeshes.forEach((mesh, idx) => {
        const { basePos, baseRot } = mesh.userData;
        mesh.position.y = basePos[1] + Math.sin(t * 1.3 + idx * 2) * 0.06;
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      observer.disconnect();

      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      geom.dispose();
      wireMat.dispose();
      sphereGeom.dispose();
      sphereMat.dispose();
      cardGeo.dispose();
      cardMeshes.forEach((m) => {
        if (m.material.map) m.material.map.dispose();
        m.material.dispose();
      });
      renderer.dispose();
    };
  }, []);

  if (!webGLSupported) {
    return (
      <div className="flex flex-col gap-4 p-6 max-w-sm mx-auto">
        <div className="bg-slate-900/90 border border-sky-500/30 rounded-2xl p-5 shadow-xl backdrop-blur-md">
          <span className="text-xs font-bold text-sky-400 uppercase tracking-widest">Enterprise Trust</span>
          <h4 className="text-white font-bold text-lg mt-2">GST Invoicing</h4>
          <p className="text-slate-400 text-xs mt-1">₹ 1.2M+ Daily Invoiced</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      className="relative w-full h-[380px] lg:h-[460px] overflow-hidden flex items-center justify-center cursor-grab"
      aria-label="Auth 3D Visualization"
    />
  );
}

import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  animate, 
  createScope, 
  spring, 
  stagger, 
  createTimeline,
  createDraggable,
  onScroll,
  morphTo,
  createMotionPath,
  splitText,
  cubicBezier,
  random,
  utils
} from 'animejs';

export default function LandingPage() {
  const root = useRef(null);
  const scope = useRef(null);

  useEffect(() => {
    // Small delay to ensure DOM elements are rendered
    const timeoutId = setTimeout(() => {
      scope.current = createScope({ root }).add(self => {
        
        // MASTER TIMELINE - Orchestrates the entire page animation
        const masterTL = createTimeline({ 
          duration: 8000,
          easing: 'outExpo'
        });

        // 1. EXPLOSIVE BRAND ENTRANCE
        masterTL.add('.canv-brand-large', {
          scale: [0, 1.2, 1],
          opacity: [0, 1],
          rotate: [180, 0],
          duration: 1500,
          easing: spring({ bounce: 0.8 })
        });

        // 2. SUBTLE BACKGROUND ANIMATION (reduced from particle burst)
        masterTL.add('.canv-subtle-bg', {
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.6, 0.4],
          rotate: [0, 5, -5, 0],
          duration: 3000,
          easing: 'inOutQuart'
        }, 200);

        // 3. TEXT MORPHING & SPLITTING ANIMATION
        masterTL.add('.canv-hero-letter', {
          scale: [0, 1.5, 1],
          opacity: [0, 1],
          translateY: [200, -20, 0],
          rotateX: [90, -10, 0],
          rotateZ: [180, 20, 0],
          skewX: [30, -10, 0],
          duration: 1200,
          delay: stagger(80, { grid: [6, 4], from: 'center' }),
          easing: spring({ bounce: 0.6 })
        }, 800);

        // 4. COMPLEX SVG MORPHING SEQUENCES
        masterTL.add('.canv-morph-path', {
          d: [
            'M50,150 Q200,50 350,150 Q500,250 650,150',
            'M50,100 Q200,200 350,100 Q500,50 650,100',
            'M50,200 Q200,100 350,200 Q500,150 650,200',
            'M50,150 Q200,250 350,150 Q500,100 650,150'
          ],
          duration: 4000,
          loop: true,
          easing: cubicBezier(0.25, 0.46, 0.45, 0.94)
        }, 1200);

        // 5. GENTLE FLOATING ELEMENTS (reduced physics system)
        masterTL.add('.canv-gentle-float', {
          translateY: [0, -10, 0],
          rotate: [0, 2, -2, 0],
          scale: [1, 1.02, 1],
          duration: 4000,
          loop: true,
          easing: 'inOutSine'
        }, 1000);

        // 6. LIQUID BLOB MORPHING
        masterTL.add('.canv-liquid-blob', {
          d: [
            'M200,200 Q250,150 300,200 Q350,250 300,300 Q250,350 200,300 Q150,250 200,200',
            'M180,180 Q280,120 320,220 Q380,280 320,340 Q220,380 180,280 Q120,220 180,180',
            'M220,220 Q270,170 320,220 Q370,270 320,320 Q270,370 220,320 Q170,270 220,220'
          ],
          duration: 3000,
          direction: 'alternate',
          loop: true,
          easing: 'inOutSine'
        }, 1500);

        // 7. SLIDING TEXT REVEAL 
        masterTL.add('.canv-hero-desc', {
          opacity: [0, 1],
          translateX: [60, 0],
          scale: [0.95, 1],
          duration: 1200,
          easing: 'outQuart'
        }, 2200);

        // 8. SLIDING CTA BUTTONS
        masterTL.add('.canv-hero-cta', {
          opacity: [0, 1],
          scale: [0.9, 1],
          translateX: [-30, 0],
          translateY: [20, 0],
          delay: stagger(150),
          duration: 900,
          easing: spring({ bounce: 0.2 })
        }, 2800);

        // 9. SLIDING FEATURE CARDS
        masterTL.add('.canv-feature-card', {
          opacity: [0, 1],
          translateX: [-100, 0],
          translateY: [40, 0],
          scale: [0.9, 1],
          rotate: [-5, 0],
          delay: stagger(300, { from: 'left' }),
          duration: 1000,
          easing: spring({ bounce: 0.3 })
        }, 3500);

        // 10. SIMPLE NAVIGATION
        masterTL.add('nav', {
          translateY: [-20, 0],
          opacity: [0, 1],
          duration: 600,
          easing: 'outQuart'
        }, 4000);

        // 11. SUBTLE AMBIENT ANIMATIONS
        setTimeout(() => {
          // Gentle brand breathing
          animate('.canv-brand-large', {
            scale: [1, 1.02, 1],
            duration: 8000,
            direction: 'alternate',
            loop: true,
            easing: 'inOutSine'
          });

          // Simple floating elements
          animate('.canv-gentle-float', {
            translateY: [0, -8, 0],
            duration: 6000,
            direction: 'alternate',
            loop: true,
            easing: 'inOutSine'
          });

          // CUTE MOVING ELEMENTS
          // Gentle cloud that slides across screen
          animate('.canv-flying-cloud', {
            translateX: [-100, window.innerWidth + 100],
            translateY: [0, -10, 5, -2, 0],
            scale: [0.9, 1, 1.05, 0.95, 1],
            rotate: [0, 1, -1, 0.5, 0],
            duration: 40000,
            loop: true,
            easing: 'linear'
          });

          // Gentle bubble that moves diagonally
          animate('.canv-bouncing-heart', {
            translateX: [50, window.innerWidth - 100, 50],
            translateY: [100, 80, 250, 120, 100],
            scale: [0.9, 1.1, 0.95, 1.05, 0.9],
            rotate: [0, 8, -5, 3, 0],
            duration: 35000,
            loop: true,
            easing: 'inOutSine'
          });

          // Gentle bubble trail
          animate('.canv-sliding-star', {
            translateX: [window.innerWidth + 50, -100],
            translateY: [80, 100, 70, 90, 80],
            rotate: [0, 180],
            scale: [0.8, 1, 1.1, 0.9, 0.8],
            opacity: [0, 0.6, 0.8, 0.6, 0],
            duration: 30000,
            loop: true,
            easing: 'inOutQuart'
          });

          // Cute floating bubble trail
          animate('.canv-bubble-trail', {
            translateX: [100, window.innerWidth - 200, 150],
            translateY: [400, 200, 350, 180, 400],
            scale: [0.6, 1, 1.3, 0.9, 0.6],
            opacity: [0.3, 0.8, 1, 0.6, 0.3],
            duration: 22000,
            loop: true,
            easing: 'inOutElastic'
          });

          // Gentle zigzag butterfly
          animate('.canv-zigzag-butterfly', {
            translateX: [0, 200, 100, 300, 50, 400, 0],
            translateY: [200, 150, 250, 120, 280, 180, 200],
            rotate: [0, 10, -15, 8, -12, 5, 0],
            scale: [0.7, 1, 0.8, 1.1, 0.9, 1, 0.7],
            duration: 30000,
            loop: true,
            easing: 'inOutSine'
          });

          // SCREEN TRAVERSING BUBBLES
          // Horizontal sliding bubble dots
          animate('.canv-sliding-dots', {
            translateX: [-50, window.innerWidth + 50],
            opacity: [0, 0.4, 0.6, 0.4, 0],
            duration: 25000,
            loop: true,
            easing: 'linear'
          });

          // Vertical sliding bubble stream
          animate('.canv-vertical-slider', {
            translateY: [window.innerHeight + 50, -50],
            translateX: [0, 15, -10, 5, 0],
            rotate: [0, 3, -2, 1, 0],
            opacity: [0, 0.3, 0.5, 0.2, 0],
            duration: 20000,
            loop: true,
            easing: 'inOutQuart'
          });

          // Diagonal bubble traverser
          animate('.canv-diagonal-mover', {
            translateX: [window.innerWidth + 100, -100],
            translateY: [-100, window.innerHeight + 100],
            rotate: [0, 90],
            scale: [0.7, 1, 1.1, 0.9, 0.7],
            opacity: [0, 0.4, 0.6, 0.3, 0],
            duration: 35000,
            loop: true,
            easing: 'inOutSine'
          });

          // Gentle wave motion for bubble elements  
          animate('.canv-wave-element', {
            translateX: [0, 60, -30, 50, 0],
            translateY: [0, -20, 15, -25, 0],
            rotate: [0, 8, -5, 4, 0],
            duration: 25000,
            loop: true,
            easing: 'inOutSine'
          });

          // Orbit around invisible center
          animate('.canv-orbital-element', {
            rotate: [0, 360],
            scale: [0.8, 1.2, 0.9, 1.1, 0.8],
            duration: 25000,
            loop: true,
            easing: 'linear'
          });

        }, 5000);

        // 12. SIMPLE BACKGROUND ELEMENTS
        animate('.canv-bg-ellipse1', {
          translateY: [0, 20, 0],
          rotate: [0, 10, 0],
          duration: 12000,
          direction: 'alternate',
          loop: true,
          easing: 'inOutSine'
        });

        // 13. MODERN SCROLL BEHAVIOR - Removed heavy parallax for smooth scrolling

        // 13. SCROLL-TRIGGERED PARALLAX
        onScroll(({ scroll }) => {
          animate('.canv-parallax-1', {
            translateY: scroll.y * 0.5,
            rotate: scroll.y * 0.1,
            duration: 0
          });
          animate('.canv-parallax-2', {
            translateY: scroll.y * -0.3,
            translateX: scroll.y * 0.1,
            duration: 0
          });
          animate('.canv-parallax-3', {
            translateY: scroll.y * 0.8,
            scale: 1 + (scroll.y * 0.0001),
            duration: 0
          });
        });

        // 14. DRAGGABLE INTERACTIVE ELEMENTS
        createDraggable('.canv-draggable-logo', {
          container: root.current,
          releaseEase: spring({ bounce: 0.8 }),
          onDrag: (draggable) => {
            animate(draggable.element, {
              rotate: draggable.velocity.x * 0.5,
              scale: 1.1,
              duration: 0
            });
          },
          onRelease: (draggable) => {
            animate(draggable.element, {
              rotate: 0,
              scale: 1,
              duration: 800,
              easing: spring({ bounce: 0.6 })
            });
          }
        });

        // 15. MOTION PATH ANIMATIONS
        const motionPath = createMotionPath('.canv-motion-element', {
          path: 'M50,50 Q200,20 350,50 Q500,80 650,50',
          duration: 8000,
          loop: true,
          easing: 'linear'
        });

        animate('.canv-motion-element', {
          rotate: [0, 360],
          scale: [1, 1.5, 1],
          duration: 8000,
          loop: true,
          easing: 'linear'
        });

        // Glitch effect for brand name
        animate('.canv-brand', {
          textShadow: [
            '0 0 0 transparent',
            '2px 0 0 #ff0080, -2px 0 0 #00ffff',
            '0 0 0 transparent'
          ],
          duration: 200,
          delay: 3000,
          loop: true,
          loopDelay: 5000,
          easing: 'steps(3)'
        });

        // Interactive methods for user interactions
        self.add('magneticHover', (element) => {
          animate(element, {
            scale: [1, 1.05],
            translateY: [0, -5],
            boxShadow: [
              '0 4px 8px rgba(0,0,0,0.1)',
              '0 12px 24px rgba(0,0,0,0.2)'
            ],
            duration: 300,
            easing: 'outQuart'
          });
        });

        self.add('magneticLeave', (element) => {
          animate(element, {
            scale: [1.05, 1],
            translateY: [-5, 0],
            boxShadow: [
              '0 12px 24px rgba(0,0,0,0.2)',
              '0 4px 8px rgba(0,0,0,0.1)'
            ],
            duration: 400,
            easing: spring({ bounce: 0.3 })
          });
        });

        self.add('rippleEffect', (element, x, y) => {
          const ripple = document.createElement('div');
          ripple.classList.add('canv-ripple');
          ripple.style.cssText = `
            position: absolute;
            border-radius: 50%;
            background: rgba(26, 35, 65, 0.3);
            pointer-events: none;
            left: ${x}px;
            top: ${y}px;
            width: 0;
            height: 0;
            transform: translate(-50%, -50%);
          `;
          element.appendChild(ripple);

          animate(ripple, {
            width: [0, 200],
            height: [0, 200],
            opacity: [0.6, 0],
            duration: 600,
            easing: 'outQuart',
            onComplete: () => ripple.remove()
          });
        });
      });
    }, 100);

    // Properly cleanup all anime.js instances
    return () => {
      clearTimeout(timeoutId);
      scope.current?.revert();
    };
  }, []);

  return (
    <div ref={root} className="relative min-h-screen bg-gradient-to-br from-[#f6fcff] via-[#eaf6fa] to-[#eaf6fa] overflow-x-hidden" style={{ scrollBehavior: 'smooth' }}>
      {/* ULTRA ADVANCED ANIMATED BACKGROUND */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <svg width="100%" height="100%" viewBox="0 0 1440 800" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Complex Morphing Paths */}
          <path className="canv-morph-path" d="M50,150 Q200,50 350,150 Q500,250 650,150" stroke="url(#gradient1)" strokeWidth="3" fill="none" />
          <path className="canv-morph-path" d="M100,200 Q300,100 500,200 Q700,300 900,200" stroke="url(#gradient2)" strokeWidth="2" fill="none" />
          
          {/* Liquid Morphing Blobs */}
          <path className="canv-liquid-blob" d="M200,200 Q250,150 300,200 Q350,250 300,300 Q250,350 200,300 Q150,250 200,200" fill="url(#gradient3)" fillOpacity="0.4" />
          <path className="canv-liquid-blob" d="M600,150 Q650,100 700,150 Q750,200 700,250 Q650,300 600,250 Q550,200 600,150" fill="url(#gradient4)" fillOpacity="0.3" />
          
          {/* Advanced Floating Elements */}
          <ellipse className="canv-bg-ellipse1" cx="900" cy="-100" rx="700" ry="300" fill="url(#gradient5)" fillOpacity="0.25" />
          <ellipse className="canv-bg-ellipse2" cx="200" cy="400" rx="500" ry="200" fill="url(#gradient6)" fillOpacity="0.18" />
          <ellipse className="canv-bg-ellipse3" cx="1200" cy="700" rx="400" ry="150" fill="url(#gradient7)" fillOpacity="0.13" />
          
          {/* Subtle Background Elements */}
          {[...Array(5)].map((_, i) => (
            <circle 
              key={i}
              className="canv-subtle-bg" 
              cx={200 + i * 250} 
              cy={150 + i * 80} 
              r={2 + i} 
              fill={`url(#gradient${(i % 3) + 1})`}
              fillOpacity={0.2}
            />
          ))}

          {/* Simple Floating Elements */}
          <circle className="canv-gentle-float" cx="720" cy="200" r="4" fill="#7fd3f7" fillOpacity="0.3"/>
          <circle className="canv-gentle-float" cx="200" cy="500" r="3" fill="#b6e0f7" fillOpacity="0.2"/>

          {/* Animated Background Gradients */}
                  <rect width="100%" height="100%" fill="url(#backgroundGradient)" opacity="0.02" className="canv-animated-bg" />
          
          {/* Advanced Gradient Definitions */}
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#b6e0f7">
                <animate attributeName="stop-color" values="#b6e0f7;#7fd3f7;#1a2341;#b6e0f7" dur="6s" repeatCount="indefinite"/>
              </stop>
              <stop offset="100%" stopColor="#7fd3f7">
                <animate attributeName="stop-color" values="#7fd3f7;#1a2341;#b6e0f7;#7fd3f7" dur="8s" repeatCount="indefinite"/>
              </stop>
            </linearGradient>
            
            <radialGradient id="gradient2" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#7fd3f7"/>
              <stop offset="100%" stopColor="transparent"/>
            </radialGradient>
            
            <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1a2341" stopOpacity="0.6"/>
              <stop offset="50%" stopColor="#7fd3f7" stopOpacity="0.4"/>
              <stop offset="100%" stopColor="#b6e0f7" stopOpacity="0.2"/>
            </linearGradient>
            
            <radialGradient id="gradient4" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#b6e0f7"/>
              <stop offset="100%" stopColor="transparent"/>
            </radialGradient>
            
            <radialGradient id="gradient5" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#7fd3f7" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="transparent"/>
            </radialGradient>
            
            <radialGradient id="gradient6" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1a2341" stopOpacity="0.2"/>
              <stop offset="100%" stopColor="transparent"/>
            </radialGradient>
            
            <radialGradient id="gradient7" cx="50%" cy="50%" r="40%">
              <stop offset="0%" stopColor="#b6e0f7" stopOpacity="0.4"/>
              <stop offset="100%" stopColor="transparent"/>
            </radialGradient>

            <linearGradient id="animatedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7fd3f7">
                <animate attributeName="offset" values="0%;30%;0%" dur="10s" repeatCount="indefinite"/>
              </stop>
              <stop offset="50%" stopColor="#b6e0f7">
                <animate attributeName="offset" values="50%;80%;50%" dur="15s" repeatCount="indefinite"/>
              </stop>
              <stop offset="100%" stopColor="#1a2341">
                <animate attributeName="offset" values="100%;70%;100%" dur="12s" repeatCount="indefinite"/>
              </stop>
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Top Navigation */}
      <nav className="relative z-10 flex justify-between items-center px-8 pt-8">
        <div className="flex items-center gap-2">
          <span className="canv-brand text-4xl md:text-5xl font-extrabold tracking-tight text-[#1a2341]">Canvoras</span>
        </div>
        <div className="flex items-center gap-4 text-[#1a2341] font-medium">
          <Link to="#features" className="hover:underline">Features</Link>
          <Link to="#about" className="hover:underline">About</Link>
          <Link to="#contact" className="hover:underline">Contact</Link>
          <Link to="/login" className="px-4 py-1 rounded bg-[#eaf6fa] hover:bg-[#d1eaf6] transition">Sign In</Link>
          <Link to="/signup" className="px-4 py-1 rounded bg-[#b6e0f7] text-[#1a2341] font-semibold hover:bg-[#7fd3f7] transition">Get Started</Link>
        </div>
      </nav>

      {/* EXPLOSIVE BRAND DISPLAY */}
      <div className="relative z-10 text-center pt-16 pb-8">
        <div className="canv-draggable-logo cursor-grab active:cursor-grabbing">
          <h1 className="canv-brand-large text-8xl md:text-9xl font-black text-[#1a2341] tracking-tighter mb-4">
            Canvoras
          </h1>
        </div>
        <p className="text-2xl md:text-3xl text-[#1a2341] font-medium opacity-80 canv-parallax-2">
          Business Management Platform
        </p>

      </div>

      {/* Main Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center text-center pt-8 pb-16 px-4">
        <h2 className="canv-hero-title text-4xl md:text-6xl font-extrabold text-[#1a2341] leading-tight mb-4 tracking-tight" style={{letterSpacing: '-0.03em'}}>
          {['E','m','p','o','w','e','r','i','n','g',' ','b','u','s','i','n','e','s','s'].map((letter, i) => (
            <span key={i} className="canv-hero-letter inline-block">
              {letter === ' ' ? '\u00A0' : letter}
            </span>
          ))}
          <br className="hidden md:block" />
          {['g','r','o','w','t','h'].map((letter, i) => (
            <span key={`growth-${i}`} className="canv-hero-letter inline-block text-transparent bg-clip-text bg-gradient-to-r from-[#1a2341] to-[#7fd3f7]">
              {letter}
            </span>
          ))}
        </h2>
        <div className="w-24 h-2 bg-[#1a2341] rounded-full mx-auto my-6 opacity-20" />
        <p className="canv-hero-desc max-w-3xl mx-auto text-lg md:text-xl text-[#1a2341] font-medium mb-8">
          Transform your business with Canvoras - the comprehensive platform that unites sales, inventory, and finance management. 
          <br className="hidden md:block" />
          <span className="font-semibold text-[#1a2341]">Streamline operations. Drive growth. Scale effortlessly.</span>
        </p>
        <div className="canv-hero-cta flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Link 
            to="/signup" 
            className="canv-cta-button relative overflow-hidden px-8 py-3 rounded-full bg-[#1a2341] text-white text-lg font-semibold shadow hover:bg-[#22306a] transition"
            onMouseEnter={(e) => scope.current?.methods?.magneticHover?.(e.currentTarget)}
            onMouseLeave={(e) => scope.current?.methods?.magneticLeave?.(e.currentTarget)}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              scope.current?.methods?.rippleEffect?.(e.currentTarget, x, y);
            }}
          >
            Start Free Trial
          </Link>
          <Link 
            to="/login" 
            className="canv-cta-button relative overflow-hidden px-8 py-3 rounded-full border-2 border-[#1a2341] text-[#1a2341] text-lg font-semibold hover:bg-[#eaf6fa] transition"
            onMouseEnter={(e) => scope.current?.methods?.magneticHover?.(e.currentTarget)}
            onMouseLeave={(e) => scope.current?.methods?.magneticLeave?.(e.currentTarget)}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              scope.current?.methods?.rippleEffect?.(e.currentTarget, x, y);
            }}
          >
            Contact Sales
          </Link>
        </div>
        <div className="max-w-xl mx-auto text-[#1a2341] text-base md:text-lg opacity-80 font-normal">
          Trusted by forward-thinking teams to streamline operations, gain insights, and drive results.
        </div>

        {/* Key Features Section */}
        <div className="canv-features grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-6xl mx-auto px-4">
          <div className="canv-feature-card text-center p-8 rounded-2xl border-2 border-[#7fd3f7]/30 hover:border-[#7fd3f7]/60 transition-all duration-500 cursor-pointer group hover:shadow-2xl">
            <div className="canv-feature-icon w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-[#1a2341] to-[#7fd3f7] rounded-2xl flex items-center justify-center text-white text-3xl font-bold group-hover:scale-110 transition-transform duration-300 shadow-lg">
              📊
            </div>
            <h3 className="text-2xl font-bold text-[#1a2341] mb-4">Sales Management</h3>
            <p className="text-[#1a2341] opacity-90 text-lg">Track leads, manage pipelines, and close deals with powerful sales automation tools.</p>
          </div>
          
          <div className="canv-feature-card text-center p-8 rounded-2xl border-2 border-[#7fd3f7]/30 hover:border-[#7fd3f7]/60 transition-all duration-500 cursor-pointer group hover:shadow-2xl">
            <div className="canv-feature-icon w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-[#1a2341] to-[#7fd3f7] rounded-2xl flex items-center justify-center text-white text-3xl font-bold group-hover:scale-110 transition-transform duration-300 shadow-lg">
              📦
            </div>
            <h3 className="text-2xl font-bold text-[#1a2341] mb-4">Inventory Control</h3>
            <p className="text-[#1a2341] opacity-90 text-lg">Real-time inventory tracking, automated reorders, and stock optimization.</p>
          </div>
          
          <div className="canv-feature-card text-center p-8 rounded-2xl border-2 border-[#7fd3f7]/30 hover:border-[#7fd3f7]/60 transition-all duration-500 cursor-pointer group hover:shadow-2xl">
            <div className="canv-feature-icon w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-[#1a2341] to-[#7fd3f7] rounded-2xl flex items-center justify-center text-white text-3xl font-bold group-hover:scale-110 transition-transform duration-300 shadow-lg">
              💰
            </div>
            <h3 className="text-2xl font-bold text-[#1a2341] mb-4">Financial Insights</h3>
            <p className="text-[#1a2341] opacity-90 text-lg">Complete financial overview with analytics, reporting, and forecasting.</p>
          </div>
        </div>

        {/* SUBTLE DECORATIVE ELEMENTS */}
        <div className="canv-gentle-float absolute top-1/3 right-20 w-3 h-3 bg-gradient-to-r from-[#7fd3f7] to-[#b6e0f7] rounded-full opacity-40"></div>
        <div className="canv-gentle-float absolute bottom-1/4 left-1/5 w-4 h-4 bg-gradient-to-r from-[#b6e0f7] to-[#7fd3f7] rounded-full opacity-30"></div>
      </main>

      {/* (Optional) Logos or Partners Section */}
      <section className="relative z-10 flex flex-wrap justify-center items-center gap-8 py-8 opacity-70">
        {/* Example logos, replace with real ones if available */}
        <span className="text-xs font-semibold text-[#1a2341]">IBM</span>
        <span className="text-xs font-semibold text-[#1a2341]">Airbus</span>
        <span className="text-xs font-semibold text-[#1a2341]">GE</span>
        <span className="text-xs font-semibold text-[#1a2341]">Tata</span>
        <span className="text-xs font-semibold text-[#1a2341]">ONGC</span>
        <span className="text-xs font-semibold text-[#1a2341]">Reliance</span>
      </section>

      {/* CUTE MOVING ELEMENTS */}
      <div className="fixed inset-0 pointer-events-none z-5 overflow-hidden">
        {/* Floating Bubble Cloud */}
        <div className="canv-flying-cloud absolute top-12 left-0">
          <div className="w-8 h-6 bg-blue-200/20 rounded-full relative border border-blue-300/30 shadow-sm">
            <div className="absolute -left-1 top-1 w-4 h-4 bg-blue-200/15 rounded-full border border-blue-300/20"></div>
            <div className="absolute -right-0.5 top-0.5 w-5 h-4 bg-blue-200/18 rounded-full border border-blue-300/25"></div>
            <div className="absolute left-1.5 -top-0.5 w-3 h-3 bg-blue-200/25 rounded-full border border-blue-300/35"></div>
          </div>
        </div>

        {/* Floating Bubble 1 - positioned to avoid main content */}
        <div className="canv-bouncing-heart absolute top-48 left-8">
          <div className="w-4 h-4 bg-blue-200/25 rounded-full border border-blue-300/35 relative shadow-sm">
            <div className="absolute inset-0.5 bg-blue-100/20 rounded-full"></div>
            <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-white/50 rounded-full"></div>
          </div>
        </div>

        {/* Floating Bubble 2 - positioned to avoid navigation */}
        <div className="canv-sliding-star absolute top-32 right-0">
          <div className="w-3 h-3 bg-cyan-200/30 rounded-full border border-cyan-300/40 relative shadow-sm">
            <div className="absolute inset-0.5 bg-cyan-100/25 rounded-full"></div>
            <div className="absolute top-0.5 left-0.5 w-0.5 h-0.5 bg-white/60 rounded-full"></div>
          </div>
        </div>

        {/* Bubble Trail */}
        <div className="canv-bubble-trail absolute bottom-32 left-20">
          <div className="w-8 h-8 bg-blue-200/35 rounded-full border-2 border-blue-300/40 relative shadow-lg">
            <div className="absolute inset-1 bg-blue-100/25 rounded-full"></div>
            <div className="absolute top-1 left-1 w-2 h-2 bg-white/70 rounded-full"></div>
          </div>
        </div>

        {/* Floating Bubble 3 - positioned in safe margin */}
        <div className="canv-zigzag-butterfly absolute top-72 left-4">
          <div className="w-5 h-5 bg-teal-200/25 rounded-full border border-teal-300/35 relative shadow-md">
            <div className="absolute inset-1 bg-teal-100/20 rounded-full"></div>
            <div className="absolute top-1 left-1 w-1 h-1 bg-white/45 rounded-full"></div>
          </div>
        </div>

        {/* Additional cute elements */}
        <div className="canv-gentle-float absolute top-64 right-32">
          <div className="w-3 h-3 bg-pink-300/50 rounded-full animate-pulse"></div>
        </div>
        
        <div className="canv-gentle-float absolute bottom-48 right-16">
          <div className="w-2 h-2 bg-emerald-200/30 rounded-full border border-emerald-300/40 relative">
            <div className="absolute inset-0.5 bg-emerald-100/20 rounded-full"></div>
          </div>
        </div>

        {/* Screen Traversing Elements */}
        <div className="canv-sliding-dots absolute top-3/5 left-0">
          <div className="flex space-x-6">
            <div className="w-2 h-2 bg-blue-200/25 rounded-full border border-blue-300/30 relative">
              <div className="absolute inset-0.5 bg-blue-100/20 rounded-full"></div>
            </div>
            <div className="w-3 h-3 bg-cyan-200/20 rounded-full border border-cyan-300/25 relative">
              <div className="absolute inset-0.5 bg-cyan-100/15 rounded-full"></div>
              <div className="absolute top-0.5 left-0.5 w-0.5 h-0.5 bg-white/40 rounded-full"></div>
            </div>
            <div className="w-2 h-2 bg-teal-200/25 rounded-full border border-teal-300/30 relative">
              <div className="absolute inset-0.5 bg-teal-100/20 rounded-full"></div>
            </div>
          </div>
        </div>

        <div className="canv-vertical-slider absolute top-0 right-1/4">
          <div className="w-6 h-6 bg-cyan-200/20 rounded-full border border-cyan-300/25 relative">
            <div className="absolute inset-1 bg-cyan-100/15 rounded-full"></div>
            <div className="absolute top-1 left-1 w-1 h-1 bg-white/35 rounded-full"></div>
          </div>
        </div>

        <div className="canv-diagonal-mover absolute top-0 right-0">
          <div className="w-4 h-4 bg-blue-200/25 rounded-full border border-blue-300/30 relative">
            <div className="absolute inset-0.5 bg-blue-100/20 rounded-full"></div>
            <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-white/40 rounded-full"></div>
          </div>
        </div>

        {/* Wave Motion Elements */}
        <div className="canv-wave-element absolute top-1/4 left-1/3">
          <div className="w-3 h-3 bg-blue-200/25 rounded-full border border-blue-300/30 relative">
            <div className="absolute inset-0.5 bg-blue-100/20 rounded-full"></div>
            <div className="absolute top-0.5 left-0.5 w-0.5 h-0.5 bg-white/45 rounded-full"></div>
          </div>
        </div>

        <div className="canv-wave-element absolute bottom-1/3 right-1/4">
          <div className="w-2 h-2 bg-gradient-to-r from-teal-400/40 to-blue-400/40 rounded-full"></div>
        </div>

        {/* Orbital Elements */}
        <div className="canv-orbital-element absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="relative w-20 h-20">
            <div className="absolute top-0 left-1/2 w-2 h-2 bg-indigo-400/50 rounded-full transform -translate-x-1/2"></div>
            <div className="absolute bottom-0 right-1/2 w-1.5 h-1.5 bg-purple-400/40 rounded-full transform translate-x-1/2"></div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 text-center text-[#1a2341] py-8 bg-transparent text-sm opacity-70">
        © {new Date().getFullYear()} Canvoras. All rights reserved.
      </footer>
    </div>
  );
}
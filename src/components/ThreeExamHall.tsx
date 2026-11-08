import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Camera, Eye, Maximize2, Minimize2, RotateCcw, Volume2, ShieldCheck, Clock } from 'lucide-react';

interface ThreeExamHallProps {
  onClose?: () => void;
  examTitle?: string;
  isStudentView?: boolean;
}

export const ThreeExamHall: React.FC<ThreeExamHallProps> = ({
  onClose,
  examTitle = 'Python Programming Examination',
  isStudentView = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeCameraAngle, setActiveCameraAngle] = useState<'hall' | 'desk' | 'proctor'>('hall');
  const [hallStatus, setHallStatus] = useState('Active Proctoring: 24 Desks Online');

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 500;

    // 1. Software WebGL detection guard
    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch (e) {
        return true;
      }
    })();

    // 2. Renderer setup with ACESFilmic & SRGBColorSpace
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a); // Deep slate
    scene.fog = new THREE.FogExp2(0x0f172a, 0.025);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 7, 13);
    camera.lookAt(0, 1.2, 0);

    // 4. Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0x94a3b8, 0x0f172a, 0.7);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(8, 14, 10);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.001;
    scene.add(keyLight);

    // Subtle blue fill light
    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.5);
    fillLight.position.set(-8, 10, -5);
    scene.add(fillLight);

    // 5. Procedural Textures (Zero external 404 dependencies)
    const createFloorTexture = () => {
      const cvs = document.createElement('canvas');
      cvs.width = 512;
      cvs.height = 512;
      const ctx = cvs.getContext('2d')!;
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 512, 512);

      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      const step = 64;
      for (let x = 0; x <= 512; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 512);
        ctx.stroke();
      }
      for (let y = 0; y <= 512; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(512, y);
        ctx.stroke();
      }
      const tex = new THREE.CanvasTexture(cvs);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(12, 12);
      return tex;
    };

    const createScreenTexture = () => {
      const cvs = document.createElement('canvas');
      cvs.width = 512;
      cvs.height = 256;
      const ctx = cvs.getContext('2d')!;
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, 512, 256);

      // Terminal header
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 512, 32);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(20, 16, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(38, 16, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(56, 16, 6, 0, Math.PI * 2);
      ctx.fill();

      // Exam code preview
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 18px monospace';
      ctx.fillText('ExamFlow Secure Terminal v1.0', 80, 22);

      ctx.fillStyle = '#10b981';
      ctx.font = '16px monospace';
      ctx.fillText('> def solve_problem(input_stream):', 25, 70);
      ctx.fillStyle = '#f8fafc';
      ctx.fillText('    # Proctor Verified: Active Focus', 45, 100);
      ctx.fillStyle = '#fbbf24';
      ctx.fillText('    return evaluate_algorithm()', 45, 130);

      // Status indicator
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(25, 190, 460, 36);
      ctx.fillStyle = '#052e16';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('● FULLSCREEN MONITORING ENGAGED', 100, 214);

      const tex = new THREE.CanvasTexture(cvs);
      return tex;
    };

    // Floor Mesh
    const floorGeo = new THREE.PlaneGeometry(60, 60);
    const floorMat = new THREE.MeshStandardMaterial({
      map: createFloorTexture(),
      roughness: 0.4,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = !isSoftwareGl;
    scene.add(floor);

    // Front Wall with Exam Banner
    const wallGeo = new THREE.PlaneGeometry(60, 16);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.8,
    });
    const backWall = new THREE.Mesh(wallGeo, wallMat);
    backWall.position.set(0, 8, -12);
    scene.add(backWall);

    // 6. Build Composite 3-12 Part Procedural Workstation Group
    const screenTexture = createScreenTexture();

    const createWorkstation = (posX: number, posZ: number, isOccupied = true) => {
      const group = new THREE.Group();

      // Part 1: Wooden Tabletop
      const topGeo = new THREE.BoxGeometry(2.4, 0.08, 1.2);
      const topMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        roughness: 0.3,
        metalness: 0.05,
      });
      const top = new THREE.Mesh(topGeo, topMat);
      top.position.y = 1.35;
      top.castShadow = !isSoftwareGl;
      top.receiveShadow = !isSoftwareGl;
      group.add(top);

      // Part 2: Steel Frame Legs
      const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.35, 12);
      const legMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        roughness: 0.2,
        metalness: 0.8,
      });

      const legPositions = [
        [-1.1, 0.675, -0.5],
        [1.1, 0.675, -0.5],
        [-1.1, 0.675, 0.5],
        [1.1, 0.675, 0.5],
      ];
      legPositions.forEach(([x, y, z]) => {
        const leg = new THREE.Mesh(legGeo, legMat);
        leg.position.set(x, y, z);
        leg.castShadow = !isSoftwareGl;
        group.add(leg);
      });

      // Part 3: Monitor Screen Bezel & Display
      const bezelGeo = new THREE.BoxGeometry(1.2, 0.75, 0.04);
      const bezelMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.3,
        metalness: 0.7,
      });
      const bezel = new THREE.Mesh(bezelGeo, bezelMat);
      bezel.position.set(0, 1.95, -0.2);
      group.add(bezel);

      // Monitor Screen (Emissive Canvas)
      const screenGeo = new THREE.PlaneGeometry(1.14, 0.68);
      const screenMat = new THREE.MeshBasicMaterial({
        map: screenTexture,
      });
      const screen = new THREE.Mesh(screenGeo, screenMat);
      screen.position.set(0, 1.95, -0.178);
      group.add(screen);

      // Monitor Stand
      const standPoleGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8);
      const standPole = new THREE.Mesh(standPoleGeo, bezelMat);
      standPole.position.set(0, 1.6, -0.2);
      group.add(standPole);

      const standBaseGeo = new THREE.CylinderGeometry(0.2, 0.22, 0.02, 16);
      const standBase = new THREE.Mesh(standBaseGeo, bezelMat);
      standBase.position.set(0, 1.4, -0.2);
      group.add(standBase);

      // Part 4: Keyboard & Mouse
      const kbGeo = new THREE.BoxGeometry(0.7, 0.02, 0.25);
      const kbMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
      const kb = new THREE.Mesh(kbGeo, kbMat);
      kb.position.set(0, 1.4, 0.15);
      group.add(kb);

      const mouseGeo = new THREE.BoxGeometry(0.1, 0.025, 0.16);
      const mouse = new THREE.Mesh(mouseGeo, kbMat);
      mouse.position.set(0.5, 1.4, 0.15);
      group.add(mouse);

      // Part 5: Ergonomic Chair
      const chairSeatGeo = new THREE.BoxGeometry(0.8, 0.08, 0.8);
      const chairMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.6 });
      const chairSeat = new THREE.Mesh(chairSeatGeo, chairMat);
      chairSeat.position.set(0, 0.85, 0.75);
      group.add(chairSeat);

      const chairBackGeo = new THREE.BoxGeometry(0.75, 0.9, 0.08);
      const chairBack = new THREE.Mesh(chairBackGeo, chairMat);
      chairBack.position.set(0, 1.35, 1.12);
      group.add(chairBack);

      const chairPole = new THREE.Mesh(standPoleGeo, legMat);
      chairPole.position.set(0, 0.45, 0.75);
      group.add(chairPole);

      // Soft contact shadow disk underneath
      const shadowGeo = new THREE.CircleGeometry(1.6, 16);
      const shadowMat = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.35,
      });
      const shadow = new THREE.Mesh(shadowGeo, shadowMat);
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = 0.01;
      group.add(shadow);

      // Student Status Light on top of monitor (Green = Active, Blue = Review, Amber = Violation)
      const statusPinGeo = new THREE.SphereGeometry(0.05, 12, 12);
      const statusMat = new THREE.MeshBasicMaterial({
        color: isOccupied ? 0x10b981 : 0x64748b,
      });
      const statusPin = new THREE.Mesh(statusPinGeo, statusMat);
      statusPin.position.set(0, 2.4, -0.2);
      group.add(statusPin);

      group.position.set(posX, 0, posZ);
      return group;
    };

    // Populate Examination Hall Desks in 3x3 Grid
    const deskRows = [-2.5, 1.5, 5.5];
    const deskCols = [-4.5, 0, 4.5];

    deskRows.forEach((z) => {
      deskCols.forEach((x) => {
        scene.add(createWorkstation(x, z, true));
      });
    });

    // 7. Proctoring Drone / Camera in the Ceiling
    const droneGroup = new THREE.Group();
    const droneBodyGeo = new THREE.SphereGeometry(0.4, 16, 16);
    const droneMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.2,
      metalness: 0.9,
    });
    const droneBody = new THREE.Mesh(droneBodyGeo, droneMat);
    droneGroup.add(droneBody);

    // Glowing camera sensor lens
    const lensGeo = new THREE.CylinderGeometry(0.15, 0.2, 0.2, 16);
    const lensMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.8,
    });
    const lens = new THREE.Mesh(lensGeo, lensMat);
    lens.position.y = -0.25;
    droneGroup.add(lens);

    // Light spotlight from proctor camera
    const spotLight = new THREE.SpotLight(0x38bdf8, 2, 20, Math.PI / 6, 0.5, 1);
    spotLight.position.set(0, 0, 0);
    spotLight.target.position.set(0, 0, 0);
    scene.add(spotLight.target);
    droneGroup.add(spotLight);

    droneGroup.position.set(0, 6.5, 2);
    scene.add(droneGroup);

    // 8. Wall Digital Timer Clock
    const clockGroup = new THREE.Group();
    const clockBezelGeo = new THREE.BoxGeometry(4.5, 1.5, 0.2);
    const clockBezel = new THREE.Mesh(clockBezelGeo, droneMat);
    clockGroup.add(clockBezel);

    const clockCvs = document.createElement('canvas');
    clockCvs.width = 512;
    clockCvs.height = 170;
    const cctx = clockCvs.getContext('2d')!;
    cctx.fillStyle = '#050b14';
    cctx.fillRect(0, 0, 512, 170);
    cctx.fillStyle = '#38bdf8';
    cctx.font = 'bold 24px monospace';
    cctx.fillText('EXAMFLOW PROCTOR CLOCK', 80, 45);
    cctx.fillStyle = '#22c55e';
    cctx.font = 'bold 64px monospace';
    cctx.fillText('01:19:42', 110, 125);

    const clockTex = new THREE.CanvasTexture(clockCvs);
    const clockFaceGeo = new THREE.PlaneGeometry(4.2, 1.3);
    const clockFace = new THREE.Mesh(clockFaceGeo, new THREE.MeshBasicMaterial({ map: clockTex }));
    clockFace.position.z = 0.11;
    clockGroup.add(clockFace);

    clockGroup.position.set(0, 6, -11.8);
    scene.add(clockGroup);

    // 9. Damped Mouse Interaction & Camera Control
    let targetX = camera.position.x;
    let targetY = camera.position.y;
    let targetZ = camera.position.z;
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let angleH = 0;
    let angleV = 0.4;
    let radius = 14;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      isDragging = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      prevMouseX = clientX;
      prevMouseY = clientY;
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const dx = clientX - prevMouseX;
      const dy = clientY - prevMouseY;
      prevMouseX = clientX;
      prevMouseY = clientY;

      angleH -= dx * 0.005;
      angleV = Math.max(0.1, Math.min(1.2, angleV + dy * 0.005));
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    container.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    container.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);

    // 10. Animation Loop with Exponential Damping
    let reqId: number;
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      reqId = requestAnimationFrame(animate);
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      // Subtle drone scan rotation
      droneGroup.rotation.y = Math.sin(currentTime * 0.001) * 0.5;

      // Update camera target based on angles
      const k = 5;
      const factor = 1 - Math.exp(-k * dt);

      targetX = Math.sin(angleH) * Math.cos(angleV) * radius;
      targetZ = Math.cos(angleH) * Math.cos(angleV) * radius;
      targetY = Math.sin(angleV) * radius + 1.2;

      camera.position.x += (targetX - camera.position.x) * factor;
      camera.position.y += (targetY - camera.position.y) * factor;
      camera.position.z += (targetZ - camera.position.z) * factor;
      camera.lookAt(0, 1.4, 0);

      renderer.render(scene, camera);
    };

    reqId = requestAnimationFrame(animate);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || 500;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      container.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);

      renderer.dispose();
      floorGeo.dispose();
      floorMat.dispose();
      wallGeo.dispose();
      wallMat.dispose();
    };
  }, []);

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden border border-slate-700 bg-slate-900 shadow-2xl transition-all duration-300 ${
        isExpanded ? 'fixed inset-4 z-50 h-[calc(100vh-2rem)]' : 'h-[440px]'
      }`}
    >
      {/* Three.js Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top HUD Overlay (Compact <= 15% footprint) */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3 bg-slate-900/90 backdrop-blur border border-slate-700/80 px-3.5 py-1.5 rounded-xl shadow-lg pointer-events-auto">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-slate-200">
            3D Exam Hall & Proctoring Simulation
          </span>
          <span className="text-[11px] text-slate-400 border-l border-slate-700 pl-2">
            Drag to Orbit &bull; PBR Studio View
          </span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors shadow-lg"
            title={isExpanded ? 'Exit Fullscreen' : 'Expand 3D View'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-rose-950/80 hover:text-rose-300 text-slate-300 border border-slate-700 text-xs font-medium transition-colors shadow-lg"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Bottom Floating Control Dock */}
      <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="bg-slate-900/90 border border-slate-700/80 px-3 py-1.5 rounded-xl text-xs text-slate-300 shadow-lg pointer-events-auto flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{hallStatus}</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-700/80 p-1 rounded-xl shadow-lg pointer-events-auto flex items-center gap-1">
          <button
            onClick={() => setActiveCameraAngle('hall')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              activeCameraAngle === 'hall'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveCameraAngle('desk')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              activeCameraAngle === 'desk'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Student Desk
          </button>
          <button
            onClick={() => setActiveCameraAngle('proctor')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              activeCameraAngle === 'proctor'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Proctor Cam
          </button>
        </div>
      </div>
    </div>
  );
};

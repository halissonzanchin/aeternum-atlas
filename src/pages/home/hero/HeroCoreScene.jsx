import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { HERO_CORE_CONFIG } from './heroCoreConfig';

// Helper to generate a Fibonacci Sphere with radial variation and layers
function getFibonacciSpherePoints(samples, config) {
  const points = [];
  const phi = Math.PI * (3 - Math.sqrt(5)); // golden angle
  const { coreRadius } = config.geometry;
  
  for (let i = 0; i < samples; i++) {
    const y = 1 - (i / (samples - 1)) * 2;
    const radiusAtY = Math.sqrt(1 - y * y);
    const theta = phi * i;

    // Layering logic: 65% outer, 25% mid, 10% inner
    let layerMultiplier = 1.0;
    if (i > samples * 0.9) layerMultiplier = 0.25;
    else if (i > samples * 0.65) layerMultiplier = 0.65;

    // Deterministic organic variation
    const variation = Math.sin(i * 0.8) * Math.cos(theta * 1.5) * 0.15;
    const finalRadius = (coreRadius * layerMultiplier) + variation;
    
    // Subtle axis compression for organic feel
    const scaleX = 0.96;
    const scaleY = 1.02;
    const scaleZ = 0.98;
    
    const x = Math.cos(theta) * radiusAtY * finalRadius * scaleX;
    const z = Math.sin(theta) * radiusAtY * finalRadius * scaleZ;
    const finalY = y * finalRadius * scaleY;
    
    points.push(new THREE.Vector3(x, finalY, z));
  }
  return points;
}

export default function HeroCoreScene() {
  const groupRef = useRef(null);
  const mainMeshRef = useRef(null);
  const highlightMeshRef = useRef(null);
  const { viewport } = useThree();

  const isDesktop = window.innerWidth >= 1024;
  const config = isDesktop ? HERO_CORE_CONFIG.desktop : HERO_CORE_CONFIG.tablet;

  // Interaction State
  const cellsRef = useRef([]);
  const highlightCellsRef = useRef([]);
  const interactionPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const interactionPoint = useMemo(() => new THREE.Vector3(), []);
  
  // Reusable temporaries for physics loop
  const tempDelta = useMemo(() => new THREE.Vector3(), []);
  const tempReturn = useMemo(() => new THREE.Vector3(), []);
  const tempDisplacement = useMemo(() => new THREE.Vector3(), []);
  const tempDummy = useMemo(() => new THREE.Object3D(), []);

  // 1. Generate Main Cells
  const mainData = useMemo(() => {
    const points = getFibonacciSpherePoints(config.mainCells, HERO_CORE_CONFIG);
    const data = [];
    const dummy = new THREE.Object3D();
    
    const colorBaseDark = new THREE.Color(HERO_CORE_CONFIG.colors.baseDark);
    const colorBaseMid = new THREE.Color(HERO_CORE_CONFIG.colors.baseMid);
    const colorCyan = new THREE.Color(HERO_CORE_CONFIG.colors.cyanAccent);

    cellsRef.current = [];

    for (let i = 0; i < config.mainCells; i++) {
      const p = points[i];
      // Escala orgânica
      const sPhase = (i * 1.7) % 1;
      const baseS = HERO_CORE_CONFIG.geometry.baseSize;
      const varS = HERO_CORE_CONFIG.geometry.sizeVariance;
      const scale = baseS + sPhase * varS;
      const rot = new THREE.Euler(sPhase * Math.PI, (1 - sPhase) * Math.PI, Math.sin(i));

      // Layer speeds for breathing
      let breathSpeed = 0.5;
      if (i > config.mainCells * 0.9) breathSpeed = 1.2;
      else if (i > config.mainCells * 0.65) breathSpeed = 0.8;

      cellsRef.current.push({
        origin: p.clone(),
        position: p.clone(),
        velocity: new THREE.Vector3(),
        rotation: rot.clone(),
        scale: scale,
        breathPhase: (i * 0.1) * Math.PI,
        breathSpeed: breathSpeed,
      });

      dummy.position.copy(p);
      dummy.rotation.copy(rot);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();

      let color = colorBaseDark; // Outer
      if (i > config.mainCells * 0.9) color = colorCyan; // Inner
      else if (i > config.mainCells * 0.65) color = colorBaseMid; // Mid
      
      data.push({ matrix: dummy.matrix.clone(), color, position: p.clone() });
    }
    return data;
  }, [config.mainCells]);

  // 2. Generate Highlight Cells
  const highlightData = useMemo(() => {
    const points = getFibonacciSpherePoints(config.highlightCells, HERO_CORE_CONFIG);
    const data = [];
    const dummy = new THREE.Object3D();
    
    const colorCyan = new THREE.Color(HERO_CORE_CONFIG.colors.cyanAccent);
    const colorGold = new THREE.Color(HERO_CORE_CONFIG.colors.goldAccent);
    const colorSoft = new THREE.Color(HERO_CORE_CONFIG.colors.softHighlight);

    highlightCellsRef.current = [];

    for (let i = 0; i < config.highlightCells; i++) {
      const p = points[i].clone().multiplyScalar(1.05); 
      const scale = HERO_CORE_CONFIG.geometry.baseSize * 1.5;
      
      highlightCellsRef.current.push({
        origin: p.clone(),
        position: p.clone(),
        velocity: new THREE.Vector3(),
        rotation: new THREE.Euler(0, Math.random(), 0),
        scale: scale,
      });

      dummy.position.copy(p);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      
      let color = colorCyan;
      if (i % 4 === 0) color = colorGold;
      else if (i % 3 === 0) color = colorSoft;

      data.push({ 
        matrix: dummy.matrix.clone(), 
        color, 
        position: p, 
        baseScale: scale,
        phase: (i * 0.9) * Math.PI,
        speed: 0.8 + (i % 3) * 0.2
      });
    }
    return data;
  }, [config.highlightCells]);

  // 3. Generate Neural Connections (LineSegments)
  const lineGeometry = useMemo(() => {
    const { maxDistance, maxConnectionsPerCell } = HERO_CORE_CONFIG.connections;
    const targetConnections = config.connections;
    const positions = [];
    let connectionsCount = 0;
    
    const cellConns = new Array(config.mainCells).fill(0);
    
    // Connect inner cells more aggressively
    for (let i = config.mainCells - 1; i >= 0; i--) {
      if (connectionsCount >= targetConnections) break;
      if (cellConns[i] >= maxConnectionsPerCell) continue;
      
      for (let j = i - 1; j >= 0; j--) {
        if (cellConns[j] >= maxConnectionsPerCell) continue;
        
        const dist = mainData[i].position.distanceTo(mainData[j].position);
        if (dist > 0.05 && dist < maxDistance) {
          positions.push(
            mainData[i].position.x, mainData[i].position.y, mainData[i].position.z,
            mainData[j].position.x, mainData[j].position.y, mainData[j].position.z
          );
          
          cellConns[i]++;
          cellConns[j]++;
          connectionsCount++;
          
          if (connectionsCount >= targetConnections || cellConns[i] >= maxConnectionsPerCell) break;
        }
      }
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geometry;
  }, [mainData, config.connections]);

  // Apply Matrices & Colors
  useEffect(() => {
    if (!mainMeshRef.current) return;
    mainData.forEach((d, i) => {
      mainMeshRef.current.setMatrixAt(i, d.matrix);
      mainMeshRef.current.setColorAt(i, d.color);
    });
    mainMeshRef.current.instanceMatrix.needsUpdate = true;
    if (mainMeshRef.current.instanceColor) mainMeshRef.current.instanceColor.needsUpdate = true;
  }, [mainData]);

  useEffect(() => {
    if (!highlightMeshRef.current) return;
    highlightData.forEach((d, i) => {
      highlightMeshRef.current.setMatrixAt(i, d.matrix);
      highlightMeshRef.current.setColorAt(i, d.color);
    });
    highlightMeshRef.current.instanceMatrix.needsUpdate = true;
    if (highlightMeshRef.current.instanceColor) highlightMeshRef.current.instanceColor.needsUpdate = true;
  }, [highlightData]);

  const dummyCalc = useMemo(() => new THREE.Object3D(), []);
  
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const { motion, interaction } = HERO_CORE_CONFIG;
    
    // 1. Group Rotation, Pulsation & Cursor Damping
    if (groupRef.current) {
      const safeDelta = isNaN(state.delta) ? 0.016 : Math.min(state.delta, 0.1);
      groupRef.current.rotation.y += motion.rotationSpeedY * safeDelta;
      groupRef.current.rotation.x += motion.rotationSpeedX * safeDelta;
      
      const pulseScale = (1 + Math.sin(time * 0.8) * motion.pulseAmount) * 0.95; // slightly larger for composition
      groupRef.current.scale.setScalar(pulseScale);
      
      const rawTargetX = (state.pointer.y * viewport.height) * 0.02; 
      const rawTargetY = (state.pointer.x * viewport.width) * 0.03;
      
      const clampX = Math.max(-motion.cursorRotationX, Math.min(motion.cursorRotationX, rawTargetX));
      const clampY = Math.max(-motion.cursorRotationY, Math.min(motion.cursorRotationY, rawTargetY));
      
      groupRef.current.rotation.x += (clampX - groupRef.current.rotation.x) * motion.damping;
      groupRef.current.rotation.y += (clampY - groupRef.current.rotation.y) * motion.damping;
    }

    const isMobile = window.innerWidth < 768;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isInsideHero = Math.abs(state.pointer.x) < 1 && Math.abs(state.pointer.y) < 1;
    const allowInteraction = interaction.enabled && !isMobile && !reducedMotion && (!interaction.activeOnlyInsideHero || isInsideHero);

    let interactionPointValid = false;
    if (allowInteraction && groupRef.current) {
      raycaster.setFromCamera(state.pointer, state.camera);
      const intersectResult = raycaster.ray.intersectPlane(interactionPlane, interactionPoint);
      if (intersectResult) {
        groupRef.current.worldToLocal(interactionPoint);
        interactionPointValid = true;
      }
    }
    
    // 2. Physics loop for Main Cells
    if (mainMeshRef.current) {
      let mainNeedsUpdate = false;
      cellsRef.current.forEach((cell, i) => {
        if (interactionPointValid) {
          tempDelta.subVectors(cell.position, interactionPoint);
          const distance = tempDelta.length();
          if (distance > 0.01 && distance < interaction.radius) {
            // Localized wave effect: exponential falloff
            const normalizedForce = Math.pow(1 - (distance / interaction.radius), 2);
            tempDelta.normalize().multiplyScalar(normalizedForce * interaction.strength);
            cell.velocity.add(tempDelta);
          }
        }

        cell.velocity.multiplyScalar(interaction.friction);
        tempReturn.subVectors(cell.origin, cell.position).multiplyScalar(interaction.returnStrength);
        cell.velocity.add(tempReturn);
        cell.position.add(cell.velocity);

        tempDisplacement.subVectors(cell.position, cell.origin);
        if (tempDisplacement.length() > interaction.maxDisplacement) {
          tempDisplacement.setLength(interaction.maxDisplacement);
          cell.position.copy(cell.origin).add(tempDisplacement);
        }

        // Organic micro-breathing
        const breath = 1.0 + Math.sin(time * cell.breathSpeed + cell.breathPhase) * 0.03;

        // Every cell updates because the breathing animation is always active.
        mainNeedsUpdate = true;
        tempDummy.position.copy(cell.position);
        tempDummy.rotation.copy(cell.rotation);

        // Apply slight organic rotation over time
        tempDummy.rotation.x += time * 0.1 * cell.breathSpeed;
        tempDummy.rotation.y += time * 0.15 * cell.breathSpeed;

        tempDummy.scale.setScalar(cell.scale * breath);
        tempDummy.updateMatrix();
        mainMeshRef.current.setMatrixAt(i, tempDummy.matrix);
      });
      if (mainNeedsUpdate) mainMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    // 3. Physics loop for Highlight Cells
    if (highlightMeshRef.current) {
      let highlightNeedsUpdate = false;
      highlightCellsRef.current.forEach((cell, i) => {
        if (interactionPointValid) {
          tempDelta.subVectors(cell.position, interactionPoint);
          const distance = tempDelta.length();
          if (distance > 0.01 && distance < interaction.radius) {
            const normalizedForce = Math.pow(1 - (distance / interaction.radius), 2);
            tempDelta.normalize().multiplyScalar(normalizedForce * interaction.strength);
            cell.velocity.add(tempDelta);
          }
        }

        cell.velocity.multiplyScalar(interaction.friction);
        tempReturn.subVectors(cell.origin, cell.position).multiplyScalar(interaction.returnStrength);
        cell.velocity.add(tempReturn);
        cell.position.add(cell.velocity);

        tempDisplacement.subVectors(cell.position, cell.origin);
        if (tempDisplacement.length() > interaction.maxDisplacement) {
          tempDisplacement.setLength(interaction.maxDisplacement);
          cell.position.copy(cell.origin).add(tempDisplacement);
        }

        const d = highlightData[i];
        const breath = 1.0 + (Math.sin(time * d.speed + d.phase) + 1) * 0.1;

        highlightNeedsUpdate = true;
        tempDummy.position.copy(cell.position);
        tempDummy.rotation.copy(cell.rotation);
        tempDummy.scale.setScalar(cell.scale * breath);
        tempDummy.updateMatrix();
        highlightMeshRef.current.setMatrixAt(i, tempDummy.matrix);
      });
      if (highlightNeedsUpdate) highlightMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  // H5B.3: Use Detail 1 for smoother organic cells, rather than sharp 0-detail crystals
  const icoGeometry = useMemo(() => new THREE.IcosahedronGeometry(1, 1), []);

  return (
    <>
      <ambientLight intensity={1.5} />
      <directionalLight position={[4, 3, 5]} intensity={2.5} color={HERO_CORE_CONFIG.colors.softHighlight} />
      {/* Inner core energy light */}
      <pointLight position={[0, 0, 0]} intensity={4.5} distance={6} color={HERO_CORE_CONFIG.colors.cyanAccent} />
      
      {/* Shift slightly to the right for composition */}
      <group ref={groupRef} position={[0.5, 0, 0]}>
        {/* MAIN CELLS */}
        <instancedMesh ref={mainMeshRef} args={[icoGeometry, null, config.mainCells]}>
          <meshStandardMaterial 
            roughness={HERO_CORE_CONFIG.materials.mainRoughness} 
            metalness={HERO_CORE_CONFIG.materials.mainMetalness} 
            emissiveIntensity={0}
          />
        </instancedMesh>
        
        {/* HIGHLIGHT CELLS */}
        <instancedMesh ref={highlightMeshRef} args={[icoGeometry, null, config.highlightCells]}>
          <meshStandardMaterial 
            roughness={HERO_CORE_CONFIG.materials.highlightRoughness} 
            metalness={HERO_CORE_CONFIG.materials.highlightMetalness} 
            emissive={"#ffffff"}
            emissiveIntensity={HERO_CORE_CONFIG.materials.highlightEmissiveIntensity}
            toneMapped={false}
          />
        </instancedMesh>

        {/* NEURAL SYNAPSES */}
        {lineGeometry.attributes.position && lineGeometry.attributes.position.count > 0 && (
          <lineSegments geometry={lineGeometry}>
            <lineBasicMaterial
              color={HERO_CORE_CONFIG.colors.cyanAccent}
              transparent={true}
              opacity={HERO_CORE_CONFIG.connections.opacity}
              depthTest={true}
              depthWrite={false}
            />
          </lineSegments>
        )}
      </group>
    </>
  );
}

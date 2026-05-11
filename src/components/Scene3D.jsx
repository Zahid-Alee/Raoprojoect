import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text, Box, Cylinder, Cone } from '@react-three/drei';
import * as THREE from 'three';

// Aircraft component
function Aircraft({ type, position, rotation }) {
  const aircraftRef = useRef();
  
  const scale = type === 'B777' ? 1.3 : 1.0;
  
  return (
    <group ref={aircraftRef} position={position} rotation={rotation}>
      {/* Fuselage */}
      <Cylinder args={[1.5 * scale, 1.5 * scale, 12 * scale, 32]} rotation={[0, 0, Math.PI / 2]}>
        <meshStandardMaterial color="#e8e8e8" metalness={0.8} roughness={0.2} />
      </Cylinder>
      
      {/* Nose cone */}
      <Cone args={[1.5 * scale, 2 * scale, 32]} position={[6 * scale, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <meshStandardMaterial color="#e8e8e8" metalness={0.8} roughness={0.2} />
      </Cone>
      
      {/* Wings */}
      <Box args={[0.5 * scale, 14 * scale, 3 * scale]} position={[-1 * scale, 0, 0]}>
        <meshStandardMaterial color="#d0d0d0" metalness={0.7} roughness={0.3} />
      </Box>
      
      {/* Tail */}
      <Box args={[0.3 * scale, 0.5 * scale, 4 * scale]} position={[-6 * scale, 0, 2 * scale]}>
        <meshStandardMaterial color="#d0d0d0" metalness={0.7} roughness={0.3} />
      </Box>
      
      {/* Horizontal stabilizer */}
      <Box args={[0.3 * scale, 5 * scale, 1.5 * scale]} position={[-6 * scale, 0, 2 * scale]}>
        <meshStandardMaterial color="#d0d0d0" metalness={0.7} roughness={0.3} />
      </Box>
      
      {/* Engines */}
      <Cylinder args={[0.6 * scale, 0.6 * scale, 2 * scale, 32]} position={[0, 3 * scale, -0.5 * scale]} rotation={[0, 0, Math.PI / 2]}>
        <meshStandardMaterial color="#4a4a4a" metalness={0.9} roughness={0.1} />
      </Cylinder>
      <Cylinder args={[0.6 * scale, 0.6 * scale, 2 * scale, 32]} position={[0, -3 * scale, -0.5 * scale]} rotation={[0, 0, Math.PI / 2]}>
        <meshStandardMaterial color="#4a4a4a" metalness={0.9} roughness={0.1} />
      </Cylinder>
    </group>
  );
}

// Ground Support Equipment
function GSE({ type, idlePosition, activePosition, active, color }) {
  const gseRef = useRef();
  const idle = useMemo(() => new THREE.Vector3(...idlePosition), [idlePosition]);
  const working = useMemo(() => new THREE.Vector3(...activePosition), [activePosition]);
  
  useFrame((state) => {
    if (!gseRef.current) return;

    const target = active ? working : idle;
    gseRef.current.position.lerp(target, 0.055);
    gseRef.current.rotation.y = active ? Math.sin(state.clock.elapsedTime * 1.5) * 0.04 : 0;
  });
  
  return (
    <group ref={gseRef} position={idlePosition}>
      {type === 'baggage' && (
        <>
          <Box args={[2, 1, 1.5]}>
            <meshStandardMaterial color={color} />
          </Box>
          <Box args={[0.3, 3, 0.3]} position={[0, 2, 0]}>
            <meshStandardMaterial color="#666" />
          </Box>
        </>
      )}
      
      {type === 'fuel' && (
        <>
          <Cylinder args={[0.8, 0.8, 2, 16]}>
            <meshStandardMaterial color={color} />
          </Cylinder>
          <Cylinder args={[0.2, 0.2, 3, 8]} position={[1.5, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <meshStandardMaterial color="#333" />
          </Cylinder>
        </>
      )}
      
      {type === 'stairs' && (
        <>
          <Box args={[2, 0.2, 1.5]}>
            <meshStandardMaterial color={color} />
          </Box>
          <Box args={[0.2, 3, 1.5]} position={[-1, 1.5, 0]}>
            <meshStandardMaterial color={color} />
          </Box>
        </>
      )}
    </group>
  );
}

// Ground/Apron
function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial color="#2a2a2a" roughness={0.8} />
    </mesh>
  );
}

function StaffMarker({ position, active, stress }) {
  const markerRef = useRef();

  useFrame((state) => {
    if (!markerRef.current) return;
    markerRef.current.position.y = position[1] + (active ? Math.sin(state.clock.elapsedTime * 4) * 0.08 : 0);
  });

  return (
    <group ref={markerRef} position={position}>
      <Cylinder args={[0.18, 0.18, 0.75, 12]} position={[0, 0.35, 0]}>
        <meshStandardMaterial color={stress > 70 ? '#ef4444' : stress > 50 ? '#f59e0b' : '#38bdf8'} />
      </Cylinder>
      <Cone args={[0.28, 0.35, 12]} position={[0, 0.92, 0]}>
        <meshStandardMaterial color="#f8fafc" />
      </Cone>
    </group>
  );
}

// Temperature visualization (heat waves)
function HeatWaves({ temperature }) {
  const particlesRef = useRef();
  
  const particleCount = Math.max(0, (temperature - 30) * 10);
  
  const particles = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 1] = Math.random() * 10 - 2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    return positions;
  }, [particleCount]);
  
  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.05;
      const positions = particlesRef.current.geometry.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3 + 1] += Math.sin(state.clock.elapsedTime + i) * 0.01;
        if (positions[i * 3 + 1] > 10) positions[i * 3 + 1] = -2;
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });
  
  if (particleCount === 0) return null;
  
  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={particles}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.3}
        color="#ff6600"
        transparent
        opacity={0.4}
        sizeAttenuation
      />
    </points>
  );
}

// Main 3D Scene
export default function Scene3D({ flightData, simulationState }) {
  const { temperature, staffEfficiency, activePhase, gseStatus, bufferStatus } = simulationState;
  const stress = 100 - staffEfficiency;
  const statusColor = bufferStatus === 'green' ? '#22c55e' : bufferStatus === 'yellow' ? '#f59e0b' : '#ef4444';
  
  return (
    <Canvas shadows style={{ background: '#050816' }}>
      <PerspectiveCamera makeDefault position={[20, 15, 20]} fov={60} />
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={10}
        maxDistance={50}
      />
      
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-10, 10, -10]} intensity={0.3 + Math.max(0, temperature - 35) * 0.02} color="#ff9900" />
      
      {/* Ground */}
      <Ground />
      
      {/* Aircraft */}
      <Aircraft
        type={flightData?.Aircraft_Type || 'A320'}
        position={[0, 0, 0]}
        rotation={[0, Math.PI / 2, 0]}
      />
      
      {/* Ground Support Equipment */}
      <GSE
        type="baggage"
        idlePosition={[-11, -1, -7]}
        activePosition={[-3.8, -1, -4.4]}
        active={gseStatus.baggage}
        color={gseStatus.baggage ? '#22c55e' : '#64748b'}
      />
      <GSE
        type="fuel"
        idlePosition={[-11, -1, 7]}
        activePosition={[-2.8, -1, 4.9]}
        active={gseStatus.fuel}
        color={gseStatus.fuel ? '#38bdf8' : '#64748b'}
      />
      <GSE
        type="stairs"
        idlePosition={[9, -1, -5]}
        activePosition={[4.5, -1, -2.7]}
        active={gseStatus.boarding}
        color={gseStatus.boarding ? '#f59e0b' : '#64748b'}
      />

      <StaffMarker position={[-2, -1.95, -5.8]} active={gseStatus.baggage} stress={stress} />
      <StaffMarker position={[2.6, -1.95, -3.4]} active={gseStatus.boarding} stress={stress} />
      <StaffMarker position={[-1.2, -1.95, 5.9]} active={gseStatus.fuel} stress={stress} />
      
      {/* Heat visualization */}
      <HeatWaves temperature={temperature} />
      
      {/* Status text */}
      <Text
        position={[0, 8, 0]}
        fontSize={1}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {activePhase}
      </Text>
      
      <Text
        position={[0, 6.5, 0]}
        fontSize={0.6}
        color="#ffb454"
        anchorX="center"
        anchorY="middle"
      >
        {temperature}°C · Staff {staffEfficiency}%
      </Text>

      <Text
        position={[0, 5.5, 0]}
        fontSize={0.45}
        color={statusColor}
        anchorX="center"
        anchorY="middle"
      >
        {flightData.Flight_ID} · Dynamic buffer {flightData.dynamicBuffer} min
      </Text>
    </Canvas>
  );
}

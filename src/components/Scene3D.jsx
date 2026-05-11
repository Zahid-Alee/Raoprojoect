import { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text, Box, Cylinder } from '@react-three/drei';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import * as THREE from 'three';

const AIRCRAFT_MODEL_ROTATION = [-Math.PI / 2, 0, 0];
const AIRCRAFT_MODEL_SCALE = {
  A320: 0.0038,
  B777: 0.0045,
};

// Aircraft component using OBJ file
function Aircraft({ type, position, rotation }) {
  const aircraftRef = useRef();
  
  // Load the OBJ file
  const obj = useLoader(OBJLoader, '/plane.obj');
  
  // Clone and configure the model
  const clonedObj = useMemo(() => {
    const clone = obj.clone();
    const bounds = new THREE.Box3().setFromObject(clone);
    const center = bounds.getCenter(new THREE.Vector3());

    // The OBJ is authored Z-up. Center its footprint and put its lowest point on the scene ground.
    clone.position.set(-center.x, -center.y, -bounds.min.z);

    clone.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: '#e8e8e8',
          metalness: 0.8,
          roughness: 0.2,
        });
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return clone;
  }, [obj]);
  
  const scale = AIRCRAFT_MODEL_SCALE[type] || AIRCRAFT_MODEL_SCALE.A320;
  
  return (
    <group ref={aircraftRef} position={position} rotation={rotation}>
      <group scale={[scale, scale, scale]} rotation={AIRCRAFT_MODEL_ROTATION}>
        <primitive object={clonedObj} />
      </group>
    </group>
  );
}

// Loading fallback
function LoadingPlane() {
  return (
    <Box args={[10, 2, 3]}>
      <meshStandardMaterial color="#666" wireframe />
    </Box>
  );
}

// Ground Support Equipment
function GSE({ type, idlePosition, activePosition, active, color }) {
  const gseRef = useRef();
  const idle = useMemo(() => new THREE.Vector3(...idlePosition), [idlePosition]);
  const working = useMemo(() => new THREE.Vector3(...activePosition), [activePosition]);
  
  useFrame(() => {
    if (!gseRef.current) return;
    const target = active ? working : idle;
    gseRef.current.position.lerp(target, 0.055);
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

// Main 3D Scene
export default function Scene3D({ flightData, simulationState }) {
  const { activePhase, gseStatus } = simulationState;
  
  return (
    <Canvas shadows style={{ background: 'linear-gradient(to bottom, #0a0e27 0%, #16213e 100%)' }}>
      <PerspectiveCamera makeDefault position={[25, 12, 25]} fov={50} />
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={15}
        maxDistance={60}
        target={[0, 0, 0]}
      />
      
      {/* Lighting - cleaner setup */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[15, 25, 15]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <hemisphereLight intensity={0.3} groundColor="#1a1a2e" />
      
      {/* Ground - simpler */}
      <Ground />
      
      {/* Aircraft with Suspense for loading */}
      <Suspense fallback={<LoadingPlane />}>
        <Aircraft
          type={flightData?.Aircraft_Type || 'A320'}
          position={[0, -2, 0]}
          rotation={[0, 0, 0]}
        />
      </Suspense>
      
      {/* Ground Support Equipment - only show when active */}
      {gseStatus.baggage && (
        <GSE
          type="baggage"
          idlePosition={[-11, -1, -7]}
          activePosition={[-3.8, -1, -4.4]}
          active={gseStatus.baggage}
          color='#22c55e'
        />
      )}
      {gseStatus.fuel && (
        <GSE
          type="fuel"
          idlePosition={[-11, -1, 7]}
          activePosition={[-2.8, -1, 4.9]}
          active={gseStatus.fuel}
          color='#38bdf8'
        />
      )}
      {gseStatus.boarding && (
        <GSE
          type="stairs"
          idlePosition={[9, -1, -5]}
          activePosition={[4.5, -1, -2.7]}
          active={gseStatus.boarding}
          color='#f59e0b'
        />
      )}
      
      {/* Minimal status text */}
      <Text
        position={[0, 10, 0]}
        fontSize={1.2}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="#000000"
      >
        {activePhase}
      </Text>
    </Canvas>
  );
}

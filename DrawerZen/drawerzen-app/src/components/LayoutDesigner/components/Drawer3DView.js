import React, { useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

/**
 * Drawer3DView
 * Props:
 * - drawerDimensions: { width, length, height }
 * - bins: array of { id, x, y, width, length, height, color, shadowBoard }
 * - selectedBinId: id of selected bin
 */
export default function Drawer3DView({ drawerDimensions, bins, selectedBinId, waveAnimation = false }) {
  // Memoize drawer size for scaling
  const drawerSize = useMemo(() => ({
    width: drawerDimensions?.width || 300,
    length: drawerDimensions?.length || 400,
    height: drawerDimensions?.height || 100,
  }), [drawerDimensions]);

  const defaultColorway = { bin: '#F5E6C8', bed: '#4A4A58' };
  // Colorways: [binColor, bedColor]
  const colorways = [
    { bin: '#F5E6C8', bed: '#4A4A58', id: 'cream' }, // Cream/tan bin, slate grey bed
    { bin: '#1A237E', bed: '#90CAF9', id: 'blue' }, // Dark blue bin, sky blue bed
    { bin: '#222', bed: '#B2FF59', id: 'black' }     // Black bin, lime green bed
  ];
  const BinMesh = ({ bin, selected }) => {
    const groupRef = useRef();
    const baseY = bin.height / 2;
    const colorway = bin.colorway ? (colorways.find(c => c.id === bin.colorway) || defaultColorway) : defaultColorway;
    const binMaterialProps = useMemo(() => ({
      color: colorway.bin,
      roughness: 0.8,
      clearcoat: 0.2,
      clearcoatRoughness: 0.7,
      metalness: 0.1,
      reflectivity: 0.2,
      opacity: bin.shadowBoard ? 0.85 : 1,
      transparent: !!bin.shadowBoard,
      sheen: 0.5,
      sheenColor: colorway.bin,
      emissive: selected ? colorway.bed : '#000',
      emissiveIntensity: selected ? 0.25 : 0
    }), [colorway.bin, colorway.bed, bin.shadowBoard, selected]);

    // Animation spec: rise 60mm, scale 1.5 when selected, smooth easing
    const lastSelectedRef = useRef(selected);
    const initializedRef = useRef(false);
    const lastBaseYRef = useRef(baseY);

    // Ensure baseline updates if bin height changes
    useEffect(() => {
      const g = groupRef.current;
      if (!g) return;
      // Adjust current position relative to new base if height changed
      const deltaBase = baseY - lastBaseYRef.current;
      if (deltaBase !== 0) {
        g.position.y += deltaBase; // shift by difference to preserve offset
        lastBaseYRef.current = baseY;
      }
    }, [baseY]);
    useFrame((_, delta) => {
      const g = groupRef.current;
      if (!g) return;
      if (!initializedRef.current) {
        // Set initial position once (avoid repeated rise reset)
        g.position.y = selected ? baseY + 60 : baseY;
        initializedRef.current = true;
      }
      if (lastSelectedRef.current !== selected) {
        lastSelectedRef.current = selected;
      }
      const targetY = selected ? baseY + 60 : baseY; // 60mm rise
      const targetScale = selected ? 1.5 : 1; // 50% increase
      const ease = 6; // damping factor
      // Smooth damp for y (only if not already effectively there)
      if (Math.abs(g.position.y - targetY) > 0.1) {
        g.position.y += (targetY - g.position.y) * Math.min(1, ease * delta);
      } else {
        g.position.y = targetY; // snap to final to prevent micro-oscillation
      }
      const newScale = g.scale.x + (targetScale - g.scale.x) * Math.min(1, ease * delta);
      g.scale.set(newScale, newScale, newScale);
    });
    return (
      <group position={[bin.x + bin.width / 2 - drawerSize.width / 2, 0, bin.y + bin.length / 2 - drawerSize.length / 2]}>
        {/* Bed */}
        <mesh position={[0, 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[bin.width, bin.length]} />
          <meshPhysicalMaterial color={colorway.bed} roughness={0.9} metalness={0.2} />
        </mesh>
        {/* Animated bin group (Y & scale animated). Remove static Y prop to avoid reset each render. */}
        <group ref={groupRef} /* initial Y set in useFrame */>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[bin.width, bin.height, bin.length]} />
            <meshPhysicalMaterial {...binMaterialProps} />
          </mesh>
          <mesh position={[0, bin.height * 0.05, 0]}>
            <boxGeometry args={[bin.width - 4, bin.height * 0.6, bin.length - 4]} />
            <meshPhysicalMaterial color={colorway.bed} roughness={0.95} metalness={0} />
          </mesh>
          {selected && (
            <mesh position={[0, bin.height / 2 + 2, 0]}> {/* Floating outline slightly above */}
              <boxGeometry args={[bin.width * 1.02, 1, bin.length * 1.02]} />
              <meshBasicMaterial color={'#ffd54f'} transparent opacity={0.85} />
            </mesh>
          )}
        </group>
      </group>
    );
  };

  const Scene = () => (
    <group>
      <mesh position={[0, drawerSize.height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[drawerSize.width, drawerSize.height, drawerSize.length]} />
        <meshPhysicalMaterial color="#e0e0e0" opacity={0.14} transparent roughness={0.9} metalness={0.05} />
      </mesh>
      {bins.map(bin => (
        <BinMesh key={bin.id} bin={bin} selected={bin.id === selectedBinId} />
      ))}
    </group>
  );

  return (
    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #f5f5f5 70%, #e3f2fd 100%)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
      <Canvas shadows dpr={[1, 2]} gl={{ antialias: true }}>
        {/* Camera: further out for full drawer visibility */}
        <PerspectiveCamera makeDefault position={[drawerSize.width * 0.9, drawerSize.height * 2.4, drawerSize.length * 1.15]} fov={50} />
        <ambientLight intensity={0.85} />
        <directionalLight position={[120, 240, 160]} intensity={0.75} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
        {/* Ground plane */}
        <mesh receiveShadow position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[drawerSize.width * 2, drawerSize.length * 2]} />
          <shadowMaterial opacity={0.15} />
        </mesh>
        <Scene />
        <OrbitControls enablePan={false} enableZoom={false} target={[0, drawerSize.height / 2, 0]} />
      </Canvas>
    </div>
  );
}

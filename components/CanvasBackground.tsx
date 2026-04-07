"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sparkles, Stars } from "@react-three/drei";
import { useMemo, useRef } from "react";
import type { Group, Mesh } from "three";

type NodeData = {
  position: [number, number, number];
  scale: number;
  color: string;
  phase: number;
};

function NetworkNodes() {
  const groupRef = useRef<Group>(null);
  const nodeRefs = useRef<Array<Mesh | null>>([]);

  const nodes = useMemo<NodeData[]>(() => {
    const total = 24;
    const palette = ["#4de8ff", "#9d6bff"];

    return Array.from({ length: total }, (_, index) => ({
      position: [
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 16,
      ],
      scale: 0.12 + Math.random() * 0.2,
      color: palette[index % palette.length],
      phase: Math.random() * Math.PI * 2,
    }));
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.06;
      groupRef.current.rotation.x = Math.sin(t * 0.12) * 0.05;
    }

    nodeRefs.current.forEach((node, idx) => {
      if (!node) {
        return;
      }
      node.position.y = nodes[idx].position[1] + Math.sin(t * 0.8 + nodes[idx].phase) * 0.35;
    });
  });

  return (
    <group ref={groupRef}>
      {nodes.map((node, idx) => (
        <mesh
          key={idx}
          ref={(element) => {
            nodeRefs.current[idx] = element;
          }}
          position={node.position}
          scale={node.scale}
        >
          <sphereGeometry args={[1, 22, 22]} />
          <meshStandardMaterial
            color={node.color}
            emissive={node.color}
            emissiveIntensity={1.9}
            roughness={0.24}
            metalness={0.18}
          />
        </mesh>
      ))}
    </group>
  );
}

export default function CanvasBackground() {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas camera={{ position: [0, 0, 10], fov: 60 }} dpr={[1, 2]}>
        <color attach="background" args={["#050505"]} />
        <fog attach="fog" args={["#050505", 8, 24]} />
        <ambientLight intensity={0.24} />
        <pointLight position={[6, 5, 4]} color="#4de8ff" intensity={1.1} />
        <pointLight position={[-6, -4, 6]} color="#9d6bff" intensity={1.1} />
        <Stars radius={90} depth={48} count={1900} factor={2.6} fade speed={0.35} />
        <Sparkles count={70} size={2.2} color="#61f4ff" speed={0.25} scale={[18, 12, 18]} />
        <Float speed={0.8} rotationIntensity={0.15} floatIntensity={0.35}>
          <NetworkNodes />
        </Float>
      </Canvas>
    </div>
  );
}

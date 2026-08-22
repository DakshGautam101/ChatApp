import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function Particles({ count = 120 }) {
    const mesh = useRef(null);
    const positions = useMemo(() => {
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 10;
            pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
        }
        return pos;
    }, [count]);

    const speeds = useMemo(() => {
        return Array.from({ length: count }, () => ({
            x: (Math.random() - 0.5) * 0.002,
            y: (Math.random() - 0.5) * 0.002,
            z: (Math.random() - 0.5) * 0.001,
        }));
    }, [count]);

    useFrame((state) => {
        if (!mesh.current) return;
        const positions = mesh.current.geometry.attributes.position.array;
        const time = state.clock.getElapsedTime();

        for (let i = 0; i < count; i++) {
            positions[i * 3] += speeds[i].x + Math.sin(time * 0.1 + i) * 0.001;
            positions[i * 3 + 1] += speeds[i].y + Math.cos(time * 0.15 + i) * 0.001;
            positions[i * 3 + 2] += speeds[i].z;

            // Wrap around boundaries
            for (let j = 0; j < 3; j++) {
                if (positions[i * 3 + j] > 5) positions[i * 3 + j] = -5;
                if (positions[i * 3 + j] < -5) positions[i * 3 + j] = 5;
            }
        }
        mesh.current.geometry.attributes.position.needsUpdate = true;
        mesh.current.rotation.y = time * 0.02;
    });

    return (
        <points ref={mesh}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={count}
                    array={positions}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.04}
                color="#d9d9d9"
                transparent
                opacity={0.55}
                sizeAttenuation
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </points>
    );
}

function GradientMesh() {
    const mesh = useRef(null);

    useFrame((state) => {
        if (!mesh.current) return;
        const time = state.clock.getElapsedTime();
        mesh.current.rotation.z = time * 0.05;
        mesh.current.rotation.x = Math.sin(time * 0.03) * 0.1;
        mesh.current.scale.setScalar(1 + Math.sin(time * 0.1) * 0.05);
    });

    return (
        <mesh ref={mesh} position={[0, 0, -3]}>
            <icosahedronGeometry args={[2.5, 1]} />
            <meshBasicMaterial
                color="#cccccc"
                wireframe
                transparent
                opacity={0.06}
            />
        </mesh>
    );
}

function FloatingOrb({ position, color, size = 0.3 }) {
    const mesh = useRef(null);
    const offset = useMemo(() => Math.random() * Math.PI * 2, []);

    useFrame((state) => {
        if (!mesh.current) return;
        const time = state.clock.getElapsedTime();
        mesh.current.position.y = position[1] + Math.sin(time * 0.5 + offset) * 0.5;
        mesh.current.position.x = position[0] + Math.cos(time * 0.3 + offset) * 0.3;
    });

    return (
        <mesh ref={mesh} position={position}>
            <sphereGeometry args={[size, 16, 16]} />
            <meshBasicMaterial
                color={color}
                transparent
                opacity={0.08}
            />
        </mesh>
    );
}

export default function AnimatedBackground({ className = "" }) {
    return (
        <div className={`absolute inset-0 -z-10 ${className}`}>
            <Canvas
                camera={{ position: [0, 0, 5], fov: 60 }}
                dpr={[1, 1.5]}
                gl={{ antialias: false, alpha: true }}
                style={{ background: "transparent" }}
            >
                <Particles count={100} />
                <GradientMesh />
                <FloatingOrb position={[-2, 1, -1]} color="#93c5fd" size={0.4} />
                <FloatingOrb position={[2, -1, -2]} color="#60a5fa" size={0.3} />
                <FloatingOrb position={[0, 2, -1.5]} color="#bfdbfe" size={0.25} />
                <FloatingOrb position={[-1.5, -1.5, -1]} color="#dbeafe" size={0.35} />
            </Canvas>

            {/* Gradient overlay to blend with the page */}
            <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-background/80" />
        </div>
    );
}

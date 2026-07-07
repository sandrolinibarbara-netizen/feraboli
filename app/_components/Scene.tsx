'use client'
import {Canvas} from "@react-three/fiber";
import {OrbitControls} from "@react-three/drei";
import Configurator from "@/app/_components/Configurator";

export default function Scene() {

    return(
        <Canvas
            className="h-full"
            camera={{fov: 35, near: 0.1, far: 500, position: [0, 10, 45]}}
            dpr={[1, 2]}
            onCreated={(state) => (state.gl.localClippingEnabled = true)}
            frameloop="demand"
        >
            <OrbitControls/>
            <Configurator/>
        </Canvas>
    )
}
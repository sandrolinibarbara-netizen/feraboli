import React, {useEffect, useLayoutEffect, useMemo, useRef} from "react";
import * as THREE from "three";
import {InstancedMesh} from "three";
import {useMeasurementsStore} from "@/app/_stores/measurements";
import {State} from "@/app/_types/State";
import {getDefinedValues} from "@/app/_utils/getDefinedValues";
import {useTexture} from "@react-three/drei";
import vertexShader from '../../_shaders/vertex.glsl';
import fragmentShader from '../../_shaders/fragment.glsl';

export default function Reticular() {
    const pillars = useMeasurementsStore((state: State) => state.pillars);
    const pillarsHeight = useMeasurementsStore((state: State) => state.pillarsHeight);
    const width = useMeasurementsStore((state: State) => state.width);
    const length = useMeasurementsStore((state: State) => state.length);
    const interaxleLength = useMeasurementsStore((state: State) => state.interaxleLength);
    const interaxleWidth = useMeasurementsStore((state: State) => state.interaxleWidth);
    const secondHeight = useMeasurementsStore((state: State) => state.secondHeight);
    const secondHeightOffset = useMeasurementsStore((state: State) => state.secondHeightOffset);
    const beamMaxHeight = useMeasurementsStore((state: State) => state.beamMaxHeight);
    const eavesHeight = useMeasurementsStore((state: State) => state.eavesHeight);

    const ref = useRef<THREE.Mesh|null>(null);
    const sourceTexture = useTexture('/zigzag2.webp');
    const texture = useMemo(() => {
        const configuredTexture = sourceTexture.clone();
        configuredTexture.colorSpace = THREE.SRGBColorSpace;
        configuredTexture.wrapS = THREE.RepeatWrapping;
        configuredTexture.repeat.set(5, 1);
        configuredTexture.needsUpdate = true;
        return configuredTexture;
    }, [sourceTexture]);

    useEffect(() => () => texture.dispose(), [texture]);

    const requiredValues = getDefinedValues({
        interaxleWidth,
        pillarsHeight,
        width,
        length,
        beamMaxHeight,
        secondHeightOffset,
        eavesHeight,
        interaxleLength,
        pillars
    });

    if (!requiredValues) return null;

    const RETICULAR = () => {
        const {pillars, length, interaxleLength, width, interaxleWidth, eavesHeight, beamMaxHeight, secondHeightOffset, pillarsHeight} = requiredValues;
        const hasSecondHeight = secondHeight !== undefined;
        const frames = (length / interaxleLength) + 1;
        const effWidth = hasSecondHeight ? width / 2 : width;
        const effBeams = hasSecondHeight ? frames * 2 : frames;
        const halfPillars = pillars / 2;

        let vertices;

        if(hasSecondHeight) {
            vertices = new Float32Array([
                pillarsHeight[halfPillars - 1].position! - (width / 2), pillarsHeight[halfPillars - 1].totalHeight as number,  0.0, // bottom left
                pillarsHeight[halfPillars].position! - (width / 2), pillarsHeight[halfPillars].totalHeight as number,  0.0, // bottom right
                0.0,  eavesHeight + secondHeightOffset + beamMaxHeight,  0.0  // top center
            ]);
        } else {
            vertices = new Float32Array([
                pillarsHeight[0].position! - (width / 2), pillarsHeight[0].totalHeight as number,  0.0, // bottom left
                pillarsHeight[pillarsHeight.length - 1].position! - (width / 2), pillarsHeight[pillarsHeight.length - 1].totalHeight as number,  0.0, // bottom right
                0.0,  eavesHeight + beamMaxHeight,  0.0  // top center
            ]);
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute([
            0, 0,
            1, 0,
            0.5, 1
        ], 2));

        const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                uTexture: {value: texture}
            },
            side: THREE.DoubleSide,
            transparent: true,
            depthWrite: false
        });

        useLayoutEffect(() => {
            if (!ref.current) return;

            const {width, interaxleLength} = requiredValues;
            const mesh = new THREE.Object3D();

            for (let i = 0; i < frames; i++) {

                if(!hasSecondHeight) {
                    mesh.position.set(pillarsHeight[0].position! - (width / 2) + (effWidth - interaxleWidth) / 2, 0, -interaxleLength * i);
                } else {
                    mesh.position.set(0, 0, -interaxleLength * i);
                }
                mesh.updateMatrix();
                (ref.current as InstancedMesh).setMatrixAt(i, mesh.matrix);
            }

        }, [effBeams, effWidth, frames, hasSecondHeight, interaxleLength, interaxleWidth, pillarsHeight]);

        return (
            <instancedUniformsMesh ref={ref}
                                   args={[geometry, material, frames]}>
            </instancedUniformsMesh>
        )
    }

    // eslint-disable-next-line react-hooks/static-components
    return <RETICULAR/>
}

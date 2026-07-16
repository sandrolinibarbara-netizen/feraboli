import React, {useLayoutEffect, useRef} from "react";
import * as THREE from "three";
import {InstancedMesh} from "three";
import {useMeasurementsStore} from "@/app/_stores/measurements";
import {State} from "@/app/_types/State";

export default function CoveringRight({material} : {material : THREE.Material}) {
    const baseModel = useMeasurementsStore((state: State) => state.geometry);
    const pillars = useMeasurementsStore((state: State) => state.pillars);
    const pitches = useMeasurementsStore((state: State) => state.pitches);
    const coveringLength = useMeasurementsStore((state: State) => state.coveringLength);
    const eavesHeight = useMeasurementsStore((state: State) => state.eavesHeight);
    const roofIncline = useMeasurementsStore((state: State) => state.roofIncline);
    const width = useMeasurementsStore((state: State) => state.width);
    const length = useMeasurementsStore((state: State) => state.length);
    const purlinType = useMeasurementsStore((state: State) => state.purlinType);

    const ref = useRef<THREE.Mesh|null>(null);
    const coveringGeometry = baseModel?.coveringRight;

    const COVERINGRIGHT = () => {
        useLayoutEffect(() => {
            const purlinOffset = purlinType === 'light' ? 0.18 : 0;
            if (ref.current && coveringLength && eavesHeight && roofIncline.percentage && width && length) {
                const mesh = new THREE.Object3D();

                for (let i = 0; i < length + 1; i++) {
                    mesh.scale.x = pillars === 1 && pitches === 'D' ? coveringLength + 1 : coveringLength;
                    const shift = ref.current.geometry.boundingBox!.min.x;
                    ref.current.geometry.translate(-shift, 0, 0);
                    mesh.position.set(width / 2, eavesHeight - purlinOffset, i === 0 ? 0 : (-i));
                    mesh.rotation.set(0, Math.PI, roofIncline.rad!)
                    ref.current.geometry.attributes.position.needsUpdate = true;
                    mesh.updateMatrix();
                    (ref.current as InstancedMesh).setMatrixAt(i, mesh.matrix);
                }
            }
        }, [])

        if (!coveringLength || !eavesHeight || !roofIncline.percentage || !width || !length || (pillars && pillars < 3 && pitches?.includes('M'))) {
            return <></>
        }

        return (
            <instancedUniformsMesh ref={ref} args={[coveringGeometry, material, length + 1]}></instancedUniformsMesh>
        )
    }

    // eslint-disable-next-line react-hooks/static-components
    return <COVERINGRIGHT/>
}
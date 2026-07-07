import React, {useLayoutEffect, useRef} from "react";
import * as THREE from "three";
import {InstancedMesh} from "three";
import {useMeasurementsStore} from "@/app/_stores/measurements";
import {State} from "@/app/_types/State";

export default  function BeamsRight({material} : {material : THREE.Material}) {
    const baseModel = useMeasurementsStore((state: State) => state.geometry);
    const pillars = useMeasurementsStore((state: State) => state.pillars);
    const beamLength = useMeasurementsStore((state: State) => state.beamLength);
    const pitches = useMeasurementsStore((state: State) => state.pitches);
    const eavesHeight = useMeasurementsStore((state: State) => state.eavesHeight);
    const roofIncline = useMeasurementsStore((state: State) => state.roofIncline);
    const width = useMeasurementsStore((state: State) => state.width);
    const length = useMeasurementsStore((state: State) => state.length);
    const interaxleLength = useMeasurementsStore((state: State) => state.interaxleLength);

    const ref = useRef<THREE.Mesh|null>(null);
    const beamGeometry = baseModel?.beamsRight;

    const BEAMSRIGHT = () => {
        useLayoutEffect(() => {
            if (ref.current && beamLength && eavesHeight && roofIncline.percentage && width && length && interaxleLength) {
                const mesh = new THREE.Object3D();

                for (let i = 0; i < (length / interaxleLength) + 1; i++) {
                    mesh.scale.x = beamLength + 1;
                    const shift = ref.current.geometry.boundingBox!.max.x;
                    ref.current.geometry.translate(-shift, 0, 0);
                    mesh.position.set(width / 2, eavesHeight, -interaxleLength * i);
                    mesh.rotation.set(0, 0, -roofIncline.rad!);
                    ref.current.geometry.attributes.position.needsUpdate = true;
                    mesh.updateMatrix();
                    (ref.current as InstancedMesh).setMatrixAt(i, mesh.matrix);
                }
            }
        }, []);

        if (!beamLength || !eavesHeight || !roofIncline.percentage || !width || !length || !interaxleLength || (pillars && pillars < 3 && pitches?.includes('M'))) {
            return <></>
        }

        return (
            <instancedUniformsMesh ref={ref}
                                   args={[beamGeometry, material, (length / interaxleLength) + 1]}>
            </instancedUniformsMesh>
        )
    }

    // eslint-disable-next-line react-hooks/static-components
    return <BEAMSRIGHT/>
}
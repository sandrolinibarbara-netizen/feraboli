import React, {useLayoutEffect, useRef} from "react";
import * as THREE from "three";
import {InstancedMesh} from "three";
import {useMeasurementsStore} from "@/app/_stores/measurements";
import {State} from "@/app/_types/State";

export default function DomeCoveringRight({material} : {material : THREE.Material}) {
    const baseModel = useMeasurementsStore((state: State) => state.geometry);
    const domeWidth = useMeasurementsStore((state: State) => state.domeWidth);
    const eavesHeight = useMeasurementsStore((state: State) => state.eavesHeight);
    const roofIncline = useMeasurementsStore((state: State) => state.roofIncline);
    const beamMaxHeight = useMeasurementsStore((state: State) => state.beamMaxHeight);
    const length = useMeasurementsStore((state: State) => state.length);
    const domeHeight = useMeasurementsStore((state: State) => state.domeHeight);

    const ref = useRef<THREE.Mesh|null>(null);
    const coveringGeometry = baseModel?.domeCoveringRight;

    const DOMECOVERINGRIGHT = () => {
        useLayoutEffect(() => {
            if (ref.current && domeWidth && eavesHeight && roofIncline.percentage && length && beamMaxHeight && domeHeight) {
                const mesh = new THREE.Object3D();
                const maxPurlinB = (domeWidth / 2) * Math.sin(roofIncline.rad!);
                const maxPurlinH = (domeWidth / 2 + 0.2) * Math.sin(roofIncline.rad!);
                for (let i = 0; i < length + 1; i++) {
                    mesh.scale.x = domeWidth / 2 + 0.2;
                    const shift = ref.current.geometry.boundingBox!.max.x;
                    ref.current.geometry.translate(-shift, 0, 0);
                    mesh.position.set(-0.2, eavesHeight + beamMaxHeight + domeHeight + (maxPurlinH - maxPurlinB) + 0.25, i === 0 ? 0 : (-i));
                    mesh.rotation.set(0, Math.PI, roofIncline.rad!)
                    ref.current.geometry.attributes.position.needsUpdate = true;
                    mesh.updateMatrix();
                    (ref.current as InstancedMesh).setMatrixAt(i, mesh.matrix);
                }
            }
        }, []);

        if (!domeWidth || !eavesHeight || !roofIncline.percentage || !length || !beamMaxHeight || !domeHeight) {
            return <></>
        }

        return (
            <instancedUniformsMesh ref={ref} args={[coveringGeometry, material, length + 1]}></instancedUniformsMesh>
        )
    }

    // eslint-disable-next-line react-hooks/static-components
    return <DOMECOVERINGRIGHT/>
}
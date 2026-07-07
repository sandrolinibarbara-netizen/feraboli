import React, {useLayoutEffect, useRef} from "react";
import * as THREE from "three";
import {InstancedMesh} from "three";
import {useMeasurementsStore} from "@/app/_stores/measurements";
import {State} from "@/app/_types/State";

export default function DomePillarsRight({material} : {material : THREE.Material}) {
    const baseModel = useMeasurementsStore((state: State) => state.geometry);
    const coveringLength = useMeasurementsStore((state: State) => state.coveringLength);
    const eavesHeight = useMeasurementsStore((state: State) => state.eavesHeight);
    const roofIncline = useMeasurementsStore((state: State) => state.roofIncline);
    const width = useMeasurementsStore((state: State) => state.width);
    const length = useMeasurementsStore((state: State) => state.length);
    const domeHeight = useMeasurementsStore((state: State) => state.domeHeight);
    const beamLength = useMeasurementsStore((state: State) => state.beamLength);
    const interaxleLength = useMeasurementsStore((state: State) => state.interaxleLength);

    const ref = useRef<THREE.Mesh|null>(null);
    const domePillarGeometry = baseModel?.domePillarsRight;

    const DOMEPILLARSRIGHT = () => {
        useLayoutEffect(() => {
            if (ref.current && coveringLength && eavesHeight && roofIncline.percentage && width && length && interaxleLength && beamLength && domeHeight) {
                const mesh = new THREE.Object3D();

                for (let i = 0; i < (length / interaxleLength) + 1; i++) {
                    mesh.scale.y = domeHeight;
                    const shift = ref.current.geometry.boundingBox!.max.y;
                    ref.current.geometry.translate(0, -shift, 0);
                    mesh.position.set(-(beamLength - coveringLength) / 2, eavesHeight + domeHeight + 0.25 + ((roofIncline.percentage! * ((width / 2) - ((beamLength - coveringLength) / 2))) / 100), -interaxleLength * i);
                    mesh.rotation.set(0, Math.PI, -roofIncline.rad!);
                    ref.current.geometry.attributes.position.needsUpdate = true;
                    mesh.updateMatrix();
                    (ref.current as InstancedMesh).setMatrixAt(i, mesh.matrix);
                }
            }
        }, []);

        if (!coveringLength || !eavesHeight || !roofIncline.percentage || !width || !length || !interaxleLength || !beamLength || !domeHeight) {
            return <></>
        }

        return (
            <instancedUniformsMesh ref={ref}
                                   args={[domePillarGeometry, material, (length / interaxleLength) + 1]}></instancedUniformsMesh>
        )
    }

    // eslint-disable-next-line react-hooks/static-components
    return <DOMEPILLARSRIGHT/>
}
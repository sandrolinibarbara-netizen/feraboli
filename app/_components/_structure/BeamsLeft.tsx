import React, {useLayoutEffect, useRef} from "react";
import * as THREE from "three";
import {InstancedMesh} from "three";
import {useMeasurementsStore} from "@/app/_stores/measurements";
import {State} from "@/app/_types/State";

export default function BeamsLeft({material} : {material : THREE.Material}) {
    const baseModel = useMeasurementsStore((state: State) => state.geometry);
    const pillars = useMeasurementsStore((state: State) => state.pillars);
    const pitches = useMeasurementsStore((state: State) => state.pitches);
    const beamLength = useMeasurementsStore((state: State) => state.beamLength);
    const eavesHeight = useMeasurementsStore((state: State) => state.eavesHeight);
    const roofIncline = useMeasurementsStore((state: State) => state.roofIncline);
    const width = useMeasurementsStore((state: State) => state.width);
    const length = useMeasurementsStore((state: State) => state.length);
    const interaxleLength = useMeasurementsStore((state: State) => state.interaxleLength);
    const secondBeamLength = useMeasurementsStore((state: State) => state.secondBeamLength);
    const secondRoofIncline = useMeasurementsStore((state: State) => state.secondRoofIncline);

    const ref = useRef<THREE.Mesh|null>(null);
    const beamGeometry = baseModel?.beamsLeft;

    const BEAMSLEFT = () => {
        useLayoutEffect(() => {
            if (ref.current && secondBeamLength && eavesHeight && secondRoofIncline.percentage && width && length && interaxleLength) {
                const mesh = new THREE.Object3D();

                for (let i = 0; i < (length / interaxleLength) + 1; i++) {
                    mesh.scale.x = secondBeamLength + 1;
                    const shift = ref.current.geometry.boundingBox!.max.x;
                    ref.current.geometry.translate(-shift, 0, 0);
                    mesh.position.set(-width / 2, eavesHeight, i === 0 ? 0 : -interaxleLength * i);
                    mesh.rotation.set(0, Math.PI, -secondRoofIncline.rad!);
                    ref.current.geometry.attributes.position.needsUpdate = true;
                    mesh.updateMatrix();
                    (ref.current as InstancedMesh).setMatrixAt(i, mesh.matrix);
                }
            } else if (ref.current && beamLength && eavesHeight && roofIncline.percentage && width && length && interaxleLength && pillars) {
                const mesh = new THREE.Object3D();

                for (let i = 0; i < (length / interaxleLength) + 1; i++) {
                    mesh.scale.x = pillars < 3 && pitches?.includes('M') ? beamLength : beamLength + 1;
                    const shift = ref.current.geometry.boundingBox!.max.x;
                    ref.current.geometry.translate(-shift, 0, 0);
                    mesh.position.set(-width / 2, eavesHeight, i === 0 ? 0 : -interaxleLength * i);
                    mesh.rotation.set(0, Math.PI, -roofIncline.rad!);
                    ref.current.geometry.attributes.position.needsUpdate = true;
                    mesh.updateMatrix();
                    (ref.current as InstancedMesh).setMatrixAt(i, mesh.matrix);
                }
            }
        }, []);

        if (!beamLength || !eavesHeight || !roofIncline.percentage || !width || !length || !interaxleLength) {
            return <></>
        }

        return (
            <instancedUniformsMesh ref={ref}
                                   args={[beamGeometry, material, (length / interaxleLength) + 1]}>
            </instancedUniformsMesh>
        )
    }

    // eslint-disable-next-line react-hooks/static-components
    return <BEAMSLEFT/>
}
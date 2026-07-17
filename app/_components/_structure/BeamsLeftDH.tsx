import React, {useLayoutEffect, useRef} from "react";
import * as THREE from "three";
import {InstancedMesh} from "three";
import {useMeasurementsStore} from "@/app/_stores/measurements";
import {State} from "@/app/_types/State";
import {getDefinedValues} from "@/app/_utils/getDefinedValues";

export default function BeamsLeftDH({material} : {material : THREE.Material}) {
    const baseModel = useMeasurementsStore((state: State) => state.geometry);
    const pillars = useMeasurementsStore((state: State) => state.pillars);
    const beamLengthDH = useMeasurementsStore((state: State) => state.beamLengthDH);
    const eavesHeight = useMeasurementsStore((state: State) => state.eavesHeight);
    const roofIncline = useMeasurementsStore((state: State) => state.roofIncline);
    const width = useMeasurementsStore((state: State) => state.width);
    const length = useMeasurementsStore((state: State) => state.length);
    const interaxleLength = useMeasurementsStore((state: State) => state.interaxleLength);

    const ref = useRef<THREE.Mesh|null>(null);
    const beamGeometry = baseModel?.beamsLeft;
    const roofValues = getDefinedValues({
        beamLengthDH,
        eavesHeight,
        roofInclineRad: roofIncline.rad,
        width,
        length,
        interaxleLength,
        pillars
    });

    if (!roofValues) return null;

    const BEAMSLEFT = () => {
        const {length, interaxleLength} = roofValues;

        useLayoutEffect(() => {
            if (!ref.current) return;

            if (roofValues) {
                const {beamLengthDH, eavesHeight, roofInclineRad, width, length, interaxleLength} = roofValues;
                const mesh = new THREE.Object3D();

                for (let i = 0; i < (length / interaxleLength) + 1; i++) {
                    mesh.scale.x = beamLengthDH;
                    const shift = ref.current.geometry.boundingBox!.max.x;
                    ref.current.geometry.translate(-shift, 0, 0);
                    mesh.position.set(-(width / 2), eavesHeight, i === 0 ? 0 : -interaxleLength * i);
                    mesh.rotation.set(0, Math.PI, -roofInclineRad);
                    ref.current.geometry.attributes.position.needsUpdate = true;
                    mesh.updateMatrix();
                    (ref.current as InstancedMesh).setMatrixAt(i, mesh.matrix);
                }
            }
        }, []);

        return (
            <instancedUniformsMesh ref={ref}
                                   args={[beamGeometry, material, (length / interaxleLength) + 1]}>
            </instancedUniformsMesh>
        )
    }

    // eslint-disable-next-line react-hooks/static-components
    return <BEAMSLEFT/>
}

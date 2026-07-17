import React, {useLayoutEffect, useRef} from "react";
import * as THREE from "three";
import {InstancedMesh} from "three";
import {useMeasurementsStore} from "@/app/_stores/measurements";
import {State} from "@/app/_types/State";
import {getDefinedValues} from "@/app/_utils/getDefinedValues";

export default function DomeBeamsLeft({material} : {material : THREE.Material}) {
    const baseModel = useMeasurementsStore((state: State) => state.geometry);
    const domeWidth = useMeasurementsStore((state: State) => state.domeWidth);
    const eavesHeight = useMeasurementsStore((state: State) => state.eavesHeight);
    const roofIncline = useMeasurementsStore((state: State) => state.roofIncline);
    const beamMaxHeight = useMeasurementsStore((state: State) => state.beamMaxHeight);
    const length = useMeasurementsStore((state: State) => state.length);
    const domeHeight = useMeasurementsStore((state: State) => state.domeHeight);
    const interaxleLength = useMeasurementsStore((state: State) => state.interaxleLength);
    const secondHeightOffset = useMeasurementsStore((state: State) => state.secondHeightOffset);

    const ref = useRef<THREE.Mesh|null>(null);
    const domePillarGeometry = baseModel?.domeBeamsLeft;
    const requiredValues = getDefinedValues({
        domeWidth,
        eavesHeight,
        roofInclineRad: roofIncline.rad,
        length,
        interaxleLength,
        beamMaxHeight,
        domeHeight
    });

    if (!requiredValues) return null;

    const DOMEBEAMSLEFT = () => {
        useLayoutEffect(() => {
            if (!ref.current) return;

            const {domeWidth, eavesHeight, roofInclineRad, length, interaxleLength, beamMaxHeight, domeHeight} = requiredValues;
            const mesh = new THREE.Object3D();

            for (let i = 0; i < (length / interaxleLength) + 1 ; i++) {
                mesh.scale.x = domeWidth / 2 + 0.05;
                const shift = ref.current.geometry.boundingBox!.max.x;
                ref.current.geometry.translate(-shift, 0, 0);
                mesh.position.set(0.05, eavesHeight + beamMaxHeight + secondHeightOffset + domeHeight + 0.25, -interaxleLength * i);
                mesh.rotation.set(0, 0, roofInclineRad);
                ref.current.geometry.attributes.position.needsUpdate = true;
                mesh.updateMatrix();
                (ref.current as InstancedMesh).setMatrixAt(i, mesh.matrix);
            }
        }, []);

        return (
            <instancedUniformsMesh ref={ref}
                                   args={[domePillarGeometry, material, (requiredValues.length / requiredValues.interaxleLength) + 1]}></instancedUniformsMesh>
        )
    }

    // eslint-disable-next-line react-hooks/static-components
    return <DOMEBEAMSLEFT/>
}

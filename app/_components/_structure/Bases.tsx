import React, {useLayoutEffect, useRef} from "react";
import * as THREE from "three";
import {InstancedMesh} from "three";
import {useMeasurementsStore} from "@/app/_stores/measurements";
import {State} from "@/app/_types/State";
import {getDefinedValues} from "@/app/_utils/getDefinedValues";

export default function Bases({material} : {material : THREE.Material}) {
    const baseModel = useMeasurementsStore((state: State) => state.geometry);
    const pillars = useMeasurementsStore((state: State) => state.pillars);
    const pillarsHeight = useMeasurementsStore((state: State) => state.pillarsHeight);
    const width = useMeasurementsStore((state: State) => state.width);
    const length = useMeasurementsStore((state: State) => state.length);
    const interaxleLength = useMeasurementsStore((state: State) => state.interaxleLength);

    const ref = useRef<THREE.Mesh|null>(null);
    const baseGeometry = baseModel?.bases;
    const requiredValues = getDefinedValues({
        pillars,
        pillarsHeight,
        width,
        length,
        interaxleLength
    });

    if (!requiredValues) return null;

    const BASES = () => {
        useLayoutEffect(() => {
            if (!ref.current) return;

            const {pillars, pillarsHeight, width, length, interaxleLength} = requiredValues;
            const mesh = new THREE.Object3D();

            for (let i = 0; i < (pillars * (length / interaxleLength)) + pillars; i++) {
                mesh.position.set(pillarsHeight[i - (pillars * Math.floor(i / pillars))].position! - (width / 2), 0, -interaxleLength * Math.floor(i / pillars));
                mesh.updateMatrix();
                (ref.current as InstancedMesh).setMatrixAt(i, mesh.matrix);
            }
        }, []);

        return (
            <instancedUniformsMesh ref={ref}
                                   args={[baseGeometry, material, (requiredValues.pillars * (requiredValues.length / requiredValues.interaxleLength)) + requiredValues.pillars]}></instancedUniformsMesh>
        )
    }

    // eslint-disable-next-line react-hooks/static-components
    return <BASES/>
}

import React, {useLayoutEffect, useRef} from "react";
import * as THREE from "three";
import {InstancedMesh} from "three";
import {useMeasurementsStore} from "@/app/_stores/measurements";
import {State} from "@/app/_types/State";
import {getDefinedValues} from "@/app/_utils/getDefinedValues";
import type {ThreeEvent} from "@react-three/fiber";

export default function BasesS({material} : {material : THREE.Material}) {
    const baseModel = useMeasurementsStore((state: State) => state.geometry);
    const sails = useMeasurementsStore((state: State) => state.sails);
    const pillarsHeight = useMeasurementsStore((state: State) => state.pillarsHeight);
    const width = useMeasurementsStore((state: State) => state.width);
    const length = useMeasurementsStore((state: State) => state.length);
    const interaxleLength = useMeasurementsStore((state: State) => state.interaxleLength);
    const instancesInformation = useMeasurementsStore((state: State) => state.instancesInformation);
    const setInstanceShown = useMeasurementsStore((state: State) => state.setInstanceShown);

    const ref = useRef<THREE.Mesh|null>(null);
    const baseGeometry = baseModel?.bases;
    const requiredValues = getDefinedValues({
        sails,
        pillarsHeight,
        width,
        length,
        interaxleLength
    });

    if (!requiredValues) return null;
    const BASES = () => {
        useLayoutEffect(() => {
            if (!ref.current) return;
            ref.current.name = 'bases';
            const {sails, pillarsHeight, width, length, interaxleLength} = requiredValues;
            const mesh = new THREE.Object3D();
            for (let i = 0; i < (sails * (length / interaxleLength)) + sails; i++) {
                mesh.position.set(pillarsHeight[i - (sails * Math.floor(i / sails))].position! - (width / 2), 0, -interaxleLength * Math.floor(i / sails));
                mesh.updateMatrix();
                (ref.current as InstancedMesh).setMatrixAt(i, mesh.matrix);
            }

        }, []);
        return (
            <instancedUniformsMesh onClick={(e: ThreeEvent<MouseEvent>) => {
                e.stopPropagation();
                if (e.instanceId === undefined) return;

                setInstanceShown(e.instanceId);
                console.log(instancesInformation.pillars?.[e.instanceId]);
            }}
                                   ref={ref}
                                   args={[baseGeometry, material, (requiredValues.sails * (requiredValues.length / requiredValues.interaxleLength)) + requiredValues.sails]}></instancedUniformsMesh>
        )
    }
    // setInstancesInformation('bases', basesInfo);
    // eslint-disable-next-line react-hooks/static-components
    return <BASES/>
}

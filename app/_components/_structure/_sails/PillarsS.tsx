import React, {useLayoutEffect, useRef} from "react";
import * as THREE from "three";
import {InstancedMesh} from "three";
import {useMeasurementsStore} from "@/app/_stores/measurements";
import {State} from "@/app/_types/State";
import {getDefinedValues} from "@/app/_utils/getDefinedValues";

export default function PillarsS({material} : {material : THREE.Material}) {
    const baseModel = useMeasurementsStore((state: State) => state.geometry);
    const sails = useMeasurementsStore((state: State) => state.sails);
    const structureType = useMeasurementsStore((state: State) => state.structureType);

    const pillarsHeight = useMeasurementsStore((state: State) => state.pillarsHeight);
    const width = useMeasurementsStore((state: State) => state.width);
    const length = useMeasurementsStore((state: State) => state.length);
    const interaxleLength = useMeasurementsStore((state: State) => state.interaxleLength);

    const ref = useRef<THREE.Mesh|null>(null);
    const pillarGeometry = baseModel?.pillars;

    const requiredValues = getDefinedValues({
        sails,
        structureType,
        pillarsHeight,
        width,
        length,
        interaxleLength
    });

    if (!requiredValues) return null;

    const PILLARSS = () => {
        useLayoutEffect(() => {
            if (!ref.current) return;

            const {sails, pillarsHeight, width, length, interaxleLength} = requiredValues;
            const mesh = new THREE.Object3D();

            for(let i = 0; i < (sails * (length / interaxleLength)) + sails; i++) {
                mesh.scale.y = pillarsHeight[i - (sails * Math.floor(i / sails))].totalHeight!;
                const shift =  ref.current.geometry.boundingBox!.min.y;
                ref.current.geometry.translate(0, -shift, 0);
                ref.current.geometry.attributes.position.needsUpdate = true;
                const sailsOccupied = [];
                if(i % sails === 0) {
                    sailsOccupied.push(0);
                } else if(i % sails === sails - 1) {
                    sailsOccupied.push(sails - 1);
                } else {
                    sailsOccupied.push(i % sails, i % sails - 1);
                }

                mesh.position.set(pillarsHeight[i - (sails * Math.floor(i / sails))].position! - (width / 2), 0, - interaxleLength * Math.floor(i / sails));
                mesh.updateMatrix();
                (ref.current as InstancedMesh).setMatrixAt(i, mesh.matrix);
            }
        }, []);

        return(
            <instancedUniformsMesh ref={ref} onClick={() => console.log(ref.current)} args={[pillarGeometry, material, (requiredValues.sails * (requiredValues.length / requiredValues.interaxleLength)) + requiredValues.sails]}></instancedUniformsMesh>
        )
    }

    // eslint-disable-next-line react-hooks/static-components
    return <PILLARSS/>
}

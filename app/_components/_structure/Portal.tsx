import React, {useLayoutEffect, useRef} from "react";
import * as THREE from "three";
import {InstancedMesh} from "three";
import {useMeasurementsStore} from "@/app/_stores/measurements";
import {State} from "@/app/_types/State";
import {getDefinedValues} from "@/app/_utils/getDefinedValues";

export default function Portal({material} : {material : THREE.Material}) {
    const baseModel = useMeasurementsStore((state: State) => state.geometry);
    const pillars = useMeasurementsStore((state: State) => state.pillars);
    const pitches = useMeasurementsStore((state: State) => state.pitches);
    const pillarsHeight = useMeasurementsStore((state: State) => state.pillarsHeight);
    const width = useMeasurementsStore((state: State) => state.width);
    const length = useMeasurementsStore((state: State) => state.length);
    const interaxleLength = useMeasurementsStore((state: State) => state.interaxleLength);
    const secondHeight = useMeasurementsStore((state: State) => state.secondHeight);

    const ref = useRef<THREE.Mesh|null>(null);
    const portalDGeometry = baseModel?.capitalPortalD;

    const requiredValues = getDefinedValues({
        pillars,
        pitches,
        pillarsHeight,
        width,
        length,
        interaxleLength,
    });

    if (!requiredValues) return null;

    const effPillars = secondHeight
        ? requiredValues.pillars - 2
            : pitches === 'S' && pillars === 3
                ? requiredValues.pillars - 1
                : requiredValues.pillars;

    const PILLARS = () => {
        useLayoutEffect(() => {
            if (!ref.current) return;

            const {pillarsHeight, width, length, interaxleLength} = requiredValues;
            const mesh = new THREE.Object3D();

            for(let i = 0; i < (effPillars * (length / interaxleLength)) + effPillars; i++) {
                if(secondHeight) {
                    const remainder = i % effPillars;
                    let index;

                    if(remainder < effPillars / 2) {
                        index = remainder;
                    } else {
                        index = remainder + 2;
                    }

                    mesh.position.set(pillarsHeight[index].position! - (width / 2), pillarsHeight[index].totalHeight! - 1.03, - interaxleLength * Math.floor(i / effPillars));

                } else if(pitches === 'S' && pillars === 3) {
                    const remainder = i % effPillars;
                    let index;

                    if(remainder < effPillars / 2) {
                        index = remainder;
                    } else {
                        index = remainder + 1;
                    }

                    mesh.position.set(pillarsHeight[index].position! - (width / 2), pillarsHeight[index].totalHeight! - 1.03, - interaxleLength * Math.floor(i / effPillars));

                } else {
                    mesh.position.set(pillarsHeight[i - (effPillars * Math.floor(i / effPillars))].position! - (width / 2), pillarsHeight[i - (effPillars * Math.floor(i / effPillars))].totalHeight! - 1.03, - interaxleLength * Math.floor(i / effPillars));
                }

                mesh.updateMatrix();
                (ref.current as InstancedMesh).setMatrixAt(i, mesh.matrix);
            }
        }, []);

        return(
            <instancedUniformsMesh ref={ref} args={[portalDGeometry, material, (effPillars * (requiredValues.length / requiredValues.interaxleLength)) + effPillars]}></instancedUniformsMesh>
        )
    }

    // eslint-disable-next-line react-hooks/static-components
    return <PILLARS/>
}

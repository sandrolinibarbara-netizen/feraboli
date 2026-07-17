import React, {useLayoutEffect, useRef} from "react";
import * as THREE from "three";
import {InstancedMesh} from "three";
import {useMeasurementsStore} from "@/app/_stores/measurements";
import {State} from "@/app/_types/State";
import {getDefinedValues} from "@/app/_utils/getDefinedValues";

export default function StrutsSingleOpp({material} : {material : THREE.Material}) {
    const baseModel = useMeasurementsStore((state: State) => state.geometry);
    const pillars = useMeasurementsStore((state: State) => state.pillars);
    const pillarsHeight = useMeasurementsStore((state: State) => state.pillarsHeight);
    const width = useMeasurementsStore((state: State) => state.width);
    const length = useMeasurementsStore((state: State) => state.length);
    const interaxleLength = useMeasurementsStore((state: State) => state.interaxleLength);
    const roofIncline = useMeasurementsStore((state: State) => state.roofIncline);
    const eavesHeight = useMeasurementsStore((state: State) => state.eavesHeight);

    const ref = useRef<THREE.Mesh|null>(null);
    const strutsSGeometry = baseModel?.capitalStrutsSOpp;

    const requiredValues = getDefinedValues({
        pillars,
        pillarsHeight,
        width,
        length,
        interaxleLength,
        roofIncline,
        eavesHeight
    });

    if (!requiredValues) return null;

    const effPillars = 2;

    const PILLARS = () => {
        useLayoutEffect(() => {
            if (!ref.current) return;

            const {pillars, pillarsHeight, width, length, interaxleLength, roofIncline, eavesHeight} = requiredValues;
            const mesh = new THREE.Object3D();

            for(let i = 0; i < (effPillars * (length / interaxleLength)) + effPillars; i++) {
                const remainder = i % 2;
                let index, height;

                if(remainder === 0) {
                    index = (pillars / 2) - 1;
                    height = pillarsHeight[index].totalHeight! - 1.03;
                } else {
                    index = pillars / 2;
                    height = eavesHeight - 1.01 - 0.25 + (roofIncline.percentage! * pillarsHeight[index - 1].position!) / 100;
                }

                mesh.position.set(pillarsHeight[index].position! - (width / 2), height, - interaxleLength * Math.floor(i / effPillars));
                mesh.updateMatrix();
                (ref.current as InstancedMesh).setMatrixAt(i, mesh.matrix);
            }
        }, []);

        return(
            <instancedUniformsMesh ref={ref} args={[strutsSGeometry, material, (effPillars * (requiredValues.length / requiredValues.interaxleLength)) + effPillars]}></instancedUniformsMesh>
        )
    }

    // eslint-disable-next-line react-hooks/static-components
    return <PILLARS/>
}

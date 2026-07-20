import React, {useLayoutEffect, useRef} from "react";
import * as THREE from "three";
import {InstancedMesh} from "three";
import {useMeasurementsStore} from "@/app/_stores/measurements";
import {State} from "@/app/_types/State";
import {getDefinedValues} from "@/app/_utils/getDefinedValues";

export default function TieBeam({material} : {material : THREE.Material}) {
    const pillars = useMeasurementsStore((state: State) => state.pillars);
    const pillarsHeight = useMeasurementsStore((state: State) => state.pillarsHeight);
    const width = useMeasurementsStore((state: State) => state.width);
    const length = useMeasurementsStore((state: State) => state.length);
    const interaxleLength = useMeasurementsStore((state: State) => state.interaxleLength);
    const interaxleWidth = useMeasurementsStore((state: State) => state.interaxleWidth);
    const secondHeight = useMeasurementsStore((state: State) => state.secondHeight);

    const ref = useRef<THREE.Mesh|null>(null);

    const requiredValues = getDefinedValues({
        interaxleWidth,
        pillarsHeight,
        width,
        length,
        interaxleLength,
        pillars
    });

    if (!requiredValues) return null;

    const TIEBEAM = () => {
        const {length, interaxleLength, width, interaxleWidth} = requiredValues;
        const hasSecondHeight = secondHeight !== undefined;
        const frames = (length / interaxleLength) + 1;
        const effWidth = hasSecondHeight ? width / 2 : width;
        const effBeams = hasSecondHeight ? frames * 2 : frames;
        const tieBeamGeometry = new THREE.CylinderGeometry(0.01, 0.01,effWidth - interaxleWidth, 6);

        useLayoutEffect(() => {
            if (!ref.current) return;

            const {width, interaxleLength, pillars} = requiredValues;
            const mesh = new THREE.Object3D();

            for (let i = 0; i < effBeams; i++) {
                if (hasSecondHeight) {
                    const isLeft = i % 2 === 0;
                    const pillarIndex = isLeft ? 0 : pillars - 1;
                    const xOffset = (isLeft ? 1 : -1) * (effWidth - interaxleWidth) / 2;

                    mesh.position.set(
                        pillarsHeight[pillarIndex].position! - (width / 2) + xOffset,
                        pillarsHeight[pillarIndex].totalHeight!,
                        -interaxleLength * Math.floor(i / 2)
                    );
                } else {
                    mesh.position.set(0, pillarsHeight[0].totalHeight!, -interaxleLength * i);
                }

                mesh.rotation.set(0, 0, Math.PI/2);
                mesh.updateMatrix();
                (ref.current as InstancedMesh).setMatrixAt(i, mesh.matrix);
            }
        }, [effBeams, effWidth, hasSecondHeight, interaxleLength, interaxleWidth]);

        return (
            <instancedUniformsMesh ref={ref}
                                   args={[tieBeamGeometry, material, effBeams]}>
            </instancedUniformsMesh>
        )
    }

    // eslint-disable-next-line react-hooks/static-components
    return <TIEBEAM/>
}

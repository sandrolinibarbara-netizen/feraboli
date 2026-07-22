import React, {useEffect, useLayoutEffect, useMemo, useRef} from "react";
import * as THREE from "three";
import {InstancedMesh} from "three";
import {useMeasurementsStore} from "@/app/_stores/measurements";
import {State} from "@/app/_types/State";
import {getDefinedValues} from "@/app/_utils/getDefinedValues";
import {
    cloneDomePillarGeometry,
    getDomeSphericalPillarTransform
} from "@/app/_utils/domeSphericalAlignment";

export default function DomePillarsRightSP({material}: {material: THREE.Material}) {
    const baseModel = useMeasurementsStore((state: State) => state.geometry);
    const coveringLength = useMeasurementsStore((state: State) => state.coveringLength);
    const beamMaxHeight = useMeasurementsStore((state: State) => state.beamMaxHeight);
    const eavesHeight = useMeasurementsStore((state: State) => state.eavesHeight);
    const roofIncline = useMeasurementsStore((state: State) => state.roofIncline);
    const width = useMeasurementsStore((state: State) => state.width);
    const length = useMeasurementsStore((state: State) => state.length);
    const domeHeight = useMeasurementsStore((state: State) => state.domeHeight);
    const beamLength = useMeasurementsStore((state: State) => state.beamLength);
    const interaxleLength = useMeasurementsStore((state: State) => state.interaxleLength);
    const secondHeightOffset = useMeasurementsStore((state: State) => state.secondHeightOffset);

    const pillarsNumber = length && interaxleLength
        ? (length / interaxleLength) + 1
        : undefined;
    const ref = useRef<InstancedMesh | null>(null);
    const pillarGeometry = useMemo(
        () => cloneDomePillarGeometry(baseModel?.domePillarsRight),
        [baseModel?.domePillarsRight]
    );
    const requiredValues = getDefinedValues({
        beamLength,
        beamMaxHeight,
        coveringLength,
        domeHeight,
        eavesHeight,
        interaxleLength,
        length,
        pillarGeometry,
        pillarsNumber,
        roofInclinePercentage: roofIncline.percentage,
        roofInclineRad: roofIncline.rad,
        secondHeightOffset,
        width
    });

    useEffect(() => () => pillarGeometry?.dispose(), [pillarGeometry]);

    useLayoutEffect(() => {
        if (!ref.current || !requiredValues) return;

        const mesh = new THREE.Object3D();

        for (let i = 0; i < requiredValues.pillarsNumber; i++) {
            const transform = getDomeSphericalPillarTransform(
                "right",
                requiredValues,
                -requiredValues.interaxleLength * i
            );

            mesh.position.copy(transform.position);
            mesh.rotation.copy(transform.rotation);
            mesh.scale.copy(transform.scale);
            mesh.updateMatrix();
            ref.current.setMatrixAt(i, mesh.matrix);
        }

        ref.current.instanceMatrix.needsUpdate = true;
    }, [requiredValues]);

    if (!requiredValues) return null;

    return (
        <instancedUniformsMesh
            ref={ref}
            args={[requiredValues.pillarGeometry, material, requiredValues.pillarsNumber]}
        />
    );
}

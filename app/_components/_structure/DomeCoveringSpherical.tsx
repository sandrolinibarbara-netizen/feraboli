import React, {useEffect, useLayoutEffect, useMemo, useRef} from "react";
import * as THREE from "three";
import {InstancedMesh} from "three";
import {useMeasurementsStore} from "@/app/_stores/measurements";
import {State} from "@/app/_types/State";
import {getDefinedValues} from "@/app/_utils/getDefinedValues";
import {
    cloneDomeCoveringGeometry,
    cloneDomePillarGeometry,
    cloneDomePurlinGeometry,
    getDomeSphericalCoveringTransform
} from "@/app/_utils/domeSphericalAlignment";

export default function DomeCoveringSpherical({material}: {material: THREE.Material}) {
    const baseModel = useMeasurementsStore((state: State) => state.geometry);
    const coveringLength = useMeasurementsStore((state: State) => state.coveringLength);
    const beamLength = useMeasurementsStore((state: State) => state.beamLength);
    const eavesHeight = useMeasurementsStore((state: State) => state.eavesHeight);
    const roofIncline = useMeasurementsStore((state: State) => state.roofIncline);
    const width = useMeasurementsStore((state: State) => state.width);
    const length = useMeasurementsStore((state: State) => state.length);
    const domeHeight = useMeasurementsStore((state: State) => state.domeHeight);
    const secondHeightOffset = useMeasurementsStore((state: State) => state.secondHeightOffset);

    const ref = useRef<InstancedMesh | null>(null);
    const coveringGeometry = useMemo(
        () => cloneDomeCoveringGeometry(baseModel?.domeCoveringSpherical),
        [baseModel?.domeCoveringSpherical]
    );
    const leftPillarGeometry = useMemo(
        () => cloneDomePillarGeometry(baseModel?.domePillarsLeft),
        [baseModel?.domePillarsLeft]
    );
    const rightPillarGeometry = useMemo(
        () => cloneDomePillarGeometry(baseModel?.domePillarsRight),
        [baseModel?.domePillarsRight]
    );
    const leftPurlinGeometry = useMemo(
        () => cloneDomePurlinGeometry(baseModel?.domePurlinsLeft),
        [baseModel?.domePurlinsLeft]
    );
    const rightPurlinGeometry = useMemo(
        () => cloneDomePurlinGeometry(baseModel?.domePurlinsRight),
        [baseModel?.domePurlinsRight]
    );
    const requiredValues = getDefinedValues({
        beamLength,
        coveringGeometry,
        coveringLength,
        domeHeight,
        eavesHeight,
        leftPillarGeometry,
        leftPurlinGeometry,
        length,
        rightPillarGeometry,
        rightPurlinGeometry,
        roofInclinePercentage: roofIncline.percentage,
        roofInclineRad: roofIncline.rad,
        secondHeightOffset,
        width
    });

    useEffect(() => () => {
        coveringGeometry?.dispose();
        leftPillarGeometry?.dispose();
        rightPillarGeometry?.dispose();
        leftPurlinGeometry?.dispose();
        rightPurlinGeometry?.dispose();
    }, [
        coveringGeometry,
        leftPillarGeometry,
        leftPurlinGeometry,
        rightPillarGeometry,
        rightPurlinGeometry
    ]);

    useLayoutEffect(() => {
        if (!ref.current || !requiredValues) return;

        const transform = getDomeSphericalCoveringTransform(
            requiredValues,
            requiredValues.coveringGeometry,
            requiredValues.leftPillarGeometry,
            requiredValues.rightPillarGeometry,
            requiredValues.leftPurlinGeometry,
            requiredValues.rightPurlinGeometry
        );
        const mesh = new THREE.Object3D();

        for (let i = 0; i < requiredValues.length + 1; i++) {
            mesh.position.copy(transform.position);
            mesh.position.z = -i;
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
            args={[requiredValues.coveringGeometry, material, requiredValues.length + 1]}
        />
    );
}

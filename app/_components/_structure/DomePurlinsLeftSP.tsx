import React, {useEffect, useLayoutEffect, useMemo, useRef} from "react";
import * as THREE from "three";
import {InstancedMesh} from "three";
import {useMeasurementsStore} from "@/app/_stores/measurements";
import {State} from "@/app/_types/State";
import {getDefinedValues} from "@/app/_utils/getDefinedValues";
import {
    cloneDomePillarGeometry,
    cloneDomePurlinGeometry,
    getDomeSphericalPurlinTransform
} from "@/app/_utils/domeSphericalAlignment";

export default function DomePurlinsLeftSP({material}: {material: THREE.Material}) {
    const baseModel = useMeasurementsStore((state: State) => state.geometry);
    const coveringLength = useMeasurementsStore((state: State) => state.coveringLength);
    const beamLength = useMeasurementsStore((state: State) => state.beamLength);
    const beamMaxHeight = useMeasurementsStore((state: State) => state.beamMaxHeight);
    const eavesHeight = useMeasurementsStore((state: State) => state.eavesHeight);
    const roofIncline = useMeasurementsStore((state: State) => state.roofIncline);
    const width = useMeasurementsStore((state: State) => state.width);
    const length = useMeasurementsStore((state: State) => state.length);
    const domeHeight = useMeasurementsStore((state: State) => state.domeHeight);
    const secondHeightOffset = useMeasurementsStore((state: State) => state.secondHeightOffset);

    const ref = useRef<InstancedMesh | null>(null);
    const purlinGeometry = useMemo(
        () => cloneDomePurlinGeometry(baseModel?.domePurlinsLeft),
        [baseModel?.domePurlinsLeft]
    );
    const pillarGeometry = useMemo(
        () => cloneDomePillarGeometry(baseModel?.domePillarsLeft),
        [baseModel?.domePillarsLeft]
    );
    const requiredValues = getDefinedValues({
        beamLength,
        beamMaxHeight,
        coveringLength,
        domeHeight,
        eavesHeight,
        length,
        pillarGeometry,
        purlinGeometry,
        roofInclinePercentage: roofIncline.percentage,
        roofInclineRad: roofIncline.rad,
        secondHeightOffset,
        width
    });

    useEffect(() => () => {
        purlinGeometry?.dispose();
        pillarGeometry?.dispose();
    }, [pillarGeometry, purlinGeometry]);

    useLayoutEffect(() => {
        if (!ref.current || !requiredValues) return;

        const transform = getDomeSphericalPurlinTransform(
            "left",
            requiredValues,
            requiredValues.pillarGeometry
        );
        const mesh = new THREE.Object3D();

        mesh.position.copy(transform.position);
        mesh.rotation.copy(transform.rotation);
        mesh.scale.copy(transform.scale);
        mesh.updateMatrix();
        ref.current.setMatrixAt(0, mesh.matrix);
        ref.current.instanceMatrix.needsUpdate = true;
    }, [requiredValues]);

    if (!requiredValues) return null;

    return (
        <instancedUniformsMesh
            ref={ref}
            args={[requiredValues.purlinGeometry, material, 1]}
        />
    );
}

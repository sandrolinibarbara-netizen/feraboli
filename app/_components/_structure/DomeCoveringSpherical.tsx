import React, {useEffect, useLayoutEffect, useMemo, useRef} from "react";
import * as THREE from "three";
import {InstancedMesh} from "three";
import {useMeasurementsStore} from "@/app/_stores/measurements";
import {State} from "@/app/_types/State";
import {getDefinedValues} from "@/app/_utils/getDefinedValues";
import {
    cloneDomeCoveringGeometry,
    cloneOmegaPurlinGeometry,
    getDomeSphericalCoveringTransform
} from "@/app/_utils/domeSphericalAlignment";

export default function DomeCoveringSpherical({material}: {material: THREE.Material}) {
    const baseModel = useMeasurementsStore((state: State) => state.geometry);
    const beamMaxHeight = useMeasurementsStore((state: State) => state.beamMaxHeight);
    const eavesHeight = useMeasurementsStore((state: State) => state.eavesHeight);
    const width = useMeasurementsStore((state: State) => state.width);
    const length = useMeasurementsStore((state: State) => state.length);
    const domeHeight = useMeasurementsStore((state: State) => state.domeHeight);
    const secondHeightOffset = useMeasurementsStore((state: State) => state.secondHeightOffset);
    const purlinShape = useMeasurementsStore((state: State) => state.purlinShape);
    const usesOmegaPurlins = purlinShape !== "c";

    const ref = useRef<InstancedMesh | null>(null);
    const coveringGeometry = useMemo(
        () => cloneDomeCoveringGeometry(baseModel?.domeCoveringSpherical),
        [baseModel?.domeCoveringSpherical]
    );
    const centralPurlinGeometry = useMemo(
        () => usesOmegaPurlins
            ? cloneOmegaPurlinGeometry(
                baseModel?.purlinsOmega,
                baseModel?.domePurlinsOmegaCentral
            )
            : cloneDomeCoveringGeometry(baseModel?.domePurlinsCentral),
        [
            baseModel?.domePurlinsCentral,
            baseModel?.domePurlinsOmegaCentral,
            baseModel?.purlinsOmega,
            usesOmegaPurlins
        ]
    );
    const requiredValues = getDefinedValues({
        beamMaxHeight,
        centralPurlinGeometry,
        coveringGeometry,
        domeHeight,
        eavesHeight,
        length,
        secondHeightOffset,
        width
    });

    useEffect(() => () => {
        coveringGeometry?.dispose();
        centralPurlinGeometry?.dispose();
    }, [centralPurlinGeometry, coveringGeometry]);

    useLayoutEffect(() => {
        if (!ref.current || !requiredValues) return;

        const transform = getDomeSphericalCoveringTransform(
            requiredValues,
            requiredValues.coveringGeometry,
            requiredValues.centralPurlinGeometry
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

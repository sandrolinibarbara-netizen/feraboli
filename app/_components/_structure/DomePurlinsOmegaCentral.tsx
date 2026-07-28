import React, {useEffect, useLayoutEffect, useMemo, useRef} from "react";
import * as THREE from "three";
import {InstancedMesh} from "three";
import {useMeasurementsStore} from "@/app/_stores/measurements";
import {State} from "@/app/_types/State";
import {getDefinedValues} from "@/app/_utils/getDefinedValues";
import {
    cloneOmegaPurlinGeometry,
    getOmegaPurlinWidth
} from "@/app/_utils/domeSphericalAlignment";

export default function DomePurlinsOmegaCentral({material}: {material: THREE.Material}) {
    const baseModel = useMeasurementsStore((state: State) => state.geometry);
    const eavesHeight = useMeasurementsStore((state: State) => state.eavesHeight);
    const beamMaxHeight = useMeasurementsStore((state: State) => state.beamMaxHeight);
    const length = useMeasurementsStore((state: State) => state.length);
    const domeHeight = useMeasurementsStore((state: State) => state.domeHeight);
    const secondHeightOffset = useMeasurementsStore((state: State) => state.secondHeightOffset);

    const ref = useRef<InstancedMesh | null>(null);
    const purlinGeometry = useMemo(
        () => cloneOmegaPurlinGeometry(
            baseModel?.purlinsOmega,
            baseModel?.domePurlinsOmegaCentral
        ),
        [baseModel?.domePurlinsOmegaCentral, baseModel?.purlinsOmega]
    );
    const requiredValues = getDefinedValues({
        beamMaxHeight,
        domeHeight,
        eavesHeight,
        length,
        purlinGeometry,
        secondHeightOffset
    });

    useEffect(() => () => purlinGeometry?.dispose(), [purlinGeometry]);

    useLayoutEffect(() => {
        if (!ref.current || !requiredValues) return;

        const mesh = new THREE.Object3D();
        const profileWidth = getOmegaPurlinWidth(requiredValues.purlinGeometry);

        mesh.scale.z = requiredValues.length + 1;
        mesh.position.set(
            profileWidth / 2,
            requiredValues.eavesHeight +
                requiredValues.secondHeightOffset +
                requiredValues.beamMaxHeight +
                requiredValues.domeHeight +
                0.25,
            -requiredValues.length / 2
        );
        mesh.rotation.set(0, 0, 0);
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

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

export default function DomePurlinsOmegaLeft({material}: {material: THREE.Material}) {
    const baseModel = useMeasurementsStore((state: State) => state.geometry);
    const domeWidth = useMeasurementsStore((state: State) => state.domeWidth);
    const eavesHeight = useMeasurementsStore((state: State) => state.eavesHeight);
    const roofIncline = useMeasurementsStore((state: State) => state.roofIncline);
    const beamMaxHeight = useMeasurementsStore((state: State) => state.beamMaxHeight);
    const width = useMeasurementsStore((state: State) => state.width);
    const length = useMeasurementsStore((state: State) => state.length);
    const domeHeight = useMeasurementsStore((state: State) => state.domeHeight);
    const secondHeightOffset = useMeasurementsStore((state: State) => state.secondHeightOffset);
    const purlinNumber = width
        ? (width >= 35 ? 2 : 1)
        : undefined;

    const ref = useRef<InstancedMesh | null>(null);
    const purlinGeometry = useMemo(
        () => cloneOmegaPurlinGeometry(
            baseModel?.purlinsOmega,
            baseModel?.domePurlinsOmega
        ),
        [baseModel?.domePurlinsOmega, baseModel?.purlinsOmega]
    );
    const requiredValues = getDefinedValues({
        beamMaxHeight,
        domeHeight,
        domeWidth,
        eavesHeight,
        length,
        purlinGeometry,
        purlinNumber,
        roofInclineRad: roofIncline.rad,
        secondHeightOffset
    });

    useEffect(() => () => purlinGeometry?.dispose(), [purlinGeometry]);

    useLayoutEffect(() => {
        if (!ref.current || !requiredValues) return;

        const {
            beamMaxHeight,
            domeHeight,
            domeWidth,
            eavesHeight,
            length,
            purlinGeometry,
            purlinNumber,
            roofInclineRad,
            secondHeightOffset
        } = requiredValues;
        const mesh = new THREE.Object3D();
        const profileWidth = getOmegaPurlinWidth(purlinGeometry);
        const maxPurlinHeight = (domeWidth / 2) * Math.sin(roofInclineRad);
        const horizontalDomeWidth = Math.sqrt(
            Math.pow(domeWidth / 2, 2) - Math.pow(maxPurlinHeight, 2)
        );

        for (let i = 0; i < purlinNumber; i++) {
            const isOuterPurlin = i === 0;
            const smallBase = i === 1 ? domeWidth / 4 : 0;
            const edgeOffset = isOuterPurlin ? profileWidth : 0.1;
            const height = (smallBase + edgeOffset) * Math.sin(roofInclineRad);
            const purlinHeight =
                eavesHeight +
                secondHeightOffset +
                beamMaxHeight +
                0.25 +
                (domeHeight - maxPurlinHeight) +
                height;
            const purlinPosition = i === 1
                ? (-horizontalDomeWidth / 2) + 0.1
                : -horizontalDomeWidth + profileWidth;

            mesh.scale.z = length + 1;
            mesh.position.set(purlinPosition, purlinHeight, -length / 2);
            mesh.rotation.set(0, 0, roofInclineRad);
            mesh.updateMatrix();
            ref.current.setMatrixAt(i, mesh.matrix);
        }

        ref.current.instanceMatrix.needsUpdate = true;
    }, [requiredValues]);

    if (!requiredValues) return null;

    return (
        <instancedUniformsMesh
            ref={ref}
            args={[
                requiredValues.purlinGeometry,
                material,
                requiredValues.purlinNumber
            ]}
        />
    );
}

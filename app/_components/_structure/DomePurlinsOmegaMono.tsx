import React, {useEffect, useLayoutEffect, useMemo, useRef} from "react";
import * as THREE from "three";
import {InstancedMesh} from "three";
import {useMeasurementsStore} from "@/app/_stores/measurements";
import {State} from "@/app/_types/State";
import {getDefinedValues} from "@/app/_utils/getDefinedValues";
import {
    cloneOmegaPurlinGeometry,
    getOmegaPurlinWidth
} from "@/app/_utils/getDomeSphericalAlignment";

export default function DomePurlinsOmegaMono({material}: {material: THREE.Material}) {
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
        ? (width >= 35 ? 5 : 3)
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
        const purlinGap = domeWidth / 4;

        for (let i = 0; i < purlinNumber; i++) {
            const distanceFromCenter = i === purlinNumber - 1
                ? (domeWidth / 2) / Math.cos(roofInclineRad)
                : i === 0
                    ? (domeWidth / 2 - profileWidth) / Math.cos(roofInclineRad)
                    : (domeWidth / 4) / Math.cos(roofInclineRad);
            const isCentralPurlin =
                (purlinNumber === 5 && i === 2) ||
                (purlinNumber === 3 && i === 1);
            const heightOffset = isCentralPurlin
                ? 0
                : distanceFromCenter * Math.sin(roofInclineRad);
            const isRightPurlin =
                i === purlinNumber - 1 ||
                (purlinNumber === 5 && i === 3);
            const purlinHeight =
                eavesHeight +
                secondHeightOffset +
                beamMaxHeight +
                0.25 +
                domeHeight +
                (isRightPurlin ? heightOffset : -heightOffset);
            const purlinPosition = i === purlinNumber - 1
                ? domeWidth / 2
                : isCentralPurlin
                    ? 0
                    : purlinNumber === 5 && i === 3
                        ? (domeWidth / 2) - purlinGap
                        : purlinNumber === 5 && i === 1
                            ? -(domeWidth / 2) + purlinGap
                            : -(domeWidth / 2) + profileWidth;

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

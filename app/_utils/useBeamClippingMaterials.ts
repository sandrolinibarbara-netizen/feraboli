import {useEffect, useLayoutEffect, useMemo} from "react";
import * as THREE from "three";
import {useMeasurementsStore} from "@/app/_stores/measurements";
import {State} from "@/app/_types/State";
import {getDefinedValues} from "@/app/_utils/getDefinedValues";

export type BeamClippingGroup =
    | "primaryLeft"
    | "primaryRight"
    | "primaryBoth"
    | "outerLeft"
    | "outerRight";

export function useBeamClippingMaterials(material: THREE.Material) {
    const baseModel = useMeasurementsStore((state: State) => state.geometry);
    const pillars = useMeasurementsStore((state: State) => state.pillars);
    const pitches = useMeasurementsStore((state: State) => state.pitches);
    const beamLength = useMeasurementsStore((state: State) => state.beamLength);
    const beamLengthDH = useMeasurementsStore((state: State) => state.beamLengthDH);
    const eavesHeight = useMeasurementsStore((state: State) => state.eavesHeight);
    const roofIncline = useMeasurementsStore((state: State) => state.roofIncline);
    const width = useMeasurementsStore((state: State) => state.width);
    const secondBeamLength = useMeasurementsStore((state: State) => state.secondBeamLength);
    const secondRoofIncline = useMeasurementsStore((state: State) => state.secondRoofIncline);
    const interaxleWidth = useMeasurementsStore((state: State) => state.interaxleWidth);
    const secondHeight = useMeasurementsStore((state: State) => state.secondHeight);
    const secondHeightOffset = useMeasurementsStore((state: State) => state.secondHeightOffset);
    const beamBoundingBox = baseModel?.beamsLeft.boundingBox;

    const clipping = useMemo(() => {
        // Mantiene visibile il capitello sotto la faccia inferiore della trave.
        const primaryLeftPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
        const primaryRightPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
        const outerLeftPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
        const outerRightPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
        const centerLeftPlane = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0);
        const centerRightPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0);

        const primaryLeftMaterial = material.clone();
        const primaryRightMaterial = material.clone();
        const primaryCenterLeftMaterial = material.clone();
        const primaryCenterRightMaterial = material.clone();
        const outerLeftMaterial = material.clone();
        const outerRightMaterial = material.clone();

        primaryLeftMaterial.clippingPlanes = [primaryLeftPlane];
        primaryRightMaterial.clippingPlanes = [primaryRightPlane];
        // Il modello doppio sul colmo viene diviso tra le due falde.
        primaryCenterLeftMaterial.clippingPlanes = [primaryLeftPlane, centerLeftPlane];
        primaryCenterRightMaterial.clippingPlanes = [primaryRightPlane, centerRightPlane];
        outerLeftMaterial.clippingPlanes = [outerLeftPlane];
        outerRightMaterial.clippingPlanes = [outerRightPlane];

        return {
            primaryLeftPlane,
            primaryRightPlane,
            outerLeftPlane,
            outerRightPlane,
            materials: {
                primaryLeft: primaryLeftMaterial,
                primaryRight: primaryRightMaterial,
                primaryCenterLeft: primaryCenterLeftMaterial,
                primaryCenterRight: primaryCenterRightMaterial,
                outerLeft: outerLeftMaterial,
                outerRight: outerRightMaterial,
            }
        };
    }, [material]);

    const primaryRoofValues = getDefinedValues({
        beamLength,
        eavesHeight,
        roofInclineRad: roofIncline.rad,
        width,
        pillars,
        interaxleWidth,
        secondHeightOffset,
        beamBoundingBox
    });
    const secondRoofValues = getDefinedValues({
        secondBeamLength,
        eavesHeight,
        secondRoofInclineRad: secondRoofIncline.rad,
        width
    });
    const doubleHeightValues = secondHeight !== undefined
        ? getDefinedValues({beamLengthDH})
        : undefined;
    const ready = Boolean(
        primaryRoofValues
        && (secondHeight === undefined || doubleHeightValues)
    );

    useLayoutEffect(() => {
        if (!primaryRoofValues) return;
        if (secondHeight !== undefined && !doubleHeightValues) return;

        const {
            beamLength,
            eavesHeight,
            roofInclineRad,
            width,
            pillars,
            interaxleWidth,
            secondHeightOffset,
            beamBoundingBox
        } = primaryRoofValues;
        const hasDoubleHeight = secondHeight !== undefined && pillars > 3;
        const leftBeamPosition = hasDoubleHeight
            ? -(interaxleWidth / 2) - 0.5
            : -(width / 2);
        const rightBeamPosition = hasDoubleHeight
            ? (interaxleWidth / 2) + 0.5
            : (width / 2);

        const leftBeamMatrix = new THREE.Matrix4().compose(
            new THREE.Vector3(
                secondRoofValues ? -(secondRoofValues.width / 2) : leftBeamPosition,
                secondRoofValues
                    ? secondRoofValues.eavesHeight
                    : eavesHeight + secondHeightOffset,
                0
            ),
            new THREE.Quaternion().setFromEuler(
                new THREE.Euler(
                    0,
                    Math.PI,
                    -(secondRoofValues?.secondRoofInclineRad ?? roofInclineRad)
                )
            ),
            new THREE.Vector3(
                secondRoofValues
                    ? secondRoofValues.secondBeamLength + 1
                    : pillars < 3 && pitches?.includes("M")
                        ? beamLength
                        : beamLength + 1,
                1,
                1
            )
        );
        const rightBeamMatrix = pillars < 3 && pitches?.includes("M")
            ? leftBeamMatrix
            : new THREE.Matrix4().compose(
                new THREE.Vector3(
                    rightBeamPosition,
                    eavesHeight + secondHeightOffset,
                    0
                ),
                new THREE.Quaternion().setFromEuler(
                    new THREE.Euler(0, 0, -roofInclineRad)
                ),
                new THREE.Vector3(beamLength + 1, 1, 1)
            );

        clipping.primaryLeftPlane
            .set(new THREE.Vector3(0, -1, 0), beamBoundingBox.min.y)
            .applyMatrix4(leftBeamMatrix);
        clipping.primaryRightPlane
            .set(new THREE.Vector3(0, -1, 0), beamBoundingBox.min.y)
            .applyMatrix4(rightBeamMatrix);

        if (secondHeight !== undefined && doubleHeightValues) {
            const outerLeftBeamMatrix = new THREE.Matrix4().compose(
                new THREE.Vector3(-(width / 2), eavesHeight, 0),
                new THREE.Quaternion().setFromEuler(
                    new THREE.Euler(0, Math.PI, -roofInclineRad)
                ),
                new THREE.Vector3(doubleHeightValues.beamLengthDH, 1, 1)
            );
            const outerRightBeamMatrix = new THREE.Matrix4().compose(
                new THREE.Vector3(width / 2, eavesHeight, 0),
                new THREE.Quaternion().setFromEuler(
                    new THREE.Euler(0, 0, -roofInclineRad)
                ),
                new THREE.Vector3(doubleHeightValues.beamLengthDH, 1, 1)
            );

            clipping.outerLeftPlane
                .set(new THREE.Vector3(0, -1, 0), beamBoundingBox.min.y)
                .applyMatrix4(outerLeftBeamMatrix);
            clipping.outerRightPlane
                .set(new THREE.Vector3(0, -1, 0), beamBoundingBox.min.y)
                .applyMatrix4(outerRightBeamMatrix);
        }
    }, [
        clipping,
        doubleHeightValues,
        pitches,
        primaryRoofValues,
        secondHeight,
        secondRoofValues
    ]);

    useEffect(() => {
        const clippedMaterials = Object.values(clipping.materials);

        return () => {
            clippedMaterials.forEach((clippedMaterial) => clippedMaterial.dispose());
        };
    }, [clipping]);

    return {
        ready,
        materials: clipping.materials
    };
}

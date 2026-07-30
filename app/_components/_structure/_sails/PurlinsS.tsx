import React, {useLayoutEffect, useRef} from "react";
import * as THREE from "three";
import {InstancedMesh} from "three";
import {useMeasurementsStore} from "@/app/_stores/measurements";
import {State} from "@/app/_types/State";
import {getDefinedValues} from "@/app/_utils/getDefinedValues";

export default function PurlinsS({material} : {material : THREE.Material}) {
    const baseModel = useMeasurementsStore((state: State) => state.geometry);
    const eavesHeight = useMeasurementsStore((state: State) => state.eavesHeight);
    const roofIncline = useMeasurementsStore((state: State) => state.roofIncline);
    const width = useMeasurementsStore((state: State) => state.width);
    const length = useMeasurementsStore((state: State) => state.length);
    const purlinType = useMeasurementsStore((state: State) => state.purlinType);
    const interaxleWidth = useMeasurementsStore((state: State) => state.interaxleWidth);
    const spansRight = useMeasurementsStore((state: State) => state.spansRight);
    const spansLeft = useMeasurementsStore((state: State) => state.spansLeft);
    const pillarsHeight = useMeasurementsStore((state: State) => state.pillarsHeight);
    const beamLength = useMeasurementsStore((state: State) => state.spansInfo.beams);

    const spansRightRef = useRef<THREE.Mesh|null>(null);
    const spansLeftRef = useRef<THREE.Mesh|null>(null);
    const spansRightGeometry = baseModel?.purlinsLeft;
    const spansLeftGeometry = baseModel?.purlinsRight;
    const pillarGeometry = baseModel?.pillars;
    const requiredValues = getDefinedValues({
        eavesHeight,
        roofInclineRad: roofIncline.rad,
        width,
        length,
        interaxleWidth,
        spansRight,
        pillarsHeight,
        beamLength,
        pillarGeometry
    });

    if (!requiredValues) return null;

    const PURLINS = () => {
        const {
            beamLength,
            spansRight,
            pillarsHeight,
            eavesHeight,
            roofInclineRad,
            interaxleWidth,
            width,
            length,
            pillarGeometry
        } = requiredValues;
        const beamsPerRow = spansRight + (spansLeft ?? 0);
        const lastBeamIndex = beamsPerRow - 1;
        const centralBeamIndex = spansRight;

        const getBeamValues = (beamIndex: number) => {
            if (!spansLeft) {
                return beamIndex === 0
                    ? beamLength.firstSpans
                    : beamLength.middleSpans;
            }

            if (beamIndex === 0) {
                const beamScale = spansRight === 1
                    ? beamLength.firstSpans.beamLength - 1
                    : beamLength.firstSpans.beamLength;

                return {
                    ...beamLength.firstSpans,
                    beamLength: beamScale
                };
            }

            if (beamIndex === lastBeamIndex) {
                const beamScale = spansLeft === 2
                    ? beamLength.firstSpans.beamLength - 1
                    : beamLength.firstSpans.beamLength;

                return {
                    ...beamLength.firstSpans,
                    beamLength: beamScale
                };
            }

            if (beamIndex === centralBeamIndex) {
                return beamLength.centralSpan;
            }

            if (Math.abs(beamIndex - centralBeamIndex) === 1) {
                return beamLength.nearCentralSpans;
            }

            return beamLength.middleSpans;
        };

        const purlinsPerBeam = Array.from(
            {length: beamsPerRow},
            (_, beamIndex) => getBeamValues(beamIndex).halfPurlins
        );
        const totalPurlins = purlinsPerBeam.reduce(
            (total, purlins) => total + purlins,
            0
        );
        const spansRightPurlins = purlinsPerBeam
            .slice(0, centralBeamIndex)
            .reduce((total, purlins) => total + purlins, 0);
        const spansLeftPurlins = totalPurlins - spansRightPurlins;

        useLayoutEffect(() => {
            if (
                !spansRightRef.current
                || (spansLeft && !spansLeftRef.current)
            ) {
                return;
            }

            const mesh = new THREE.Object3D();
            const purlinOffset = purlinType === "light" ? 0.21 : 0;
            let spansRightInstanceIndex = 0;
            let spansLeftInstanceIndex = 0;
            const meshes = [
                spansRightRef.current,
                spansLeftRef.current
            ].filter((purlinsMesh): purlinsMesh is THREE.Mesh => {
                return purlinsMesh !== null;
            });

            for (const purlinsMesh of meshes) {
                purlinsMesh.geometry.computeBoundingBox();
                const shift = purlinsMesh.geometry.boundingBox?.max.x ?? 0;
                purlinsMesh.geometry.translate(-shift, 0, 0);
                purlinsMesh.geometry.attributes.position.needsUpdate = true;
            }

            pillarGeometry.computeBoundingBox();
            const pillarHalfWidth = Math.max(
                Math.abs(pillarGeometry.boundingBox?.min.x ?? 0),
                Math.abs(pillarGeometry.boundingBox?.max.x ?? 0)
            );
            const clearance = 0.005;
            const getPurlinBounds = (
                purlinsMesh: THREE.Mesh,
                rotation: number
            ) => {
                const rotationMatrix = new THREE.Matrix4()
                    .makeRotationFromEuler(
                        new THREE.Euler(0, Math.PI, rotation)
                    );

                return purlinsMesh.geometry.boundingBox!
                    .clone()
                    .applyMatrix4(rotationMatrix);
            };
            const spansRightBounds = getPurlinBounds(
                spansRightRef.current,
                -roofInclineRad
            );
            const spansLeftBounds = spansLeftRef.current
                ? getPurlinBounds(
                    spansLeftRef.current,
                    roofInclineRad
                )
                : undefined;

            for (let beamIndex = 0; beamIndex < beamsPerRow; beamIndex++) {
                const beamValues = getBeamValues(beamIndex);
                const purlinCount = purlinsPerBeam[beamIndex];
                const beamScale = beamValues.beamLength;
                const isDescending = Boolean(
                    spansLeft && beamIndex >= centralBeamIndex
                );
                const positionOffset = beamIndex === 0
                    ? interaxleWidth / 2
                    : spansLeft && beamIndex === centralBeamIndex
                        ? 1
                        : spansLeft && beamIndex > centralBeamIndex + 1
                            && beamIndex < lastBeamIndex
                            ? 1
                            : spansLeft === 2 && beamIndex === lastBeamIndex
                                ? 0
                                : spansLeft && spansLeft !== 2
                                    && beamIndex === lastBeamIndex
                                    ? 1
                                    : 0;
                const beamPosition = pillarsHeight[beamIndex].position!
                    - (width / 2)
                    - positionOffset;
                let beamHeight = isDescending
                    ? eavesHeight + beamScale * Math.sin(roofInclineRad)
                    : eavesHeight;

                if (spansLeft && beamIndex === centralBeamIndex) {
                    beamHeight = pillarsHeight[beamIndex].totalHeight!
                        + positionOffset * Math.tan(roofInclineRad);
                }

                const base = beamScale * Math.cos(roofInclineRad);
                const height = (beamScale - 0.1) * Math.sin(roofInclineRad);
                const calculatedGap = ((beamScale - 0.1) / purlinCount) + 0.1;
                const purlinGap = calculatedGap > 1.52
                    ? calculatedGap
                    : 1.52;

                for (
                    let purlinIndex = 0;
                    purlinIndex < purlinCount;
                    purlinIndex++
                ) {
                    const isFirst = purlinIndex === 0;
                    const isLast = purlinIndex === purlinCount - 1;
                    const distance = purlinGap * purlinIndex;
                    const purlinHeight = (distance - 0.1)
                        * Math.sin(roofInclineRad);
                    const purlinBase = isFirst
                        ? 0
                        : Math.sqrt(
                            Math.max(
                                0,
                                Math.pow(distance, 2)
                                - Math.pow(purlinHeight, 2)
                            )
                        );
                    const horizontalOffset = isFirst
                        ? 0
                        : isLast
                            ? base - 0.1
                            : purlinBase - 0.1;
                    const verticalOffset = isFirst
                        ? 0
                        : isLast
                            ? height
                            : purlinHeight;
                    const purlinBounds = isDescending
                        ? spansLeftBounds!
                        : spansRightBounds;
                    const isFirstSpan = beamIndex === 0
                        || Boolean(
                            spansLeft && beamIndex === lastBeamIndex
                        );
                    let purlinPosition = beamPosition + horizontalOffset;
                    let purlinVerticalPosition = beamHeight
                        + (isDescending ? -verticalOffset : verticalOffset)
                        - purlinOffset;

                    if (!isFirstSpan && (isFirst || isLast)) {
                        const supportPillarIndex = isFirst
                            ? beamIndex
                            : beamIndex + 1;
                        const supportPillarPosition =
                            pillarsHeight[supportPillarIndex].position!
                            - (width / 2);
                        const pillarMin =
                            supportPillarPosition - pillarHalfWidth;
                        const pillarMax =
                            supportPillarPosition + pillarHalfWidth;
                        const purlinMin =
                            purlinPosition + purlinBounds.min.x;
                        const purlinMax =
                            purlinPosition + purlinBounds.max.x;
                        const intersectsPillar =
                            purlinMin < pillarMax
                            && purlinMax > pillarMin;

                        if (intersectsPillar) {
                            const adjacentPosition = isFirst
                                ? pillarMax + clearance - purlinBounds.min.x
                                : pillarMin - clearance - purlinBounds.max.x;
                            const horizontalShift =
                                adjacentPosition - purlinPosition;

                            purlinPosition = adjacentPosition;
                            purlinVerticalPosition += horizontalShift
                                * Math.tan(roofInclineRad)
                                * (isDescending ? -1 : 1);
                        }
                    }

                    mesh.scale.set(1, 1, length + 1);
                    mesh.position.set(
                        purlinPosition,
                        purlinVerticalPosition,
                        -length / 2
                    );
                    mesh.rotation.set(
                        0,
                        Math.PI,
                        isDescending ? roofInclineRad : -roofInclineRad
                    );
                    mesh.updateMatrix();
                    const targetRef = isDescending
                        ? spansLeftRef
                        : spansRightRef;
                    const targetIndex = isDescending
                        ? spansLeftInstanceIndex
                        : spansRightInstanceIndex;
                    (targetRef.current as InstancedMesh).setMatrixAt(
                        targetIndex,
                        mesh.matrix
                    );

                    if (isDescending) {
                        spansLeftInstanceIndex++;
                    } else {
                        spansRightInstanceIndex++;
                    }
                }
            }

            (spansRightRef.current as InstancedMesh)
                .instanceMatrix.needsUpdate = true;
            if (spansLeftRef.current) {
                (spansLeftRef.current as InstancedMesh)
                    .instanceMatrix.needsUpdate = true;
            }
            // The geometry is initialized once for this instanced mesh.
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);

        return(
            <>
                <instancedUniformsMesh
                    ref={spansRightRef}
                    args={[
                        spansRightGeometry,
                        material,
                        spansRightPurlins
                    ]}
                />
                {spansLeft && (
                    <instancedUniformsMesh
                        ref={spansLeftRef}
                        args={[
                            spansLeftGeometry,
                            material,
                            spansLeftPurlins
                        ]}
                    />
                )}
            </>
        )
    }

    // eslint-disable-next-line react-hooks/static-components
    return <PURLINS/>
}

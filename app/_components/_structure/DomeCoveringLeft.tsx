import React, {useLayoutEffect, useRef} from "react";
import * as THREE from "three";
import {InstancedMesh} from "three";
import {useMeasurementsStore} from "@/app/_stores/measurements";
import {State} from "@/app/_types/State";
import {getDefinedValues} from "@/app/_utils/getDefinedValues";

export default function DomeCoveringLeft({material} : {material : THREE.Material}) {
    const baseModel = useMeasurementsStore((state: State) => state.geometry);
    const coveringType = useMeasurementsStore((state: State) => state.coveringType.type);
    const domeWidth = useMeasurementsStore((state: State) => state.domeWidth);
    const eavesHeight = useMeasurementsStore((state: State) => state.eavesHeight);
    const roofIncline = useMeasurementsStore((state: State) => state.roofIncline);
    const beamMaxHeight = useMeasurementsStore((state: State) => state.beamMaxHeight);
    const length = useMeasurementsStore((state: State) => state.length);
    const domeHeight = useMeasurementsStore((state: State) => state.domeHeight);
    const secondHeightOffset = useMeasurementsStore((state: State) => state.secondHeightOffset);

    const coveringRef = useRef<InstancedMesh|null>(null);
    const supCoveringRef = useRef<InstancedMesh|null>(null);
    const fcCovering = coveringType === 'FC'
        ? baseModel?.domeCoveringFCLeft
        : undefined;
    const fcCoveringMesh = fcCovering?.children[0] as THREE.Mesh | undefined;
    const supCoveringMesh = fcCovering?.children[1] as THREE.Mesh | undefined;
    const coveringGeometry = coveringType === 'L'
        ? baseModel?.domeCoveringLamLeft
        : coveringType === 'FC'
            ? fcCoveringMesh?.geometry
            : baseModel?.domeCoveringLeft;
    const supCoveringGeometry = supCoveringMesh?.geometry;
    const requiredValues = getDefinedValues({
        domeWidth,
        eavesHeight,
        roofInclineRad: roofIncline.rad,
        length,
        beamMaxHeight,
        domeHeight
    });

    if (
        !requiredValues
        || !coveringGeometry
        || (coveringType === 'FC' && !supCoveringGeometry)
    ) {
        return null;
    }

    const DOMECOVERINGLEFT = () => {
        const {domeWidth, length} = requiredValues;
        const activeCoveringLength = domeWidth / 2 + 0.2;
        const xCount = coveringType === 'FC'
            ? Math.max(1, Math.floor(activeCoveringLength))
            : 1;
        const zCount = Math.floor(length) + 1;
        const count = xCount * zCount;

        useLayoutEffect(() => {
            if (
                !coveringRef.current
                || (supCoveringGeometry && !supCoveringRef.current)
            ) {
                return;
            }

            const {domeWidth, eavesHeight, roofInclineRad, beamMaxHeight, domeHeight} = requiredValues;
            const mesh = new THREE.Object3D();
            const maxPurlinB = (domeWidth / 2) * Math.sin(roofInclineRad);
            const maxPurlinH = (domeWidth / 2 + 0.2) * Math.sin(roofInclineRad);
            const instances = [
                coveringRef.current,
                supCoveringRef.current
            ].filter((instance): instance is InstancedMesh => instance !== null);

            instances.forEach((instance) => {
                instance.geometry.computeBoundingBox();
                const shift = instance.geometry.boundingBox!.min.x;
                instance.geometry.translate(-shift, 0, 0);
                instance.geometry.attributes.position.needsUpdate = true;
            });

            for (let i = 0; i < count; i++) {
                const xIndex = i % xCount;
                const zIndex = Math.floor(i / xCount);

                mesh.scale.x = coveringType === 'FC'
                    ? 1
                    : activeCoveringLength;
                mesh.position.set(
                    0.2,
                    eavesHeight
                        + secondHeightOffset
                        + beamMaxHeight
                        + domeHeight
                        + (maxPurlinH - maxPurlinB)
                        + 0.25,
                    -zIndex
                );
                mesh.rotation.set(0, Math.PI, -roofInclineRad);
                mesh.translateX(xIndex);
                mesh.updateMatrix();
                instances.forEach((instance) => {
                    instance.setMatrixAt(i, mesh.matrix);
                });
            }

            instances.forEach((instance) => {
                instance.instanceMatrix.needsUpdate = true;
            });
        }, [activeCoveringLength, count, xCount]);

        return (
            <>
                {supCoveringGeometry &&
                    <instancedUniformsMesh
                        ref={supCoveringRef}
                        args={[supCoveringGeometry, material, count]}>
                    </instancedUniformsMesh>
                }
                <instancedUniformsMesh
                    ref={coveringRef}
                    args={[coveringGeometry, material, count]}>
                </instancedUniformsMesh>
            </>
        )
    }

    // eslint-disable-next-line react-hooks/static-components
    return <DOMECOVERINGLEFT/>
}

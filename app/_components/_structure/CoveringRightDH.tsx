import React, {useLayoutEffect, useRef} from "react";
import * as THREE from "three";
import {InstancedMesh} from "three";
import {useMeasurementsStore} from "@/app/_stores/measurements";
import {State} from "@/app/_types/State";
import {getDefinedValues} from "@/app/_utils/getDefinedValues";

export default function CoveringRightDH({material} : {material : THREE.Material}) {
    const baseModel = useMeasurementsStore((state: State) => state.geometry);
    const coveringType = useMeasurementsStore((state: State) => state.coveringType.type);
    const pillars = useMeasurementsStore((state: State) => state.pillars);
    const pitches = useMeasurementsStore((state: State) => state.pitches);
    const coveringLengthDH = useMeasurementsStore((state: State) => state.coveringLengthDH);
    const eavesHeight = useMeasurementsStore((state: State) => state.eavesHeight);
    const roofIncline = useMeasurementsStore((state: State) => state.roofIncline);
    const width = useMeasurementsStore((state: State) => state.width);
    const length = useMeasurementsStore((state: State) => state.length);
    const purlinType = useMeasurementsStore((state: State) => state.purlinType);

    const coveringRef = useRef<InstancedMesh|null>(null);
    const supCoveringRef = useRef<InstancedMesh|null>(null);
    const fcCovering = coveringType === 'FC'
        ? baseModel?.coveringFCRight
        : undefined;
    const fcCoveringMesh = fcCovering?.children[0] as THREE.Mesh | undefined;
    const supCoveringMesh = fcCovering?.children[1] as THREE.Mesh | undefined;
    const coveringGeometry = coveringType === 'L'
        ? baseModel?.coveringLamRight
        : coveringType === 'FC'
            ? fcCoveringMesh?.geometry
            : baseModel?.coveringRight;
    const supCoveringGeometry = supCoveringMesh?.geometry;
    const requiredValues = getDefinedValues({
        coveringLengthDH,
        eavesHeight,
        roofInclineRad: roofIncline.rad,
        width,
        length,
        pillars
    });

    if (
        !requiredValues
        || !coveringGeometry
        || (coveringType === 'FC' && !supCoveringGeometry)
        || (requiredValues.pillars < 3 && pitches?.includes('M'))
    ) {
        return null;
    }

    const COVERINGRIGHT = () => {
        const {coveringLengthDH, length} = requiredValues;
        const xCount = coveringType === 'FC'
            ? Math.max(1, Math.floor(coveringLengthDH))
            : 1;
        const zCount = Math.floor(length) + 1;
        const count = xCount * zCount;

        useLayoutEffect(() => {
            const purlinOffset = purlinType === 'light' ? 0.18 : 0;
            if (
                !coveringRef.current
                || (supCoveringGeometry && !supCoveringRef.current)
            ) {
                return;
            }

            const {coveringLengthDH, eavesHeight, roofInclineRad, width, pillars} = requiredValues;
            const mesh = new THREE.Object3D();
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
                    : pillars === 1 && pitches === 'D'
                        ? coveringLengthDH + 1
                        : coveringLengthDH;
                mesh.position.set(width / 2, eavesHeight - purlinOffset, -zIndex);
                mesh.rotation.set(0, Math.PI, roofInclineRad);
                mesh.translateX(xIndex);
                mesh.updateMatrix();
                instances.forEach((instance) => {
                    instance.setMatrixAt(i, mesh.matrix);
                });
            }

            instances.forEach((instance) => {
                instance.instanceMatrix.needsUpdate = true;
            });
        }, [count, xCount])

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
    return <COVERINGRIGHT/>
}

import React, {useLayoutEffect, useRef} from "react";
import * as THREE from "three";
import {InstancedMesh} from "three";
import {useMeasurementsStore} from "@/app/_stores/measurements";
import {State} from "@/app/_types/State";
import {getDefinedValues} from "@/app/_utils/getDefinedValues";

export default function CoveringLeftDH({material} : {material : THREE.Material}) {
    const baseModel = useMeasurementsStore((state: State) => state.geometry);
    const pillars = useMeasurementsStore((state: State) => state.pillars);
    const pitches = useMeasurementsStore((state: State) => state.pitches);
    const coveringLengthDH = useMeasurementsStore((state: State) => state.coveringLengthDH);
    const eavesHeight = useMeasurementsStore((state: State) => state.eavesHeight);
    const roofIncline = useMeasurementsStore((state: State) => state.roofIncline);
    const width = useMeasurementsStore((state: State) => state.width);
    const length = useMeasurementsStore((state: State) => state.length);
    const secondCoveringLength = useMeasurementsStore((state: State) => state.secondCoveringLength);
    const secondRoofIncline = useMeasurementsStore((state: State) => state.secondRoofIncline);
    const purlinType = useMeasurementsStore((state: State) => state.purlinType);
    const interaxleWidth = useMeasurementsStore((state: State) => state.interaxleWidth);

    const ref = useRef<THREE.Mesh|null>(null);
    const coveringGeometry = baseModel?.coveringLeft;
    const secondRoofValues = getDefinedValues({
        secondCoveringLength,
        eavesHeight,
        secondRoofInclineRad: secondRoofIncline.rad,
        width,
        length
    });
    const primaryRoofValues = getDefinedValues({
        coveringLengthDH,
        eavesHeight,
        roofInclineRad: roofIncline.rad,
        width,
        length,
        pillars
    });
    const requiredValues = secondRoofValues ?? primaryRoofValues;

    if (!requiredValues) return null;

    const COVERINGLEFT = () => {
        const {length} = requiredValues;

        useLayoutEffect(() => {
            const purlinOffset = purlinType === 'light' ? 0.18 : 0;
            if (!ref.current) return;

            if (secondRoofValues) {
                const {secondCoveringLength, eavesHeight, secondRoofInclineRad, width, length} = secondRoofValues;
                const mesh = new THREE.Object3D();

                for (let i = 0; i < length + 1; i++) {
                    mesh.scale.x = secondCoveringLength;
                    const shift = ref.current.geometry.boundingBox!.max.x;
                    ref.current.geometry.translate(-shift, 0, 0);
                    mesh.position.set(-width / 2, eavesHeight - purlinOffset, i === 0 ? 0 : (-i));
                    mesh.rotation.set(0, Math.PI, -secondRoofInclineRad)
                    ref.current.geometry.attributes.position.needsUpdate = true;
                    mesh.updateMatrix();
                    (ref.current as InstancedMesh).setMatrixAt(i, mesh.matrix);
                }

                return;
            }

            if (primaryRoofValues) {
                const {coveringLengthDH, eavesHeight, roofInclineRad, width, length, pillars} = primaryRoofValues;
                const mesh = new THREE.Object3D();

                for (let i = 0; i < length + 1; i++) {
                    mesh.scale.x = pillars === 1 && pitches === 'D' ? coveringLengthDH + 1 : coveringLengthDH;
                    const shift = ref.current.geometry.boundingBox!.max.x;
                    ref.current.geometry.translate(-shift, 0, 0);
                    mesh.position.set(-(width / 2), eavesHeight - purlinOffset, i === 0 ? 0 : (-i));
                    mesh.rotation.set(0, Math.PI, -roofInclineRad)
                    ref.current.geometry.attributes.position.needsUpdate = true;
                    mesh.updateMatrix();
                    (ref.current as InstancedMesh).setMatrixAt(i, mesh.matrix);
                }
            }
        }, [])

        return (
            <instancedUniformsMesh ref={ref} args={[coveringGeometry, material, length + 1]}></instancedUniformsMesh>
        )
    }

    // eslint-disable-next-line react-hooks/static-components
    return <COVERINGLEFT/>
}

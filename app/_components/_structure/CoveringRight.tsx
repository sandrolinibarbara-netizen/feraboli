import React, {useLayoutEffect, useRef} from "react";
import * as THREE from "three";
import {InstancedMesh} from "three";
import {useMeasurementsStore} from "@/app/_stores/measurements";
import {State} from "@/app/_types/State";
import {getDefinedValues} from "@/app/_utils/getDefinedValues";

export default function CoveringRight({material} : {material : THREE.Material}) {
    const baseModel = useMeasurementsStore((state: State) => state.geometry);
    const coveringType = useMeasurementsStore((state: State) => state.coveringType.type);
    const pillars = useMeasurementsStore((state: State) => state.pillars);
    const pitches = useMeasurementsStore((state: State) => state.pitches);
    const coveringLength = useMeasurementsStore((state: State) => state.coveringLength);
    const eavesHeight = useMeasurementsStore((state: State) => state.eavesHeight);
    const roofIncline = useMeasurementsStore((state: State) => state.roofIncline);
    const width = useMeasurementsStore((state: State) => state.width);
    const length = useMeasurementsStore((state: State) => state.length);
    const purlinType = useMeasurementsStore((state: State) => state.purlinType);
    const interaxleWidth = useMeasurementsStore((state: State) => state.interaxleWidth);
    const secondHeightOffset = useMeasurementsStore((state: State) => state.secondHeightOffset);

    const ref = useRef<THREE.Mesh|null>(null);
    const coveringGeometry = coveringType === 'L'
        ? baseModel?.coveringLamRight
        : baseModel?.coveringRight;
    const requiredValues = getDefinedValues({
        coveringLength,
        eavesHeight,
        roofInclineRad: roofIncline.rad,
        width,
        length,
        pillars
    });

    if (!requiredValues || (requiredValues.pillars < 3 && pitches?.includes('M'))) {
        return null;
    }

    const COVERINGRIGHT = () => {
        useLayoutEffect(() => {
            const purlinOffset = purlinType === 'light' ? 0.18 : 0;
            if (!ref.current) return;

            const {coveringLength, eavesHeight, roofInclineRad, width, length, pillars} = requiredValues;
            const mesh = new THREE.Object3D();
            const beamPosition = (interaxleWidth && pillars > 3 && pitches === 'DH')
                ? (interaxleWidth / 2) + 0.5
                : (width / 2)

            for (let i = 0; i < length + 1; i++) {
                mesh.scale.x = pillars === 1 && pitches === 'D' ? coveringLength + 1 : coveringLength;
                const shift = ref.current.geometry.boundingBox!.min.x;
                ref.current.geometry.translate(-shift, 0, 0);
                mesh.position.set(beamPosition, eavesHeight - purlinOffset + secondHeightOffset, i === 0 ? 0 : (-i));
                mesh.rotation.set(0, Math.PI, roofInclineRad)
                ref.current.geometry.attributes.position.needsUpdate = true;
                mesh.updateMatrix();
                (ref.current as InstancedMesh).setMatrixAt(i, mesh.matrix);
            }
        }, [])

        return (
            <instancedUniformsMesh ref={ref} args={[coveringGeometry, material, requiredValues.length + 1]}></instancedUniformsMesh>
        )
    }

    // eslint-disable-next-line react-hooks/static-components
    return <COVERINGRIGHT/>
}

import React, {useLayoutEffect, useRef} from "react";
import * as THREE from "three";
import {InstancedMesh} from "three";
import {useMeasurementsStore} from "@/app/_stores/measurements";
import {State} from "@/app/_types/State";
import {getDefinedValues} from "@/app/_utils/getDefinedValues";

export default function PurlinsOmegaRightDH({material} : {material : THREE.Material}) {
    const baseModel = useMeasurementsStore((state: State) => state.geometry);
    const pillars = useMeasurementsStore((state: State) => state.pillars);
    const pitches = useMeasurementsStore((state: State) => state.pitches);
    const halfPurlinsDH = useMeasurementsStore((state: State) => state.halfPurlinsDH);
    const eavesHeight = useMeasurementsStore((state: State) => state.eavesHeight);
    const roofIncline = useMeasurementsStore((state: State) => state.roofIncline);
    const width = useMeasurementsStore((state: State) => state.width);
    const length = useMeasurementsStore((state: State) => state.length);
    const coveringLengthDH = useMeasurementsStore((state: State) => state.coveringLengthDH);
    const purlinType = useMeasurementsStore((state: State) => state.purlinType);

    const ref = useRef<THREE.Mesh|null>(null);
    const purlinGeometry = baseModel?.purlinsOmega;
    const requiredValues = getDefinedValues({
        halfPurlinsDH,
        eavesHeight,
        coveringLengthDH,
        roofInclineRad: roofIncline.rad,
        width,
        length,
        pillars
    });

    if (!requiredValues || (requiredValues.pillars < 3 && pitches?.includes('M'))) {
        return null;
    }

    const PURLINRIGHT = () => {
        useLayoutEffect(() => {
            if (!ref.current) return;

            const {halfPurlinsDH, eavesHeight, coveringLengthDH, roofInclineRad, width, length} = requiredValues;
            const mesh = new THREE.Object3D();


            const base = coveringLengthDH * Math.cos(roofInclineRad);
            const height = coveringLengthDH * Math.sin(roofInclineRad);
            const purlinGap = ((coveringLengthDH / halfPurlinsDH) + 0.1) > 1.52
                ? ((coveringLengthDH / halfPurlinsDH) + 0.1)
                : 1.52;
            const purlinOffset = purlinType === 'light' ? 0.21 : 0;

            for(let i = 0; i < halfPurlinsDH; i++) {
                const h = ((purlinGap * i) + 0.1) * Math.sin(roofInclineRad);
                const b = Math.sqrt(Math.pow((purlinGap * i), 2) - Math.pow(h, 2))
                const purlinHeight = i === halfPurlinsDH - 1
                                                    ? eavesHeight + height - purlinOffset - (0.308 * Math.sin(roofInclineRad))
                                                    : eavesHeight + h - purlinOffset;

                const purlinPos = i === 0
                    ? (width / 2) - 0.1
                    : i === halfPurlinsDH - 1
                            ? (width / 2) - base + 0.308
                            : (width / 2) - 0.1 - b;

                mesh.scale.z = length + 1;
                const shift =  ref.current.geometry.boundingBox!.max.x;
                ref.current.geometry.translate(-shift, 0, 0);
                mesh.position.set(purlinPos, purlinHeight, -length / 2);
                mesh.rotation.set(0, 0, -roofInclineRad)
                ref.current.geometry.attributes.position.needsUpdate = true;
                mesh.updateMatrix();
                (ref.current as InstancedMesh).setMatrixAt(i, mesh.matrix);
            }
        }, []);

        return(
            <instancedUniformsMesh ref={ref} args={[purlinGeometry, material, requiredValues.halfPurlinsDH]}></instancedUniformsMesh>
        )
    }

    // eslint-disable-next-line react-hooks/static-components
    return <PURLINRIGHT/>

}

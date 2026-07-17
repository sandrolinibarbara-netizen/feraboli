import React, {useLayoutEffect, useRef} from "react";
import * as THREE from "three";
import {InstancedMesh} from "three";
import {useMeasurementsStore} from "@/app/_stores/measurements";
import {State} from "@/app/_types/State";
import {getDefinedValues} from "@/app/_utils/getDefinedValues";

export default function DomeCoveringLeft({material} : {material : THREE.Material}) {
    const baseModel = useMeasurementsStore((state: State) => state.geometry);
    const domeWidth = useMeasurementsStore((state: State) => state.domeWidth);
    const eavesHeight = useMeasurementsStore((state: State) => state.eavesHeight);
    const roofIncline = useMeasurementsStore((state: State) => state.roofIncline);
    const beamMaxHeight = useMeasurementsStore((state: State) => state.beamMaxHeight);
    const length = useMeasurementsStore((state: State) => state.length);
    const domeHeight = useMeasurementsStore((state: State) => state.domeHeight);
    const secondHeightOffset = useMeasurementsStore((state: State) => state.secondHeightOffset);

    const ref = useRef<THREE.Mesh|null>(null);
    const coveringGeometry = baseModel?.domeCoveringLeft;
    const requiredValues = getDefinedValues({
        domeWidth,
        eavesHeight,
        roofInclineRad: roofIncline.rad,
        length,
        beamMaxHeight,
        domeHeight
    });

    if (!requiredValues) return null;

    const DOMECOVERINGLEFT = () => {
        useLayoutEffect(() => {
            if (!ref.current) return;

            const {domeWidth, eavesHeight, roofInclineRad, length, beamMaxHeight, domeHeight} = requiredValues;
            const mesh = new THREE.Object3D();
            const maxPurlinB = (domeWidth / 2) * Math.sin(roofInclineRad);
            const maxPurlinH = (domeWidth / 2 + 0.2) * Math.sin(roofInclineRad);

            for (let i = 0; i < length + 1; i++) {
                mesh.scale.x = domeWidth / 2 + 0.2;
                const shift = ref.current.geometry.boundingBox!.min.x;
                ref.current.geometry.translate(-shift, 0, 0);
                mesh.position.set(0.2, eavesHeight + secondHeightOffset + beamMaxHeight + domeHeight + (maxPurlinH - maxPurlinB) + 0.25, i === 0 ? 0 : (-i));
                mesh.rotation.set(0, Math.PI, -roofInclineRad)
                ref.current.geometry.attributes.position.needsUpdate = true;
                mesh.updateMatrix();
                (ref.current as InstancedMesh).setMatrixAt(i, mesh.matrix);
            }
        }, []);

        return (
            <instancedUniformsMesh ref={ref} args={[coveringGeometry, material, requiredValues.length + 1]}></instancedUniformsMesh>
        )
    }

    // eslint-disable-next-line react-hooks/static-components
    return <DOMECOVERINGLEFT/>
}

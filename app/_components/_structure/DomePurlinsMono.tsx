import React, {useLayoutEffect, useRef} from "react";
import * as THREE from "three";
import {InstancedMesh} from "three";
import {useMeasurementsStore} from "@/app/_stores/measurements";
import {State} from "@/app/_types/State";
import {getDefinedValues} from "@/app/_utils/getDefinedValues";

export default function DomePurlinsMono({material} : {material : THREE.Material}) {
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

    const ref = useRef<THREE.Mesh|null>(null);
    const purlinGeometry = baseModel?.domePurlinsLeft;
    const requiredValues = getDefinedValues({
        domeWidth,
        eavesHeight,
        roofInclineRad: roofIncline.rad,
        length,
        beamMaxHeight,
        domeHeight,
        purlinNumber
    });

    if (!requiredValues) return null;

    const DOMEPURLINSLEFT = () => {
        useLayoutEffect(() => {
            if (!ref.current) return;

            const {domeWidth, eavesHeight, roofInclineRad, length, beamMaxHeight, domeHeight, purlinNumber} = requiredValues;
            const mesh = new THREE.Object3D();
            const purlinGap = domeWidth / 4;

            for (let i = 0; i < purlinNumber; i++) {

                const ip = i === purlinNumber - 1
                                ? (domeWidth / 2) / Math.cos(roofInclineRad)
                                : i === 0
                                    ? (domeWidth / 2 - 0.1) / Math.cos(roofInclineRad)
                                    : (domeWidth / 4) / Math.cos(roofInclineRad);
                const hToAdd = (purlinNumber === 5 && i === 2) || (purlinNumber === 3 && i === 1) ? 0 : ip * Math.sin(roofInclineRad);

                const purlinHeight = i === purlinNumber-1 || (purlinNumber === 5 && i === 3)
                                            ? eavesHeight + secondHeightOffset + beamMaxHeight + 0.25 + domeHeight + hToAdd
                                            : eavesHeight + secondHeightOffset + beamMaxHeight + 0.25 + domeHeight - hToAdd;

                // const b = Math.sqrt(Math.pow((domeWidth / 2), 2) - Math.pow(maxPurlinH, 2));
                const pPos = i === purlinNumber-1
                                    ? domeWidth / 2
                                    : (purlinNumber === 5 && i === 2) || (purlinNumber === 3 && i === 1)
                                        ? 0
                                        : (purlinNumber === 5 && i === 3)
                                            ? (domeWidth / 2) - purlinGap
                                            : (purlinNumber === 5 && i === 1)
                                                ? -(domeWidth / 2) + purlinGap
                                                : -(domeWidth / 2 - 0.1);
                mesh.scale.z = length + 1;
                const shift = ref.current.geometry.boundingBox!.min.x;
                ref.current.geometry.translate(-shift, 0, 0);
                mesh.position.set(pPos, purlinHeight, -length / 2);
                mesh.rotation.set(0, Math.PI, -roofInclineRad);
                ref.current.geometry.attributes.position.needsUpdate = true;
                mesh.updateMatrix();
                (ref.current as InstancedMesh).setMatrixAt(i, mesh.matrix);
            }
        }, []);

        return (
            <instancedUniformsMesh ref={ref}
                                   args={[purlinGeometry, material, requiredValues.purlinNumber]}></instancedUniformsMesh>
        )
    }

    // eslint-disable-next-line react-hooks/static-components
    return <DOMEPURLINSLEFT/>
}

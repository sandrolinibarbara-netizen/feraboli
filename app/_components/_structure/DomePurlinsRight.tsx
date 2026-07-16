import React, {useLayoutEffect, useRef} from "react";
import * as THREE from "three";
import {InstancedMesh} from "three";
import {useMeasurementsStore} from "@/app/_stores/measurements";
import {State} from "@/app/_types/State";

export default function DomePurlinsRight({material} : {material : THREE.Material}) {
    const baseModel = useMeasurementsStore((state: State) => state.geometry);
    const domeWidth = useMeasurementsStore((state: State) => state.domeWidth);
    const eavesHeight = useMeasurementsStore((state: State) => state.eavesHeight);
    const roofIncline = useMeasurementsStore((state: State) => state.roofIncline);
    const beamMaxHeight = useMeasurementsStore((state: State) => state.beamMaxHeight);
    const width = useMeasurementsStore((state: State) => state.width);
    const length = useMeasurementsStore((state: State) => state.length);
    const domeHeight = useMeasurementsStore((state: State) => state.domeHeight);

    const purlinNumber = width
        ? (width >= 35 ? 2 : 1)
        : undefined;

    const ref = useRef<THREE.Mesh|null>(null);
    const purlinGeometry = baseModel?.domePurlinsRight;

    const DOMEPURLINSRIGHT = () => {
        useLayoutEffect(() => {
            if (ref.current && domeWidth && eavesHeight && roofIncline.percentage && length && beamMaxHeight && domeHeight && purlinNumber) {
                const mesh = new THREE.Object3D();

                for (let i = 0; i < purlinNumber; i++) {
                    const smallB = i === 1 ? (domeWidth/4) : 0;
                    const h = smallB * Math.sin(roofIncline.rad!);
                    const maxPurlinH = ((domeWidth / 2)) * Math.sin(roofIncline.rad!);
                    const purlinHeight = eavesHeight + beamMaxHeight + 0.25 + (domeHeight - maxPurlinH) + h;

                    const b = Math.sqrt(Math.pow((domeWidth / 2), 2) - Math.pow(maxPurlinH, 2));
                    const pPos = i === 1 ? b/2 : b;
                    mesh.scale.z = length + 1;
                    const shift = ref.current.geometry.boundingBox!.min.x;
                    ref.current.geometry.translate(-shift, 0, 0);
                    mesh.position.set(pPos, purlinHeight, -length / 2);
                    mesh.rotation.set(0, Math.PI, roofIncline.rad!);
                    ref.current.geometry.attributes.position.needsUpdate = true;
                    mesh.updateMatrix();
                    (ref.current as InstancedMesh).setMatrixAt(i, mesh.matrix);
                }
            }
        }, []);

        if (!domeWidth || !eavesHeight || !roofIncline.percentage || !length || !beamMaxHeight || !domeHeight) {
            return <></>
        }

        return (
            <instancedUniformsMesh ref={ref}
                                   args={[purlinGeometry, material, purlinNumber]}></instancedUniformsMesh>
        )
    }

    // eslint-disable-next-line react-hooks/static-components
    return <DOMEPURLINSRIGHT/>
}
import React, {useLayoutEffect, useRef} from "react";
import * as THREE from "three";
import {InstancedMesh} from "three";
import {useMeasurementsStore} from "@/app/_stores/measurements";
import {State} from "@/app/_types/State";

export default function DomePurlinsLeft({material} : {material : THREE.Material}) {
    const baseModel = useMeasurementsStore((state: State) => state.geometry);
    const domeWidth = useMeasurementsStore((state: State) => state.domeWidth);
    const eavesHeight = useMeasurementsStore((state: State) => state.eavesHeight);
    const roofIncline = useMeasurementsStore((state: State) => state.roofIncline);
    const beamMaxHeight = useMeasurementsStore((state: State) => state.beamMaxHeight);
    const length = useMeasurementsStore((state: State) => state.length);
    const domeHeight = useMeasurementsStore((state: State) => state.domeHeight);

    const ref = useRef<THREE.Mesh|null>(null);
    const purlinGeometry = baseModel?.domePurlinsLeft;

    const DOMEPURLINSLEFT = () => {
        useLayoutEffect(() => {
            if (ref.current && domeWidth && eavesHeight && roofIncline.percentage && length && beamMaxHeight && domeHeight) {
                const mesh = new THREE.Object3D();
                const p = Math.floor((domeWidth / 2) / 0.5);
                for (let i = 0; i < p; i++) {
                    const h = ((0.5 * i) + 0.1) * Math.sin(roofIncline.rad!);
                    const maxPurlinH = (domeWidth / 2) * Math.sin(roofIncline.rad!);
                    const purlinHeight = eavesHeight + beamMaxHeight + 0.25 + (domeHeight - maxPurlinH) + h;


                    const b = Math.sqrt(Math.pow((domeWidth / 2), 2) - Math.pow(maxPurlinH, 2));
                    mesh.scale.z = length + 1;
                    const shift = ref.current.geometry.boundingBox!.min.x;
                    ref.current.geometry.translate(-shift, 0, 0);
                    mesh.position.set(-b + (i * 0.5) + 0.1, purlinHeight, -length / 2);
                    mesh.rotation.set(0, Math.PI, -roofIncline.rad!);
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
                                   args={[purlinGeometry, material, Math.floor((domeWidth / 2) / 0.5)]}></instancedUniformsMesh>
        )
    }

    // eslint-disable-next-line react-hooks/static-components
    return <DOMEPURLINSLEFT/>
}
import React, {useLayoutEffect, useRef} from "react";
import * as THREE from "three";
import {InstancedMesh} from "three";
import {useMeasurementsStore} from "@/app/_stores/measurements";
import {State} from "@/app/_types/State";

export default function PurlinsRight({material} : {material : THREE.Material}) {
    const baseModel = useMeasurementsStore((state: State) => state.geometry);
    const pillars = useMeasurementsStore((state: State) => state.pillars);
    const pitches = useMeasurementsStore((state: State) => state.pitches);
    const halfPurlins = useMeasurementsStore((state: State) => state.halfPurlins);
    const eavesHeight = useMeasurementsStore((state: State) => state.eavesHeight);
    const roofIncline = useMeasurementsStore((state: State) => state.roofIncline);
    const width = useMeasurementsStore((state: State) => state.width);
    const length = useMeasurementsStore((state: State) => state.length);
    const coveringLength = useMeasurementsStore((state: State) => state.coveringLength);

    const ref = useRef<THREE.Mesh|null>(null);
    const purlinGeometry = baseModel?.purlinsRight;

    const PURLINRIGHT = () => {

        useLayoutEffect(() => {
            if(ref.current && halfPurlins && eavesHeight && coveringLength && roofIncline.percentage && width && length) {

                const mesh = new THREE.Object3D();
                const base = coveringLength * Math.cos(roofIncline.rad!);
                const height = (coveringLength) * Math.sin(roofIncline.rad!);
                const purlinGap = (((coveringLength) / halfPurlins) + 0.1) > 1.52
                    ? (((coveringLength) / halfPurlins) + 0.1)
                    : 1.52;

                for(let i = 0; i < halfPurlins; i++) {
                    const h = ((purlinGap * i) + 0.1) * Math.sin(roofIncline.rad!);
                    const b = Math.sqrt(Math.pow((purlinGap * i), 2) - Math.pow(h, 2))
                    const purlinHeight = i === halfPurlins - 1
                                                        ? eavesHeight + height
                                                        : eavesHeight + h;

                    const purlinPos = i === 0
                        ? (width / 2) - 0.1
                        : i === halfPurlins - 1
                                ? (width / 2) - base
                                : (width / 2) - 0.1 - b;

                    mesh.scale.z = length + 1;
                    const shift =  ref.current.geometry.boundingBox!.max.x;
                    ref.current.geometry.translate(-shift, 0, 0);
                    mesh.position.set(purlinPos, purlinHeight, -length / 2);
                    mesh.rotation.set(0, Math.PI, roofIncline.rad!)
                    ref.current.geometry.attributes.position.needsUpdate = true;
                    mesh.updateMatrix();
                    (ref.current as InstancedMesh).setMatrixAt(i, mesh.matrix);
                }
            }
        }, []);

        if(!halfPurlins || !eavesHeight || !roofIncline.percentage || !width || !length || (pillars && pillars < 3 && pitches?.includes('M'))) {
            return <></>
        }

        return(
            <instancedUniformsMesh ref={ref} args={[purlinGeometry, material, halfPurlins]}></instancedUniformsMesh>
        )
    }

    // eslint-disable-next-line react-hooks/static-components
    return <PURLINRIGHT/>

}
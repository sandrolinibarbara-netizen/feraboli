import React, {useLayoutEffect, useRef} from "react";
import * as THREE from "three";
import {InstancedMesh} from "three";
import {useMeasurementsStore} from "@/app/_stores/measurements";
import {State} from "@/app/_types/State";

export default function PurlinsLeft({material} : {material : THREE.Material}) {
    const baseModel = useMeasurementsStore((state: State) => state.geometry);
    const halfPurlins = useMeasurementsStore((state: State) => state.halfPurlins);
    const eavesHeight = useMeasurementsStore((state: State) => state.eavesHeight);
    const roofIncline = useMeasurementsStore((state: State) => state.roofIncline);
    const width = useMeasurementsStore((state: State) => state.width);
    const length = useMeasurementsStore((state: State) => state.length);
    const secondRoofIncline = useMeasurementsStore((state: State) => state.secondRoofIncline);

    const ref = useRef<THREE.Mesh|null>(null);
    const purlinGeometry = baseModel?.purlinsLeft;

    const PURLINLEFT = () => {
        useLayoutEffect(() => {
            if(ref.current && halfPurlins && eavesHeight && secondRoofIncline.percentage && width && length) {
                const mesh = new THREE.Object3D();

                for(let i = 0; i < halfPurlins; i++) {
                    const h = (((1 + 0.05) * i)) * Math.sin(secondRoofIncline.rad!);
                    const b = Math.sqrt(Math.pow(((1 + 0.05) * i), 2) - Math.pow(h, 2))
                    const purlinHeight = i === 0 ? eavesHeight : eavesHeight + h;

                    mesh.scale.z = length + 1;
                    const shift =  ref.current.geometry.boundingBox!.max.x;
                    ref.current.geometry.translate(-shift, 0, 0);
                    mesh.position.set(i === 0 ? - (width / 2) : b - (width / 2), purlinHeight, -length / 2);
                    mesh.rotation.set(0, Math.PI, -secondRoofIncline.rad!)
                    ref.current.geometry.attributes.position.needsUpdate = true;
                    mesh.updateMatrix();
                    (ref.current as InstancedMesh).setMatrixAt(i, mesh.matrix);
                }
            } else if(ref.current && halfPurlins && eavesHeight && roofIncline.percentage && width && length) {
                const mesh = new THREE.Object3D();

                for(let i = 0; i < halfPurlins; i++) {
                    const h = (((1 + 0.05) * i)) * Math.sin(roofIncline.rad!);
                    const b = Math.sqrt(Math.pow(((1 + 0.05) * i), 2) - Math.pow(h, 2))
                    const purlinHeight = i === 0 ? eavesHeight : eavesHeight + h;

                    mesh.scale.z = length + 1;
                    const shift =  ref.current.geometry.boundingBox!.max.x;
                    ref.current.geometry.translate(-shift, 0, 0);
                    mesh.position.set(i === 0 ? - (width / 2) : b - (width / 2), purlinHeight, -length / 2);
                    mesh.rotation.set(0, Math.PI, -roofIncline.rad!)
                    ref.current.geometry.attributes.position.needsUpdate = true;
                    mesh.updateMatrix();
                    (ref.current as InstancedMesh).setMatrixAt(i, mesh.matrix);
                }
            }
        }, []);

        if(!halfPurlins || !eavesHeight || !roofIncline.percentage || !width || !length) {
            return <></>
        }

        return(
            <instancedUniformsMesh ref={ref} args={[purlinGeometry, material, halfPurlins]}></instancedUniformsMesh>
        )
    }

    // eslint-disable-next-line react-hooks/static-components
    return <PURLINLEFT/>
}
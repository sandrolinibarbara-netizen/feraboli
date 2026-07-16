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
    const coveringLength = useMeasurementsStore((state: State) => state.coveringLength);
    const secondRoofIncline = useMeasurementsStore((state: State) => state.secondRoofIncline);
    const secondCoveringLength = useMeasurementsStore((state: State) => state.secondCoveringLength);
    const secondHalfPurlins = useMeasurementsStore((state: State) => state.secondHalfPurlins);
    const purlinType = useMeasurementsStore((state: State) => state.purlinType);


    const ref = useRef<THREE.Mesh|null>(null);
    const purlinGeometry = baseModel?.purlinsLeft;

    const PURLINLEFT = () => {
        const hP = secondHalfPurlins ? secondHalfPurlins : halfPurlins;
        useLayoutEffect(() => {
          if(ref.current && hP && eavesHeight && coveringLength && roofIncline.percentage && width && length) {
              const cL = secondCoveringLength ? secondCoveringLength : coveringLength;
              const rI = secondRoofIncline.percentage ? secondRoofIncline : roofIncline;

              const mesh = new THREE.Object3D();
              const base = cL * Math.cos(rI.rad!);
              const height = (cL - 0.1) * Math.sin(rI.rad!);
              const purlinGap = (((cL - 0.1) / hP) + 0.1) > 1.52
                                            ? (((cL - 0.1) / hP) + 0.1)
                                            : 1.52;
              const purlinOffset = purlinType === 'light' ? 0.21 : 0;

                for(let i = 0; i < hP; i++) {
                    const h = ((purlinGap * i) - 0.1) * Math.sin(rI.rad!);
                    const b = Math.sqrt(Math.pow((purlinGap * i), 2) - Math.pow(h, 2))
                    const purlinHeight = i === 0
                                                    ? eavesHeight - purlinOffset
                                                    : i === hP - 1 && secondCoveringLength
                                                        ? eavesHeight + height - 0.1 - purlinOffset
                                                        : i === hP - 1
                                                            ? eavesHeight + height - purlinOffset
                                                            : eavesHeight + h - purlinOffset;

                    const purlinPos = i === 0
                                                ? -(width / 2)
                                                : i === hP - 1 && secondCoveringLength
                                                    ? 0
                                                    : i === hP - 1
                                                        ? base - (width / 2) - 0.1
                                                        : b - (width / 2) - 0.1;

                    mesh.scale.z = length + 1;
                    const shift =  ref.current.geometry.boundingBox!.max.x;
                    ref.current.geometry.translate(-shift, 0, 0);
                    mesh.position.set(purlinPos, purlinHeight, -length / 2);
                    mesh.rotation.set(0, Math.PI, -rI.rad!)
                    ref.current.geometry.attributes.position.needsUpdate = true;
                    mesh.updateMatrix();
                    (ref.current as InstancedMesh).setMatrixAt(i, mesh.matrix);
                }
            }
        }, []);

        if(!hP || !eavesHeight || !roofIncline.percentage || !width || !length) {
            return <></>
        }

        return(
            <instancedUniformsMesh ref={ref} args={[purlinGeometry, material, hP]}></instancedUniformsMesh>
        )
    }

    // eslint-disable-next-line react-hooks/static-components
    return <PURLINLEFT/>
}
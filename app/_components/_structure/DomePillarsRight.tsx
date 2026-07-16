import React, {useLayoutEffect, useRef} from "react";
import * as THREE from "three";
import {InstancedMesh} from "three";
import {useMeasurementsStore} from "@/app/_stores/measurements";
import {State} from "@/app/_types/State";

export default function DomePillarsRight({material} : {material : THREE.Material}) {
    const baseModel = useMeasurementsStore((state: State) => state.geometry);
    const coveringLength = useMeasurementsStore((state: State) => state.coveringLength);
    const eavesHeight = useMeasurementsStore((state: State) => state.eavesHeight);
    const roofIncline = useMeasurementsStore((state: State) => state.roofIncline);
    const width = useMeasurementsStore((state: State) => state.width);
    const length = useMeasurementsStore((state: State) => state.length);
    const domeHeight = useMeasurementsStore((state: State) => state.domeHeight);
    const domeWidth = useMeasurementsStore((state: State) => state.domeWidth);
    const domeType = useMeasurementsStore((state: State) => state.domeType);
    const beamMaxHeight = useMeasurementsStore((state: State) => state.beamMaxHeight);
    const beamLength = useMeasurementsStore((state: State) => state.beamLength);
    const interaxleLength = useMeasurementsStore((state: State) => state.interaxleLength);

    const pillarNumber = (width && length && interaxleLength)
                                                ? (width >= 35 ? ((length / interaxleLength) + 1) * 2 : (length / interaxleLength) + 1)
                                                : undefined;

    const ref = useRef<THREE.Mesh|null>(null);
    const domePillarGeometry = baseModel?.domePillarsRight;
    const domeBeamGeometry = baseModel?.domeBeamsRight;
    const mainBeamGeometry = baseModel?.beamsLeft;

    const localPlaneInclined = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
    const materialClippedRoof = material.clone();
    materialClippedRoof.clippingPlanes = [localPlaneInclined];

    const DOMEPILLARSRIGHT = () => {
        useLayoutEffect(() => {
            if (ref.current && coveringLength && eavesHeight && roofIncline.percentage && roofIncline.rad && width && length && interaxleLength && beamLength && beamMaxHeight && domeHeight && domeWidth && domeType && pillarNumber && domeBeamGeometry?.boundingBox && mainBeamGeometry?.boundingBox) {
                const mesh = new THREE.Object3D();
                const pillarLocalHeight =
                    ref.current.geometry.boundingBox!.max.y -
                    ref.current.geometry.boundingBox!.min.y;

                // Allinea la faccia inferiore del pilastro alla faccia superiore
                // della trave principale, tenendo conto della rotazione di entrambe.
                const pillarVerticalOffset =
                    ((domeHeight * pillarLocalHeight) + mainBeamGeometry.boundingBox.max.y) /
                    Math.cos(roofIncline.rad) - domeHeight - 0.25;

                if(width >= 35) {
                    for (let i = 0; i < pillarNumber; i++) {
                        mesh.scale.y = domeHeight;
                        const shift = ref.current.geometry.boundingBox!.max.y;
                        ref.current.geometry.translate(0, -shift, 0);
                        if(i % 2 === 0) {
                            mesh.position.set(-(beamLength - coveringLength) / 3, eavesHeight + domeHeight + 0.25 + pillarVerticalOffset + ((roofIncline.percentage! * ((width / 2) - ((beamLength - coveringLength) / 3))) / 100), -interaxleLength * (i/2));
                        } else {
                            mesh.position.set((-(beamLength - coveringLength) / 3) * 2, eavesHeight + domeHeight + 0.25 + pillarVerticalOffset + ((roofIncline.percentage! * ((width / 2) - ((beamLength - coveringLength) / 3) * 2)) / 100), -interaxleLength * ((i-1)/2));
                        }

                        mesh.rotation.set(0, Math.PI, -roofIncline.rad!);
                        ref.current.geometry.attributes.position.needsUpdate = true;
                        mesh.updateMatrix();
                        (ref.current as InstancedMesh).setMatrixAt(i, mesh.matrix);
                    }
                } else {
                    for (let i = 0; i < pillarNumber; i++) {
                        mesh.scale.y = domeHeight;
                        const shift = ref.current.geometry.boundingBox!.max.y;
                        ref.current.geometry.translate(0, -shift, 0);
                        mesh.position.set(-(beamLength - coveringLength) / 2, eavesHeight + domeHeight + 0.25 + pillarVerticalOffset + ((roofIncline.percentage! * ((width / 2) - ((beamLength - coveringLength) / 2))) / 100), -interaxleLength * i);
                        mesh.rotation.set(0, Math.PI, -roofIncline.rad!);
                        ref.current.geometry.attributes.position.needsUpdate = true;
                        mesh.updateMatrix();
                        (ref.current as InstancedMesh).setMatrixAt(i, mesh.matrix);
                    }
                }

                const isMonoDome = domeType === 'S';
                const ip = (domeWidth / 2) / Math.cos(roofIncline.rad);
                const hToAdd = ip * Math.sin(roofIncline.rad);
                const beamMatrix = new THREE.Matrix4().compose(
                    new THREE.Vector3(
                        isMonoDome ? domeWidth / 2 : 0.05,
                        eavesHeight + beamMaxHeight + domeHeight + 0.25 +
                            (isMonoDome ? hToAdd : 0),
                        0
                    ),
                    new THREE.Quaternion().setFromEuler(
                        new THREE.Euler(0, 0, roofIncline.rad)
                    ),
                    new THREE.Vector3(
                        isMonoDome
                            ? domeWidth / Math.cos(roofIncline.rad)
                            : domeWidth / 2 + 0.05,
                        1,
                        1
                    )
                );

                // Taglia il pilastro sulla faccia inferiore della trave superiore.
                localPlaneInclined
                    .set(
                        new THREE.Vector3(0, -1, 0),
                        domeBeamGeometry.boundingBox.min.y
                    )
                    .applyMatrix4(beamMatrix);
            }
        }, []);

        if (!coveringLength || !eavesHeight || !roofIncline.percentage || !width || !length || !interaxleLength || !beamLength || !domeHeight || !domeWidth || !domeType) {
            return <></>
        }

        return (
            <instancedUniformsMesh ref={ref}
                                   args={[domePillarGeometry, materialClippedRoof, pillarNumber]}></instancedUniformsMesh>
        )
    }

    // eslint-disable-next-line react-hooks/static-components
    return <DOMEPILLARSRIGHT/>
}

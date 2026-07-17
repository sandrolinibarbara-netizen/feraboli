import React, {useLayoutEffect, useRef} from "react";
import * as THREE from "three";
import {InstancedMesh} from "three";
import {useMeasurementsStore} from "@/app/_stores/measurements";
import {State} from "@/app/_types/State";
import {getDefinedValues} from "@/app/_utils/getDefinedValues";

export default function DomePurlinsCentral({material} : {material : THREE.Material}) {
    const baseModel = useMeasurementsStore((state: State) => state.geometry);
    const eavesHeight = useMeasurementsStore((state: State) => state.eavesHeight);
    const beamMaxHeight = useMeasurementsStore((state: State) => state.beamMaxHeight);
    const length = useMeasurementsStore((state: State) => state.length);
    const domeHeight = useMeasurementsStore((state: State) => state.domeHeight);
    const secondHeightOffset = useMeasurementsStore((state: State) => state.secondHeightOffset);

    const ref = useRef<THREE.Mesh|null>(null);
    const purlinGeometry = baseModel?.domePurlinsCentral;
    const requiredValues = getDefinedValues({
        eavesHeight,
        length,
        beamMaxHeight,
        domeHeight
    });

    if (!requiredValues) return null;

    const DOMEPURLINSCENTRAL = () => {
        useLayoutEffect(() => {
            if (!ref.current) return;

            const {eavesHeight, length, beamMaxHeight, domeHeight} = requiredValues;
            const mesh = new THREE.Object3D();

            for (let i = 0; i < 1; i++) {
                mesh.scale.z = length + 1;
                const shift = ref.current.geometry.boundingBox!.min.x;
                ref.current.geometry.translate(-shift, 0, 0);
                mesh.position.set(0.05, eavesHeight + secondHeightOffset + beamMaxHeight + domeHeight + 0.25, -length / 2);
                mesh.rotation.set(0, Math.PI, 0);
                ref.current.geometry.attributes.position.needsUpdate = true;
                mesh.updateMatrix();
                (ref.current as InstancedMesh).setMatrixAt(i, mesh.matrix);
            }
        }, []);

        return (
            <instancedUniformsMesh ref={ref} args={[purlinGeometry, material, 1]}></instancedUniformsMesh>
        )
    }

    // eslint-disable-next-line react-hooks/static-components
    return <DOMEPURLINSCENTRAL/>
}

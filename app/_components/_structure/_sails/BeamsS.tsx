import React, {useLayoutEffect, useRef} from "react";
import * as THREE from "three";
import {InstancedMesh} from "three";
import {useMeasurementsStore} from "@/app/_stores/measurements";
import {State} from "@/app/_types/State";
import {getDefinedValues} from "@/app/_utils/getDefinedValues";

export default function BeamsS({material} : {material : THREE.Material}) {
    const baseModel = useMeasurementsStore((state: State) => state.geometry);
    const sails = useMeasurementsStore((state: State) => state.sails);
    const beamLength = useMeasurementsStore((state: State) => state.spansInfo.beams);
    const eavesHeight = useMeasurementsStore((state: State) => state.eavesHeight);
    const spansRight = useMeasurementsStore((state: State) => state.spansRight);
    const spansLeft = useMeasurementsStore((state: State) => state.spansLeft);
    const pillarsHeight = useMeasurementsStore((state: State) => state.pillarsHeight);
    const roofIncline = useMeasurementsStore((state: State) => state.roofIncline);
    const width = useMeasurementsStore((state: State) => state.width);
    const length = useMeasurementsStore((state: State) => state.length);
    const interaxleLength = useMeasurementsStore((state: State) => state.interaxleLength);
    const interaxleWidth = useMeasurementsStore((state: State) => state.interaxleWidth);

    const ref = useRef<THREE.Mesh|null>(null);
    const beamGeometry = baseModel?.beamsLeft;

    const primaryRoofValues = getDefinedValues({
        beamLength,
        eavesHeight,
        pillarsHeight,
        roofInclineRad: roofIncline.rad,
        width,
        length,
        spansRight,
        interaxleLength,
        interaxleWidth,
        sails
    });
    const requiredValues = primaryRoofValues;

    if (!requiredValues) return null;

    const BEAMSLEFT = () => {
        const {length, interaxleLength, sails} = requiredValues;

        useLayoutEffect(() => {
            if (!ref.current) return;

            if (primaryRoofValues) {
                const {spansRight, pillarsHeight, width, beamLength, eavesHeight, roofInclineRad, interaxleWidth, length, interaxleLength, sails} = primaryRoofValues;
                const mesh = new THREE.Object3D();
                const beamsPerRow = sails - 1;
                const lastBeamIndex = beamsPerRow - 1;
                const centralBeamIndex = spansRight;

                ref.current.geometry.computeBoundingBox();
                const shift = ref.current.geometry.boundingBox?.max.x ?? 0;
                ref.current.geometry.translate(-shift, 0, 0);
                ref.current.geometry.attributes.position.needsUpdate = true;

                for (let i = 0; i < ((length / interaxleLength) + 1) * beamsPerRow; i++) {
                    const beamIndex = i % beamsPerRow;
                    const rowIndex = Math.floor(i / beamsPerRow);
                    let scale, rotation, verticalOffset: number;

                    if(!spansLeft) {
                        scale = beamIndex === 0
                            ? beamLength.firstSpans.beamLength
                            : beamLength.middleSpans.beamLength;
                    } else if(beamIndex === 0 || beamIndex === lastBeamIndex) {
                        if(spansLeft === 2 || spansRight === 1) {
                            scale = beamLength.firstSpans.beamLength - 1.0;
                        } else {
                            scale = beamLength.firstSpans.beamLength;
                        }
                    } else if(beamIndex === centralBeamIndex) {
                        scale = beamLength.centralSpan.beamLength;
                    } else if(Math.abs(beamIndex - centralBeamIndex) === 1) {
                        scale = beamLength.nearCentralSpans.beamLength;
                    } else {
                        scale = beamLength.middleSpans.beamLength;
                    }

                    if(spansLeft && beamIndex >= centralBeamIndex) {
                        rotation = roofInclineRad;
                        verticalOffset = eavesHeight + scale * Math.sin(roofInclineRad);
                    } else {
                        rotation = -roofInclineRad;
                        verticalOffset = eavesHeight;
                    }

                    const positionOffset = beamIndex === 0
                        ? interaxleWidth / 2
                        : spansLeft && beamIndex === centralBeamIndex
                            ? 1
                            : spansLeft && beamIndex > centralBeamIndex + 1 && beamIndex < lastBeamIndex
                                ? 1
                                : spansLeft === 2 && beamIndex === lastBeamIndex
                                    ? 0
                                    : spansLeft && spansLeft !== 2 && beamIndex === lastBeamIndex
                                        ? 1
                                        : 0;

                    if(spansLeft && beamIndex === centralBeamIndex) {
                        verticalOffset = pillarsHeight[beamIndex].totalHeight!
                            + positionOffset * Math.tan(roofInclineRad);
                    }

                    const beamPosition = pillarsHeight[beamIndex].position!
                        - (width / 2)
                        - positionOffset;

                    mesh.scale.set(scale, 1, 1);
                    mesh.position.set(
                        beamPosition,
                        verticalOffset,
                        -interaxleLength * rowIndex
                    );
                    mesh.rotation.set(0, Math.PI, rotation);
                    mesh.updateMatrix();
                    (ref.current as InstancedMesh).setMatrixAt(i, mesh.matrix);
                }

                (ref.current as InstancedMesh).instanceMatrix.needsUpdate = true;
            }
        }, []);

        return (
            <instancedUniformsMesh ref={ref}
                                   args={[beamGeometry, material, ((length / interaxleLength) + 1) * (sails - 1)]}>
            </instancedUniformsMesh>
        )
    }

    // eslint-disable-next-line react-hooks/static-components
    return <BEAMSLEFT/>
}

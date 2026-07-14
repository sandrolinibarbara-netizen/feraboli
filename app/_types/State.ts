import * as THREE from "three";

export type Geometry = {
    domeCoveringRight: THREE.BufferGeometry,
    domeCoveringLeft: THREE.BufferGeometry,
    domePurlinsRight: THREE.BufferGeometry,
    domePurlinsCentral: THREE.BufferGeometry,
    domePurlinsLeft: THREE.BufferGeometry,
    domeBeamsRight: THREE.BufferGeometry,
    domeBeamsLeft: THREE.BufferGeometry,
    domePillarsRight: THREE.BufferGeometry,
    domePillarsLeft: THREE.BufferGeometry,
    coveringRight: THREE.BufferGeometry,
    coveringLeft: THREE.BufferGeometry,
    purlinsRight: THREE.BufferGeometry,
    purlinsLeft: THREE.BufferGeometry,
    beamsRight: THREE.BufferGeometry,
    beamsLeft: THREE.BufferGeometry,
    pillars: THREE.BufferGeometry,
    bases: THREE.BufferGeometry,
}
export interface Measurements {
    pillars: string | number | undefined,
    pitches: string | number | undefined,
    structureType: string | undefined,
    roofIncline: string | number | undefined,
    eavesHeight: string | number | undefined,
    secondEavesHeight: string | number | undefined,
    length: string | number | undefined,
    width: string | number | undefined,
    interaxleLength: string | number | undefined,
}
export interface Pillar {
    heightToAdd: number | undefined,
    totalHeight: number | undefined,
    position: number | undefined
}
export interface State {
    geometry: Geometry | undefined,
    setGeometry: (geometry:Geometry) => void,
    pillars: number | undefined,
    pitches: string | undefined,
    structureType: string | undefined,
    eavesHeight: number | undefined,
    secondEavesHeight: number | undefined,
    length: number | undefined,
    width: number | undefined,
    interaxleLength: number | undefined,
    interaxleWidth: number | undefined,
    roofIncline: {
        percentage: number | undefined,
        grad: number | undefined,
        rad: number | undefined,
    },
    setRoofIncline: (state:State, n:number|undefined) => void,
    secondRoofIncline: {
        percentage: number | undefined,
        grad: number | undefined,
        rad: number | undefined,
    },
    setSecondRoofIncline: (state:State, n:number|undefined) => void,

    setBaseMeasurements: (measurements:Measurements) => void,
    setDerivedMeasurements: (state:State) => void,

    beamMaxHeight: number | undefined,
    beamLength: number | undefined,
    secondBeamMaxHeight: number | undefined,
    secondBeamLength: number | undefined,
    beamPatchLength: number | undefined,
    coveringLength: number | undefined,
    secondCoveringLength: number | undefined,
    halfPurlins: number | undefined,
    secondHalfPurlins: number | undefined,
    domeHeight: number | undefined,
    domeWidth: number | undefined,
    pillarsHeight: Pillar[],
}
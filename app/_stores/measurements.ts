import { create } from 'zustand';
import {produce} from "immer";
import {Pillar, State} from "@/app/_types/State";


export const useMeasurementsStore = create<State>((set, get) => ({

    // GEOMETRY
    geometry: undefined,
    setGeometry: (geometry) => set({geometry:geometry}),
    // BASE MEASUREMENTS
    pillars: undefined,
    pitches: undefined,
    structureType: undefined,
    eavesHeight: undefined,
    secondHeight: undefined,
    length: undefined,
    width: undefined,
    interaxleLength: undefined,
    interaxleWidth: undefined,
    domeType: undefined,
    purlinType: undefined,
    // OBJECT: %, grad e rad
    // TECNICAMENTE, anche questo sarebbe derivabile,
    // MA devono avere la possibilità di inserire misure arbitrarie
    roofIncline: {
        percentage: undefined,
        grad: undefined,
        rad: undefined,
    },
    setRoofIncline: (state, n) =>  {
            if(!n) {
                state.roofIncline.percentage = undefined;
                state.roofIncline.grad = undefined;
                state.roofIncline.rad = undefined;
            } else {
                state.roofIncline.percentage = n;
                state.roofIncline.grad = Math.atan(n/100) * (180/Math.PI);
                state.roofIncline.rad = Math.atan(n/100);
            }
        },
    secondRoofIncline: {
        percentage: undefined,
        grad: undefined,
        rad: undefined,
    },
    setSecondRoofIncline: (state, n) =>  {
        if(!n) {
            state.secondRoofIncline.percentage = undefined;
            state.secondRoofIncline.grad = undefined;
            state.secondRoofIncline.rad = undefined;
        } else {
            state.secondRoofIncline.percentage = n;
            state.secondRoofIncline.grad = Math.atan(n/100) * (180/Math.PI);
            state.secondRoofIncline.rad = Math.atan(n/100);
        }
    },

    // FUNCTION TO SET BASE MEASUREMENTS
    setBaseMeasurements: (measurements) =>
        set(
            produce((state) => {
                state.pillars = Number(measurements.pillars);
                state.pitches = measurements.pitches;
                state.domeType = measurements.dome;
                state.purlinType = measurements.purlin;

                // EXCEPTION: 3 PILLARS + SHED
                if(state.pitches === 'S') {
                    state.structureType = measurements.structureType;
                    get().setRoofIncline(state, 15);
                    get().setSecondRoofIncline(state, 25);
                // ALL OTHER CASES
                } else {
                    // EXCEPTION: 1, 2 PILLARS
                    if(state.pillars < 3) {
                        state.structureType = 'struts';
                    } else {
                        state.structureType = measurements.structureType;
                    }
                    get().setRoofIncline(state, Number(measurements.roofIncline));
                    state.secondRoofIncline = {
                        percentage: undefined,
                        grad: undefined,
                        rad: undefined,
                    }
                }

                state.eavesHeight = Number(measurements.eavesHeight);
                if(measurements.secondHeight !== '' && measurements.pitches === 'DH') {
                    state.secondHeight = Number(measurements.secondHeight);
                } else {
                    state.secondHeight = undefined;
                }
                state.length = Number(measurements.length);
                state.width = Number(measurements.width);
                state.interaxleLength = Number(measurements.interaxleLength);
                state.interaxleWidth = Number(measurements.width) / Number(measurements.pillars);

                get().setDerivedMeasurements(state);
            })),

    // FUNCTION TO DERIVE MEASUREMENTS
    setDerivedMeasurements: (state) => {
        state.secondHeightOffset = 0;

        if(state.width && state.roofIncline.percentage && state.pillars
            && state.interaxleWidth && state.eavesHeight) {
            state.pillarsHeight = [];
            const halfWidth = state.width / 2;

            state.secondHeightOffset = state.secondHeight && state.pillars > 3 && state.pitches === 'DH'
                ? (halfWidth - ((state.interaxleWidth / 2) + 0.5)) * Math.tan(state.roofIncline.rad!) + state.secondHeight
                : 0;

            // BEAM
            // EXCEPTION: 1 o 2 PILLARS MONO FALDA
            if(state.pillars < 3 && state.pitches?.includes('M')) {
                state.beamMaxHeight = (state.roofIncline.percentage * state.width) / 100;
                state.beamLength = Math.sqrt(Math.pow(state.beamMaxHeight, 2) + Math.pow(state.width, 2));

            // EXCEPTION: >4 PILLARS DOUBLE HEIGHT
            } else if(state.pillars > 3 && state.pitches?.includes('D')) {
                state.beamMaxHeight = (state.roofIncline.percentage * (state.interaxleWidth/2 + 0.5)) / 100;
                state.beamLength = Math.sqrt(Math.pow(state.beamMaxHeight, 2) + Math.pow((state.interaxleWidth/2 + 0.5), 2));

                state.beamMaxHeightDH = (state.roofIncline.percentage * (halfWidth - state.interaxleWidth/2)) / 100;
                state.beamLengthDH = Math.sqrt(Math.pow(state.beamMaxHeightDH, 2) + Math.pow(halfWidth - state.interaxleWidth/2, 2));
                state.coveringLengthDH = state.beamLengthDH;
                state.halfPurlinsDH = Math.ceil(state.coveringLengthDH / 1.5);
            // ALL OTHER CASES
            } else {
                state.beamMaxHeight = (state.roofIncline.percentage * halfWidth) / 100;
                state.beamLength = Math.sqrt(Math.pow(state.beamMaxHeight, 2) + Math.pow(halfWidth, 2));
            }
            // ADD-ON: 3 PILLARS + SHED
            if(state.pitches === 'S' && state.secondRoofIncline.percentage) {
                state.secondBeamMaxHeight = (state.secondRoofIncline.percentage * (halfWidth + 0.5)) / 100;
                state.secondBeamLength = Math.sqrt(Math.pow(state.secondBeamMaxHeight, 2) + Math.pow(halfWidth + 0.5, 2));
                state.secondCoveringLength = state.secondBeamLength;
                state.secondHalfPurlins = Math.ceil(state.secondCoveringLength / 1.5);
            } else {
                state.secondBeamMaxHeight = undefined;
                state.secondBeamLength = undefined;
                state.secondCoveringLength = undefined;
                state.secondHalfPurlins = undefined;
            }

            // DOME
            // SOLO SE !== 1 o 2 PILLARS MONO FALDA, 3 PILLARS + SHED
            if(state.pitches && (state.pillars === 1 || (state.pillars === 2 && state.pitches.includes('M')) || (state.pillars === 3 && state.pitches.includes('S')))) {
                state.domeWidth = undefined;
                state.domeHeight = undefined;
            } else {
                // height
                if (state.width >= 10 && state.width < 35) {
                    state.domeHeight = 0.5;
                } else {
                    state.domeHeight = 0.6;
                }
                // width
                if (state.width <= 10) {
                    state.domeWidth = 1;
                } else if (state.width >= 60) {
                    state.domeWidth = 5;
                } else {
                    state.domeWidth = 0.08 * state.width + 0.2;
                }
            }

            // COVERING LENGTH
            // EXCEPTIONS: 1 o 2 PILLARS MONOFALDA, 3 PILLARS + SHED
            if(state.pitches && (state.pillars === 1 || (state.pillars === 2 && state.pitches.includes('M')) || (state.pillars === 3 && state.pitches.includes('S')))) {
                state.coveringLength = state.beamLength;
            // ALL OTHER CASES
            } else {
                state.coveringLength = state.beamLength - (state.domeWidth! / 2) + 0.5;
            }

            state.halfPurlins = Math.ceil(state.coveringLength / 1.5);

            const halfPillars = Math.ceil(Number(state.pillars) / 2);
            // pillars height, BUT ALSO pillars position
            for(let i= 0; i < state.pillars; i++) {
                const pillar:Pillar = {
                    heightToAdd: undefined,
                    totalHeight: undefined,
                    position: undefined
                };
                // POSITION
                if(i === 0) {
                    pillar.position = state.interaxleWidth / 2;
                } else if(i === state.pillars - 1) {
                    pillar.position = state.interaxleWidth / 2 + (state.interaxleWidth * (state.pillars - 1));
                } else {
                    pillar.position = state.interaxleWidth / 2 + (state.interaxleWidth * i);
                }
                // HEIGHT
                // EXCEPTION: 2 PILLARS MONO FALDA
                if(state.pitches && (state.pillars === 2 && state.pitches.includes('M'))) {
                    pillar.heightToAdd = (state.roofIncline.percentage * pillar.position) / 100;
                    pillar.totalHeight = state.eavesHeight + pillar.heightToAdd;
                // EXCEPTION: 3 PILLARS SHED
                } else if(state.pitches === 'S' && state.secondRoofIncline.percentage){
                    if(i < halfPillars) {
                        pillar.heightToAdd = (state.secondRoofIncline.percentage * pillar.position) / 100;
                    } else {
                        pillar.heightToAdd = (state.roofIncline.percentage * state.pillarsHeight[0].position!) / 100;
                    }
                    pillar.totalHeight = state.eavesHeight + pillar.heightToAdd;
                // EXCEPTION: 3 PILLARS NORMAL
                } else if(state.pillars === 3) {
                    if(i < halfPillars) {
                        pillar.heightToAdd = (state.roofIncline.percentage * pillar.position) / 100;
                        pillar.totalHeight = state.eavesHeight + pillar.heightToAdd;
                    } else {
                        pillar.heightToAdd = state.pillarsHeight[0].heightToAdd;
                        pillar.totalHeight = state.pillarsHeight[0].totalHeight;
                    }
                } else {
                    if(i < halfPillars) {
                        if(state.secondHeight && i === halfPillars - 1) {
                            pillar.heightToAdd = ((state.roofIncline.percentage * pillar.position) / 100) + state.secondHeight;
                        } else {
                            pillar.heightToAdd = (state.roofIncline.percentage * pillar.position) / 100;
                        }
                        pillar.totalHeight = state.eavesHeight + pillar.heightToAdd;
                    } else {
                        pillar.heightToAdd = state.pillarsHeight[i - 1 - (2 * (i - halfPillars))].heightToAdd;
                        pillar.totalHeight = state.pillarsHeight[i - 1 - (2 * (i - halfPillars))].totalHeight;
                    }
                }
                state.pillarsHeight.push(pillar);
            }
        }
    },

    // DERIVED MEASUREMENTS
    beamMaxHeight: undefined,
    beamLength: undefined,
    beamMaxHeightDH: undefined,
    beamLengthDH: undefined,
    coveringLengthDH: undefined,
    secondBeamMaxHeight: undefined,
    secondBeamLength: undefined,
    beamPatchLength: undefined,
    coveringLength: undefined,
    secondCoveringLength: undefined,
    halfPurlins: undefined,
    halfPurlinsDH: undefined,
    secondHalfPurlins: undefined,
    domeHeight: undefined,
    domeWidth: undefined,
    secondHeightOffset: 0,
    pillarsHeight: undefined
}))

import React, {Fragment, useState} from "react";
import {useMeasurementsStore} from "@/app/_stores/measurements";
import {State} from "@/app/_types/State";
import Image from "next/image";

export default function DerivedMeasurements() {

    const pillars = useMeasurementsStore((state: State) => state.pillars);
    const pitches = useMeasurementsStore((state: State) => state.pitches);
    const interaxleWidth = useMeasurementsStore((state: State) => state.interaxleWidth);
    const roofIncline = useMeasurementsStore((state: State) => state.roofIncline);
    const secondRoofIncline = useMeasurementsStore((state: State) => state.secondRoofIncline);
    const beamMaxHeight = useMeasurementsStore((state: State) => state.beamMaxHeight);
    const beamLength = useMeasurementsStore((state: State) => state.beamLength);
    const secondBeamMaxHeight = useMeasurementsStore((state: State) => state.secondBeamMaxHeight);
    const secondBeamLength = useMeasurementsStore((state: State) => state.secondBeamLength);
    const domeHeight = useMeasurementsStore((state: State) => state.domeHeight);
    const domeWidth = useMeasurementsStore((state: State) => state.domeWidth);
    const coveringLength = useMeasurementsStore((state: State) => state.coveringLength);
    const secondCoveringLength = useMeasurementsStore((state: State) => state.secondCoveringLength);
    const pillarsHeight = useMeasurementsStore((state: State) => state.pillarsHeight);
    const halfPurlins = useMeasurementsStore((state: State) => state.halfPurlins);

    const [openDrawer, setOpenDrawer] = useState(false);

    return (

        <aside className="absolute right-0 z-25">
            <div
                className={`${openDrawer ? 'bg-titleground' : 'bg-background/50'} h-[52px] flex w-[200px] justify-even`}>
                <h2 className="text-sm uppercase font-semibold p-4">Misure
                    derivate</h2>
                <button onClick={() => setOpenDrawer(prev => !prev)} className="cursor-pointer">
                    <Image aria-hidden src="/close-pane.svg" alt="Icona di chiusura del drawer" width={24} height={24}/>
                </button>
            </div>
            <div
                className={`${openDrawer ? 'block' : 'hidden'} w-[200px] bg-asideground h-[calc(100dvh-60px-52px)] overflow-y-auto py-4 pr-8 pl-4 text-xs font-medium`}>
                <p className="flex justify-between p-1 border-b-strokes border-b-1">Interasse
                    (larghezza): <span className="text-black">{interaxleWidth?.toFixed(2)} m</span></p>
                <p className="flex justify-between p-1 border-b-strokes border-b-1">Pendenza tetto
                    (%): <span className="text-black">{roofIncline.percentage?.toFixed(2)} %</span></p>
                <p className="flex justify-between p-1 border-b-strokes border-b-1">Pendenza tetto
                    (grad): <span className="text-black">{roofIncline.grad?.toFixed(2)} °</span></p>
                <p className="flex justify-between p-1 border-b-strokes border-b-1">Pendenza tetto
                    (rad): <span className="text-black">{roofIncline.rad?.toFixed(2)} rad</span></p>
                {pitches === 'S' &&
                    <>
                        <p className="flex justify-between p-1 border-b-strokes border-b-1">Pend. sec. tetto
                            (%): <span className="text-black">{secondRoofIncline.percentage?.toFixed(2)} %</span></p>
                        <p className="flex justify-between p-1 border-b-strokes border-b-1">Pend. sec. tetto
                            (grad): <span className="text-black">{secondRoofIncline.grad?.toFixed(2)} °</span></p>
                        <p className="flex justify-between p-1 border-b-strokes border-b-1">Pend. sec. tetto
                            (rad): <span className="text-black">{secondRoofIncline.rad?.toFixed(2)} rad</span></p>
                    </>
                }
                <p className="flex justify-between p-1 border-b-strokes border-b-1">Max. altezza
                    trave: <span className="text-black">{beamMaxHeight?.toFixed(2)} m</span></p>
                <p className="flex justify-between p-1 border-b-strokes border-b-1">Lunghezza
                    trave: <span className="text-black">{beamLength?.toFixed(2)} m</span></p>
                {pitches === 'S' &&
                    <>
                        <p className="flex justify-between p-1 border-b-strokes border-b-1">Max. altezza
                            sec.
                            trave: <span className="text-black">{secondBeamMaxHeight?.toFixed(2)} m</span></p>
                        <p className="flex justify-between p-1 border-b-strokes border-b-1">Lunghezza sec.
                            trave: <span className="text-black">{secondBeamLength?.toFixed(2)} m</span></p>
                    </>
                }
                {
                    pillars && (pillars > 1 || pitches?.includes('D')) &&
                    <>
                        <p className="flex justify-between p-1 border-b-strokes border-b-1">Altezza
                            cupolino: <span className="text-black">{domeHeight?.toFixed(2)} m</span></p>
                        <p className="flex justify-between p-1 border-b-strokes border-b-1">Ampiezza
                            cupolino: <span className="text-black">{domeWidth?.toFixed(2)} m</span></p>
                    </>
                }

                <p className="flex justify-between p-1 border-b-strokes border-b-1">Lunghezza
                    copertura: <span className="text-black">{coveringLength?.toFixed(2)} m</span></p>

                {pitches === 'S' &&
                    <p className="flex justify-between p-1 border-b-strokes border-b-1">Lunghezza sec.
                        copertura: <span className="text-black">{secondCoveringLength?.toFixed(2)} m</span></p>
                }

                <p className="flex justify-between p-1 border-b-strokes border-b-1">Arcarecci
                    (metà): <span className="text-black">{halfPurlins}</span></p>

                <p className="flex justify-between p-1 mt-4">Pilastri:</p>
                <ul className="pl-4">
                    {pillarsHeight?.map((el, i) => {
                        return (
                            <li key={i}>
                                {i + 1}:
                                <ul className="pl-4">
                                    {/*<li className="flex justify-between">Altezza da aggiungere: <span className"text-black>{el.heightToAdd?.toFixed(2)} m</span></li>*/}
                                    <li className="flex justify-between">Altezza
                                        totale: <span className="text-black">{el.totalHeight?.toFixed(2)} m</span></li>
                                    <li className="flex justify-between">Posizione: <span className="text-black">{el.position?.toFixed(2)}</span>
                                    </li>
                                </ul>
                            </li>
                        )
                    })}
                </ul>
            </div>

        </aside>
    );
}
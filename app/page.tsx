'use client'
import React from "react";
import Scene from "@/app/_components/Scene";
import MeasurementsInput from "@/app/_components/MeasurementsInput";
import DerivedMeasurements from "@/app/_components/DerivedMeasurements";
import Image from "next/image";

export default function Home() {

    return (
        <main className="w-full h-[100dvh] font-barlow">
            <header className="h-header p-2 flex gap-4 items-center shadow-md relative z-50">
                <Image
                    src="/feraboli-logo.svg"
                    alt="Logo di Feraboli"
                    width={100} height={50}
                    className="h-[44px]"
                />
                <div aria-hidden className="bg-strokes w-[2px] h-[44px] rounded"></div>
                <h1 className="uppercase font-bold">Configuratore 3D</h1>
            </header>
            <div className="flex h-view">
                <MeasurementsInput/>
                <Scene/>
                <DerivedMeasurements/>
            </div>
        </main>
    );
}
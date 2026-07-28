import * as THREE from "three";

export type DomeSphericalMeasurements = {
    beamMaxHeight: number;
    domeHeight: number;
    eavesHeight: number;
    secondHeightOffset: number;
    width: number;
};

export type DomeSphericalTransform = {
    position: THREE.Vector3;
    rotation: THREE.Euler;
    scale: THREE.Vector3;
};

function getBoundingBox(geometry: THREE.BufferGeometry) {
    if (!geometry.boundingBox) geometry.computeBoundingBox();
    return geometry.boundingBox!;
}

function getLowerSurfaceYAtZ(geometry: THREE.BufferGeometry, targetZ: number) {
    const positions = geometry.getAttribute("position");
    const index = geometry.index;
    const vertexCount = index?.count ?? positions.count;
    let lowerY = Number.POSITIVE_INFINITY;

    const getVertexIndex = (indexPosition: number) => index
        ? index.getX(indexPosition)
        : indexPosition;

    // Interseca ogni triangolo con il piano z = targetZ. In questo modo
    // l'appoggio segue la curva reale anche tra due vertici della copertura.
    for (let i = 0; i < vertexCount; i += 3) {
        const triangle = [
            getVertexIndex(i),
            getVertexIndex(i + 1),
            getVertexIndex(i + 2)
        ];

        for (let edge = 0; edge < 3; edge++) {
            const start = triangle[edge];
            const end = triangle[(edge + 1) % 3];
            const startZ = positions.getZ(start);
            const endZ = positions.getZ(end);
            const zRange = endZ - startZ;

            if (Math.abs(zRange) < Number.EPSILON) {
                if (Math.abs(targetZ - startZ) < 1e-6) {
                    lowerY = Math.min(
                        lowerY,
                        positions.getY(start),
                        positions.getY(end)
                    );
                }
                continue;
            }

            const interpolation = (targetZ - startZ) / zRange;

            if (interpolation >= 0 && interpolation <= 1) {
                lowerY = Math.min(
                    lowerY,
                    THREE.MathUtils.lerp(
                        positions.getY(start),
                        positions.getY(end),
                        interpolation
                    )
                );
            }
        }
    }

    return lowerY;
}

export function cloneDomeCoveringGeometry(geometry: THREE.BufferGeometry | undefined) {
    if (!geometry) return undefined;

    const clone = geometry.clone();
    clone.computeBoundingBox();
    return clone;
}

export function cloneOmegaPurlinGeometry(
    geometry: THREE.BufferGeometry | undefined,
    domeReferenceGeometry?: THREE.BufferGeometry
) {
    if (!geometry) return undefined;

    const clone = geometry.clone();
    clone.computeBoundingBox();
    const bounds = clone.boundingBox!;
    let yOffset = 0;

    if (domeReferenceGeometry) {
        const referenceBounds = getBoundingBox(domeReferenceGeometry);
        yOffset = referenceBounds.min.y - bounds.min.y;
    }

    // Come negli arcarecci Omega di falda, il bordo destro del profilo è
    // l'origine locale. Il riferimento del cupolino corregge soltanto la
    // diversa quota con cui lo stesso profilo è stato esportato nel GLB.
    clone.translate(-bounds.max.x, yOffset, 0);
    clone.computeBoundingBox();
    return clone;
}

export function getOmegaPurlinWidth(geometry: THREE.BufferGeometry) {
    return getBoundingBox(geometry).getSize(new THREE.Vector3()).x;
}

export function getDomeSphericalCoveringTransform(
    measurements: DomeSphericalMeasurements,
    coveringGeometry: THREE.BufferGeometry,
    centralPurlinGeometry: THREE.BufferGeometry
): DomeSphericalTransform {
    const scaleY = measurements.width >= 35
        ? 2.0 + 0.25 * ((measurements.width - 40) / 5.5)
        : 1.75;
    const scaleZ = measurements.width >= 35
        ? 1.75 + 0.25 * ((measurements.width - 40) / 5)
        : measurements.width <= 27.5
            ? 1.25
            : 1.5;
    const coveringBottom = getLowerSurfaceYAtZ(coveringGeometry, 0);

    if (!Number.isFinite(coveringBottom)) {
        throw new Error("La geometria della copertura sferica non raggiunge l'arcareccio centrale");
    }

    const purlinTop = getBoundingBox(centralPurlinGeometry).max.y;
    const purlinPositionY =
        measurements.eavesHeight +
        measurements.secondHeightOffset +
        measurements.beamMaxHeight +
        measurements.domeHeight +
        0.25;
    const positionY = purlinPositionY + purlinTop - coveringBottom * scaleY;

    return {
        position: new THREE.Vector3(0, positionY, 0),
        rotation: new THREE.Euler(0, Math.PI / 2, 0),
        scale: new THREE.Vector3(1, scaleY, scaleZ)
    };
}
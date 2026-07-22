import * as THREE from "three";

export type DomeSphericalSide = "left" | "right";

export type DomeSphericalMeasurements = {
    beamLength: number;
    beamMaxHeight: number;
    coveringLength: number;
    domeHeight: number;
    eavesHeight: number;
    length: number;
    roofInclinePercentage: number;
    roofInclineRad: number;
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

function getTransformMatrix(transform: DomeSphericalTransform) {
    return new THREE.Matrix4().compose(
        transform.position,
        new THREE.Quaternion().setFromEuler(transform.rotation),
        transform.scale
    );
}

function getPurlinTopCenter(
    geometry: THREE.BufferGeometry,
    transform: DomeSphericalTransform
) {
    const bounds = getBoundingBox(geometry);

    return new THREE.Vector3(
        (bounds.min.x + bounds.max.x) / 2,
        bounds.max.y,
        (bounds.min.z + bounds.max.z) / 2
    ).applyMatrix4(getTransformMatrix(transform));
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

export function cloneDomePillarGeometry(geometry: THREE.BufferGeometry | undefined) {
    if (!geometry) return undefined;

    const clone = geometry.clone();
    const bounds = getBoundingBox(clone);

    // La sommità del pilastro diventa l'origine locale, una sola volta.
    clone.translate(0, -bounds.max.y, 0);
    clone.computeBoundingBox();
    return clone;
}

export function cloneDomePurlinGeometry(geometry: THREE.BufferGeometry | undefined) {
    if (!geometry) return undefined;

    const clone = geometry.clone();
    const bounds = getBoundingBox(clone);
    const center = bounds.getCenter(new THREE.Vector3());

    // L'origine locale è il centro della faccia inferiore dell'arcareccio.
    clone.translate(-center.x, -bounds.min.y, -center.z);
    clone.computeBoundingBox();
    return clone;
}

export function getDomeSphericalPillarTransform(
    side: DomeSphericalSide,
    measurements: DomeSphericalMeasurements,
    z = 0
): DomeSphericalTransform {
    const direction = side === "left" ? 1 : -1;
    const supportDistance = (measurements.beamLength - measurements.coveringLength) / 2;
    const roofHeightAtSupport = measurements.beamMaxHeight - (
        measurements.roofInclinePercentage * supportDistance
    ) / 100;

    return {
        position: new THREE.Vector3(
            direction * supportDistance,
            measurements.eavesHeight + measurements.secondHeightOffset +
                measurements.domeHeight + 0.25 + roofHeightAtSupport,
            z
        ),
        rotation: side === "left"
            ? new THREE.Euler(0, 0, -measurements.roofInclineRad)
            : new THREE.Euler(0, Math.PI, -measurements.roofInclineRad),
        scale: new THREE.Vector3(1, measurements.domeHeight, 1)
    };
}

export function getDomeSphericalPurlinTransform(
    side: DomeSphericalSide,
    measurements: DomeSphericalMeasurements,
    pillarGeometry: THREE.BufferGeometry
): DomeSphericalTransform {
    const pillarBounds = getBoundingBox(pillarGeometry);
    const pillarTopCenter = new THREE.Vector3(
        (pillarBounds.min.x + pillarBounds.max.x) / 2,
        pillarBounds.max.y,
        (pillarBounds.min.z + pillarBounds.max.z) / 2
    );
    const pillarTransform = getDomeSphericalPillarTransform(side, measurements);
    const pillarMatrix = getTransformMatrix(pillarTransform);
    const purlinRotation = pillarTransform.rotation.clone();

    if (side === "right") {
        // I due profili GLB sono speculari. Sul lato destro ruotiamo il profilo
        // attorno al suo asse Y locale: la cavità guarda verso il centro senza
        // cambiare la normale della faccia inferiore appoggiata al pilastro.
        const purlinQuaternion = new THREE.Quaternion()
            .setFromEuler(pillarTransform.rotation)
            .multiply(new THREE.Quaternion().setFromAxisAngle(
                new THREE.Vector3(0, 1, 0),
                Math.PI
            ));

        purlinRotation.setFromQuaternion(purlinQuaternion);
    }

    pillarTopCenter.applyMatrix4(pillarMatrix);

    return {
        position: new THREE.Vector3(
            pillarTopCenter.x,
            pillarTopCenter.y,
            -measurements.length / 2
        ),
        rotation: purlinRotation,
        scale: new THREE.Vector3(1, 1, measurements.length + 1)
    };
}

export function getDomeSphericalCoveringTransform(
    measurements: DomeSphericalMeasurements,
    coveringGeometry: THREE.BufferGeometry,
    leftPillarGeometry: THREE.BufferGeometry,
    rightPillarGeometry: THREE.BufferGeometry,
    leftPurlinGeometry: THREE.BufferGeometry,
    rightPurlinGeometry: THREE.BufferGeometry
): DomeSphericalTransform {
    const leftPurlinTransform = getDomeSphericalPurlinTransform(
        "left",
        measurements,
        leftPillarGeometry
    );
    const rightPurlinTransform = getDomeSphericalPurlinTransform(
        "right",
        measurements,
        rightPillarGeometry
    );
    const leftPurlinTop = getPurlinTopCenter(leftPurlinGeometry, leftPurlinTransform);
    const rightPurlinTop = getPurlinTopCenter(rightPurlinGeometry, rightPurlinTransform);
    const scaleY = measurements.width >= 35
        ? 1.75 + 0.25 * ((measurements.width - 40) / 5)
        : 1;
    const scaleZ = measurements.width >= 35
        ? 1.5 + 0.25 * ((measurements.width - 40) / 5)
        : 1;
    const leftCoveringBottom = getLowerSurfaceYAtZ(
        coveringGeometry,
        leftPurlinTop.x / scaleZ
    );
    const rightCoveringBottom = getLowerSurfaceYAtZ(
        coveringGeometry,
        rightPurlinTop.x / scaleZ
    );

    if (!Number.isFinite(leftCoveringBottom) || !Number.isFinite(rightCoveringBottom)) {
        throw new Error("La geometria della copertura non raggiunge gli arcarecci sferici");
    }

    // Il valore maggiore garantisce che la copertura non attraversi nessuno
    // dei due arcarecci. Le geometrie sono speculari, quindi i due appoggi
    // coincidono salvo le tolleranze numeriche del modello GLB.
    const positionY = Math.max(
        leftPurlinTop.y - leftCoveringBottom * scaleY,
        rightPurlinTop.y - rightCoveringBottom * scaleY
    );

    return {
        position: new THREE.Vector3(0, positionY, 0),
        rotation: new THREE.Euler(0, Math.PI / 2, 0),
        scale: new THREE.Vector3(1, scaleY, scaleZ)
    };
}

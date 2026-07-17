type DefinedValues<T extends Record<string, unknown>> = {
    [K in keyof T]-?: NonNullable<T[K]>;
};

export function getDefinedValues<T extends Record<string, unknown>>(
    values: T
): DefinedValues<T> | undefined {
    const hasMissingValue = Object.values(values).some(
        (value) => value === undefined || value === null
    );

    return hasMissingValue ? undefined : values as DefinedValues<T>;
}

export function assignDefinedFields<T extends object>(
  target: T,
  patch: Partial<T>,
): void {
  Object.assign(
    target,
    Object.fromEntries(
      Object.entries(patch).filter(([, value]) => value !== undefined),
    ),
  );
}

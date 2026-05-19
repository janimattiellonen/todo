export function requireString(name: string): string {
  return requireValue(name);
}

export function requireOneOf<T>(name: string, values: readonly T[]): T {
  const value = requireValue(name) as T;

  if (!values.includes(value)) {
    throw new Error(
      `Environment variable ${name} must be one of ${values.join(", ")}`,
    );
  }

  return value;
}

function requireValue(name: string): string {
  const value = optionalValue(name);

  if (value === null) {
    throw new Error(`Environment variable ${name} is not defined`);
  }

  if (!value) {
    throw new Error(
      `Environment variable ${name} is missing (falsy, empty string)`,
    );
  }

  return value;
}

function optionalValue(name: string): string | null {
  const env = isServerSide() ? process.env : import.meta.env;

  const value = env[name];

  if (typeof value === "undefined") {
    return null;
  }

  return value;
}

function isServerSide() {
  return typeof document === "undefined";
}

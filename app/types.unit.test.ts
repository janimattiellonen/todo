import { describe, expect, expectTypeOf, test } from "vitest";
import type { Branded, Values } from "~/types";

type Slug = Branded<string, "Slug">;

function toSlug(value: string): Slug {
  return value as Slug;
}

describe("Branded", () => {
  test("round-trips the underlying value", () => {
    const slug = toSlug("welcome-aboard");

    expect(slug).toBe("welcome-aboard");
  });

  test("is assignable to the underlying type", () => {
    const slug: Slug = toSlug("welcome-aboard");
    const asString: string = slug;

    expect(asString).toBe("welcome-aboard");
  });

  test("a raw string is not assignable to the branded type", () => {
    expectTypeOf<string>().not.toEqualTypeOf<Slug>();
    expectTypeOf<Slug>().toMatchTypeOf<string>();
  });
});

describe("Values", () => {
  test("unions the value types of an object type", () => {
    const httpMethods = { get: "GET", post: "POST" } as const;
    type HttpMethod = Values<typeof httpMethods>;

    expectTypeOf<HttpMethod>().toEqualTypeOf<"GET" | "POST">();
  });
});

import { describe, expect, expectTypeOf, test } from "vitest";
import type { Branded, Values } from "~/types";

type Foo = Branded<string, "Foo">;

function toFoo(value: string): Foo {
  return value as Foo;
}

describe("Branded", () => {
  test("round-trips the underlying value", () => {
    const foo = toFoo("hello");

    expect(foo).toBe("hello");
  });

  test("is assignable to the underlying type", () => {
    const foo: Foo = toFoo("hello");
    const asString: string = foo;

    expect(asString).toBe("hello");
  });

  test("a raw string is not assignable to the branded type", () => {
    expectTypeOf<string>().not.toEqualTypeOf<Foo>();
    expectTypeOf<Foo>().toMatchTypeOf<string>();
  });
});

describe("Values", () => {
  test("unions the value types of an object type", () => {
    const colors = { red: "RED", blue: "BLUE" } as const;
    type Color = Values<typeof colors>;

    expectTypeOf<Color>().toEqualTypeOf<"RED" | "BLUE">();
  });
});

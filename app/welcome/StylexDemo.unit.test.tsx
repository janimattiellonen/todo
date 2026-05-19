import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { StylexDemo } from "./StylexDemo";

describe("StylexDemo", () => {
  test("renders the heading", () => {
    render(<StylexDemo />);

    expect(screen.getByTestId("stylex-demo")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "StyleX is wired up.",
    );
  });
});

import { describe, expect, test } from "vitest";
import { validateNewTaskInput } from "./validateNewTaskInput";

const uuid = "11111111-1111-4111-8111-111111111111";

// biome-ignore lint/security/noSecrets: Describe label, not a secret.
describe("validateNewTaskInput", () => {
  test("accepts a minimal happy path (title + columnId only)", () => {
    const result = validateNewTaskInput({
      columnId: uuid,
      title: "Write spec",
      description: "",
      assigneeUserId: "",
      dueDate: "",
    });

    expect(result).toEqual({
      ok: true,
      value: {
        columnId: uuid,
        title: "Write spec",
        description: null,
        assigneeUserId: null,
        dueDate: null,
      },
    });
  });

  test("rejects empty title with a user-readable error", () => {
    const result = validateNewTaskInput({
      columnId: uuid,
      title: "   ",
      description: "",
      assigneeUserId: "",
      dueDate: "",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/title is required/i);
    }
  });

  test("rejects title over 200 characters", () => {
    const result = validateNewTaskInput({
      columnId: uuid,
      title: "x".repeat(201),
      description: "",
      assigneeUserId: "",
      dueDate: "",
    });

    expect(result.ok).toBe(false);
  });

  test("rejects an invalid columnId", () => {
    const result = validateNewTaskInput({
      columnId: "not-a-uuid",
      title: "t",
      description: "",
      assigneeUserId: "",
      dueDate: "",
    });

    expect(result.ok).toBe(false);
  });

  test("normalises empty assignee / due date to null", () => {
    const result = validateNewTaskInput({
      columnId: uuid,
      title: "t",
      description: "  ",
      assigneeUserId: "",
      dueDate: "",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.assigneeUserId).toBeNull();
      expect(result.value.dueDate).toBeNull();
      expect(result.value.description).toBeNull();
    }
  });

  test("accepts a valid YYYY-MM-DD due date", () => {
    const result = validateNewTaskInput({
      columnId: uuid,
      title: "t",
      description: "",
      assigneeUserId: "",
      dueDate: "2026-06-15",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.dueDate).toBe("2026-06-15");
    }
  });

  test("rejects a malformed due date", () => {
    const result = validateNewTaskInput({
      columnId: uuid,
      title: "t",
      description: "",
      assigneeUserId: "",
      dueDate: "06/15/2026",
    });

    expect(result.ok).toBe(false);
  });
});

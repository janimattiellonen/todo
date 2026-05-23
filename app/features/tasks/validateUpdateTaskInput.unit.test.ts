import { describe, expect, test } from "vitest";
import { validateUpdateTaskInput } from "./validateUpdateTaskInput";

const taskUuid = "11111111-1111-4111-8111-111111111111";
const columnUuid = "22222222-2222-4222-8222-222222222222";
const memberUuid = "33333333-3333-4333-8333-333333333333";

describe("validateUpdateTaskInput", () => {
  test("accepts a happy-path payload with all fields set", () => {
    const result = validateUpdateTaskInput({
      taskId: taskUuid,
      title: "Refined",
      description: "Updated body",
      columnId: columnUuid,
      assigneeUserId: memberUuid,
      dueDate: "2026-07-01",
    });

    expect(result).toEqual({
      ok: true,
      value: {
        taskId: taskUuid,
        title: "Refined",
        description: "Updated body",
        columnId: columnUuid,
        assigneeUserId: memberUuid,
        dueDate: "2026-07-01",
      },
    });
  });

  test("rejects empty title", () => {
    const result = validateUpdateTaskInput({
      taskId: taskUuid,
      title: "   ",
      description: "",
      columnId: columnUuid,
      assigneeUserId: "",
      dueDate: "",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/title is required/i);
  });

  test("rejects an invalid taskId", () => {
    const result = validateUpdateTaskInput({
      taskId: "not-a-uuid",
      title: "x",
      description: "",
      columnId: columnUuid,
      assigneeUserId: "",
      dueDate: "",
    });

    expect(result.ok).toBe(false);
  });

  test("normalises empty fields to null", () => {
    const result = validateUpdateTaskInput({
      taskId: taskUuid,
      title: "x",
      description: "  ",
      columnId: columnUuid,
      assigneeUserId: "",
      dueDate: "",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.description).toBeNull();
      expect(result.value.assigneeUserId).toBeNull();
      expect(result.value.dueDate).toBeNull();
    }
  });

  test("rejects a malformed due date", () => {
    const result = validateUpdateTaskInput({
      taskId: taskUuid,
      title: "x",
      description: "",
      columnId: columnUuid,
      assigneeUserId: "",
      dueDate: "07/01/2026",
    });

    expect(result.ok).toBe(false);
  });

  test("rejects title over 200 characters", () => {
    const result = validateUpdateTaskInput({
      taskId: taskUuid,
      title: "x".repeat(201),
      description: "",
      columnId: columnUuid,
      assigneeUserId: "",
      dueDate: "",
    });

    expect(result.ok).toBe(false);
  });
});

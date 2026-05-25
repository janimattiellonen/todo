import * as stylex from "@stylexjs/stylex";
import { useState } from "react";
import { Form } from "react-router";
import type { ColumnId } from "~/features/columns/columnsTypes";
import type { TaskId } from "~/features/tasks/tasksTypes";
import type { UserId } from "~/features/users/usersTypes";
import type { WorkspaceMember } from "~/features/workspaces/queryListWorkspaceMembers.server";
import { colors } from "~/ui/tokens/colors.stylex";
import { radius } from "~/ui/tokens/radius.stylex";
import { spacing } from "~/ui/tokens/spacing.stylex";
import {
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
} from "~/ui/tokens/typography.stylex";

type ColumnOption = { id: ColumnId; name: string };

type Props = {
  taskId: TaskId;
  initial: {
    title: string;
    description: string | null;
    columnId: ColumnId;
    assigneeUserId: UserId | null;
    dueDate: string | null;
  };
  /** What the user typed last; takes precedence over `initial` so edits aren't lost on error. */
  values: {
    title: string | null;
    description: string | null;
    columnId: string | null;
    assigneeUserId: string | null;
    dueDate: string | null;
  } | null;
  error: string | null;
  members: ReadonlyArray<WorkspaceMember>;
  columns: ReadonlyArray<ColumnOption>;
  onCancel: () => void;
};

export function EditTaskForm(props: Props) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const values = props.values ?? {
    title: props.initial.title,
    description: props.initial.description,
    columnId: props.initial.columnId,
    assigneeUserId: props.initial.assigneeUserId,
    dueDate: props.initial.dueDate,
  };

  const editFormId = "edit-task-form-fields";
  const deleteFormId = "delete-task-form";
  const archiveFormId = "archive-task-form";

  return (
    <>
      <Form
        method="post"
        id={editFormId}
        {...stylex.props(styles.form)}
        data-testid="edit-task-form"
      >
        <input type="hidden" name="_intent" value="update-task" />
        <input type="hidden" name="task_id" value={props.taskId} />

        <label {...stylex.props(styles.label)}>
          <span {...stylex.props(styles.labelText)}>Title</span>
          <input
            type="text"
            name="title"
            defaultValue={values.title ?? ""}
            maxLength={200}
            required
            {...stylex.props(styles.input)}
          />
        </label>

        <label {...stylex.props(styles.label)}>
          <span {...stylex.props(styles.labelText)}>Description</span>
          <textarea
            name="description"
            defaultValue={values.description ?? ""}
            rows={4}
            maxLength={2000}
            {...stylex.props(styles.input, styles.textarea)}
          />
        </label>

        <label {...stylex.props(styles.label)}>
          <span {...stylex.props(styles.labelText)}>Column</span>
          <select
            name="column_id"
            defaultValue={values.columnId ?? props.initial.columnId}
            {...stylex.props(styles.input)}
          >
            {props.columns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label {...stylex.props(styles.label)}>
          <span {...stylex.props(styles.labelText)}>Assignee</span>
          <select
            name="assignee_user_id"
            defaultValue={values.assigneeUserId ?? ""}
            {...stylex.props(styles.input)}
          >
            <option value="">Unassigned</option>
            {props.members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.email}
              </option>
            ))}
          </select>
        </label>

        <label {...stylex.props(styles.label)}>
          <span {...stylex.props(styles.labelText)}>Due date</span>
          <input
            type="date"
            name="due_date"
            defaultValue={values.dueDate ?? ""}
            {...stylex.props(styles.input)}
          />
        </label>

        {props.error !== null && (
          <p {...stylex.props(styles.error)} role="alert">
            {props.error}
          </p>
        )}
      </Form>

      {/* Sibling forms for delete + archive — kept separate so each
          submitting button carries only its own intent + task_id. */}
      <Form method="post" id={deleteFormId} data-testid="delete-task-form">
        <input type="hidden" name="_intent" value="delete-task" />
        <input type="hidden" name="task_id" value={props.taskId} />
      </Form>
      <Form method="post" id={archiveFormId} data-testid="archive-task-form">
        <input type="hidden" name="_intent" value="archive-task" />
        <input type="hidden" name="task_id" value={props.taskId} />
      </Form>

      {confirmingDelete ? (
        <div {...stylex.props(styles.footer, styles.footerConfirm)}>
          <p {...stylex.props(styles.confirmText)}>Delete this task?</p>
          <div {...stylex.props(styles.buttonGroup)}>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              {...stylex.props(styles.cancel)}
              data-testid="delete-task-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              form={deleteFormId}
              {...stylex.props(styles.dangerConfirm)}
              data-testid="delete-task-confirm"
            >
              Confirm delete
            </button>
          </div>
        </div>
      ) : (
        <div {...stylex.props(styles.footer)}>
          <div {...stylex.props(styles.buttonGroup)}>
            <button
              type="submit"
              form={archiveFormId}
              {...stylex.props(styles.ghost)}
              data-testid="archive-task-button"
            >
              Archive
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              {...stylex.props(styles.dangerGhost)}
              data-testid="delete-task-toggle"
            >
              Delete
            </button>
          </div>
          <div {...stylex.props(styles.buttonGroup)}>
            <button
              type="button"
              onClick={props.onCancel}
              {...stylex.props(styles.cancel)}
            >
              Cancel
            </button>
            <button
              type="submit"
              form={editFormId}
              {...stylex.props(styles.submit)}
              data-testid="edit-task-submit"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const styles = stylex.create({
  form: {
    display: "flex",
    flexDirection: "column",
    gap: spacing.x3,
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: spacing.x1,
  },
  labelText: {
    fontSize: fontSize.bodySm,
    fontWeight: fontWeight.medium,
    color: colors.textDefault,
  },
  input: {
    width: "100%",
    padding: `${spacing.x2} ${spacing.x3}`,
    fontFamily: fontFamily.text,
    fontSize: fontSize.bodySm,
    color: colors.textDefault,
    backgroundColor: colors.surface1,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: colors.borderDefault,
    borderRadius: radius.md,
    outline: "none",
    boxSizing: "border-box",
  },
  textarea: {
    resize: "vertical",
    fontFamily: fontFamily.text,
  },
  error: {
    margin: 0,
    fontSize: fontSize.bodyXs,
    lineHeight: lineHeight.body,
    color: colors.danger,
  },
  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.x3,
    marginTop: spacing.x2,
  },
  footerConfirm: {
    padding: spacing.x3,
    backgroundColor: colors.dangerBg,
    borderRadius: radius.md,
  },
  buttonGroup: {
    display: "flex",
    gap: spacing.x2,
  },
  ghost: {
    padding: `${spacing.x2} ${spacing.x3}`,
    fontFamily: fontFamily.text,
    fontSize: fontSize.bodySm,
    fontWeight: fontWeight.medium,
    color: colors.textDefault,
    backgroundColor: { default: "transparent", ":hover": colors.surface2 },
    borderWidth: 0,
    borderRadius: radius.md,
    cursor: "pointer",
  },
  cancel: {
    padding: `${spacing.x2} ${spacing.x3}`,
    fontFamily: fontFamily.text,
    fontSize: fontSize.bodySm,
    fontWeight: fontWeight.medium,
    color: colors.textDefault,
    backgroundColor: { default: colors.surface1, ":hover": colors.surface2 },
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: colors.borderDefault,
    borderRadius: radius.md,
    cursor: "pointer",
  },
  submit: {
    padding: `${spacing.x2} ${spacing.x4}`,
    fontFamily: fontFamily.text,
    fontSize: fontSize.bodySm,
    fontWeight: fontWeight.medium,
    color: colors.textInverse,
    backgroundColor: { default: colors.accent, ":hover": colors.accentHover },
    borderWidth: 0,
    borderRadius: radius.md,
    cursor: "pointer",
  },
  dangerGhost: {
    padding: `${spacing.x2} ${spacing.x3}`,
    fontFamily: fontFamily.text,
    fontSize: fontSize.bodySm,
    fontWeight: fontWeight.medium,
    color: colors.danger,
    backgroundColor: { default: "transparent", ":hover": colors.dangerBg },
    borderWidth: 0,
    borderRadius: radius.md,
    cursor: "pointer",
  },
  dangerConfirm: {
    padding: `${spacing.x2} ${spacing.x4}`,
    fontFamily: fontFamily.text,
    fontSize: fontSize.bodySm,
    fontWeight: fontWeight.medium,
    color: colors.textInverse,
    backgroundColor: { default: colors.danger, ":hover": colors.danger },
    borderWidth: 0,
    borderRadius: radius.md,
    cursor: "pointer",
  },
  confirmText: {
    margin: 0,
    fontSize: fontSize.bodySm,
    fontWeight: fontWeight.medium,
    color: colors.danger,
  },
});

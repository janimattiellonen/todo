import * as stylex from "@stylexjs/stylex";
import { useState } from "react";
import { Form } from "react-router";
import type { ColumnId } from "~/features/columns/columnsTypes";
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

type Props = {
  columnId: ColumnId;
  members: ReadonlyArray<WorkspaceMember>;
  /** Error message returned by the action for *this column*, or null. */
  error: string | null;
};

export function AddTaskForm(props: Props) {
  const [open, setOpen] = useState<boolean>(props.error !== null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        {...stylex.props(styles.addButton)}
        data-testid="add-task-toggle"
      >
        + Add task
      </button>
    );
  }

  return (
    <Form
      method="post"
      {...stylex.props(styles.form)}
      data-testid="add-task-form"
    >
      <input type="hidden" name="_intent" value="create-task" />
      <input type="hidden" name="column_id" value={props.columnId} />

      <input
        type="text"
        name="title"
        placeholder="Title"
        maxLength={200}
        required
        {...stylex.props(styles.input)}
      />

      <textarea
        name="description"
        placeholder="Description (optional)"
        rows={2}
        maxLength={2000}
        {...stylex.props(styles.input, styles.textarea)}
      />

      <select name="assignee_user_id" {...stylex.props(styles.input)}>
        <option value="">Unassigned</option>
        {props.members.map((m) => (
          <option key={m.userId} value={m.userId}>
            {m.email}
          </option>
        ))}
      </select>

      <input type="date" name="due_date" {...stylex.props(styles.input)} />

      {props.error !== null && (
        <p {...stylex.props(styles.error)} role="alert">
          {props.error}
        </p>
      )}

      <div {...stylex.props(styles.buttons)}>
        <button
          type="button"
          onClick={() => setOpen(false)}
          {...stylex.props(styles.cancel)}
        >
          Cancel
        </button>
        <button
          type="submit"
          {...stylex.props(styles.submit)}
          data-testid="add-task-submit"
        >
          Add task
        </button>
      </div>
    </Form>
  );
}

const styles = stylex.create({
  addButton: {
    padding: spacing.x2,
    fontFamily: fontFamily.text,
    fontSize: fontSize.bodySm,
    fontWeight: fontWeight.medium,
    color: colors.textMuted,
    backgroundColor: { default: "transparent", ":hover": colors.surface3 },
    borderWidth: 0,
    borderRadius: radius.md,
    cursor: "pointer",
    textAlign: "left",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: spacing.x2,
    padding: spacing.x3,
    backgroundColor: colors.surface1,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: colors.borderSubtle,
    borderRadius: radius.md,
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
  buttons: {
    display: "flex",
    justifyContent: "flex-end",
    gap: spacing.x2,
    marginTop: spacing.x1,
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
  error: {
    margin: 0,
    fontSize: fontSize.bodyXs,
    lineHeight: lineHeight.body,
    color: colors.danger,
  },
});

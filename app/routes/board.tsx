import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import * as stylex from "@stylexjs/stylex";
import { useEffect, useState } from "react";
import { Form, redirect, useNavigate, useSubmit } from "react-router";
import { getServerConfig } from "~/config/serverConfig.server";
import { getPool } from "~/database/pool.server";
import { requireSession } from "~/features/auth/requireSession.server";
import { toColumnId } from "~/features/columns/columnsTypes";
import { queryListColumnsForWorkspace } from "~/features/columns/queryListColumnsForWorkspace.server";
import { AddTaskForm } from "~/features/tasks/AddTaskForm";
import { deleteTask } from "~/features/tasks/deleteTask.server";
import { EditTaskForm } from "~/features/tasks/EditTaskForm";
import { insertTask } from "~/features/tasks/insertTask.server";
import { moveTask } from "~/features/tasks/moveTask.server";
import { queryFindTaskById } from "~/features/tasks/queryFindTaskById.server";
import { queryListTasksForWorkspace } from "~/features/tasks/queryListTasksForWorkspace.server";
import { toTaskId } from "~/features/tasks/tasksTypes";
import { updateTask } from "~/features/tasks/updateTask.server";
import {
  parseFormData,
  validateNewTaskInput,
} from "~/features/tasks/validateNewTaskInput";
import {
  parseUpdateFormData,
  validateUpdateTaskInput,
} from "~/features/tasks/validateUpdateTaskInput";
import { queryFindWorkspaceById } from "~/features/workspaces/queryFindWorkspaceById.server";
import {
  queryListWorkspaceMembers,
  type WorkspaceMember,
} from "~/features/workspaces/queryListWorkspaceMembers.server";
import { Modal } from "~/ui/Modal/Modal";
import { colors } from "~/ui/tokens/colors.stylex";
import { radius } from "~/ui/tokens/radius.stylex";
import { spacing } from "~/ui/tokens/spacing.stylex";
import {
  fontFamily,
  fontSize,
  fontWeight,
  letterSpacing,
  lineHeight,
} from "~/ui/tokens/typography.stylex";
import type { Route } from "./+types/board";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Board · Todo" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const config = getServerConfig();
  const session = await requireSession(config, request);

  const pool = await getPool(config);

  const [workspace, columns, tasks, members] = await Promise.all([
    queryFindWorkspaceById(pool, session.workspaceId),
    queryListColumnsForWorkspace(pool, session.workspaceId),
    queryListTasksForWorkspace(pool, session.workspaceId),
    queryListWorkspaceMembers(pool, session.workspaceId),
  ]);

  // Group tasks by their column. tasks are already sorted by
  // (column_id ASC, position ASC) — the per-column order is preserved
  // by iterating in that sequence.
  const tasksByColumn = new Map<string, Array<{ id: string; title: string }>>();
  for (const task of tasks) {
    const bucket = tasksByColumn.get(task.columnId) ?? [];
    bucket.push({ id: task.id, title: task.title });
    tasksByColumn.set(task.columnId, bucket);
  }

  // If `?edit=<taskId>` is present and the task belongs to this
  // workspace, surface it so the page can render the edit modal.
  const url = new URL(request.url);
  const editParam = url.searchParams.get("edit");
  let editingTask: ReturnType<typeof serialiseEditableTask> | null = null;
  if (editParam !== null) {
    const found = await queryFindTaskById(
      pool,
      session.workspaceId,
      toTaskId(editParam),
    );
    if (found !== null) editingTask = serialiseEditableTask(found);
  }

  return {
    workspaceName: workspace?.name ?? "Workspace",
    columns: columns.map((c) => ({
      id: c.id,
      name: c.name,
      tasks: tasksByColumn.get(c.id) ?? [],
    })),
    columnOptions: columns.map((c) => ({ id: c.id, name: c.name })),
    members: members.map((m) => ({ userId: m.userId, email: m.email })),
    editingTask,
  };
}

function serialiseEditableTask(t: {
  id: string;
  columnId: string;
  title: string;
  description: string | null;
  assigneeUserId: string | null;
  dueDate: string | null;
}) {
  return {
    id: t.id,
    columnId: t.columnId,
    title: t.title,
    description: t.description,
    assigneeUserId: t.assigneeUserId,
    dueDate: t.dueDate,
  };
}

type CreateActionResult = {
  intent: "create-task";
  error: string;
  forColumnId: string | null;
};

type UpdateActionResult = {
  intent: "update-task";
  error: string;
  taskId: string | null;
  values: {
    title: string | null;
    description: string | null;
    columnId: string | null;
    assigneeUserId: string | null;
    dueDate: string | null;
  };
};

export async function action({
  request,
}: Route.ActionArgs): Promise<
  CreateActionResult | UpdateActionResult | Response
> {
  const config = getServerConfig();
  const session = await requireSession(config, request);

  const formData = await request.formData();
  const intent = formData.get("_intent");
  const pool = await getPool(config);

  if (intent === "create-task") {
    const parsed = validateNewTaskInput(parseFormData(formData));
    if (!parsed.ok) {
      const forColumnId = formData.get("column_id");
      return {
        intent: "create-task",
        error: parsed.error,
        forColumnId: typeof forColumnId === "string" ? forColumnId : null,
      };
    }

    const outcome = await insertTask(pool, session.workspaceId, parsed.value);
    if (!outcome.ok) {
      return {
        intent: "create-task",
        error: outcome.error,
        forColumnId: parsed.value.columnId,
      };
    }
    return redirect("/board");
  }

  if (intent === "update-task") {
    const raw = parseUpdateFormData(formData);
    const parsed = validateUpdateTaskInput(raw);
    if (!parsed.ok) {
      const r = raw as Record<string, unknown>;
      return {
        intent: "update-task",
        error: parsed.error,
        taskId: typeof r["taskId"] === "string" ? r["taskId"] : null,
        values: {
          title: typeof r["title"] === "string" ? r["title"] : null,
          description:
            typeof r["description"] === "string" ? r["description"] : null,
          columnId: typeof r["columnId"] === "string" ? r["columnId"] : null,
          assigneeUserId:
            typeof r["assigneeUserId"] === "string"
              ? r["assigneeUserId"]
              : null,
          dueDate: typeof r["dueDate"] === "string" ? r["dueDate"] : null,
        },
      };
    }

    const outcome = await updateTask(pool, session.workspaceId, parsed.value);
    if (!outcome.ok) {
      return {
        intent: "update-task",
        error: outcome.error,
        taskId: parsed.value.taskId,
        values: {
          title: parsed.value.title,
          description: parsed.value.description,
          columnId: parsed.value.columnId,
          assigneeUserId: parsed.value.assigneeUserId,
          dueDate: parsed.value.dueDate,
        },
      };
    }
    return redirect("/board");
  }

  if (intent === "delete-task") {
    const taskIdRaw = formData.get("task_id");
    if (typeof taskIdRaw !== "string" || taskIdRaw.length === 0) {
      // Silent redirect — there is no UI surface for a bad delete request.
      return redirect("/board");
    }
    await deleteTask(pool, session.workspaceId, toTaskId(taskIdRaw));
    return redirect("/board");
  }

  if (intent === "move-task") {
    const taskIdRaw = formData.get("task_id");
    const destColRaw = formData.get("destination_column_id");
    const destIdxRaw = formData.get("destination_index");
    if (
      typeof taskIdRaw !== "string" ||
      typeof destColRaw !== "string" ||
      typeof destIdxRaw !== "string"
    ) {
      return redirect("/board");
    }
    const idx = Number.parseInt(destIdxRaw, 10);
    if (Number.isNaN(idx) || idx < 0) {
      return redirect("/board");
    }
    await moveTask(pool, session.workspaceId, {
      taskId: toTaskId(taskIdRaw),
      destinationColumnId: toColumnId(destColRaw),
      destinationIndex: idx,
    });
    return redirect("/board");
  }

  return {
    intent: "create-task",
    error: "Unknown action.",
    forColumnId: null,
  };
}

const COLUMN_DROPPABLE_PREFIX = "column:";

export default function Board({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const navigate = useNavigate();
  const submit = useSubmit();
  const members: ReadonlyArray<WorkspaceMember> = loaderData.members.map(
    (m) => ({ userId: m.userId, email: m.email }),
  ) as never;

  const updateError =
    actionData !== undefined && actionData.intent === "update-task"
      ? actionData
      : null;

  // Local view of the board so dnd-kit can reorder optimistically while
  // the server confirms. Synced to loader data on every navigation.
  const [columnState, setColumnState] = useState(() => loaderData.columns);
  useEffect(() => {
    setColumnState(loaderData.columns);
  }, [loaderData.columns]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over === null) return;
    const taskId = String(active.id);
    const overId = String(over.id);
    if (taskId === overId) return;

    const sourceColumn = columnState.find((c) =>
      c.tasks.some((t) => t.id === taskId),
    );
    if (sourceColumn === undefined) return;
    const movingTask = sourceColumn.tasks.find((t) => t.id === taskId);
    if (movingTask === undefined) return;

    let destColumnId: string;
    let destIndex: number;

    if (overId.startsWith(COLUMN_DROPPABLE_PREFIX)) {
      // Dropped on the empty area of a column.
      destColumnId = overId.slice(COLUMN_DROPPABLE_PREFIX.length);
      const destCol = columnState.find((c) => c.id === destColumnId);
      destIndex =
        destCol === undefined
          ? 0
          : destCol.tasks.filter((t) => t.id !== taskId).length;
    } else {
      // Dropped on/near another task.
      const overColumn = columnState.find((c) =>
        c.tasks.some((t) => t.id === overId),
      );
      if (overColumn === undefined) return;
      destColumnId = overColumn.id;
      const filtered = overColumn.tasks.filter((t) => t.id !== taskId);
      const idx = filtered.findIndex((t) => t.id === overId);
      destIndex = idx === -1 ? filtered.length : idx;
    }

    // Optimistic local reorder.
    setColumnState((prev) => {
      const next = prev.map((c) => ({
        ...c,
        tasks: c.tasks.filter((t) => t.id !== taskId),
      }));
      const dest = next.find((c) => c.id === destColumnId);
      if (dest !== undefined) {
        dest.tasks.splice(destIndex, 0, movingTask);
      }
      return next;
    });

    const fd = new FormData();
    fd.set("_intent", "move-task");
    fd.set("task_id", taskId);
    fd.set("destination_column_id", destColumnId);
    fd.set("destination_index", String(destIndex));
    submit(fd, { method: "post" });
  }

  return (
    <main {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <h1 {...stylex.props(styles.workspaceName)}>
          {loaderData.workspaceName}
        </h1>
        <Form method="post" action="/auth/signout">
          <button type="submit" {...stylex.props(styles.signOutButton)}>
            Sign out
          </button>
        </Form>
      </header>

      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <section {...stylex.props(styles.board)} aria-label="Board">
          {columnState.map((column) => {
            const errorForThisColumn =
              actionData !== undefined &&
              actionData.intent === "create-task" &&
              actionData.forColumnId === column.id &&
              actionData.error !== ""
                ? actionData.error
                : null;
            return (
              <BoardColumn
                key={column.id}
                column={column}
                members={members}
                addTaskError={errorForThisColumn}
                onTaskClick={(id) => navigate(`/board?edit=${id}`)}
              />
            );
          })}
        </section>
      </DndContext>

      {loaderData.editingTask !== null && (
        <Modal title="Edit task" onClose={() => navigate("/board")}>
          <EditTaskForm
            taskId={loaderData.editingTask.id as never}
            initial={{
              title: loaderData.editingTask.title,
              description: loaderData.editingTask.description,
              columnId: loaderData.editingTask.columnId as never,
              assigneeUserId: loaderData.editingTask.assigneeUserId as never,
              dueDate: loaderData.editingTask.dueDate,
            }}
            values={
              updateError !== null &&
              updateError.taskId === loaderData.editingTask.id
                ? updateError.values
                : null
            }
            error={
              updateError !== null &&
              updateError.taskId === loaderData.editingTask.id
                ? updateError.error
                : null
            }
            members={members}
            columns={
              loaderData.columnOptions.map((c) => ({
                id: c.id,
                name: c.name,
              })) as never
            }
            onCancel={() => navigate("/board")}
          />
        </Modal>
      )}
    </main>
  );
}

type BoardColumnProps = {
  column: {
    id: string;
    name: string;
    tasks: Array<{ id: string; title: string }>;
  };
  members: ReadonlyArray<WorkspaceMember>;
  addTaskError: string | null;
  onTaskClick: (taskId: string) => void;
};

function BoardColumn(props: BoardColumnProps) {
  const { setNodeRef } = useDroppable({
    id: `${COLUMN_DROPPABLE_PREFIX}${props.column.id}`,
  });

  return (
    <div
      ref={setNodeRef}
      {...stylex.props(styles.column)}
      data-testid="board-column"
    >
      <h2 {...stylex.props(styles.columnTitle)}>{props.column.name}</h2>
      <SortableContext
        items={props.column.tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        {props.column.tasks.length === 0 ? (
          <p {...stylex.props(styles.columnEmpty)}>No tasks yet.</p>
        ) : (
          <ul {...stylex.props(styles.taskList)}>
            {props.column.tasks.map((task) => (
              <SortableTask
                key={task.id}
                taskId={task.id}
                title={task.title}
                onClick={() => props.onTaskClick(task.id)}
              />
            ))}
          </ul>
        )}
      </SortableContext>
      <AddTaskForm
        columnId={props.column.id as never}
        members={props.members}
        error={props.addTaskError}
      />
    </div>
  );
}

type SortableTaskProps = {
  taskId: string;
  title: string;
  onClick: () => void;
};

function SortableTask(props: SortableTaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.taskId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li {...stylex.props(styles.taskListItem)} style={style} ref={setNodeRef}>
      <button
        type="button"
        onClick={props.onClick}
        {...stylex.props(styles.taskCard)}
        data-testid="board-task"
        {...attributes}
        {...listeners}
      >
        {props.title}
      </button>
    </li>
  );
}

const styles = stylex.create({
  page: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    backgroundColor: colors.surface0,
    fontFamily: fontFamily.text,
    color: colors.textDefault,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: `${spacing.x4} ${spacing.x6}`,
    backgroundColor: colors.surface1,
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: colors.borderSubtle,
  },
  workspaceName: {
    margin: 0,
    fontSize: fontSize.titleMd,
    fontWeight: fontWeight.semiBold,
    lineHeight: lineHeight.heading,
    letterSpacing: letterSpacing.tight,
  },
  signOutButton: {
    padding: `${spacing.x2} ${spacing.x4}`,
    fontFamily: fontFamily.text,
    fontSize: fontSize.bodySm,
    fontWeight: fontWeight.medium,
    color: colors.textDefault,
    backgroundColor: {
      default: colors.surface1,
      ":hover": colors.surface2,
    },
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: colors.borderDefault,
    borderRadius: radius.md,
    cursor: "pointer",
  },
  board: {
    flex: 1,
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: spacing.x4,
    padding: spacing.x6,
  },
  column: {
    display: "flex",
    flexDirection: "column",
    gap: spacing.x3,
    padding: spacing.x4,
    backgroundColor: colors.surface2,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: colors.borderSubtle,
    borderRadius: radius.lg,
    minHeight: "200px",
  },
  columnTitle: {
    margin: 0,
    fontSize: fontSize.bodyXxs,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.body,
    letterSpacing: letterSpacing.wide,
    textTransform: "uppercase",
    color: colors.textMuted,
  },
  columnEmpty: {
    margin: 0,
    fontSize: fontSize.bodyXs,
    color: colors.textFaint,
  },
  taskList: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "flex",
    flexDirection: "column",
    gap: spacing.x2,
  },
  taskListItem: {
    display: "block",
  },
  taskCard: {
    display: "block",
    width: "100%",
    padding: spacing.x3,
    backgroundColor: colors.surface1,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: {
      default: colors.borderSubtle,
      ":hover": colors.borderDefault,
    },
    borderRadius: radius.md,
    fontFamily: fontFamily.text,
    fontSize: fontSize.bodyMd,
    lineHeight: lineHeight.body,
    color: colors.textDefault,
    textAlign: "left",
    cursor: "pointer",
  },
});

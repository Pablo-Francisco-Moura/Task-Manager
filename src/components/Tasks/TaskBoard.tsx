import {
  useSensor,
  useSensors,
  DndContext,
  useDroppable,
  PointerSensor,
  KeyboardSensor,
  closestCorners,
} from "@dnd-kit/core";
import {
  arrayMove,
  useSortable,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslation } from "react-i18next";
import { TaskPriorityBadge } from "@/components/TaskPriorityBadge";
import { IconButton, Tooltip } from "@mui/material";
import { formatTaskDueDate, isTaskDueDateOverdue } from "@/utils/taskDueDate";
import type { Task as TypeTask, TaskStatus } from "@prisma/client";
import type { DragEndEvent, UniqueIdentifier } from "@dnd-kit/core";
import styles from "./TaskBoard.module.css";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";

interface IProps {
  tasks: TypeTask[];
  isSaving: boolean;
  onReorder: (orderedTaskIdsByStatus: Record<TaskStatus, number[]>) => void;
  onEditClick: (task: TypeTask) => void;
  onDeleteClick: (task: TypeTask) => void;
}

const taskStatuses: TaskStatus[] = ["todo", "in_progress", "done"];
const statusLabelKeys: Record<TaskStatus, string> = {
  todo: "task.status.todo",
  in_progress: "task.status.inProgress",
  done: "task.status.done",
};

type TasksByStatus = Record<TaskStatus, TypeTask[]>;

function getColumnId(status: TaskStatus) {
  return `column:${status}`;
}

function getColumnStatus(id: string): TaskStatus | undefined {
  return taskStatuses.find((status) => getColumnId(status) === id);
}

function sortByPosition(first: TypeTask, second: TypeTask) {
  return first.position - second.position || first.id - second.id;
}

function groupTasks(tasks: TypeTask[]): TasksByStatus {
  return {
    todo: tasks.filter((task) => task.status === "todo").sort(sortByPosition),
    in_progress: tasks
      .filter((task) => task.status === "in_progress")
      .sort(sortByPosition),
    done: tasks.filter((task) => task.status === "done").sort(sortByPosition),
  };
}

function SortableTaskCard({
  task,
  isSaving,
  onEditClick,
  onDeleteClick,
}: {
  task: TypeTask;
  isSaving: boolean;
  onEditClick: (task: TypeTask) => void;
  onDeleteClick: (task: TypeTask) => void;
}) {
  const { t, i18n } = useTranslation();
  const dueValue = task.dueAt ?? task.dueDate;
  const hasDueTime = task.dueAt !== null;
  const isOverdue =
    task.status !== "done" &&
    dueValue !== null &&
    isTaskDueDateOverdue(dueValue, new Date(), hasDueTime);
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: isSaving });

  return (
    <li
      ref={setNodeRef}
      className={styles.cardShell}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.45 : 1,
      }}
    >
      <article className={styles.card}>
        <Tooltip arrow title={t("task.dragHandle", { name: task.name })}>
          <IconButton
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            className={styles.dragHandle}
            size="small"
            aria-label={t("task.dragHandle", { name: task.name })}
            disabled={isSaving}
          >
            <DragIndicatorIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <div className={styles.cardCopy}>
          <h4 className={styles.cardTitle}>{task.name}</h4>
          <TaskPriorityBadge priority={task.priority} />
          {task.description && (
            <p className={styles.cardDescription}>{task.description}</p>
          )}
          {dueValue && (
            <p className={styles.cardDueDate} data-overdue={isOverdue}>
              <EventOutlinedIcon fontSize="inherit" aria-hidden="true" />
              {t(
                isOverdue ? "task.dueDate.overdue" : "task.dueDate.label",
              )}: {formatTaskDueDate(dueValue, i18n.language, hasDueTime)}
            </p>
          )}
        </div>
        <div className={styles.cardActions}>
          <Tooltip arrow title={`${t("task.update.label")} ${task.name}`}>
            <IconButton
              aria-label={`${t("task.update.label")} ${task.name}`}
              onClick={() => onEditClick(task)}
              size="small"
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip arrow title={`${t("task.delete.label")} ${task.name}`}>
            <IconButton
              aria-label={`${t("task.delete.label")} ${task.name}`}
              onClick={() => onDeleteClick(task)}
              size="small"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </div>
      </article>
    </li>
  );
}

export function TaskBoard({
  tasks,
  isSaving,
  onEditClick,
  onDeleteClick,
  onReorder,
}: IProps) {
  const { t } = useTranslation();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const tasksByStatus = groupTasks(tasks);

  const findStatusForTask = (taskId: number) =>
    taskStatuses.find((status) =>
      tasksByStatus[status].some((task) => task.id === taskId),
    );
  const taskName = (id: UniqueIdentifier) =>
    tasks.find((task) => task.id === Number(id))?.name ?? "";
  const targetStatus = (id: UniqueIdentifier) =>
    getColumnStatus(String(id)) ?? findStatusForTask(Number(id));
  const statusLabel = (status: TaskStatus | undefined) =>
    status ? t(statusLabelKeys[status]) : "";

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || isSaving) return;

    const taskId = Number(active.id);
    const sourceStatus = findStatusForTask(taskId);
    const destinationStatus = targetStatus(over.id);
    if (!sourceStatus || !destinationStatus) return;

    const nextIdsByStatus: Record<TaskStatus, number[]> = {
      todo: tasksByStatus.todo.map((task) => task.id),
      in_progress: tasksByStatus.in_progress.map((task) => task.id),
      done: tasksByStatus.done.map((task) => task.id),
    };
    const sourceIds = nextIdsByStatus[sourceStatus];
    const sourceIndex = sourceIds.indexOf(taskId);
    if (sourceIndex < 0) return;

    if (sourceStatus === destinationStatus) {
      const destinationId = Number(over.id);
      const destinationIndex = sourceIds.includes(destinationId)
        ? sourceIds.indexOf(destinationId)
        : sourceIds.length - 1;
      if (destinationIndex < 0 || destinationIndex === sourceIndex) return;
      nextIdsByStatus[sourceStatus] = arrayMove(
        sourceIds,
        sourceIndex,
        destinationIndex,
      );
    } else {
      nextIdsByStatus[sourceStatus] = sourceIds.filter((id) => id !== taskId);
      const destinationIds = nextIdsByStatus[destinationStatus];
      const destinationId = Number(over.id);
      const destinationIndex = destinationIds.includes(destinationId)
        ? destinationIds.indexOf(destinationId)
        : destinationIds.length;
      destinationIds.splice(destinationIndex, 0, taskId);
    }

    onReorder(nextIdsByStatus);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragEnd={onDragEnd}
      accessibility={{
        screenReaderInstructions: {
          draggable: t("task.dragInstructions"),
        },
        announcements: {
          onDragStart: ({ active }) =>
            t("task.dragStarted", { name: taskName(active.id) }),
          onDragOver: ({ active, over }) =>
            over
              ? t("task.dragOver", {
                  name: taskName(active.id),
                  status: statusLabel(targetStatus(over.id)),
                })
              : "",
          onDragEnd: ({ active, over }) =>
            over
              ? t("task.dragCompleted", {
                  name: taskName(active.id),
                  status: statusLabel(targetStatus(over.id)),
                })
              : t("task.dragCancelled", { name: taskName(active.id) }),
          onDragCancel: ({ active }) =>
            t("task.dragCancelled", { name: taskName(active.id) }),
        },
      }}
    >
      <div
        className={styles.board}
        aria-label={t("task.board")}
        aria-busy={isSaving}
      >
        {taskStatuses.map((status) => {
          const statusTasks = tasksByStatus[status];
          const headingId = `task-column-${status}`;

          return (
            <TaskStatusColumn
              key={status}
              status={status}
              tasks={statusTasks}
              headingId={headingId}
              isSaving={isSaving}
              onEditClick={onEditClick}
              onDeleteClick={onDeleteClick}
            />
          );
        })}
      </div>
    </DndContext>
  );
}

function TaskStatusColumn({
  status,
  tasks,
  headingId,
  isSaving,
  onEditClick,
  onDeleteClick,
}: {
  status: TaskStatus;
  tasks: TypeTask[];
  headingId: string;
  isSaving: boolean;
  onEditClick: (task: TypeTask) => void;
  onDeleteClick: (task: TypeTask) => void;
}) {
  const { t } = useTranslation();
  const { isOver, setNodeRef } = useDroppable({ id: getColumnId(status) });

  return (
    <section
      className={styles.column}
      data-status={status}
      aria-labelledby={headingId}
    >
      <header className={styles.columnHeader}>
        <h3 id={headingId} className={styles.columnTitle}>
          {t(statusLabelKeys[status])}
        </h3>
        <span className={styles.columnCount}>{tasks.length}</span>
      </header>
      <SortableContext
        items={tasks.map((task) => task.id)}
        strategy={verticalListSortingStrategy}
      >
        <ol
          ref={setNodeRef}
          className={`${styles.cards}${isOver ? ` ${styles.cardsOver}` : ""}`}
          aria-labelledby={headingId}
          aria-busy={isSaving}
        >
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              isSaving={isSaving}
              onEditClick={onEditClick}
              onDeleteClick={onDeleteClick}
            />
          ))}
        </ol>
      </SortableContext>
    </section>
  );
}

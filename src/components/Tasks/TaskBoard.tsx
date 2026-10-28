import {
  useSensor,
  useSensors,
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCorners,
} from "@dnd-kit/core";
import { useTranslation } from "react-i18next";
import { TaskStatusColumn } from "./TaskStatusColumn";
import { getColumnStatus, groupTasks } from "./taskBoard.utils";
import { statusLabelKeys, taskStatuses } from "@/constants";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import type { DragEndEvent, UniqueIdentifier } from "@dnd-kit/core";
import type { TypeLocalTask, TypeLocalTaskStatus } from "@/types/localData";
import styles from "./TaskBoard.module.css";

interface IProps {
  tasks: TypeLocalTask[];
  isSaving: boolean;
  onReorder: (
    orderedTaskIdsByStatus: Record<TypeLocalTaskStatus, number[]>,
    movedTaskId: number,
  ) => void;
  onEditClick: (task: TypeLocalTask) => void;
  onDeleteClick: (task: TypeLocalTask) => void;
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
  const statusLabel = (status: TypeLocalTaskStatus | undefined) =>
    status ? t(statusLabelKeys[status]) : "";

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || isSaving) return;

    const taskId = Number(active.id);
    const sourceStatus = findStatusForTask(taskId);
    const destinationStatus = targetStatus(over.id);
    if (!sourceStatus || !destinationStatus) return;

    const nextIdsByStatus: Record<TypeLocalTaskStatus, number[]> = {
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

    onReorder(nextIdsByStatus, taskId);
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

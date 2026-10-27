import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { useTranslation } from "react-i18next";
import { TaskPriorityBadge } from "@/components/TaskPriorityBadge";
import { IconButton, Tooltip } from "@mui/material";
import { formatTaskDueDate, isTaskDueDateOverdue } from "@/utils/taskDueDate";
import type { TypeLocalTask } from "@/types/localData";
import styles from "./TaskBoard.module.css";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";

interface IProps {
  task: TypeLocalTask;
  isSaving: boolean;
  onEditClick: (task: TypeLocalTask) => void;
  onDeleteClick: (task: TypeLocalTask) => void;
}

export function SortableTaskCard({
  task,
  isSaving,
  onEditClick,
  onDeleteClick,
}: IProps) {
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
            disableRipple
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

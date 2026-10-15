import {
  Select,
  Tooltip,
  MenuItem,
  IconButton,
  FormControl,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { TaskPriorityBadge } from "@/components/TaskPriorityBadge";
import { formatTaskDueDate, isTaskDueDateOverdue } from "@/utils/taskDueDate";
import type { TypeLocalTask, TypeLocalTaskStatus } from "@/types/localData";
import React from "react";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";

interface IProps {
  task: TypeLocalTask;
  position: number;
  onEditClick: (task: TypeLocalTask) => void;
  onDeleteClick: (task: TypeLocalTask) => void;
  onStatusChange: (task: TypeLocalTask, status: TypeLocalTaskStatus) => void;
}

export function Task({
  task,
  position,
  onEditClick,
  onDeleteClick,
  onStatusChange,
}: IProps) {
  const { t, i18n } = useTranslation();
  const dueValue = task.dueAt ?? task.dueDate;
  const hasDueTime = task.dueAt !== null;
  const isOverdue =
    task.status !== "done" &&
    dueValue !== null &&
    isTaskDueDateOverdue(dueValue, new Date(), hasDueTime);

  return (
    <li className="task-row">
      <span className="task-position">{String(position).padStart(2, "0")}</span>
      <div className="task-copy">
        <span className="task-name">{task.name}</span>
        <TaskPriorityBadge priority={task.priority} />
        {task.description && (
          <span className="task-description">{task.description}</span>
        )}
        {dueValue && (
          <span
            className={`task-due-date${isOverdue ? " task-due-date-overdue" : ""}`}
          >
            <EventOutlinedIcon fontSize="inherit" aria-hidden="true" />
            {t(isOverdue ? "task.dueDate.overdue" : "task.dueDate.label")}:{" "}
            {formatTaskDueDate(dueValue, i18n.language, hasDueTime)}
          </span>
        )}
      </div>
      <FormControl
        className="task-status-control"
        data-status={task.status}
        size="small"
      >
        <Select
          value={task.status}
          inputProps={{
            "aria-label": `${t("task.status.label")}: ${task.name}`,
          }}
          onChange={(event) =>
            onStatusChange(task, event.target.value as TypeLocalTaskStatus)
          }
        >
          <MenuItem value="todo">{t("task.status.todo")}</MenuItem>
          <MenuItem value="in_progress">{t("task.status.inProgress")}</MenuItem>
          <MenuItem value="done">{t("task.status.done")}</MenuItem>
        </Select>
      </FormControl>
      <div className="task-row-actions">
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
    </li>
  );
}

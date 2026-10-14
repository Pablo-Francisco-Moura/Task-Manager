import {
  Select,
  Tooltip,
  MenuItem,
  IconButton,
  FormControl,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { Task as TypeTask, TaskStatus } from "@prisma/client";
import React from "react";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

interface IProps {
  task: TypeTask;
  position: number;
  onEditClick: (task: TypeTask) => void;
  onDeleteClick: (task: TypeTask) => void;
  onStatusChange: (task: TypeTask, status: TaskStatus) => void;
}

export function Task({
  task,
  position,
  onEditClick,
  onDeleteClick,
  onStatusChange,
}: IProps) {
  const { t } = useTranslation();

  return (
    <li className="task-row">
      <span className="task-position">{String(position).padStart(2, "0")}</span>
      <div className="task-copy">
        <span className="task-name">{task.name}</span>
        {task.description && (
          <span className="task-description">{task.description}</span>
        )}
      </div>
      <FormControl className="task-status-control" size="small">
        <Select
          value={task.status}
          inputProps={{ "aria-label": `${t("taskStatus")}: ${task.name}` }}
          onChange={(event) =>
            onStatusChange(task, event.target.value as TaskStatus)
          }
        >
          <MenuItem value="todo">{t("statusTodo")}</MenuItem>
          <MenuItem value="in_progress">{t("statusInProgress")}</MenuItem>
          <MenuItem value="done">{t("statusDone")}</MenuItem>
        </Select>
      </FormControl>
      <div className="task-row-actions">
        <Tooltip arrow title={`${t("editTask")} ${task.name}`}>
          <IconButton
            aria-label={`${t("editTask")} ${task.name}`}
            onClick={() => onEditClick(task)}
            size="small"
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip arrow title={`${t("deleteTask")} ${task.name}`}>
          <IconButton
            aria-label={`${t("deleteTask")} ${task.name}`}
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

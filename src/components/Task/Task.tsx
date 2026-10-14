import { useTranslation } from "react-i18next";
import { Task as TypeTask } from "@prisma/client";
import { IconButton, Tooltip } from "@mui/material";
import React from "react";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

interface IProps {
  task: TypeTask;
  position: number;
  onEditClick: (task: TypeTask) => void;
  onDeleteClick: (task: TypeTask) => void;
}

export function Task({ task, position, onEditClick, onDeleteClick }: IProps) {
  const { t } = useTranslation();

  return (
    <li className="task-row">
      <span className="task-position">{String(position).padStart(2, "0")}</span>
      <span className="task-name">{task.name}</span>
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

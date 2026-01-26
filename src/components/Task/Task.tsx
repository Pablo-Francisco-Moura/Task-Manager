import { useTranslation } from "react-i18next";
import { Task as TypeTask } from "@prisma/client";
import { IconButton, Tooltip } from "@mui/material";
import React from "react";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

interface Props {
  task: TypeTask;
  onEditClick: (task: TypeTask) => void;
  onDeleteClick: (task: TypeTask) => void;
}

export function Task({ task, onEditClick, onDeleteClick }: Props) {
  const { t } = useTranslation();

  return (
    <div
      key={task.id}
      className="w-full flex justify-between items-center gap-4"
    >
      <li className="text-gray-800 dark:text-white mb-1">{task.name}</li>
      <div>
        <Tooltip arrow title={`${t("editTask")} ${task.name}`}>
          <IconButton onClick={() => onEditClick(task)} size="small">
            <EditIcon className="dark:text-white" fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip arrow title={`${t("deleteTask")} ${task.name}`}>
          <IconButton onClick={() => onDeleteClick(task)} size="small">
            <DeleteIcon className="dark:text-white" fontSize="small" />
          </IconButton>
        </Tooltip>
      </div>
    </div>
  );
}

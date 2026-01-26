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
  return (
    <div
      key={task.id}
      className="w-full flex justify-between items-center gap-4"
    >
      <li className="text-gray-800 mb-1">{task.name}</li>
      <div>
        <Tooltip arrow title={`Editar tarefa: ${task.name}`}>
          <IconButton onClick={() => onEditClick(task)} size="small">
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip arrow title={`Deletar tarefa: ${task.name}`}>
          <IconButton onClick={() => onDeleteClick(task)} size="small">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </div>
    </div>
  );
}

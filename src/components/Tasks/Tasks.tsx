import { Task } from "@prisma/client";
import { Form } from "../Form";
import { Button } from "../Button";
import { useForm } from "react-hook-form";
import { TaskForm } from "@/components/TaskForm";
import { SubTitle } from "@/components/SubTitle";
import { deleteTask } from "@/hooks/useTasks/useCase/deleteTask.api";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { updateTask } from "@/hooks/useTasks/useCase/updateTask.api";
import { AlertMessage } from "@/components/AlertMessage";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useProjectStore } from "@/store/projectStore";
import { useProjects, useTasks } from "@/hooks";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { IconButton, Tooltip, Dialog } from "@mui/material";
import React, { useState } from "react";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

export function Tasks() {
  const selectedProject = useProjectStore((s) => s.selectedProject);

  const [editTask, setEditTask] = useState<Task | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [openAddTask, toggleOpenAddTask] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);

  const queryClient = useQueryClient();

  // Mutation to delete task.
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => deleteTask(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PROJECTS, selectedProject?.id],
      });
      await queryClient.refetchQueries({
        queryKey: [QUERY_KEYS.PROJECTS, selectedProject?.id],
      });
      setTaskToDelete(null);
      setOpenDialog(false);
    },
  });

  // Mutation to edit task.
  const updateMutation = useMutation({
    mutationFn: updateTask,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PROJECTS, selectedProject?.id],
      });
      await queryClient.refetchQueries({
        queryKey: [QUERY_KEYS.PROJECTS, selectedProject?.id],
      });
      setEditTask(null);
      setOpenEditDialog(false);
    },
  });

  // Edit form.
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<{ name: string }>({
    defaultValues: { name: "" },
  });

  // Handlers
  const handleDeleteClick = (task: Task) => {
    setTaskToDelete(task);
    setOpenDialog(true);
  };

  const handleConfirmDelete = () => {
    if (taskToDelete) {
      deleteMutation.mutate(taskToDelete.id);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setTaskToDelete(null);
  };

  const handleEditClick = (task: Task) => {
    setEditTask(task);
    reset({ name: task.name });
    setOpenEditDialog(true);
  };

  const handleEditClose = () => {
    setOpenEditDialog(false);
    setEditTask(null);
  };

  const onEditSubmit = async (data: { name: string }) => {
    if (editTask) {
      await updateMutation.mutateAsync({
        id: editTask.id,
        name: data.name,
        projectId: editTask.projectId,
      });
    }
  };

  const { projects, isLoading: isProjectsLoading } = useProjects();
  const {
    tasks,
    isError,
    isLoading: isTasksLoading,
  } = useTasks(selectedProject?.id);

  if (isProjectsLoading && projects === undefined) {
    return <AlertMessage message="Carregando projetos..." />;
  }

  if (projects && !selectedProject) {
    return <AlertMessage message="Selecione um projeto para ver as tarefas." />;
  }

  if (isTasksLoading) {
    return <AlertMessage message="Carregando tarefas..." />;
  }

  if (isError) {
    return <AlertMessage type="error" message="Erro ao buscar tarefas!" />;
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="flex gap-4 flex-col items-center justify-center w-full p-4">
        <AlertMessage message="Nenhuma tarefa associada a este projeto!" />
        {openAddTask && selectedProject ? (
          <TaskForm
            onClose={() => toggleOpenAddTask(false)}
            projectId={selectedProject.id}
          />
        ) : (
          <Button
            full={false}
            label="Add Task"
            onClick={() => toggleOpenAddTask(true)}
          />
        )}
      </div>
    );
  }

  return (
    <div
      className="w-full min-h-300 max-w-2xl bg-white shadow-md rounded-md p-4 mb-4 mx-2
     border border-grey-200 overflow-y-auto"
    >
      <SubTitle
        label={`Tasks of ${selectedProject?.name ?? ""}`}
        onClick={() => toggleOpenAddTask(!openAddTask)}
      />

      {selectedProject && openAddTask && (
        <div className="flex justify-center my-4">
          <TaskForm
            onClose={() => toggleOpenAddTask(false)}
            projectId={selectedProject.id}
          />
        </div>
      )}

      <ul className="list-none pl-0 ml-4 mt-6">
        {tasks
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((task: Task) => (
            <div
              key={task.id}
              className="w-full flex justify-between items-center gap-4"
            >
              <li className="text-gray-800 mb-1">{task.name}</li>
              <Tooltip arrow title={`Editar tarefa: ${task.name}`}>
                <IconButton onClick={() => handleEditClick(task)} size="small">
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip arrow title={`Deletar tarefa: ${task.name}`}>
                <IconButton
                  onClick={() => handleDeleteClick(task)}
                  size="small"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </div>
          ))}
      </ul>

      <Dialog open={openEditDialog} onClose={handleEditClose}>
        <Form
          title="Editar Tarefa"
          placeholder="Nome da tarefa"
          submitLabel="Salvar"
          error={
            updateMutation.isError ? "Erro ao atualizar tarefa" : undefined
          }
          isSubmitting={isSubmitting || updateMutation.isPending}
          register={register}
          onSubmit={handleSubmit(onEditSubmit)}
          onClose={handleEditClose}
        />
      </Dialog>

      <ConfirmDialog
        open={openDialog}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmDelete}
        description={`Tem certeza que deseja deletar a tarefa "${taskToDelete?.name}"? Essa ação não pode ser desfeita.`}
      />
    </div>
  );
}

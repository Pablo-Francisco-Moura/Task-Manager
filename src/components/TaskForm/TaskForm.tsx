import { useForm } from "react-hook-form";
import { useState } from "react";
import { createTask } from "@/hooks/useTasks/useCase/createTask.api";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface TaskFormProps {
  projectId: number;
  onClose: () => void;
}

interface TaskFormInputs {
  name: string;
}

export function TaskForm({ projectId, onClose }: TaskFormProps) {
  const {
    formState: { errors, isSubmitting },
    reset,
    register,
    handleSubmit,
  } = useForm<TaskFormInputs>();
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: TaskFormInputs) => {
      return createTask({ ...data, projectId });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TASKS] });
      await queryClient.refetchQueries({
        queryKey: [QUERY_KEYS.TASKS, projectId],
      });

      reset();
      setError(null);
      onClose();
    },
    onError: () => {
      setError("Erro ao cadastrar tarefa!");
    },
  });

  const onSubmit = (data: TaskFormInputs) => {
    setError(null);
    mutation.mutate(data);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-2 w-full max-w-md p-4 bg-white rounded shadow"
    >
      <label htmlFor="name" className="font-medium text-gray-700">
        Nome da Tarefa
      </label>
      <input
        id="name"
        type="text"
        {...register("name", { required: "Nome é obrigatório" })}
        className="text-black border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Digite o nome da tarefa"
        disabled={isSubmitting}
      />
      {errors?.name && (
        <span className="text-red-500 text-sm">{errors.name?.message}</span>
      )}
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Cadastrando..." : "Cadastrar Tarefa"}
      </button>
      {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
    </form>
  );
}

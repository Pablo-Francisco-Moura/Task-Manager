import { useForm } from "react-hook-form";
import { useState } from "react";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { createProject } from "@/hooks/useProjects/useCase/createProject.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";

interface Props {
  toggleOpenAddProject: (value: boolean) => void;
}

interface ProjectFormInputs {
  name: string;
}

export function ProjectForm({ toggleOpenAddProject }: Props) {
  const {
    formState: { errors, isSubmitting },
    reset,
    register,
    handleSubmit,
  } = useForm<ProjectFormInputs>();
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createProject,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROJECTS] });
      await queryClient.refetchQueries({ queryKey: [QUERY_KEYS.PROJECTS] });
      reset();
      setError(null);
      toggleOpenAddProject(false);
    },
    onError: () => {
      setError("Erro ao cadastrar projeto!");
    },
  });

  const onSubmit = (data: ProjectFormInputs) => {
    setError(null);
    mutation.mutate(data);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-2 w-full max-w-md p-4 bg-white rounded shadow"
    >
      <div className="flex flex-col gap-2 md:flex-row md:justify-between md:items-center">
        <label htmlFor="name" className="font-medium text-gray-700">
          Nome do Projeto
        </label>
        <IconButton
          color="error"
          onClick={() => toggleOpenAddProject(false)}
          className="mb-4"
        >
          <CloseIcon />
        </IconButton>
      </div>

      <input
        id="name"
        type="text"
        {...register("name", { required: "Nome é obrigatório" })}
        className="text-black border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Digite o nome do projeto"
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
        {isSubmitting ? "Cadastrando..." : "Cadastrar Projeto"}
      </button>

      {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
    </form>
  );
}

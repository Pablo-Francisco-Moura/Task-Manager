import { Form } from "@/components/Form";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { createProject } from "@/hooks/useProjects/useCase/createProject.api";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface Props {
  toggleOpenAddProject: (value: boolean) => void;
}

interface ProjectFormInputs {
  name: string;
}

export function ProjectForm({ toggleOpenAddProject }: Props) {
  const {
    formState: { isSubmitting },
    reset,
    register,
    handleSubmit,
  } = useForm<ProjectFormInputs>();
  const [error, setError] = useState<string | null>(null);

  const { t } = useTranslation();
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
      setError(t("errorCreatingProject"));
    },
  });

  const onSubmit = (data: ProjectFormInputs) => {
    setError(null);
    mutation.mutate(data);
  };

  return (
    <Form
      title={t("projectName")}
      error={error}
      onClose={() => toggleOpenAddProject(false)}
      onSubmit={handleSubmit(onSubmit)}
      register={register}
      submitLabel={t("registerProject")}
      placeholder={t("enterProjectName")}
      isSubmitting={isSubmitting}
    />
  );
}

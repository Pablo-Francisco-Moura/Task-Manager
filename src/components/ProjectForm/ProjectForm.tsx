import { Form } from "@/components/Form";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { createProject } from "@/hooks/useProjects/useCase/createProject.api";
import { useTranslation } from "react-i18next";
import { useFeedbackStore } from "@/store/feedbackStore";
import { MAX_DESCRIPTION_LENGTH } from "@/constants";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface IProps {
  toggleOpenAddProject: (value: boolean) => void;
}

interface IProjectFormInputs {
  name: string;
  description: string;
}

export function ProjectForm({ toggleOpenAddProject }: IProps) {
  const {
    formState: { isSubmitting },
    reset,
    register,
    handleSubmit,
  } = useForm<IProjectFormInputs>({
    defaultValues: { name: "", description: "" },
  });
  const [error, setError] = useState<string | null>(null);

  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const showFeedback = useFeedbackStore((state) => state.showFeedback);

  const mutation = useMutation({
    mutationFn: createProject,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROJECTS] });
      await queryClient.refetchQueries({ queryKey: [QUERY_KEYS.PROJECTS] });

      reset();
      setError(null);
      toggleOpenAddProject(false);
      showFeedback(t("projectCreated"));
    },
    onError: () => {
      setError(t("errorCreatingProject"));
    },
  });

  const onSubmit = (data: IProjectFormInputs) => {
    setError(null);
    mutation.mutate(data);
  };

  return (
    <Form
      title={t("projectName")}
      error={error}
      inputId="project-create-name"
      onClose={() => toggleOpenAddProject(false)}
      onSubmit={handleSubmit(onSubmit)}
      register={register}
      submitLabel={t("registerProject")}
      placeholder={t("enterProjectName")}
      descriptionField={{
        inputId: "project-create-description",
        label: t("projectDescription"),
        placeholder: t("enterProjectDescription"),
        maxLength: MAX_DESCRIPTION_LENGTH,
      }}
      isSubmitting={isSubmitting || mutation.isPending}
    />
  );
}

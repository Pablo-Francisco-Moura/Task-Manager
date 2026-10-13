import { Form } from "@/components/Form";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { createProject } from "@/hooks/useProjects/useCase/createProject.api";
import { useTranslation } from "react-i18next";
import { useFeedbackStore } from "@/store/feedbackStore";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface IProps {
  toggleOpenAddProject: (value: boolean) => void;
}

interface IProjectFormInputs {
  name: string;
}

export function ProjectForm({ toggleOpenAddProject }: IProps) {
  const {
    formState: { isSubmitting },
    reset,
    register,
    handleSubmit,
  } = useForm<IProjectFormInputs>();
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
      onClose={() => toggleOpenAddProject(false)}
      onSubmit={handleSubmit(onSubmit)}
      register={register}
      submitLabel={t("registerProject")}
      placeholder={t("enterProjectName")}
      isSubmitting={isSubmitting || mutation.isPending}
    />
  );
}

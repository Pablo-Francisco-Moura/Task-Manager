import { Form } from "@/components/Form";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { createTask } from "@/hooks/useTasks/useCase/createTask.api";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { useTranslation } from "react-i18next";
import { useFeedbackStore } from "@/store/feedbackStore";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface IProps {
  projectId: number;
  onClose: () => void;
}

interface ITaskFormInputs {
  name: string;
}

export function TaskForm({ projectId, onClose }: IProps) {
  const {
    formState: { isSubmitting },
    reset,
    register,
    handleSubmit,
  } = useForm<ITaskFormInputs>();
  const [error, setError] = useState<string | null>(null);

  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const showFeedback = useFeedbackStore((state) => state.showFeedback);

  const mutation = useMutation({
    mutationFn: async (data: ITaskFormInputs) => {
      return createTask({ ...data, projectId });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.TASKS, projectId],
      });
      await queryClient.refetchQueries({
        queryKey: [QUERY_KEYS.TASKS, projectId],
      });

      reset();
      setError(null);
      onClose();
      showFeedback(t("taskCreated"));
    },
    onError: () => {
      setError(t("errorCreatingTask"));
    },
  });

  const onSubmit = (data: ITaskFormInputs) => {
    setError(null);
    mutation.mutate(data);
  };

  return (
    <Form
      title={t("taskName")}
      error={error}
      inputId="task-create-name"
      onClose={onClose}
      onSubmit={handleSubmit(onSubmit)}
      register={register}
      submitLabel={t("registerTask")}
      placeholder={t("enterTaskName")}
      isSubmitting={isSubmitting || mutation.isPending}
    />
  );
}

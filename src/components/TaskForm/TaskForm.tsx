import { Form } from "@/components/Form";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { createTask } from "@/hooks/useTasks/useCase/createTask.api";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { useTranslation } from "react-i18next";
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
    formState: { isSubmitting },
    reset,
    register,
    handleSubmit,
  } = useForm<TaskFormInputs>();
  const [error, setError] = useState<string | null>(null);

  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: TaskFormInputs) => {
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
    },
    onError: () => {
      setError(t("errorCreatingTask"));
    },
  });

  const onSubmit = (data: TaskFormInputs) => {
    setError(null);
    mutation.mutate(data);
  };

  return (
    <Form
      title={t("taskName")}
      error={error}
      onClose={onClose}
      onSubmit={handleSubmit(onSubmit)}
      register={register}
      submitLabel={t("registerTask")}
      placeholder={t("enterTaskName")}
      isSubmitting={isSubmitting}
    />
  );
}

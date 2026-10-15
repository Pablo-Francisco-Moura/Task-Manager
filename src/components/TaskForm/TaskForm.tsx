import { Form } from "@/components/Form";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { createTask } from "@/hooks/useTasks/useCase/createTask.api";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { useTranslation } from "react-i18next";
import { useFeedbackStore } from "@/store/feedbackStore";
import { MAX_DESCRIPTION_LENGTH } from "@/constants";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TaskPriority } from "@prisma/client";

interface IProps {
  projectId: number;
  onClose: () => void;
}

interface ITaskFormInputs {
  name: string;
  priority: TaskPriority;
  description: string;
}

export function TaskForm({ projectId, onClose }: IProps) {
  const {
    formState: { isSubmitting, isValid, errors },
    reset,
    register,
    handleSubmit,
  } = useForm<ITaskFormInputs>({
    mode: "onChange",
    defaultValues: { name: "", description: "", priority: "normal" },
  });
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
      showFeedback(t("task.create.success"));
    },
    onError: () => {
      setError(t("task.create.error"));
    },
  });

  const onSubmit = (data: ITaskFormInputs) => {
    setError(null);
    mutation.mutate(data);
  };

  return (
    <Form
      title={t("task.name")}
      error={error}
      nameError={errors.name?.message}
      submitDisabled={!isValid}
      inputId="task-create-name"
      onClose={onClose}
      onSubmit={handleSubmit(onSubmit)}
      register={register}
      submitLabel={t("task.create.submit")}
      placeholder={t("task.create.enterName")}
      descriptionField={{
        inputId: "task-create-description",
        label: t("task.description"),
        placeholder: t("task.enterDescription"),
        maxLength: MAX_DESCRIPTION_LENGTH,
      }}
      priorityField={{
        inputId: "task-create-priority",
        label: t("task.priority.label"),
        defaultValue: "normal",
        options: [
          { value: "low", label: t("task.priority.low") },
          { value: "normal", label: t("task.priority.normal") },
          { value: "high", label: t("task.priority.high") },
        ],
      }}
      isSubmitting={isSubmitting || mutation.isPending}
    />
  );
}

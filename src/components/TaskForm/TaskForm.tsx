import { Form } from "@/components/Form";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { createTask } from "@/hooks/useTasks/useCase/createTask.api";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { useTranslation } from "react-i18next";
import { useFeedbackStore } from "@/store/feedbackStore";
import { MAX_DESCRIPTION_LENGTH } from "@/constants";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TaskPriority, TaskStatus } from "@prisma/client";

interface IProps {
  projectId: number;
  onClose: () => void;
}

interface ITaskFormInputs {
  name: string;
  status: TaskStatus;
  dueDate: string;
  priority: TaskPriority;
  description: string;
}

export function TaskForm({ projectId, onClose }: IProps) {
  const {
    formState: { isSubmitting, isValid, errors },
    reset,
    register,
    watch,
    handleSubmit,
  } = useForm<ITaskFormInputs>({
    mode: "onChange",
    defaultValues: {
      name: "",
      status: "todo",
      dueDate: "",
      priority: "normal",
      description: "",
    },
  });
  const [error, setError] = useState<string | null>(null);

  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const showFeedback = useFeedbackStore((state) => state.showFeedback);

  const mutation = useMutation({
    mutationFn: async (data: ITaskFormInputs) => {
      return createTask({
        ...data,
        dueDate: data.dueDate || null,
        projectId,
      });
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
      statusField={{
        label: t("task.status.label"),
        inputId: "task-create-status",
        defaultValue: "todo",
        value: watch("status"),
        options: [
          { value: "todo", label: t("task.status.todo") },
          { value: "in_progress", label: t("task.status.inProgress") },
          { value: "done", label: t("task.status.done") },
        ],
      }}
      priorityField={{
        inputId: "task-create-priority",
        label: t("task.priority.label"),
        defaultValue: "normal",
        value: watch("priority"),
        options: [
          { value: "low", label: t("task.priority.low") },
          { value: "normal", label: t("task.priority.normal") },
          { value: "high", label: t("task.priority.high") },
        ],
      }}
      dueDateField={{
        label: t("task.dueDate.label"),
        inputId: "task-create-due-date",
        defaultValue: "",
      }}
      isSubmitting={isSubmitting || mutation.isPending}
    />
  );
}

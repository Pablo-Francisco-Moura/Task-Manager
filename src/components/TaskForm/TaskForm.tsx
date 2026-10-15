import type {
  TypeLocalTaskStatus,
  TypeLocalTaskPriority,
} from "@/types/localData";
import { Form } from "@/components/Form";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { createTask } from "@/hooks/useTasks/useCase/createTask.api";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { useTranslation } from "react-i18next";
import { useFeedbackStore } from "@/store/feedbackStore";
import { toTaskDueAtISOString } from "@/utils/taskDueDate";
import { MAX_DESCRIPTION_LENGTH } from "@/constants";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface IProps {
  projectId: number;
  onClose: () => void;
}

interface ITaskFormInputs {
  name: string;
  status: TypeLocalTaskStatus;
  dueDate: string;
  dueTime: string;
  priority: TypeLocalTaskPriority;
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
      dueTime: "",
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
      const dueAt = toTaskDueAtISOString(data.dueDate, data.dueTime);
      return createTask({
        name: data.name,
        dueAt,
        status: data.status,
        dueDate: dueAt ? null : data.dueDate || null,
        priority: data.priority,
        projectId,
        description: data.description,
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
        dateLabel: t("task.dueDate.dateLabel"),
        inputId: "task-create-due-date",
        timeLabel: t("task.dueDate.timeLabel"),
        timeInputId: "task-create-due-time",
        defaultTime: "",
        defaultValue: "",
        dateRequiredMessage: t("task.dueDate.dateRequired"),
        dateError: errors.dueDate?.message ?? errors.dueTime?.message,
      }}
      isSubmitting={isSubmitting || mutation.isPending}
    />
  );
}

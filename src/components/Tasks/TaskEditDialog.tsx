import {
  toTaskDueDateInputValue,
  toTaskDueTimeInputValue,
} from "@/utils/taskDueDate";
import { Form } from "../Form";
import { Dialog } from "@mui/material";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { normalizeTaskPriority } from "@/utils/taskPriority";
import { MAX_DESCRIPTION_LENGTH } from "@/constants";
import type { TypeLocalTask, TypeLocalTaskStatus } from "@/types/localData";

export interface TypeTaskEditFormValues {
  name: string;
  status: TypeLocalTaskStatus;
  dueDate: string;
  dueTime: string;
  priority: TypeLocalTask["priority"];
  description: string;
}

interface IProps {
  task: TypeLocalTask | null;
  open: boolean;
  hasError: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: TypeTaskEditFormValues) => Promise<void>;
}

export function TaskEditDialog({
  task,
  open,
  hasError,
  isSubmitting,
  onClose,
  onSubmit,
}: IProps) {
  const { t } = useTranslation();
  const {
    watch,
    reset,
    trigger,
    register,
    handleSubmit,
    formState: { isSubmitting: isFormSubmitting, isValid, errors },
  } = useForm<TypeTaskEditFormValues>({
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

  useEffect(() => {
    if (!task) return;
    reset({
      name: task.name,
      status: task.status,
      dueDate: toTaskDueDateInputValue(
        task.dueAt ?? task.dueDate,
        task.dueAt !== null,
      ),
      dueTime: toTaskDueTimeInputValue(task.dueAt),
      priority: normalizeTaskPriority(task.priority),
      description: task.description ?? "",
    });
    void trigger(["dueDate", "dueTime"]);
  }, [reset, task, trigger]);

  return (
    <Dialog open={open} onClose={onClose}>
      <Form
        title={t("task.update.label")}
        error={hasError ? t("task.update.error") : undefined}
        nameError={errors.name?.message}
        submitDisabled={!isValid}
        inputId={`task-edit-name-${task?.id ?? "pending"}`}
        onClose={onClose}
        register={register}
        onSubmit={handleSubmit(onSubmit)}
        placeholder={t("task.name")}
        submitLabel={t("common.save")}
        descriptionField={{
          inputId: `task-edit-description-${task?.id ?? "pending"}`,
          label: t("task.description"),
          placeholder: t("task.enterDescription"),
          maxLength: MAX_DESCRIPTION_LENGTH,
        }}
        statusField={{
          label: t("task.status.label"),
          inputId: `task-edit-status-${task?.id ?? "pending"}`,
          defaultValue: task?.status ?? "todo",
          value: watch("status"),
          options: [
            { value: "todo", label: t("task.status.todo") },
            { value: "in_progress", label: t("task.status.inProgress") },
            { value: "done", label: t("task.status.done") },
          ],
        }}
        priorityField={{
          inputId: `task-edit-priority-${task?.id ?? "pending"}`,
          label: t("task.priority.label"),
          defaultValue: task?.priority ?? "normal",
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
          inputId: `task-edit-due-date-${task?.id ?? "pending"}`,
          defaultValue: toTaskDueDateInputValue(
            task?.dueAt ?? task?.dueDate ?? null,
            task?.dueAt !== null && task?.dueAt !== undefined,
          ),
          timeLabel: t("task.dueDate.timeLabel"),
          timeInputId: `task-edit-due-time-${task?.id ?? "pending"}`,
          defaultTime: toTaskDueTimeInputValue(task?.dueAt ?? null),
          dateRequiredMessage: t("task.dueDate.dateRequired"),
          dateError: errors.dueDate?.message ?? errors.dueTime?.message,
        }}
        isSubmitting={isSubmitting || isFormSubmitting}
      />
    </Dialog>
  );
}

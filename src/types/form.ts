import type { FormEvent } from "react";
import type { FieldValues, UseFormRegister } from "react-hook-form";

export interface TypeFormChoiceField {
  label: string;
  value: string;
  inputId: string;
  options: Array<{ value: string; label: string }>;
  defaultValue: string;
}

export interface TypeFormDueDateField {
  label: string;
  inputId: string;
  dateLabel: string;
  timeLabel: string;
  timeInputId: string;
  defaultTime: string;
  defaultValue: string;
  dateRequiredMessage: string;
  dateError?: string;
}

export interface TypeFormDescriptionField {
  label: string;
  inputId: string;
  maxLength: number;
  placeholder: string;
}

export interface TypeFormSelectFieldProps<
  TFieldValues extends FieldValues & { name: string },
> {
  field: TypeFormChoiceField;
  fieldName: "status" | "priority";
  className: string;
  isSubmitting?: boolean;
  register: UseFormRegister<TFieldValues>;
}

export interface TypeFormDueDateFieldsProps<
  TFieldValues extends FieldValues & { name: string },
> {
  field: TypeFormDueDateField;
  isSubmitting?: boolean;
  register: UseFormRegister<TFieldValues>;
}

export interface TypeFormProps<
  TFieldValues extends FieldValues & { name: string },
> {
  title: string;
  inputId: string;
  placeholder: string;
  submitLabel: string;
  error?: string | null;
  stepIndex?: 0 | 1;
  nameError?: string;
  register: UseFormRegister<TFieldValues>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  stepLabels?: [string, string];
  statusField?: TypeFormChoiceField;
  dueDateField?: TypeFormDueDateField;
  isSubmitting?: boolean;
  priorityField?: TypeFormChoiceField;
  submitDisabled?: boolean;
  descriptionField?: TypeFormDescriptionField;
  onClose?: () => void;
  onNextStep?: () => void;
  onPreviousStep?: () => void;
}

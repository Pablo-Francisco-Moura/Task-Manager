import { useTranslation } from "react-i18next";
import { IconButton, Tooltip } from "@mui/material";
import { FieldPath, FieldValues, UseFormRegister } from "react-hook-form";
import styles from "./Form.module.css";
import CloseIcon from "@mui/icons-material/Close";

interface IProps<TFieldValues extends FieldValues & { name: string }> {
  title: string;
  inputId: string;
  placeholder: string;
  submitLabel: string;
  error?: string | null;
  nameError?: string;
  isSubmitting?: boolean;
  submitDisabled?: boolean;
  register: UseFormRegister<TFieldValues>;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onClose?: () => void;
  descriptionField?: {
    label: string;
    inputId: string;
    maxLength: number;
    placeholder: string;
  };
}

export function Form<TFieldValues extends FieldValues & { name: string }>({
  title,
  error,
  inputId,
  nameError,
  placeholder,
  submitLabel,
  isSubmitting,
  submitDisabled,
  descriptionField,
  onClose,
  onSubmit,
  register,
}: IProps<TFieldValues>) {
  const { t } = useTranslation();

  return (
    <form onSubmit={onSubmit} className={`${styles.form} app-form`}>
      <div className={`${styles.heading} app-form-heading`}>
        <label htmlFor={inputId} className={`${styles.title} app-form-title`}>
          {title}
        </label>
        {onClose && (
          <Tooltip arrow title={t("close")}>
            <IconButton
              type="button"
              color="error"
              onClick={onClose}
              aria-label={t("close")}
            >
              <CloseIcon />
            </IconButton>
          </Tooltip>
        )}
      </div>

      <input
        id={inputId}
        type="text"
        {...register("name" as FieldPath<TFieldValues>, {
          required: t("nameRequired"),
          validate: (value: string) =>
            value.trim().length > 0 || t("nameRequired"),
          maxLength: { value: 200, message: t("nameRequired") },
        })}
        disabled={isSubmitting}
        aria-invalid={Boolean(nameError)}
        aria-describedby={nameError ? `${inputId}-name-error` : undefined}
        className={`${styles.input} app-form-input${nameError ? ` ${styles.inputError} app-form-input-error` : ""}`}
        placeholder={placeholder}
      />
      {nameError && (
        <div
          id={`${inputId}-name-error`}
          className={`${styles.fieldError} app-form-field-error`}
        >
          {nameError}
        </div>
      )}

      {descriptionField && (
        <div
          className={`${styles.descriptionField} app-form-description-field`}
        >
          <label
            htmlFor={descriptionField.inputId}
            className={`${styles.title} app-form-title`}
          >
            {descriptionField.label}
          </label>
          <textarea
            id={descriptionField.inputId}
            {...register("description" as FieldPath<TFieldValues>)}
            disabled={isSubmitting}
            className={`${styles.input} ${styles.textarea} app-form-input app-form-textarea`}
            placeholder={descriptionField.placeholder}
            maxLength={descriptionField.maxLength}
            rows={4}
          />
        </div>
      )}

      <button
        type="submit"
        className={`${styles.submit} app-form-submit`}
        disabled={isSubmitting || submitDisabled}
      >
        {isSubmitting ? t("saving") : submitLabel}
      </button>
      {error && (
        <div
          id={`${inputId}-error`}
          className={`${styles.error} app-form-error`}
          role="alert"
        >
          {error}
        </div>
      )}
    </form>
  );
}

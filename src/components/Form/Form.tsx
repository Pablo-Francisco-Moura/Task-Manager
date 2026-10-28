"use client";

import { useTranslation } from "react-i18next";
import { Tooltip, IconButton } from "@mui/material";
import {
  FormSelectField,
  FormDueDateFields,
} from "./FormFields";
import type { FieldPath, FieldValues, UseFormRegister } from "react-hook-form";
import type { TypeFormProps } from "@/types";
import styles from "./Form.module.css";
import CloseIcon from "@mui/icons-material/Close";

export function Form<TFieldValues extends FieldValues & { name: string }>({
  title,
  error,
  inputId,
  register,
  nameError,
  placeholder,
  submitLabel,
  statusField,
  isSubmitting,
  dueDateField,
  priorityField,
  submitDisabled,
  descriptionField,
  onClose,
  onSubmit,
}: TypeFormProps<TFieldValues>) {
  const { t } = useTranslation();

  return (
    <form onSubmit={onSubmit} className={`${styles.form} app-form`}>
      <div className={`${styles.heading} app-form-heading`}>
        <label htmlFor={inputId} className={`${styles.title} app-form-title`}>
          {title}
        </label>
        {onClose ? (
          <Tooltip arrow title={t("common.close")}>
            <IconButton
              type="button"
              color="error"
              onClick={onClose}
              aria-label={t("common.close")}
            >
              <CloseIcon />
            </IconButton>
          </Tooltip>
        ) : null}
      </div>

      <input
        id={inputId}
        type="text"
        {...register("name" as FieldPath<TFieldValues>, {
          required: t("common.nameRequired"),
          validate: (value: string) =>
            value.trim().length > 0 || t("common.nameRequired"),
          maxLength: { value: 200, message: t("common.nameTooLong") },
        })}
        disabled={isSubmitting}
        aria-invalid={Boolean(nameError)}
        aria-describedby={nameError ? `${inputId}-name-error` : undefined}
        className={`${styles.input} app-form-input${nameError ? ` ${styles.inputError} app-form-input-error` : ""}`}
        placeholder={placeholder}
      />
      {nameError ? (
        <div
          id={`${inputId}-name-error`}
          className={`${styles.fieldError} app-form-field-error`}
        >
          {nameError}
        </div>
      ) : null}

      {descriptionField ? (
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
      ) : null}

      {dueDateField ? (
        <FormDueDateFields
          field={dueDateField}
          isSubmitting={isSubmitting}
          register={register}
        />
      ) : null}
      {statusField ? (
        <FormSelectField
          field={statusField}
          fieldName="status"
          className={styles.statusSelect}
          isSubmitting={isSubmitting}
          register={register}
        />
      ) : null}
      {priorityField ? (
        <FormSelectField
          field={priorityField}
          fieldName="priority"
          className={styles.prioritySelect}
          isSubmitting={isSubmitting}
          register={register}
        />
      ) : null}

      <button
        type="submit"
        className={`${styles.submit} app-form-submit`}
        disabled={isSubmitting || submitDisabled}
      >
        {isSubmitting ? t("common.saving") : submitLabel}
      </button>
      {error ? (
        <div
          id={`${inputId}-error`}
          className={`${styles.error} app-form-error`}
          role="alert"
        >
          {error}
        </div>
      ) : null}
    </form>
  );
}

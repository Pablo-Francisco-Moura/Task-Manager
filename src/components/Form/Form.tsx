"use client";

import { Stack, Button, Typography } from "@mui/material";
import { FormSelectField, FormDueDateFields } from "./FormFields";
import { useTranslation } from "react-i18next";
import { Tooltip, IconButton } from "@mui/material";
import type { FormEvent } from "react";
import type { TypeFormProps } from "@/types";
import type { FieldPath, FieldValues } from "react-hook-form";
import styles from "./Form.module.css";
import CloseIcon from "@mui/icons-material/Close";

export function Form<TFieldValues extends FieldValues & { name: string }>({
  title,
  error,
  inputId,
  nameError,
  stepIndex,
  stepLabels,
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
  register,
  onNextStep,
  onPreviousStep,
}: TypeFormProps<TFieldValues>) {
  const { t } = useTranslation();
  const isWizard = stepIndex !== undefined;
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (stepIndex === 0) {
      event.preventDefault();
      onNextStep?.();
      return;
    }
    onSubmit(event);
  };

  return (
    <form onSubmit={handleSubmit} className={`${styles.form} app-form`}>
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

      {isWizard && stepLabels ? (
        <Typography variant="caption" color="text.secondary">
          {t("common.stepOf", {
            step: stepIndex + 1,
            total: stepLabels.length,
          })}
          {" · "}
          {stepLabels[stepIndex]}
        </Typography>
      ) : null}

      {stepIndex === undefined || stepIndex === 0 ? (
        <>
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
        </>
      ) : null}
      {stepIndex === undefined || stepIndex === 1 ? (
        <>
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
        </>
      ) : null}

      {isWizard ? (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          {onClose ? (
            <Button type="button" onClick={onClose} disabled={isSubmitting}>
              {t("common.cancel")}
            </Button>
          ) : null}
          {stepIndex === 1 ? (
            <Button
              type="button"
              onClick={onPreviousStep}
              disabled={isSubmitting}
            >
              {t("common.back")}
            </Button>
          ) : null}
          {stepIndex === 0 ? (
            <Button
              type="button"
              variant="contained"
              onClick={onNextStep}
              disabled={isSubmitting || submitDisabled}
            >
              {t("common.continue")}
            </Button>
          ) : (
            <button
              type="submit"
              className={`${styles.submit} app-form-submit`}
              disabled={isSubmitting || submitDisabled}
            >
              {isSubmitting ? t("common.saving") : submitLabel}
            </button>
          )}
        </Stack>
      ) : (
        <button
          type="submit"
          className={`${styles.submit} app-form-submit`}
          disabled={isSubmitting || submitDisabled}
        >
          {isSubmitting ? t("common.saving") : submitLabel}
        </button>
      )}
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

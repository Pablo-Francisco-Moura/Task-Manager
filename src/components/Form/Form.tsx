import { useTranslation } from "react-i18next";
import { IconButton, Tooltip } from "@mui/material";
import { FieldPath, FieldValues, UseFormRegister } from "react-hook-form";
import CloseIcon from "@mui/icons-material/Close";

interface IProps<TFieldValues extends FieldValues & { name: string }> {
  title: string;
  inputId: string;
  placeholder: string;
  submitLabel: string;
  error?: string | null;
  isSubmitting?: boolean;
  register: UseFormRegister<TFieldValues>;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onClose?: () => void;
  descriptionField?: {
    inputId: string;
    label: string;
    placeholder: string;
    maxLength: number;
  };
}

export function Form<TFieldValues extends FieldValues & { name: string }>({
  title,
  error,
  inputId,
  placeholder,
  submitLabel,
  isSubmitting,
  onClose,
  onSubmit,
  register,
  descriptionField,
}: IProps<TFieldValues>) {
  const { t } = useTranslation();

  return (
    <form onSubmit={onSubmit} className="app-form">
      <div className="app-form-heading">
        <label htmlFor={inputId} className="app-form-title">
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
        })}
        disabled={isSubmitting}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className="app-form-input"
        placeholder={placeholder}
      />

      {descriptionField && (
        <div className="app-form-description-field">
          <label htmlFor={descriptionField.inputId} className="app-form-title">
            {descriptionField.label}
          </label>
          <textarea
            id={descriptionField.inputId}
            {...register("description" as FieldPath<TFieldValues>)}
            disabled={isSubmitting}
            className="app-form-input app-form-textarea"
            placeholder={descriptionField.placeholder}
            maxLength={descriptionField.maxLength}
            rows={4}
          />
        </div>
      )}

      <button type="submit" className="app-form-submit" disabled={isSubmitting}>
        {isSubmitting ? t("saving") : submitLabel}
      </button>
      {error && (
        <div id={`${inputId}-error`} className="app-form-error" role="alert">
          {error}
        </div>
      )}
    </form>
  );
}

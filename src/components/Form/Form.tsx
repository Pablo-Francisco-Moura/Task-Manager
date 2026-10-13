import { useTranslation } from "react-i18next";
import { IconButton, Tooltip } from "@mui/material";
import { FieldPath, FieldValues, UseFormRegister } from "react-hook-form";
import CloseIcon from "@mui/icons-material/Close";

interface IProps<TFieldValues extends FieldValues & { name: string }> {
  title: string;
  placeholder: string;
  submitLabel: string;
  error?: string | null;
  isSubmitting?: boolean;
  register: UseFormRegister<TFieldValues>;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onClose?: () => void;
}

export function Form<TFieldValues extends FieldValues & { name: string }>({
  title,
  error,
  placeholder,
  submitLabel,
  isSubmitting,
  onClose,
  onSubmit,
  register,
}: IProps<TFieldValues>) {
  const { t } = useTranslation();

  return (
    <form onSubmit={onSubmit} className="app-form">
      <div className="app-form-heading">
        <label htmlFor="name" className="app-form-title">
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
        id="name"
        type="text"
        {...register("name" as FieldPath<TFieldValues>, {
          required: t("nameRequired"),
        })}
        disabled={isSubmitting}
        className="app-form-input"
        placeholder={placeholder}
      />

      <button type="submit" className="app-form-submit" disabled={isSubmitting}>
        {isSubmitting ? t("saving") : submitLabel}
      </button>
      {error && (
        <div className="app-form-error" role="alert">
          {error}
        </div>
      )}
    </form>
  );
}

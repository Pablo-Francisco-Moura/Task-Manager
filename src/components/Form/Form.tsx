import {
  Select,
  Tooltip,
  MenuItem,
  TextField,
  IconButton,
  InputLabel,
  FormControl,
  InputAdornment,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { FieldPath, FieldValues, UseFormRegister } from "react-hook-form";
import styles from "./Form.module.css";
import CloseIcon from "@mui/icons-material/Close";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";

function openNativePicker(inputId: string) {
  const input = document.getElementById(inputId) as HTMLInputElement | null;
  if (!input) return;

  if (typeof input.showPicker === "function") {
    input.showPicker();
    return;
  }

  input.focus();
  input.click();
}

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
  statusField?: {
    label: string;
    inputId: string;
    options: Array<{ value: string; label: string }>;
    defaultValue: string;
    value: string;
  };
  priorityField?: {
    label: string;
    inputId: string;
    options: Array<{ value: string; label: string }>;
    defaultValue: string;
    value: string;
  };
  dueDateField?: {
    label: string;
    inputId: string;
    dateLabel: string;
    timeLabel: string;
    timeInputId: string;
    defaultTime: string;
    defaultValue: string;
    dateRequiredMessage: string;
    dateError?: string;
  };
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
  statusField,
  isSubmitting,
  dueDateField,
  priorityField,
  submitDisabled,
  descriptionField,
  onClose,
  onSubmit,
  register,
}: IProps<TFieldValues>) {
  const { t } = useTranslation();
  const dueDateRegistration = dueDateField
    ? register("dueDate" as FieldPath<TFieldValues>, {
        deps: "dueTime" as FieldPath<TFieldValues>,
      })
    : undefined;
  const dueTimeRegistration = dueDateField
    ? register("dueTime" as FieldPath<TFieldValues>, {
        validate: (value: string, values: TFieldValues) =>
          !value || Boolean(values.dueDate) || dueDateField.dateRequiredMessage,
      })
    : undefined;
  const statusRegistration = statusField
    ? register("status" as FieldPath<TFieldValues>)
    : undefined;
  const priorityRegistration = priorityField
    ? register("priority" as FieldPath<TFieldValues>)
    : undefined;
  const { ref: dueDateInputRef, ...dueDateInputProps } =
    dueDateRegistration ?? {};
  const { ref: dueTimeInputRef, ...dueTimeInputProps } =
    dueTimeRegistration ?? {};
  const { ref: statusInputRef, ...statusInputProps } = statusRegistration ?? {};
  const { ref: priorityInputRef, ...priorityInputProps } =
    priorityRegistration ?? {};
  const menuProps = {
    PaperProps: {
      sx: {
        backgroundColor: "var(--surface)",
        color: "var(--foreground)",
        "& .MuiMenuItem-root:hover": {
          backgroundColor: "var(--brand-soft)",
        },
      },
    },
  };

  return (
    <form onSubmit={onSubmit} className={`${styles.form} app-form`}>
      <div className={`${styles.heading} app-form-heading`}>
        <label htmlFor={inputId} className={`${styles.title} app-form-title`}>
          {title}
        </label>
        {onClose && (
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
        )}
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

      {dueDateField && (
        <div
          className={`${styles.descriptionField} app-form-description-field`}
        >
          <span className={`${styles.title} app-form-title`}>
            {dueDateField.label}
          </span>
          <div className={styles.dueDateInputs}>
            <div className={styles.dueDateInputGroup}>
              <TextField
                id={dueDateField.inputId}
                type="date"
                label={dueDateField.dateLabel}
                variant="outlined"
                fullWidth
                defaultValue={dueDateField.defaultValue}
                {...dueDateInputProps}
                inputRef={dueDateInputRef}
                disabled={isSubmitting}
                error={Boolean(dueDateField.dateError)}
                sx={{
                  "& .MuiInputBase-root": {
                    backgroundColor: "var(--surface)",
                    color: "var(--foreground)",
                  },
                  "& .MuiInputLabel-root": { color: "var(--muted)" },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: "var(--accent)",
                  },
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "var(--line)",
                  },
                  "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline":
                    {
                      borderColor: "var(--accent)",
                    },
                  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                    {
                      borderColor: "var(--accent)",
                      borderWidth: 2,
                    },
                  "& .MuiSvgIcon-root": { color: "var(--foreground)" },
                  "& input::-webkit-calendar-picker-indicator": {
                    display: "none",
                  },
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        type="button"
                        aria-label={dueDateField.dateLabel}
                        onClick={() => openNativePicker(dueDateField.inputId)}
                        edge="end"
                        size="small"
                        sx={{
                          color: "var(--muted)",
                          "&:hover": {
                            color: "var(--accent)",
                            backgroundColor: "var(--brand-soft)",
                          },
                        }}
                      >
                        <EventOutlinedIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                aria-describedby={
                  dueDateField.dateError
                    ? `${dueDateField.timeInputId}-error`
                    : undefined
                }
                InputLabelProps={{ shrink: true }}
              />
            </div>
            <div className={styles.dueDateInputGroup}>
              <TextField
                id={dueDateField.timeInputId}
                type="time"
                label={dueDateField.timeLabel}
                variant="outlined"
                fullWidth
                defaultValue={dueDateField.defaultTime}
                {...dueTimeInputProps}
                inputRef={dueTimeInputRef}
                disabled={isSubmitting}
                sx={{
                  "& .MuiInputBase-root": {
                    backgroundColor: "var(--surface)",
                    color: "var(--foreground)",
                  },
                  "& .MuiInputLabel-root": { color: "var(--muted)" },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: "var(--accent)",
                  },
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "var(--line)",
                  },
                  "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline":
                    {
                      borderColor: "var(--accent)",
                    },
                  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                    {
                      borderColor: "var(--accent)",
                      borderWidth: 2,
                    },
                  "& .MuiSvgIcon-root": { color: "var(--foreground)" },
                  "& input::-webkit-calendar-picker-indicator": {
                    display: "none",
                  },
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        type="button"
                        aria-label={dueDateField.timeLabel}
                        onClick={() =>
                          openNativePicker(dueDateField.timeInputId)
                        }
                        edge="end"
                        size="small"
                        sx={{
                          color: "var(--muted)",
                          "&:hover": {
                            color: "var(--accent)",
                            backgroundColor: "var(--brand-soft)",
                          },
                        }}
                      >
                        <AccessTimeIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                aria-describedby={
                  dueDateField.dateError
                    ? `${dueDateField.timeInputId}-error`
                    : undefined
                }
                InputLabelProps={{ shrink: true }}
              />
            </div>
          </div>
          {dueDateField.dateError && (
            <div
              id={`${dueDateField.timeInputId}-error`}
              className={`${styles.fieldError} app-form-field-error`}
              role="alert"
            >
              {dueDateField.dateError}
            </div>
          )}
        </div>
      )}

      {statusField && (
        <div
          className={`${styles.descriptionField} app-form-description-field`}
        >
          <FormControl fullWidth>
            <InputLabel
              id={`${statusField.inputId}-label`}
              sx={{
                color: "var(--foreground)",
                "&.Mui-focused": { color: "var(--accent)" },
              }}
            >
              {statusField.label}
            </InputLabel>
            <Select
              id={statusField.inputId}
              data-status={statusField.value}
              labelId={`${statusField.inputId}-label`}
              label={statusField.label}
              value={statusField.value}
              {...statusInputProps}
              inputRef={statusInputRef}
              disabled={isSubmitting}
              className={styles.statusSelect}
              MenuProps={menuProps}
              sx={{
                backgroundColor: "var(--field-tint, var(--surface))",
                color: "var(--field-ink, var(--foreground))",
                ".MuiOutlinedInput-notchedOutline": {
                  borderColor: "var(--field-line, var(--line))",
                  borderLeftWidth: 4,
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "var(--field-line, var(--line))",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "var(--field-line, var(--line))",
                  borderWidth: 2,
                  borderLeftWidth: 4,
                },
                "& .MuiSelect-icon": {
                  color: "var(--field-ink, var(--foreground))",
                },
              }}
            >
              {statusField.options.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
      )}

      {priorityField && (
        <div
          className={`${styles.descriptionField} app-form-description-field`}
        >
          <FormControl fullWidth>
            <InputLabel
              id={`${priorityField.inputId}-label`}
              sx={{
                color: "var(--foreground)",
                "&.Mui-focused": { color: "var(--accent)" },
              }}
            >
              {priorityField.label}
            </InputLabel>
            <Select
              id={priorityField.inputId}
              data-priority={priorityField.value}
              labelId={`${priorityField.inputId}-label`}
              label={priorityField.label}
              value={priorityField.value}
              {...priorityInputProps}
              inputRef={priorityInputRef}
              disabled={isSubmitting}
              className={styles.prioritySelect}
              MenuProps={menuProps}
              sx={{
                backgroundColor: "var(--field-tint, var(--surface))",
                color: "var(--field-ink, var(--foreground))",
                ".MuiOutlinedInput-notchedOutline": {
                  borderColor: "var(--field-line, var(--line))",
                  borderLeftWidth: 4,
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "var(--field-line, var(--line))",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "var(--field-line, var(--line))",
                  borderWidth: 2,
                  borderLeftWidth: 4,
                },
                "& .MuiSelect-icon": {
                  color: "var(--field-ink, var(--foreground))",
                },
              }}
            >
              {priorityField.options.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
      )}

      <button
        type="submit"
        className={`${styles.submit} app-form-submit`}
        disabled={isSubmitting || submitDisabled}
      >
        {isSubmitting ? t("common.saving") : submitLabel}
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

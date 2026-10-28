import {
  Select,
  MenuItem,
  TextField,
  IconButton,
  InputLabel,
  FormControl,
  InputAdornment,
} from "@mui/material";
import type { FieldPath, FieldValues, UseFormRegister } from "react-hook-form";
import type { ReactNode } from "react";
import type {
  TypeFormSelectFieldProps,
  TypeFormDueDateFieldsProps,
} from "@/types";
import styles from "./Form.module.css";
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

export function FormSelectField<
  TFieldValues extends FieldValues & { name: string },
>({
  field,
  fieldName,
  className,
  isSubmitting,
  register,
}: TypeFormSelectFieldProps<TFieldValues>) {
  const { ref: inputRef, ...inputProps } = register(
    fieldName as FieldPath<TFieldValues>,
  );
  const dataAttribute =
    fieldName === "status"
      ? { "data-status": field.value }
      : { "data-priority": field.value };

  return (
    <div className={`${styles.descriptionField} app-form-description-field`}>
      <FormControl fullWidth>
        <InputLabel
          id={`${field.inputId}-label`}
          sx={{
            color: "var(--foreground)",
            "&.Mui-focused": { color: "var(--accent)" },
          }}
        >
          {field.label}
        </InputLabel>
        <Select
          id={field.inputId}
          {...dataAttribute}
          labelId={`${field.inputId}-label`}
          label={field.label}
          value={field.value}
          {...inputProps}
          inputRef={inputRef}
          disabled={isSubmitting}
          className={className}
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
          {field.options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </div>
  );
}

export function FormDueDateFields<
  TFieldValues extends FieldValues & { name: string },
>({ field, isSubmitting, register }: TypeFormDueDateFieldsProps<TFieldValues>) {
  const { ref: dateInputRef, ...dateInputProps } = register(
    "dueDate" as FieldPath<TFieldValues>,
    { deps: "dueTime" as FieldPath<TFieldValues> },
  );
  const { ref: timeInputRef, ...timeInputProps } = register(
    "dueTime" as FieldPath<TFieldValues>,
    {
      validate: (value: string, values: TFieldValues) =>
        !value || Boolean(values.dueDate) || field.dateRequiredMessage,
    },
  );

  const inputSx = {
    "& .MuiInputBase-root": {
      backgroundColor: "var(--surface)",
      color: "var(--foreground)",
    },
    "& .MuiInputLabel-root": { color: "var(--muted)" },
    "& .MuiInputLabel-root.Mui-focused": { color: "var(--accent)" },
    "& .MuiOutlinedInput-notchedOutline": { borderColor: "var(--line)" },
    "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "var(--accent)",
    },
    "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "var(--accent)",
      borderWidth: 2,
    },
    "& .MuiSvgIcon-root": { color: "var(--foreground)" },
    "& input::-webkit-calendar-picker-indicator": { display: "none" },
  };

  const pickerAdornment = (inputId: string, label: string, icon: ReactNode) => (
    <InputAdornment position="end">
      <IconButton
        type="button"
        aria-label={label}
        onClick={() => openNativePicker(inputId)}
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
        {icon}
      </IconButton>
    </InputAdornment>
  );

  return (
    <div className={`${styles.descriptionField} app-form-description-field`}>
      <span className={`${styles.title} app-form-title`}>{field.label}</span>
      <div className={styles.dueDateInputs}>
        <div className={styles.dueDateInputGroup}>
          <TextField
            id={field.inputId}
            type="date"
            label={field.dateLabel}
            variant="outlined"
            fullWidth
            defaultValue={field.defaultValue}
            {...dateInputProps}
            inputRef={dateInputRef}
            disabled={isSubmitting}
            error={Boolean(field.dateError)}
            sx={inputSx}
            InputProps={{
              endAdornment: pickerAdornment(
                field.inputId,
                field.dateLabel,
                <EventOutlinedIcon fontSize="small" />,
              ),
            }}
            aria-describedby={
              field.dateError ? `${field.timeInputId}-error` : undefined
            }
            InputLabelProps={{ shrink: true }}
          />
        </div>
        <div className={styles.dueDateInputGroup}>
          <TextField
            id={field.timeInputId}
            type="time"
            label={field.timeLabel}
            variant="outlined"
            fullWidth
            defaultValue={field.defaultTime}
            {...timeInputProps}
            inputRef={timeInputRef}
            disabled={isSubmitting}
            sx={inputSx}
            InputProps={{
              endAdornment: pickerAdornment(
                field.timeInputId,
                field.timeLabel,
                <AccessTimeIcon fontSize="small" />,
              ),
            }}
            aria-describedby={
              field.dateError ? `${field.timeInputId}-error` : undefined
            }
            InputLabelProps={{ shrink: true }}
          />
        </div>
      </div>
      {field.dateError ? (
        <div
          id={`${field.timeInputId}-error`}
          className={`${styles.fieldError} app-form-field-error`}
          role="alert"
        >
          {field.dateError}
        </div>
      ) : null}
    </div>
  );
}

import { Tooltip, TextField, IconButton, InputAdornment } from "@mui/material";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";

interface IProps {
  label: string;
  value: string;
  error: boolean;
  visible: boolean;
  showLabel: string;
  hideLabel: string;
  helperText: string;
  placeholder: string;
  onChange: (value: string) => void;
  onToggle: () => void;
  minLength?: number;
}

export function PasswordField({
  label,
  value,
  error,
  visible,
  showLabel,
  hideLabel,
  helperText,
  placeholder,
  onChange,
  onToggle,
  minLength = 6,
}: IProps) {
  return (
    <TextField
      label={label}
      type={visible ? "text" : "password"}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      required
      error={error}
      helperText={helperText}
      slotProps={{
        htmlInput: { minLength },
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <Tooltip title={visible ? hideLabel : showLabel}>
                <IconButton
                  edge="end"
                  size="small"
                  aria-label={visible ? hideLabel : showLabel}
                  onClick={onToggle}
                >
                  {visible ? (
                    <VisibilityOffOutlinedIcon fontSize="small" />
                  ) : (
                    <VisibilityOutlinedIcon fontSize="small" />
                  )}
                </IconButton>
              </Tooltip>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}

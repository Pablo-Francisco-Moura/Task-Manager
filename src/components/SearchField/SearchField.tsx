import { InputAdornment, TextField, type TextFieldProps } from "@mui/material";
import type { ChangeEvent } from "react";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";

interface IProps extends Omit<TextFieldProps, "value" | "onChange" | "size"> {
  value: string;
  onChange: (value: string) => void;
  size?: TextFieldProps["size"];
}

export function SearchField({
  sx,
  size = "small",
  value,
  onChange,
  ...props
}: IProps) {
  return (
    <TextField
      {...props}
      sx={{ width: { xs: "100%", sm: 320 }, ...sx }}
      size={size}
      value={value}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchOutlinedIcon fontSize="small" color="action" />
            </InputAdornment>
          ),
        },
      }}
      onChange={(event: ChangeEvent<HTMLInputElement>) =>
        onChange(event.target.value)
      }
    />
  );
}

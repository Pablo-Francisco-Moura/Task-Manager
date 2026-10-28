import { TextField, type TextFieldProps } from "@mui/material";
import type { ChangeEvent } from "react";

interface IProps
  extends Omit<TextFieldProps, "value" | "onChange" | "size"> {
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
      onChange={(event: ChangeEvent<HTMLInputElement>) =>
        onChange(event.target.value)
      }
    />
  );
}

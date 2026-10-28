import { createTheme } from "@mui/material/styles";
import { getThemeColors } from "./colorTokens";
import { DEFAULT_COLOR_SETTINGS } from "@/constants";
import type { TypeTheme, TypeThemeColors } from "@/types";

export function createMuiTheme(
  mode: TypeTheme,
  colors: TypeThemeColors = getThemeColors(mode, DEFAULT_COLOR_SETTINGS),
) {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: colors.brand,
        light: colors.brandSoft,
        dark: colors.brand,
        contrastText: colors.brandContrast,
      },
      secondary: {
        main: colors.accent,
        light: colors.accent,
        dark: colors.accentDark,
        contrastText: colors.accentContrast,
      },
      error: {
        main: colors.danger,
        light: colors.danger,
        dark: colors.danger,
        contrastText: colors.background,
      },
      background: {
        default: colors.background,
        paper: colors.surface,
      },
      text: {
        primary: colors.foreground,
        secondary: colors.muted,
      },
      divider: colors.line,
    },
    typography: {
      fontFamily: '"Avenir Next", Avenir, "Segoe UI", sans-serif',
    },
    shape: {
      borderRadius: 5,
    },
    components: {
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: "var(--surface)",
            color: "var(--foreground)",
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: "var(--line)",
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            color: "var(--muted)",
            "&.Mui-focused": { color: "var(--accent)" },
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            backgroundColor: "var(--surface)",
            color: "var(--foreground)",
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            color: "var(--foreground)",
            "&:hover": { backgroundColor: "var(--brand-soft)" },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            backgroundColor: "var(--surface)",
            color: "var(--foreground)",
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "var(--accent)",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "var(--accent)",
              borderWidth: 2,
            },
          },
          notchedOutline: { borderColor: "var(--line)" },
        },
      },
      MuiSelect: {
        styleOverrides: {
          icon: { color: "var(--foreground)" },
        },
      },
    },
  });
}

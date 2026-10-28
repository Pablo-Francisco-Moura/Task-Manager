import { createTheme } from "@mui/material/styles";
import type { TypeTheme } from "@/types";

export function createMuiTheme(mode: TypeTheme) {
  const colors =
    mode === "dark"
      ? {
          brand: "#a8c6b4",
          brandSoft: "#2a3930",
          accent: "#f08b72",
          accentDark: "#ff9d84",
          accentContrast: "#202925",
          danger: "#ff9388",
          background: "#171e1b",
          surface: "#202925",
          foreground: "#edf2ee",
          muted: "#a6b2aa",
          line: "#35433b",
        }
      : {
          brand: "#254b3d",
          brandSoft: "#e8f0eb",
          accent: "#a6432e",
          accentDark: "#843321",
          accentContrast: "#ffffff",
          danger: "#b53d35",
          background: "#f4f6f3",
          surface: "#ffffff",
          foreground: "#202925",
          muted: "#626d66",
          line: "#dce3dd",
        };

  return createTheme({
    palette: {
      mode,
      primary: {
        main: colors.brand,
        light: colors.brandSoft,
        dark: colors.brand,
        contrastText: mode === "dark" ? "#171e1b" : "#ffffff",
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

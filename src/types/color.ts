export interface TypeColorSettings {
  brand: string;
  accent: string;
}

export interface TypeThemeColors {
  line: string;
  muted: string;
  brand: string;
  accent: string;
  danger: string;
  surface: string;
  brandSoft: string;
  brandText: string;
  background: string;
  foreground: string;
  accentDark: string;
  brandContrast: string;
  accentContrast: string;
  workspaceMemberColors: string[];
}

export interface TypeColorSettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

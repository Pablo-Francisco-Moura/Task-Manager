"use client";

import {
  Box,
  Alert,
  Stack,
  Button,
  Dialog,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
} from "@mui/material";
import {
  contrastRatio,
  getThemeColors,
} from "@/components/Providers/colorTokens";
import { DEFAULT_COLOR_SETTINGS } from "@/constants";
import { useTheme } from "@/components/Providers/ThemeProvider";
import { hasAccessibleColorSettings } from "@/components/Providers/colorContrastValidation";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import type {
  TypeColorSettings,
  TypeColorSettingsDialogProps,
} from "@/types";

export function ColorSettingsDialog({
  open,
  onClose,
}: TypeColorSettingsDialogProps) {
  const { t } = useTranslation();
  const { theme, colorSettings, setColorSettings } = useTheme();
  const [draft, setDraft] = useState<TypeColorSettings>(colorSettings);
  const colors = getThemeColors(theme, draft);
  const canApplyColors = hasAccessibleColorSettings(draft);
  const brandContrast = contrastRatio(colors.brandText, colors.brandSoft);
  const accentContrast = Math.min(
    contrastRatio(colors.accentContrast, colors.accent),
    contrastRatio(colors.accentContrast, colors.accentDark),
  );

  useEffect(() => {
    if (open) setDraft(colorSettings);
  }, [colorSettings, open]);

  const updateColor = (key: keyof TypeColorSettings, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const colorControl = (
    key: keyof TypeColorSettings,
    label: string,
    value: string,
  ) => (
    <Stack
      key={key}
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      spacing={2}
      sx={{
        border: "1px solid var(--line)",
        borderRadius: 1,
        px: 1.5,
        py: 1,
      }}
    >
      <Box>
        <label htmlFor={`color-${key}`} style={{ fontSize: "0.875rem" }}>
          {label}
        </label>
        <Typography display="block" variant="caption" color="text.secondary">
          {value.toUpperCase()}
        </Typography>
      </Box>
      <input
        id={`color-${key}`}
        type="color"
        aria-label={label}
        value={value}
        onChange={(event) => updateColor(key, event.target.value)}
        style={{
          width: 48,
          height: 36,
          padding: 2,
          border: "1px solid var(--line)",
          borderRadius: 6,
          background: "var(--surface)",
          cursor: "pointer",
        }}
      />
    </Stack>
  );

  const handleApply = () => {
    if (!canApplyColors) return;
    setColorSettings(draft);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{t("colors.title")}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {t("colors.description")}
          </Typography>
          <Alert severity="info">{t("colors.contrastInfo")}</Alert>
          {!canApplyColors && (
            <Alert severity="error">{t("colors.contrastError")}</Alert>
          )}
          {colorControl("brand", t("colors.brand"), draft.brand)}
          {colorControl("accent", t("colors.accent"), draft.accent)}
          <Stack direction="row" spacing={1}>
            <Box
              sx={{
                flex: 1,
                borderRadius: 1,
                p: 1.25,
                backgroundColor: colors.brandSoft,
                color: colors.brandText,
                border: "1px solid var(--line)",
              }}
            >
              <Typography variant="caption" display="block">
                {t("colors.brandPreview")}
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {brandContrast.toFixed(1)}:1
              </Typography>
            </Box>
            <Box
              sx={{
                flex: 1,
                borderRadius: 1,
                p: 1.25,
                backgroundColor: colors.accent,
                color: colors.accentContrast,
              }}
            >
              <Typography variant="caption" display="block">
                {t("colors.accentPreview")}
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {accentContrast.toFixed(1)}:1
              </Typography>
            </Box>
          </Stack>
          <Typography variant="caption" color="text.secondary">
            {t("colors.adjustmentInfo")}
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={() => setDraft(DEFAULT_COLOR_SETTINGS)}>
          {t("colors.reset")}
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose}>{t("colors.cancel")}</Button>
        <Button
          variant="contained"
          onClick={handleApply}
          disabled={!canApplyColors}
        >
          {t("colors.apply")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

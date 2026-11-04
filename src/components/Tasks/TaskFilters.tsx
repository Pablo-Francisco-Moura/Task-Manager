import {
  Badge,
  Stack,
  Select,
  MenuItem,
  Dialog,
  Button,
  IconButton,
  InputLabel,
  FormControl,
  DialogTitle,
  DialogActions,
  DialogContent,
} from "@mui/material";
import { SearchField } from "@/components/SearchField";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import FilterListOutlinedIcon from "@mui/icons-material/FilterListOutlined";
import type {
  TypeLocalTaskStatus,
  TypeLocalTaskPriority,
} from "@/types/localData";

interface IProps {
  search: string;
  statusFilter: TypeLocalTaskStatus | "all";
  priorityFilter: TypeLocalTaskPriority | "all";
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: TypeLocalTaskStatus | "all") => void;
  onPriorityFilterChange: (value: TypeLocalTaskPriority | "all") => void;
}

export function TaskFilters({
  search,
  statusFilter,
  priorityFilter,
  onSearchChange,
  onStatusFilterChange,
  onPriorityFilterChange,
}: IProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const activeFilterCount =
    Number(Boolean(search.trim())) +
    Number(statusFilter !== "all") +
    Number(priorityFilter !== "all");

  return (
    <>
      <IconButton
        aria-label={
          activeFilterCount > 0
            ? t("task.openFiltersWithCount", { count: activeFilterCount })
            : t("task.openFilters")
        }
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(true)}
      >
        <Badge badgeContent={activeFilterCount} color="primary">
          <FilterListOutlinedIcon />
        </Badge>
      </IconButton>
      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>{t("task.filtersTitle")}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <SearchField
              label={t("task.search")}
              value={search}
              onChange={onSearchChange}
              sx={{ flex: 1 }}
            />
            <FormControl size="small" fullWidth>
              <InputLabel id="task-status-filter-label">
                {t("task.filterStatus")}
              </InputLabel>
              <Select
                labelId="task-status-filter-label"
                label={t("task.filterStatus")}
                value={statusFilter}
                onChange={(event) =>
                  onStatusFilterChange(
                    event.target.value as TypeLocalTaskStatus | "all",
                  )
                }
              >
                <MenuItem value="all">{t("task.allStatuses")}</MenuItem>
                <MenuItem value="todo">{t("task.status.todo")}</MenuItem>
                <MenuItem value="in_progress">
                  {t("task.status.inProgress")}
                </MenuItem>
                <MenuItem value="done">{t("task.status.done")}</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel id="task-priority-filter-label">
                {t("task.filterPriority")}
              </InputLabel>
              <Select
                labelId="task-priority-filter-label"
                label={t("task.filterPriority")}
                value={priorityFilter}
                onChange={(event) =>
                  onPriorityFilterChange(
                    event.target.value as TypeLocalTaskPriority | "all",
                  )
                }
              >
                <MenuItem value="all">{t("task.allPriorities")}</MenuItem>
                <MenuItem value="low">{t("task.priority.low")}</MenuItem>
                <MenuItem value="normal">{t("task.priority.normal")}</MenuItem>
                <MenuItem value="high">{t("task.priority.high")}</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            disabled={activeFilterCount === 0}
            onClick={() => {
              onSearchChange("");
              onStatusFilterChange("all");
              onPriorityFilterChange("all");
            }}
          >
            {t("task.clearFilters")}
          </Button>
          <Button variant="contained" onClick={() => setIsOpen(false)}>
            {t("common.close")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

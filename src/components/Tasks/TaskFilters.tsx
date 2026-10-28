import {
  Stack,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from "@mui/material";
import { SearchField } from "@/components/SearchField";
import { useTranslation } from "react-i18next";
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

  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 2 }}>
      <SearchField
        label={t("task.search")}
        value={search}
        onChange={onSearchChange}
        sx={{ flex: 1 }}
      />
      <FormControl size="small" sx={{ minWidth: 160 }}>
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
          <MenuItem value="in_progress">{t("task.status.inProgress")}</MenuItem>
          <MenuItem value="done">{t("task.status.done")}</MenuItem>
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 160 }}>
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
  );
}

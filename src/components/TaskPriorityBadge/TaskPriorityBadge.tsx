import { useTranslation } from "react-i18next";
import { normalizeTaskPriority } from "@/utils/taskPriority";
import type { TypeLocalTaskPriority } from "@/types/localData";
import styles from "./TaskPriorityBadge.module.css";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import HorizontalRuleIcon from "@mui/icons-material/HorizontalRule";

const priorityIcons = {
  low: ArrowDownwardIcon,
  normal: HorizontalRuleIcon,
  high: PriorityHighIcon,
} satisfies Record<TypeLocalTaskPriority, typeof ArrowDownwardIcon>;

interface IProps {
  priority?: TypeLocalTaskPriority | null;
}

export function TaskPriorityBadge({ priority }: IProps) {
  const { t } = useTranslation();
  const normalizedPriority = normalizeTaskPriority(priority);
  const PriorityIcon = priorityIcons[normalizedPriority];

  return (
    <span className={styles.badge} data-priority={normalizedPriority}>
      <PriorityIcon aria-hidden="true" fontSize="inherit" />
      {t(`task.priority.${normalizedPriority}`)}
    </span>
  );
}

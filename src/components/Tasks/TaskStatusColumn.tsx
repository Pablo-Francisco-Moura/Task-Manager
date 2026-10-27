import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { getColumnId } from "./taskBoard.utils";
import { useDroppable } from "@dnd-kit/core";
import { useTranslation } from "react-i18next";
import { statusLabelKeys } from "@/constants";
import { SortableTaskCard } from "./SortableTaskCard";
import type { TypeLocalTask, TypeLocalTaskStatus } from "@/types/localData";
import styles from "./TaskBoard.module.css";

interface IProps {
  tasks: TypeLocalTask[];
  status: TypeLocalTaskStatus;
  isSaving: boolean;
  headingId: string;
  onEditClick: (task: TypeLocalTask) => void;
  onDeleteClick: (task: TypeLocalTask) => void;
}

export function TaskStatusColumn({
  tasks,
  status,
  isSaving,
  headingId,
  onEditClick,
  onDeleteClick,
}: IProps) {
  const { t } = useTranslation();
  const { isOver, setNodeRef } = useDroppable({ id: getColumnId(status) });

  return (
    <section
      className={styles.column}
      data-status={status}
      aria-labelledby={headingId}
    >
      <header className={styles.columnHeader}>
        <h3 id={headingId} className={styles.columnTitle}>
          {t(statusLabelKeys[status])}
        </h3>
        <span className={styles.columnCount}>{tasks.length}</span>
      </header>
      <SortableContext
        items={tasks.map((task) => task.id)}
        strategy={verticalListSortingStrategy}
      >
        <ol
          ref={setNodeRef}
          className={`${styles.cards}${isOver ? ` ${styles.cardsOver}` : ""}`}
          aria-labelledby={headingId}
          aria-busy={isSaving}
        >
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              isSaving={isSaving}
              onEditClick={onEditClick}
              onDeleteClick={onDeleteClick}
            />
          ))}
        </ol>
      </SortableContext>
    </section>
  );
}

import { Project } from "../Project/Project";
import { useEffect, useState } from "react";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { useProjects } from "@/hooks";
import { AlertMessage } from "../AlertMessage";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { deleteProject } from "@/hooks/useProjects/useCase/deleteProject.api";
import { useTranslation } from "react-i18next";
import { useFeedbackStore } from "@/store/feedbackStore";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TypeProjectWithTasks } from "@/types";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import { TablePagination, TextField } from "@mui/material";

interface IProps {
  openAddProject: boolean;
  toggleOpenAddProject: (value: boolean) => void;
  canManageProjects: boolean;
}

export function Projects({ openAddProject, toggleOpenAddProject, canManageProjects }: IProps) {
  const { t } = useTranslation();
  const { projects, isLoading, isError, refetch } = useProjects();

  const [openDialog, setOpenDialog] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);

  const [projectToDelete, setProjectToDelete] =
    useState<TypeProjectWithTasks | null>(null);

  const queryClient = useQueryClient();
  const showFeedback = useFeedbackStore((state) => state.showFeedback);

  // Mutation to delete project.
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => deleteProject(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROJECTS] });
      await queryClient.refetchQueries({ queryKey: [QUERY_KEYS.PROJECTS] });

      setProjectToDelete(null);
      setOpenDialog(false);
      showFeedback(t("project.delete.success"));
    },
    onError: () => showFeedback(t("project.delete.error"), "error"),
  });

  const handleConfirmDelete = () => {
    if (projectToDelete) {
      deleteMutation.mutate(projectToDelete.id);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setProjectToDelete(null);
  };

  const normalizedSearch = search.trim().toLowerCase();
  const filteredProjects = (projects ?? []).filter((project) =>
    `${project.name} ${project.description ?? ""}`
      .toLowerCase()
      .includes(normalizedSearch),
  );
  const sortedProjects = filteredProjects
    .slice()
    .sort((first, second) => first.name.localeCompare(second.name));
  const pagedProjects =
    rowsPerPage === -1
      ? sortedProjects
      : sortedProjects.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  useEffect(() => {
    const maxPage =
      rowsPerPage === -1
        ? 0
        : Math.max(0, Math.ceil(filteredProjects.length / rowsPerPage) - 1);
    setPage((currentPage) => Math.min(currentPage, maxPage));
  }, [filteredProjects.length, rowsPerPage]);

  return (
    <>
      {isLoading && (
        <div className="content-state" role="status">
          <AlertMessage type="loading" message={t("project.loading")} />
        </div>
      )}
      {isError && (
        <div className="content-state" role="alert">
          <AlertMessage
            type="error"
            message={t("project.loadError")}
            retryLabel={t("common.retry")}
            onRetry={() => void refetch()}
          />
        </div>
      )}
      {projects && projects.length > 0 && (
        <>
          <TextField
            size="small"
            label={t("project.search")}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(0);
            }}
            sx={{ mb: 2, width: { xs: "100%", sm: 320 } }}
          />
          {pagedProjects.length > 0 ? (
            <div className="projects-grid">
              {pagedProjects.map((project: TypeProjectWithTasks) => (
              <Project
                key={project.id}
                project={project}
                setOpenDialog={setOpenDialog}
                setProjectToDelete={setProjectToDelete}
              />
              ))}
            </div>
          ) : (
            <div className="empty-state"><h3>{t("project.noMatches")}</h3></div>
          )}
          <TablePagination
            component="div"
            count={filteredProjects.length}
            page={page}
            onPageChange={(_event, nextPage) => setPage(nextPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(Number(event.target.value));
              setPage(0);
            }}
            rowsPerPageOptions={[
              12,
              24,
              48,
              { value: -1, label: t("common.all") },
            ]}
            labelRowsPerPage={t("common.rowsPerPage")}
            labelDisplayedRows={({ from, to, count }) =>
              t("common.pagination", { from, to, count })
            }
          />
        </>
      )}
      {projects && projects.length === 0 && !isLoading && canManageProjects && (
        <div className="empty-state">
          <span className="empty-state-mark" aria-hidden="true">
            <FolderOpenOutlinedIcon />
          </span>
          <h3>{t("project.empty")}</h3>
          <button
            type="button"
            className="text-action"
            onClick={() => toggleOpenAddProject(true)}
            disabled={openAddProject}
          >
            {t("project.add")}
          </button>
        </div>
      )}
      {projects && projects.length === 0 && !isLoading && !canManageProjects ? (
        <div className="empty-state"><h3>{t("project.noneAvailable")}</h3></div>
      ) : null}
      <ConfirmDialog
        open={openDialog}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
        relatedItems={projectToDelete?.tasks.map((task) => task.name)}
        relatedItemsLabel={t("project.tasksDeletedWithProject")}
        description={`${t("project.delete.confirm")} "${projectToDelete?.name}"? ${t("project.delete.irreversible")}`}
      />
    </>
  );
}

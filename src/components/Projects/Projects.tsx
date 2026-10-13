import { Project } from "../Project/Project";
import { useState } from "react";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { useProjects } from "@/hooks";
import { AlertMessage } from "../AlertMessage";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { deleteProject } from "@/hooks/useProjects/useCase/deleteProject.api";
import { useTranslation } from "react-i18next";
import { Project as TypeProject } from "@prisma/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface Props {
  openAddProject: boolean;
  toggleOpenAddProject: (value: boolean) => void;
}

export function Projects({ openAddProject, toggleOpenAddProject }: Props) {
  const { t } = useTranslation();
  const { projects, isLoading, isError } = useProjects();

  const [openDialog, setOpenDialog] = useState(false);

  const [projectToDelete, setProjectToDelete] = useState<TypeProject | null>(
    null,
  );

  const queryClient = useQueryClient();

  // Mutation to delete project.
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => deleteProject(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROJECTS] });
      await queryClient.refetchQueries({ queryKey: [QUERY_KEYS.PROJECTS] });

      setProjectToDelete(null);
      setOpenDialog(false);
    },
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

  return (
    <>
      {isLoading && (
        <div className="content-state" role="status">
          <AlertMessage message={t("loadingProjects")} />
        </div>
      )}
      {isError && (
        <div className="content-state" role="alert">
          <AlertMessage type="error" message={t("errorLoadingProjects")} />
        </div>
      )}
      {projects && projects.length > 0 && (
        <div className="projects-grid">
          {[...projects]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((project: TypeProject) => (
              <Project
                key={project.id}
                project={project}
                setOpenDialog={setOpenDialog}
                setProjectToDelete={setProjectToDelete}
              />
            ))}
        </div>
      )}
      {projects && projects.length === 0 && !isLoading && (
        <div className="empty-state">
          <span className="empty-state-mark">P</span>
          <h3>{t("noProjectsFound")}</h3>
          <button
            type="button"
            className="text-action"
            onClick={() => toggleOpenAddProject(true)}
            disabled={openAddProject}
          >
            {t("addProject")}
          </button>
        </div>
      )}
      <ConfirmDialog
        open={openDialog}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmDelete}
        description={`${t("confirmDeleteProject")} "${projectToDelete?.name}"? ${t("inforToDeleteProject")}`}
      />
    </>
  );
}

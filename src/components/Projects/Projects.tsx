import { Button } from "../Button";
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
      {isLoading && <AlertMessage message={t("loadingProjects")} />}
      {isError && <AlertMessage message={t("errorLoadingProjects")} />}
      {projects && (
        <div
          className="w-full min-h-300 max-w-2xl bg-white dark:bg-gray-600 shadow-md rounded-md p-4 mb-4 mx-2
     border border-grey-200 overflow-y-auto gap-4 flex flex-col items-center overflow-y-auto"
        >
          {projects.length > 0
            ? projects
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((project: TypeProject) => (
                  <Project
                    key={project.id}
                    project={project}
                    setOpenDialog={setOpenDialog}
                    setProjectToDelete={setProjectToDelete}
                  />
                ))
            : !isLoading && (
                <div className="flex gap-4 flex-col items-center justify-center w-full p-4">
                  <AlertMessage message={t("noProjectsFound")} />
                  <Button
                    full={false}
                    label={t("addProject")}
                    onClick={() => toggleOpenAddProject(true)}
                    disabled={openAddProject}
                  />
                </div>
              )}
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

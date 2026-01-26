"use client";

import { useState } from "react";
import { SubTitle } from "@/components/SubTitle";
import { Projects } from "@/components/Projects/Projects";
import { ProjectForm } from "@/components/ProjectForm/ProjectForm";
import { useTranslation } from "react-i18next";

export function ProjectScreen() {
  const [openAddProject, toggleOpenAddProject] = useState(false);

  const { t } = useTranslation();

  return (
    <div className="flex flex-col w-full items-center gap-4 bg-gray-50 dark:bg-gray-700 pb-4 transition-colors">
      <SubTitle
        label={t("projects")}
        onClick={() => toggleOpenAddProject(!openAddProject)}
      />
      {openAddProject && (
        <ProjectForm toggleOpenAddProject={toggleOpenAddProject} />
      )}

      <Projects
        openAddProject={openAddProject}
        toggleOpenAddProject={toggleOpenAddProject}
      />
    </div>
  );
}

"use client";

import { Dialog } from "@mui/material";
import { useState } from "react";
import { Projects } from "@/components/Projects/Projects";
import { ProjectForm } from "@/components/ProjectForm/ProjectForm";
import { useProjects } from "@/hooks";
import { useTranslation } from "react-i18next";
import styles from "./ProjectScreen.module.css";
import AddIcon from "@mui/icons-material/Add";

export function ProjectScreen() {
  const [openAddProject, toggleOpenAddProject] = useState(false);

  const { t } = useTranslation();
  const { projects } = useProjects();

  return (
    <section className={`${styles.projectScreen} screen-content`}>
      <div className="screen-heading">
        {projects && (
          <p className="project-count" aria-live="polite">
            <span className="project-count-value">{projects.length}</span>
            {t(
              projects.length === 1
                ? "project.count.singular"
                : "project.count.plural",
            )}
          </p>
        )}
        <button
          type="button"
          className="primary-action"
          onClick={() => toggleOpenAddProject(!openAddProject)}
          aria-expanded={openAddProject}
        >
          <AddIcon fontSize="small" />
          <span>{t("project.add")}</span>
        </button>
      </div>
      <Dialog open={openAddProject} onClose={() => toggleOpenAddProject(false)}>
        <ProjectForm toggleOpenAddProject={toggleOpenAddProject} />
      </Dialog>

      <Projects
        openAddProject={openAddProject}
        toggleOpenAddProject={toggleOpenAddProject}
      />
    </section>
  );
}

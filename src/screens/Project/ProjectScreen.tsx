"use client";

import { useState } from "react";
import { Projects } from "@/components/Projects/Projects";
import { ProjectForm } from "@/components/ProjectForm/ProjectForm";
import { useTranslation } from "react-i18next";
import styles from "./ProjectScreen.module.css";
import AddIcon from "@mui/icons-material/Add";

export function ProjectScreen() {
  const [openAddProject, toggleOpenAddProject] = useState(false);

  const { t } = useTranslation();

  return (
    <section className={`${styles.projectScreen} screen-content`}>
      <div className="screen-heading">
        <h2 className="screen-title">{t("navigation.projects")}</h2>
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
      {openAddProject && (
        <div className="form-surface">
          <ProjectForm toggleOpenAddProject={toggleOpenAddProject} />
        </div>
      )}

      <Projects
        openAddProject={openAddProject}
        toggleOpenAddProject={toggleOpenAddProject}
      />
    </section>
  );
}

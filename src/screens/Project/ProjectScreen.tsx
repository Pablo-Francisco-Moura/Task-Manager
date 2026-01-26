"use client";

import { useState } from "react";
import { SubTitle } from "@/components/SubTitle";
import { Projects } from "@/components/Projects/Projects";
import { ProjectForm } from "@/components/ProjectForm/ProjectForm";

export function ProjectScreen() {
  const [openAddProject, toggleOpenAddProject] = useState(false);

  return (
    <div className="flex flex-col w-full items-center gap-4 bg-gray-50 pb-4">
      <SubTitle
        label="Projects"
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

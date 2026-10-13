import { Project } from "@prisma/client";
import { useTheme } from "../Providers/ThemeProvider";
import { useEffect } from "react";
import { useProjects } from "@/hooks/useProjects";
import { useTranslation } from "react-i18next";
import { useProjectStore } from "@/store/projectStore";
import { CircularProgress } from "@mui/material";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";

export function Toolbar() {
  const selectedProject = useProjectStore((s) => s.selectedProject);
  const setSelectedProject = useProjectStore((s) => s.setSelectedProject);

  const { t } = useTranslation();
  const { theme } = useTheme();
  const { projects, isLoading } = useProjects();

  const isDark = theme === "dark";

  useEffect(() => {
    if (projects && projects.length > 0) {
      if (
        !selectedProject ||
        !projects.some((p: Project) => p.id === selectedProject.id)
      ) {
        setSelectedProject(projects[0]);
      }
    } else if (projects && projects.length === 0) {
      setSelectedProject(null);
    }
  }, [projects, selectedProject, setSelectedProject]);

  const handleChange = (event: SelectChangeEvent) => {
    const id = Number(event.target.value);
    const project = projects?.find((p: Project) => p.id === id) || null;
    setSelectedProject(project);
  };

  return (
    <div className="task-project-toolbar">
      <p className="toolbar-caption">{t("projectName")}</p>
      <FormControl className="task-project-select" sx={{ minWidth: 220 }}>
        <Select
          aria-label={t("projectName")}
          value={selectedProject?.id?.toString() ?? ""}
          onChange={handleChange}
          disabled={!projects || projects.length === 0 || isLoading}
          displayEmpty
          sx={{
            color: isDark ? "#fff" : undefined,
            ".MuiOutlinedInput-notchedOutline": {
              borderColor: isDark ? "#fff" : undefined,
            },
            "& .MuiSvgIcon-root": {
              color: isDark ? "#fff" : undefined,
            },
          }}
        >
          <MenuItem value="" disabled>
            {isLoading ? t("loadingProjects") : t("selectProject")}
          </MenuItem>
          {projects &&
            projects.map((project: Project) => (
              <MenuItem key={project.id} value={project.id.toString()}>
                {project.name}
              </MenuItem>
            ))}
        </Select>
      </FormControl>
      {isLoading && <CircularProgress />}
    </div>
  );
}

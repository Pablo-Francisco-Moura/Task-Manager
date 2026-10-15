import { Project } from "@prisma/client";
import { useTheme } from "../Providers/ThemeProvider";
import { useEffect } from "react";
import { useProjects } from "@/hooks/useProjects";
import { useTranslation } from "react-i18next";
import { useProjectStore } from "@/store/projectStore";
import { CircularProgress } from "@mui/material";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import AddIcon from "@mui/icons-material/Add";
import MenuItem from "@mui/material/MenuItem";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";

interface IProps {
  openAddTask: boolean;
  onToggleAddTask: () => void;
}

export function Toolbar({ openAddTask, onToggleAddTask }: IProps) {
  const selectedProject = useProjectStore((s) => s.selectedProject);
  const selectedProjectId = useProjectStore((s) => s.selectedProjectId);
  const preferencesLoaded = useProjectStore((s) => s.preferencesLoaded);
  const setSelectedProject = useProjectStore((s) => s.setSelectedProject);

  const { t } = useTranslation();
  const { theme } = useTheme();
  const { projects, isLoading } = useProjects();

  const isDark = theme === "dark";

  useEffect(() => {
    if (!preferencesLoaded) return;

    if (projects && projects.length > 0) {
      const projectToSelect =
        projects.find((project: Project) => project.id === selectedProjectId) ??
        projects.find(
          (project: Project) => project.id === selectedProject?.id,
        ) ??
        projects[0];
      if (
        selectedProject?.id !== projectToSelect.id ||
        selectedProjectId !== projectToSelect.id
      ) {
        setSelectedProject(projectToSelect);
      }
    } else if (projects && projects.length === 0) {
      setSelectedProject(null);
    }
  }, [
    projects,
    preferencesLoaded,
    selectedProject,
    selectedProjectId,
    setSelectedProject,
  ]);

  const handleChange = (event: SelectChangeEvent) => {
    const id = Number(event.target.value);
    const project = projects?.find((p: Project) => p.id === id) || null;
    setSelectedProject(project);
  };

  return (
    <div className="task-project-toolbar">
      <FormControl className="task-project-select" sx={{ minWidth: 220 }}>
        <InputLabel id="task-project-select-label">
          {t("project.label")}
        </InputLabel>
        <Select
          labelId="task-project-select-label"
          label={t("project.label")}
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
            {isLoading ? t("project.loading") : t("project.select")}
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
      <button
        type="button"
        className="primary-action"
        onClick={onToggleAddTask}
        aria-expanded={openAddTask}
        disabled={!selectedProject || isLoading}
      >
        <AddIcon fontSize="small" />
        <span>{t("task.create.submit")}</span>
      </button>
    </div>
  );
}

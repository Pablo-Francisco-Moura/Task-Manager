import { Project } from "@prisma/client";
import { useTasks } from "@/hooks/useTasks";
import { useEffect } from "react";
import { useProjects } from "@/hooks/useProjects";
import { useTranslation } from "react-i18next";
import { useProjectStore } from "@/store/projectStore";
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
  const { projects, isLoading } = useProjects();
  const { tasks } = useTasks(selectedProject?.id);

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
        <InputLabel
          id="task-project-select-label"
          shrink
          sx={{
            color: "var(--muted)",
            "&.Mui-focused": { color: "var(--accent)" },
          }}
        >
          {t("project.label")}
        </InputLabel>
        <Select
          labelId="task-project-select-label"
          label={t("project.label")}
          value={selectedProject?.id?.toString() ?? ""}
          onChange={handleChange}
          disabled={!projects || projects.length === 0 || isLoading}
          displayEmpty
          MenuProps={{
            PaperProps: {
              sx: {
                backgroundColor: "var(--surface)",
                color: "var(--foreground)",
                "& .MuiMenuItem-root:hover": {
                  backgroundColor: "var(--brand-soft)",
                },
              },
            },
          }}
          sx={{
            color: "var(--foreground)",
            ".MuiOutlinedInput-notchedOutline": {
              borderColor: "var(--line)",
            },
            "&:not(.Mui-disabled):hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "var(--accent)",
            },
            "&.Mui-disabled .MuiOutlinedInput-notchedOutline": {
              borderColor: "var(--line)",
            },
            "& .MuiSvgIcon-root": {
              color: "var(--foreground)",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "var(--accent)",
              borderWidth: 2,
            },
          }}
        >
          <MenuItem value="" disabled>
            {isLoading
              ? t("project.loading")
              : projects?.length === 0
                ? t("project.noneAvailable")
                : t("project.select")}
          </MenuItem>
          {projects &&
            projects.map((project: Project) => (
              <MenuItem key={project.id} value={project.id.toString()}>
                {project.name}
              </MenuItem>
            ))}
        </Select>
      </FormControl>
      <div className="screen-heading task-summary-heading">
        {tasks && (
          <p className="task-count" aria-live="polite">
            <span className="task-count-value">{tasks.length}</span>
            {t(
              tasks.length === 1 ? "task.count.singular" : "task.count.plural",
            )}
          </p>
        )}
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
    </div>
  );
}

import { useEffect } from "react";
import { useProjects } from "@/hooks/useProjects";
import { useProjectStore } from "@/store/projectStore";
import { CircularProgress } from "@mui/material";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";

export function Toolbar() {
  const selectedProject = useProjectStore((s) => s.selectedProject);
  const setSelectedProject = useProjectStore((s) => s.setSelectedProject);

  const { projects, isLoading } = useProjects();

  useEffect(() => {
    if (projects && projects.length > 0) {
      if (
        !selectedProject ||
        !projects.some((p: any) => p.id === selectedProject.id)
      ) {
        setSelectedProject(projects[0]);
      }
    } else if (projects && projects.length === 0) {
      setSelectedProject(null);
    }
  }, [projects]);

  const handleChange = (event: SelectChangeEvent) => {
    const id = Number(event.target.value);
    const project = projects?.find((p: any) => p.id === id) || null;
    setSelectedProject(project);
  };

  return (
    <div className="w-full bg-white border-b border-gray-200 py-4 px-4 flex items-center gap-4">
      <FormControl sx={{ minWidth: 200 }}>
        <InputLabel id="select-project-label">Projeto</InputLabel>
        <Select
          value={selectedProject?.id?.toString() ?? ""}
          label="Projeto"
          labelId="select-project-label"
          onChange={handleChange}
          disabled={!projects || projects.length === 0 || isLoading}
          displayEmpty
        >
          <MenuItem value="" disabled>
            {isLoading ? "Carregando..." : "Selecione um projeto"}
          </MenuItem>
          {projects &&
            projects.map((project: any) => (
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

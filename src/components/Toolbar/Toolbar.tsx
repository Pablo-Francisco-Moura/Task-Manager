import { useEffect } from "react";
import { useProjects } from "@/hooks/useProjects";
import { useProjectStore } from "@/store/projectStore";
import { CircularProgress } from "@mui/material";
import Box from "@mui/material/Box";
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
    <Box
      sx={{
        p: 2,
        gap: 2,
        width: "100%",
        bgcolor: "background.paper",
        display: "flex",
        alignItems: "center",
        borderColor: "divider",
        borderBottom: 1,
      }}
    >
      <FormControl sx={{ minWidth: 200 }}>
        <InputLabel id="select-project-label">Projeto</InputLabel>
        <Select
          labelId="select-project-label"
          value={selectedProject?.id?.toString() ?? ""}
          onChange={handleChange}
          disabled={!projects || projects.length === 0 || isLoading}
          displayEmpty
          label="Projeto"
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
    </Box>
  );
}

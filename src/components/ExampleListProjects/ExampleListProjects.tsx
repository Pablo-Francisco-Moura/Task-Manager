import { GetProjectResponse } from "@/hooks";

type ExampleListProjectsProps = {
  projects: GetProjectResponse;
};

export function ExampleListProjects({ projects }: ExampleListProjectsProps) {
  return (
    <div>
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Id</th>
            <th>Tasks</th>
          </tr>
        </thead>
        <tbody>
          {projects?.map((project) => (
            <tr key={project.id}>
              <td>{project.name}</td>
              <td>{project.id}</td>
              <td>
                <ul>
                  {project.tasks.map((task) => (
                    <li key={task.id}>{task.name}</li>
                  ))}
                </ul>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

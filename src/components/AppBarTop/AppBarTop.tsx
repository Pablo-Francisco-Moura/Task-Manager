import { appTitle } from "@/app/constants/app";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

export function AppBarTop() {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {appTitle}
        </Typography>
      </Toolbar>
    </AppBar>
  );
}

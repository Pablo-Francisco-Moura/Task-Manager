import type { Metadata } from "next";
import { Providers } from "@/components/Providers/Providers";
import { appTitle, metadataTitle } from "./constants/app";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import "./globals.css";

export const metadata: Metadata = {
  title: metadataTitle,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" data-lt-installed="true">
      <body>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              {appTitle}
            </Typography>
          </Toolbar>
        </AppBar>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

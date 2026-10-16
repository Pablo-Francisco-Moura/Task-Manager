import { AppBarTop } from "@/components/AppBarTop/AppBarTop";
import { MainWorkspace } from "./MainWorkspace";
import { FeedbackSnackbar } from "@/components/FeedbackSnackbar/FeedbackSnackbar";
import styles from "./MainScreen.module.css";

export function MainScreen() {
  return (
    <div
      className={`${styles.shell} app-shell flex min-h-screen w-full flex-col overflow-x-hidden transition-colors`}
    >
      <AppBarTop />
      <main className="app-main mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-12 sm:px-6 lg:px-8">
        <MainWorkspace />
      </main>
      <FeedbackSnackbar />
    </div>
  );
}

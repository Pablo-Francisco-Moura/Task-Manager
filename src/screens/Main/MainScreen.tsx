import { AppBarTop } from "@/components/AppBarTop/AppBarTop";
import { MainWorkspace } from "./MainWorkspace";
import { FeedbackSnackbar } from "@/components/FeedbackSnackbar/FeedbackSnackbar";
import styles from "./MainScreen.module.css";

export function MainScreen() {
  return (
    <div
      className={`${styles.shell} app-shell w-full overflow-x-hidden transition-colors`}
    >
      <AppBarTop />
      <main className="app-main flex w-full flex-1 flex-col px-4">
        <MainWorkspace />
      </main>
      <FeedbackSnackbar />
    </div>
  );
}

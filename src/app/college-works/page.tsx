import { redirect } from "next/navigation";

/** College Works was merged into Assignments. */
export default function CollegeWorksRedirect() {
  redirect("/assignments");
}

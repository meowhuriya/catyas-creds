import { GradesTabs } from "@/components/shell/grades-tabs";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <GradesTabs>{children}</GradesTabs>;
}

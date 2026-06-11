import { HomeShell } from "@/components/wrapper/HomeShell";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full">
      <HomeShell>{children}</HomeShell>
    </div>
  );
}

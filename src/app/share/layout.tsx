export default function ShareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-8 sm:px-6">
      {children}
    </div>
  );
}

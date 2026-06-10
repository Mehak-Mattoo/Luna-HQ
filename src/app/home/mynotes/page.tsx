import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import HomePage from "@/components/pages/HomePage";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 p-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full" />
        </div>
      }
    >
      <HomePage />
    </Suspense>
  );
}

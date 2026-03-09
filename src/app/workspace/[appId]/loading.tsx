import { Skeleton } from "@/components/ui/skeleton";

export default function AppWorkspaceLoading() {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-12" />
        </div>
        <div className="lg:col-span-3">
          <Skeleton className="h-96" />
        </div>
      </div>
    </div>
  );
}

import { FormSkeleton, Skeleton } from "../../../../components/ui/Loading";

export default function AdminComposeLoading() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <FormSkeleton fields={4} />
      <Skeleton className="h-96 w-full" rounded="rounded-lg" />
    </div>
  );
}

import {
  CardGridSkeleton,
  PageHeaderSkeleton,
} from "../../../../components/ui/Loading";

export default function AdminGuideLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <CardGridSkeleton
        count={4}
        variant="text"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        label="Loading the owner guide"
      />
    </div>
  );
}

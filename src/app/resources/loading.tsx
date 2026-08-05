import {
  CardGridSkeleton,
  PageHeaderSkeleton,
  Skeleton,
} from "../../components/ui/Loading";

export default function ResourcesLoading() {
  return (
    <section className="space-y-5">
      <PageHeaderSkeleton />
      <div className="site-panel p-4">
        <Skeleton className="h-9 w-full" />
      </div>
      <CardGridSkeleton
        count={8}
        variant="resource"
        className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4"
        label="Loading the library"
      />
    </section>
  );
}

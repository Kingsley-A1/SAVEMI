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
      <CardGridSkeleton count={6} variant="resource" label="Loading the library" />
    </section>
  );
}

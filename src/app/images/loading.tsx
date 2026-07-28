import {
  CardGridSkeleton,
  PageHeaderSkeleton,
  Skeleton,
} from "../../components/ui/Loading";

export default function ImagesLoading() {
  return (
    <section className="space-y-5">
      <PageHeaderSkeleton />
      <div className="site-panel p-4">
        <Skeleton className="h-9 w-full" />
      </div>
      <CardGridSkeleton
        count={4}
        variant="media"
        className="grid grid-cols-1 gap-4 lg:grid-cols-2"
        label="Loading image messages"
      />
    </section>
  );
}

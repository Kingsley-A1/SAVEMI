import {
  CardGridSkeleton,
  PageHeaderSkeleton,
  Skeleton,
} from "../../components/ui/Loading";

export default function BooksLoading() {
  return (
    <section className="space-y-5">
      <PageHeaderSkeleton />
      <div className="site-panel p-4">
        <Skeleton className="h-9 w-full" />
      </div>
      <CardGridSkeleton count={6} variant="book" label="Loading the library" />
    </section>
  );
}

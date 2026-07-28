import {
  CardGridSkeleton,
  PageHeaderSkeleton,
} from "../../components/ui/Loading";

export default function QuotesLoading() {
  return (
    <section className="space-y-5">
      <PageHeaderSkeleton />
      <CardGridSkeleton
        count={6}
        variant="text"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        label="Loading quotes"
      />
    </section>
  );
}

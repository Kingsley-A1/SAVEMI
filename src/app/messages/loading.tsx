import {
  CardGridSkeleton,
  PageHeaderSkeleton,
} from "../../components/ui/Loading";

export default function MessagesLoading() {
  return (
    <section className="space-y-5">
      <PageHeaderSkeleton />
      <CardGridSkeleton
        count={6}
        variant="media"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
        label="Loading messages"
      />
    </section>
  );
}

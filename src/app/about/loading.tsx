import {
  CardGridSkeleton,
  PageHeaderSkeleton,
} from "../../components/ui/Loading";

export default function AboutLoading() {
  return (
    <div className="space-y-5">
      <PageHeaderSkeleton />
      <CardGridSkeleton count={3} variant="text" label="Loading our story" />
    </div>
  );
}

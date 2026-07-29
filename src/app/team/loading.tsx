import {
  CardGridSkeleton,
  PageHeaderSkeleton,
} from "../../components/ui/Loading";

export default function TeamLoading() {
  return (
    <div className="space-y-5">
      <PageHeaderSkeleton />
      <CardGridSkeleton
        count={6}
        variant="text"
        label="Loading the ministry team"
      />
    </div>
  );
}

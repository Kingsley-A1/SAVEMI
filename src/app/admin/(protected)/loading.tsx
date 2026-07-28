import {
  CardGridSkeleton,
  PageHeaderSkeleton,
  StatGridSkeleton,
} from "../../../components/ui/Loading";

export default function AdminDashboardLoading() {
  return (
    <div className="space-y-5">
      <PageHeaderSkeleton />
      <StatGridSkeleton count={4} />
      <CardGridSkeleton
        count={2}
        variant="text"
        className="grid gap-4 lg:grid-cols-2"
        label="Loading dashboard panels"
      />
    </div>
  );
}

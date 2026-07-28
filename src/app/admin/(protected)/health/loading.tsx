import {
  PageHeaderSkeleton,
  StatGridSkeleton,
  TableSkeleton,
} from "../../../../components/ui/Loading";

export default function AdminHealthLoading() {
  return (
    <div className="space-y-5">
      <PageHeaderSkeleton />
      <StatGridSkeleton count={4} />
      <TableSkeleton rows={6} columns={3} label="Running health checks" />
    </div>
  );
}

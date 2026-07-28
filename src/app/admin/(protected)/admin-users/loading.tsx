import {
  PageHeaderSkeleton,
  TableSkeleton,
} from "../../../../components/ui/Loading";

export default function AdminUsersLoading() {
  return (
    <div className="space-y-5">
      <PageHeaderSkeleton />
      <TableSkeleton rows={5} columns={4} label="Loading admin users" />
    </div>
  );
}

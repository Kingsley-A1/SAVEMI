import {
  PageHeaderSkeleton,
  TableSkeleton,
} from "../../../../components/ui/Loading";

export default function AdminAuditLogLoading() {
  return (
    <div className="space-y-5">
      <PageHeaderSkeleton />
      <TableSkeleton rows={10} columns={5} label="Loading audit events" />
    </div>
  );
}

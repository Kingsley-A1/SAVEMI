import {
  PageHeaderSkeleton,
  TableSkeleton,
} from "../../../../components/ui/Loading";

export default function AdminContactsLoading() {
  return (
    <div className="space-y-5">
      <PageHeaderSkeleton />
      <TableSkeleton rows={8} columns={4} label="Loading contact submissions" />
    </div>
  );
}

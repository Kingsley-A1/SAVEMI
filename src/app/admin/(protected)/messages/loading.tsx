import {
  PageHeaderSkeleton,
  TableSkeleton,
} from "../../../../components/ui/Loading";

export default function AdminMessagesLoading() {
  return (
    <div className="space-y-5">
      <PageHeaderSkeleton />
      <TableSkeleton rows={8} columns={5} label="Loading messages" />
    </div>
  );
}

import {
  PageHeaderSkeleton,
  TableSkeleton,
} from "../../../../components/ui/Loading";

export default function AdminBooksLoading() {
  return (
    <div className="space-y-5">
      <PageHeaderSkeleton />
      <TableSkeleton rows={6} columns={5} label="Loading books" />
    </div>
  );
}

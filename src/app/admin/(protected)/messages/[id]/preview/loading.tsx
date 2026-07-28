import { DetailSkeleton } from "../../../../../../components/ui/Loading";

export default function MessagePreviewLoading() {
  return (
    <div className="mx-auto max-w-3xl">
      <DetailSkeleton />
    </div>
  );
}

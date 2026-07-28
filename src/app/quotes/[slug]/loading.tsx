import { DetailSkeleton } from "../../../components/ui/Loading";

export default function QuoteDetailLoading() {
  return (
    <div className="mx-auto max-w-3xl">
      <DetailSkeleton />
    </div>
  );
}

import { DetailSkeleton } from "../../../components/ui/Loading";

export default function BookDetailLoading() {
  return (
    <div className="mx-auto max-w-4xl">
      <DetailSkeleton />
    </div>
  );
}

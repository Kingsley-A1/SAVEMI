import { DetailSkeleton } from "../../../components/ui/Loading";

export default function ResourceDetailLoading() {
  return (
    <div className="mx-auto max-w-4xl">
      <DetailSkeleton />
    </div>
  );
}

import { DetailSkeleton } from "../../../components/ui/Loading";

export default function MessageDetailLoading() {
  return (
    <article className="mx-auto max-w-3xl">
      <DetailSkeleton />
    </article>
  );
}

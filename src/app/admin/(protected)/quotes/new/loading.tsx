import { FormSkeleton } from "../../../../../components/ui/Loading";

export default function NewQuoteLoading() {
  return (
    <div className="mx-auto max-w-2xl">
      <FormSkeleton fields={5} />
    </div>
  );
}

import { FormSkeleton } from "../../../../../components/ui/Loading";

export default function NewBookLoading() {
  return (
    <div className="mx-auto max-w-2xl">
      <FormSkeleton fields={6} />
    </div>
  );
}

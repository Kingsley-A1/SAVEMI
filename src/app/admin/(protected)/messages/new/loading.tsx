import { FormSkeleton } from "../../../../../components/ui/Loading";

export default function NewMessageLoading() {
  return (
    <div className="mx-auto max-w-3xl">
      <FormSkeleton fields={7} />
    </div>
  );
}

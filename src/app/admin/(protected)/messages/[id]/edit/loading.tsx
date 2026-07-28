import { FormSkeleton } from "../../../../../../components/ui/Loading";

export default function EditRecordLoading() {
  return (
    <div className="mx-auto max-w-3xl">
      <FormSkeleton fields={6} />
    </div>
  );
}

import { FormSkeleton } from "../../../../components/ui/Loading";

export default function AdminSettingsLoading() {
  return (
    <div className="mx-auto max-w-3xl">
      <FormSkeleton fields={6} />
    </div>
  );
}

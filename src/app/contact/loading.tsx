import { FormSkeleton } from "../../components/ui/Loading";

export default function ContactLoading() {
  return (
    <div className="mx-auto max-w-2xl">
      <FormSkeleton fields={3} />
    </div>
  );
}

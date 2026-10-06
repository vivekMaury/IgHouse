import { redirect } from "next/navigation";

type NewWorkflowAliasPageProps = {
  searchParams?: {
    id?: string;
  };
};

export default function NewWorkflowAliasPage({
  searchParams,
}: NewWorkflowAliasPageProps) {
  const workflowId = searchParams?.id;
  redirect(
    workflowId
      ? `/dashboard/flows/new?id=${encodeURIComponent(workflowId)}`
      : "/dashboard/flows/new",
  );
}

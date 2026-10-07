import { redirect } from "next/navigation";

/** Share link: /app/join/ABC123 → join form pre-filled. */
export default async function JoinLink({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  redirect(`/app/groups/join?code=${encodeURIComponent(code)}`);
}

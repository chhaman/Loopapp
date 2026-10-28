import { Feed } from "@/components/Feed";
import { getCurrentUser } from "@/lib/data/auth";
import { getFeed } from "@/lib/data/catalog";
import { startFeedAt } from "@/lib/domain/feed";

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const { app } = await searchParams;
  const [feed, user] = await Promise.all([getFeed(), getCurrentUser()]);
  const entries = startFeedAt(feed, typeof app === "string" ? app : undefined);
  return <Feed entries={entries} viewer={{ signedIn: user !== null }} />;
}

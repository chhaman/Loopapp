import { notFound } from "next/navigation";
import { Harness } from "./Harness";

const FIXTURES = ["broken", "escape"] as const;

/**
 * Test-only page that runs fixture miniapps through the real viewer
 * (TC-004, TC-005). Disabled unless NEXT_PUBLIC_ENABLE_TEST_HARNESS=1.
 */
export default async function TestHarnessPage({ searchParams }: PageProps<"/test-harness">) {
  if (process.env.NEXT_PUBLIC_ENABLE_TEST_HARNESS !== "1") notFound();
  const { fixture } = await searchParams;
  if (!FIXTURES.includes(fixture as (typeof FIXTURES)[number])) notFound();
  return (
    <div className="mx-auto h-[70dvh] max-w-md p-4">
      <Harness fixture={fixture as string} />
    </div>
  );
}

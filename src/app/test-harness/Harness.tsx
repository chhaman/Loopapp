"use client";

import { MiniappViewer } from "@/components/MiniappViewer";

export function Harness({ fixture }: { fixture: string }) {
  return (
    <MiniappViewer
      app={{
        id: "00000000-0000-4000-a000-0000000000ff",
        slug: `fixture-${fixture}`,
        name: `Fixture ${fixture}`,
        accent: "#7B6CF6",
        versionId: "00000000-0000-4000-b000-0000000000ff",
        entryPath: `/miniapps/_fixtures/${fixture}/index.html`,
      }}
      load
      active
      resetKey={0}
      onSkip={() => {}}
    />
  );
}

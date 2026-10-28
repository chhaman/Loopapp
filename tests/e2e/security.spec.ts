import { expect, test } from "@playwright/test";

test.describe("Aislamiento de miniapps (RF-012, RNF-005)", () => {
  test("TC-004 · una miniapp no puede leer cookies, storage, DOM del host ni usar la red", async ({ page, context }) => {
    await context.addCookies([{ name: "sb-test-auth-token", value: "secret-token", url: test.info().project.use.baseURL! }]);
    await page.goto("/");
    await page.evaluate(() => localStorage.setItem("secret", "host-only"));
    await page.goto("/test-harness?fixture=escape");
    const frame = page.locator("iframe").contentFrame();
    await expect(frame.locator("#out")).toHaveText("blocked", { timeout: 15_000 });
  });

  test("TC-005 · una excepción de la miniapp muestra un error recuperable", async ({ page }) => {
    await page.goto("/test-harness?fixture=broken");
    await expect(page.getByTestId("miniapp-error")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("button", { name: "Reintentar" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Siguiente" })).toBeVisible();
  });

  test("las miniapps se sirven con CSP restrictiva y sandbox", async ({ request }) => {
    const res = await request.get("/miniapps/foco/1.0.0/index.html");
    expect(res.ok()).toBe(true);
    const csp = res.headers()["content-security-policy"];
    expect(csp).toContain("connect-src 'none'");
    expect(csp).toContain("sandbox allow-scripts");
    expect(res.headers()["x-content-type-options"]).toBe("nosniff");
  });

  test("el iframe no concede capacidades extra", async ({ page }) => {
    await page.goto("/");
    const iframe = page.locator('[data-slug="foco"] iframe');
    await expect(iframe).toHaveAttribute("sandbox", "allow-scripts");
    await expect(iframe).toHaveAttribute("allow", "");
  });

  test("las páginas del host no se pueden embeber", async ({ request }) => {
    const res = await request.get("/");
    expect(res.headers()["x-frame-options"]).toBe("DENY");
    expect(res.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
  });
});

test.describe("Autorización y entradas (TC-015, RF-040)", () => {
  test("TC-015 · un visitante no accede al panel de administración", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByTestId("admin-forbidden")).toBeVisible();
    await expect(page.getByRole("link", { name: "Admin" })).toHaveCount(0);
  });

  test("el endpoint de eventos valida la entrada", async ({ request }) => {
    expect((await request.post("/api/events", { data: "not json", headers: { "content-type": "text/plain" } })).status()).toBe(400);
    expect((await request.post("/api/events", { data: { events: [{ type: "purchase" }] } })).status()).toBe(400);
    const ok = await request.post("/api/events", {
      data: {
        events: [
          {
            type: "impression",
            appId: "00000000-0000-4000-a000-000000000001",
            versionId: "00000000-0000-4000-b000-000000000001",
            sessionId: "8c7c2c55-41a6-4f63-9a4a-3d2b1c0e9f00",
            at: new Date().toISOString(),
          },
        ],
      },
    });
    expect(ok.status()).toBe(202);
  });

  test("sin Supabase, el login explica que las cuentas no están habilitadas", async ({ page }) => {
    await page.goto("/ingresar");
    await expect(page.getByTestId("auth-not-configured")).toBeVisible();
  });
});

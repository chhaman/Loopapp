import { expect, test } from "@playwright/test";
import { miniappFrame, waitForActiveMiniapp } from "./helpers";

test.describe("Descubrir y probar (flujo 4.1)", () => {
  test("TC-001 · el visitante ve el feed sin registrarse", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("feed-item")).toHaveCount(5);
    await waitForActiveMiniapp(page, "foco");
    await expect(page.getByRole("heading", { name: /Foco/ })).toBeVisible();
    await expect(page.getByText("Demo de Loopapp").first()).toBeVisible();
  });

  test("TC-003 · una miniapp válida responde a la interacción", async ({ page }) => {
    await page.goto("/?app=foco");
    await waitForActiveMiniapp(page, "foco");
    const frame = miniappFrame(page, "foco");
    await frame.getByRole("button", { name: "Empezar" }).click();
    await expect(frame.getByRole("button", { name: "Pausar" })).toBeVisible();
  });

  test("TC-002 · pasar a la siguiente miniapp con el control o el teclado", async ({ page }) => {
    await page.goto("/");
    await waitForActiveMiniapp(page, "foco");
    await page.getByRole("button", { name: "Miniapp siguiente" }).first().click();
    await waitForActiveMiniapp(page, "dividi-la-cuenta");
    await page.locator("body").press("ArrowDown");
    await waitForActiveMiniapp(page, "paletas");
    await page.locator("body").press("ArrowUp");
    await waitForActiveMiniapp(page, "dividi-la-cuenta");
  });

  test("RF-003 · la siguiente miniapp se precarga", async ({ page }) => {
    await page.goto("/");
    await waitForActiveMiniapp(page, "foco");
    await expect(page.locator('[data-slug="dividi-la-cuenta"] iframe')).toHaveCount(1);
    await expect(page.locator('[data-slug="respira"] iframe')).toHaveCount(0);
  });

  test("RF-011 · reiniciar la demo vuelve al estado inicial", async ({ page }) => {
    await page.goto("/?app=foco");
    const item = await waitForActiveMiniapp(page, "foco");
    const frame = miniappFrame(page, "foco");
    await frame.getByRole("button", { name: "Empezar" }).click();
    await expect(frame.getByRole("button", { name: "Pausar" })).toBeVisible();
    await item.getByTestId("reset-demo").click();
    await expect(item.getByTestId("miniapp-viewer")).toHaveAttribute("data-status", "ready");
    await expect(miniappFrame(page, "foco").getByRole("button", { name: "Empezar" })).toBeVisible();
  });

  test("TC-006 · guardar sin cuenta pide iniciar sesión y conserva el contexto", async ({ page }) => {
    await page.goto("/?app=paletas");
    const item = await waitForActiveMiniapp(page, "paletas");
    await item.getByRole("button", { name: "Guardar" }).click();
    const prompt = page.getByTestId("auth-prompt");
    await expect(prompt).toBeVisible();
    await expect(prompt.getByRole("link")).toHaveAttribute("href", "/ingresar?next=%2F%3Fapp%3Dpaletas");
    await prompt.getByRole("button", { name: "Seguir explorando" }).click();
    await expect(prompt).toBeHidden();
  });

  test("TC-013 · si la miniapp no carga se ofrece reintentar", async ({ page }) => {
    await page.route("**/miniapps/foco/**", (route) => route.abort("internetdisconnected"));
    await page.goto("/?app=foco");
    const item = page.locator('[data-slug="foco"]');
    await expect(item.getByTestId("miniapp-error")).toBeVisible({ timeout: 20_000 });
    await page.unroute("**/miniapps/foco/**");
    await item.getByRole("button", { name: "Reintentar" }).click();
    await expect(item.getByTestId("miniapp-viewer")).toHaveAttribute("data-status", "ready", { timeout: 15_000 });
  });
});

test.describe("Ficha y enlaces compartidos", () => {
  test("RF-005 · la ficha muestra procedencia, versión y permisos", async ({ page }) => {
    await page.goto("/app/conversor");
    const details = page.getByTestId("app-details");
    await expect(details.getByRole("heading", { level: 1, name: "Conversor" })).toBeVisible();
    await expect(details.getByText("Demo de Loopapp")).toBeVisible();
    await expect(details.getByText("1.0.0")).toBeVisible();
    await expect(details.getByText(/Ninguno/)).toBeVisible();
  });

  test("RF-006 · el enlace compartido abre la experiencia correcta", async ({ page }) => {
    await page.goto("/app/respira");
    await page.getByRole("link", { name: "Probar en el feed" }).click();
    await waitForActiveMiniapp(page, "respira");
  });

  test("TC-012 · una app inexistente o retirada muestra un estado apropiado", async ({ page }) => {
    await page.goto("/app/no-existe");
    await expect(page.getByTestId("app-unavailable")).toBeVisible();
    await page.getByRole("link", { name: "Volver al feed" }).click();
    await expect(page.getByTestId("feed")).toBeVisible();
  });
});

test.describe("Preferencias", () => {
  test("cambia a inglés y vuelve a español", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("lang-toggle").click();
    await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
    await waitForActiveMiniapp(page, "foco");
    await expect(miniappFrame(page, "foco").getByRole("button", { name: "Start" })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
    await page.getByTestId("lang-toggle").click();
    await expect(page.getByRole("link", { name: "Ingresar" })).toBeVisible();
  });

  test("alterna tema sistema → claro → oscuro y lo recuerda", async ({ page }) => {
    await page.goto("/");
    const html = page.locator("html");
    await expect(html).toHaveAttribute("data-theme", "system");
    await page.getByTestId("theme-toggle").click();
    await expect(html).toHaveAttribute("data-theme", "light");
    await page.getByTestId("theme-toggle").click();
    await expect(html).toHaveAttribute("data-theme", "dark");
    await page.reload();
    await expect(html).toHaveAttribute("data-theme", "dark");
    await waitForActiveMiniapp(page, "foco");
    await expect(miniappFrame(page, "foco").locator("html")).toHaveAttribute("data-theme", "dark");
  });
});

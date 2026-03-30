const { request } = require('@playwright/test');

/**
 * Быстрая проверка, что фронт поднят (иначе все тесты «зависают» на UI).
 */
module.exports = async function globalSetup(config) {
  const baseURL =
    config.projects?.[0]?.use?.baseURL ||
    process.env.PLAYWRIGHT_BASE_URL ||
    'http://127.0.0.1:3001';

  const ctx = await request.newContext({ baseURL });
  try {
    const pageRes = await ctx.get('/profile.html', { timeout: 15_000 });
    if (!pageRes.ok()) {
      throw new Error(`profile.html HTTP ${pageRes.status()}`);
    }
    const apiRes = await ctx.get('/api/meal-types', { timeout: 15_000 });
    if (!apiRes.ok()) {
      throw new Error(
        `/api/meal-types HTTP ${apiRes.status()} (нужна рабочая БД и миграция meal_types)`
      );
    }
  } catch (err) {
    throw new Error(
      `[E2E] Нет доступа к ${baseURL} (${err.message}).\n` +
        `Запустите стек из корня репозитория: docker compose up\n` +
        `Затем снова: npm run test:e2e (из папки frontend)`
    );
  } finally {
    await ctx.dispose();
  }
};

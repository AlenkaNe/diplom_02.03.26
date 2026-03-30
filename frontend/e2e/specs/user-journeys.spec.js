const { test, expect } = require('@playwright/test');
const { newUserCreds, register, logout, login } = require('../helpers/auth');

/**
 * Сценарии приближены к пользовательским путям.
 * Требования: запущенный frontend (порт 3001), PostgreSQL с миграцией/ init-db,
 * для USDA: backend Nest на 3000 и FOOD_DATA_API_KEY (как в docker-compose).
 */
test.describe('Ключевые пользовательские сценарии (E2E)', () => {
  test('1. Регистрация → выход → вход → расчёт и сохранение норм КБЖУ', async ({ page }) => {
    const u = newUserCreds();
    await register(page, u);
    await logout(page);
    await login(page, u);

    await page.goto('/calorie-calculator.html');
    await page.locator('#gender').selectOption('male');
    await page.locator('#age').fill('30');
    await page.locator('#height').fill('180');
    await page.locator('#weight').fill('80');
    await page.locator('#activity').selectOption('1.55');
    await page.locator('#goal').selectOption('loss');
    await page.locator('#formula').selectOption('harris');
    await page.getByRole('button', { name: 'Рассчитать' }).click();

    await expect(page.locator('#tdee-value')).not.toHaveText('0');
    await expect(page.locator('#body-mass-index-value')).not.toHaveText('0');
    await expect(page.locator('#save-notification')).toBeVisible({ timeout: 25_000 });
    await expect(page.locator('#save-notification')).toContainText(/сохранен/i);
  });

  test('2. Добавление продукта в дневник (поиск USDA → модальное окно)', async ({
    page,
    request,
    baseURL,
  }) => {
    const probe = await request.get(
      `${baseURL}/foods/search?query=apple&pageSize=3&pageNumber=1`
    );
    test.skip(
      !probe.ok(),
      `Прокси /foods недоступен (HTTP ${probe.status()}). Запустите backend с FOOD_DATA_API_KEY (например: docker compose up).`
    );

    const u = newUserCreds();
    await register(page, u);

    await page.goto('/product-search.html');
    await page.locator('#search-input').fill('apple');
    await page.locator('#search-button').click();

    await expect(page.locator('#results-table')).toBeVisible({ timeout: 30_000 });
    const addBtn = page.locator('#results-body tr').first().getByRole('button', {
      name: 'Добавить в дневник',
    });
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    await expect(page.locator('#add-to-diary-modal')).toBeVisible();
    await page.locator('#meal-type-select').selectOption({ index: 1 });
    await page.locator('#amount-gram').fill('120');
    await page.locator('#add-to-diary-form').getByRole('button', { name: 'Добавить в дневник' }).click();

    await expect(page.locator('#diary-message')).toContainText(/успешно/i, { timeout: 20_000 });
  });

  test('3. Просмотр дневника за день', async ({ page, baseURL }) => {
    const u = newUserCreds();
    await register(page, u);
    const today = new Date().toISOString().split('T')[0];

    const addRes = await page.request.post(`${baseURL}/api/diary/add`, {
      data: {
        meal_type_id: 1,
        amount_gram: 100,
        custom_name: 'E2E_Просмотр',
        custom_kcal: 100,
        custom_protein: 5,
        custom_fat: 2,
        custom_carbs: 15,
        eaten_at: today,
      },
    });
    expect(addRes.ok(), `Запись не создана: ${addRes.status()} ${await addRes.text()}`).toBeTruthy();

    await page.goto('/diary.html');
    await expect(page.locator('#date-input')).toHaveValue(today);
    await expect(page.getByRole('heading', { name: 'Дневник питания' })).toBeVisible();
    await expect(page.locator('.entry-name')).toContainText('E2E_Просмотр', { timeout: 20_000 });
    await expect(page.locator('#summary')).toBeVisible();
  });

  test('4. Поиск продуктов (прокси /foods → Nest → USDA)', async ({ page, request, baseURL }) => {
    const probe = await request.get(
      `${baseURL}/foods/search?query=rice&pageSize=5&pageNumber=1`
    );
    test.skip(
      !probe.ok(),
      `Нет ответа от прокси USDA (HTTP ${probe.status()}). Проверьте docker compose и FOOD_DATA_API_KEY.`
    );

    const u = newUserCreds();
    await register(page, u);
    await page.goto('/product-search.html');
    await page.locator('#search-input').fill('rice');
    await page.locator('#search-button').click();

    await expect(page.locator('#results-body tr').first()).toBeVisible({ timeout: 30_000 });
    const idCell = page.locator('#results-body tr').first().locator('td').first();
    await expect(idCell).toHaveText(/\d+/);
  });

  test('5. Обновление профиля', async ({ page }) => {
    const u = newUserCreds();
    await register(page, u);
    await page.getByRole('button', { name: 'Редактировать данные' }).click();
    await page.locator('#edit-first-name').fill('ОбновленоИмя');
    await page.locator('#edit-last-name').fill('ОбновленоФамилия');
    await page.getByRole('button', { name: 'Сохранить изменения' }).click();
    await expect(page.locator('#message.success')).toContainText(/обновлен/i, { timeout: 15_000 });
    await expect(page.locator('#user-content')).toContainText('ОбновленоИмя');
  });
});

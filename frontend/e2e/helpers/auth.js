/**
 * Уникальные данные пользователя для изолированных E2E-прогонов.
 */
function newUserCreds() {
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  return {
    login: `e2e_${id}`,
    password: 'E2E_Secure_Pass_1',
    firstName: 'E2E',
  };
}

/**
 * Регистрация на странице профиля (остаётся с JWT cookie).
 */
async function register(page, { login, password, firstName }) {
  await page.goto('/profile.html');
  await page.getByRole('button', { name: 'Регистрация' }).click();
  await page.locator('#register-username').fill(login);
  await page.locator('#register-password').fill(password);
  await page.locator('#register-first-name').fill(firstName);
  // У части развёртываний в БД last_name объявлен как NOT NULL — заполняем явно.
  await page.locator('#register-last-name').fill('E2E');
  const [regResp] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes('/api/register') && r.request().method() === 'POST',
      { timeout: 25_000 }
    ),
    page.getByRole('button', { name: 'Зарегистрироваться' }).click(),
  ]);
  if (!regResp.ok()) {
    let detail = '';
    try {
      detail = JSON.stringify(await regResp.json());
    } catch {
      detail = (await regResp.text()).slice(0, 500);
    }
    throw new Error(`Регистрация не удалась: HTTP ${regResp.status()} ${detail}`);
  }
  await page.locator('#user-section').waitFor({ state: 'visible', timeout: 25_000 });
}

async function logout(page) {
  await page.getByRole('button', { name: 'Выйти' }).click();
  await page.locator('#auth-section').waitFor({ state: 'visible', timeout: 20_000 });
}

async function login(page, { login, password }) {
  await page.getByRole('button', { name: 'Вход' }).click();
  await page.locator('#login-form').waitFor({ state: 'visible', timeout: 10_000 });
  await page.locator('#login-username').fill(login);
  await page.locator('#login-password').fill(password);
  const [loginResp] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes('/api/login') && r.request().method() === 'POST',
      { timeout: 25_000 }
    ),
    page.getByRole('button', { name: 'Войти' }).click(),
  ]);
  if (!loginResp.ok()) {
    let detail = '';
    try {
      detail = JSON.stringify(await loginResp.json());
    } catch {
      detail = (await loginResp.text()).slice(0, 500);
    }
    throw new Error(`Вход не удался: HTTP ${loginResp.status()} ${detail}`);
  }
  await page.locator('#user-section').waitFor({ state: 'visible', timeout: 25_000 });
}

module.exports = { newUserCreds, register, logout, login };

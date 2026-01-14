import { test, expect } from '@playwright/test';

test.describe('Teachers CRUD Smoke Test', () => {
  test('should load Teachers page', async ({ page }) => {
    await page.goto('/teachers');
    await expect(page.locator('h1, h2')).toContainText(['Teacher', 'Teachers']);
  });

  test('should create a new teacher', async ({ page }) => {
    await page.goto('/teachers');
    await page.click('button:has-text("Add Teacher")');
    await page.fill('input[name="name"]', 'Test Teacher');
    await page.fill('input[name="email"]', 'test.teacher@example.com');
    await page.click('button:has-text("Save")');
    await expect(page.locator('table')).toContainText('Test Teacher');
  });

  test('should update teacher', async ({ page }) => {
    await page.goto('/teachers');
    await page.click('tr:has-text("Test Teacher") button:has-text("Edit")');
    await page.fill('input[name="name"]', 'Test Teacher Updated');
    await page.click('button:has-text("Save")');
    await expect(page.locator('table')).toContainText('Test Teacher Updated');
  });

  test('should delete teacher', async ({ page }) => {
    await page.goto('/teachers');
    await page.click('tr:has-text("Test Teacher Updated") button:has-text("Delete")');
    await page.click('button:has-text("Confirm")');
    await expect(page.locator('table')).not.toContainText('Test Teacher Updated');
  });
});

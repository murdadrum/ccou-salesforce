import { test, expect } from '@playwright/test'

test.describe('Events page', () => {
  test('loads with correct title', async ({ page }) => {
    await page.goto('/events')
    await expect(page).toHaveTitle(/Upcoming Events/)
  })

  test('view toggle is present', async ({ page }) => {
    await page.goto('/events')
    await expect(page.getByRole('button', { name: /List/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Grid/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Calendar/i })).toBeVisible()
  })

  test('List view is active by default', async ({ page }) => {
    await page.goto('/events')
    const listBtn = page.getByRole('button', { name: /List/i })
    await expect(listBtn).toHaveClass(/view-toggle-btn--active/)
  })

  test('nav is present with Events link active', async ({ page }) => {
    await page.goto('/events')
    await expect(page.locator('nav').first()).toBeVisible()
    // Desktop uses .nav-links; mobile collapses to .nav-flyout — check either
    await expect(page.locator('.nav-links a.nav-active, .nav-flyout a.nav-active').filter({ hasText: 'Events' }).first()).toBeAttached()
  })

  test('subscribe form is present', async ({ page }) => {
    await page.goto('/events')
    await expect(page.locator('.events-subscribe')).toBeVisible()
  })
})

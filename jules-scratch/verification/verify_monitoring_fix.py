import re
from playwright.sync_api import Page, expect, sync_playwright

def run_test(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    base_url = "http://localhost:3000"

    # --- 1. Login and Navigate ---
    print("Logging in as admin_banorte...")
    page.goto(f"{base_url}/login.html")
    expect(page.get_by_role("heading", name="Login")).to_be_visible()
    page.get_by_label("Username:").fill("admin_banorte")
    page.get_by_label("Password:").fill("password123")
    page.get_by_role("button", name="Login").click()

    # Wait for selection page and access the dashboard
    expect(page.get_by_role("heading", name=re.compile("Welcome"))).to_be_visible()
    banorte_card = page.locator(".card", has_text="Banorte")
    with page.expect_navigation():
        banorte_card.get_by_role("button", name="Access Dashboard").click()

    # Navigate to Monitoring page
    expect(page.get_by_role("heading", name="Dashboard - Banorte")).to_be_visible()
    page.get_by_role("button", name="Menu").click()
    with page.expect_navigation():
        page.get_by_role("link", name="Monitoring").click()

    # --- 2. Verify Monitoring Page ---
    print("Verifying monitoring page...")
    # Expect the main header to be visible
    expect(page.get_by_role("heading", name="Monitoring - Banorte")).to_be_visible()

    # Expect the table to contain at least one of the known processes for Banorte.
    # This confirms that the API call was successful and the data was rendered.
    expect(page.get_by_text("PROCESO NOCTURNO BANORTE")).to_be_visible(timeout=10000)

    print("Monitoring page loaded successfully.")

    # --- 3. Take Screenshot ---
    page.screenshot(path="jules-scratch/verification/monitoring_fix_verified.png")
    print("Screenshot taken.")

    browser.close()

if __name__ == "__main__":
    with sync_playwright() as p:
        run_test(p)
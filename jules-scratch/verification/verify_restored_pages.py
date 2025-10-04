import re
from playwright.sync_api import Page, expect, sync_playwright

def run_test(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    base_url = "http://localhost:3000"

    # --- 1. Login and Navigate to Dashboard ---
    print("Logging in as admin_banorte...")
    page.goto(f"{base_url}/login.html")
    page.get_by_label("Username:").fill("admin_banorte")
    page.get_by_label("Password:").fill("password123")
    page.get_by_role("button", name="Login").click()

    expect(page.get_by_role("heading", name=re.compile("Welcome"))).to_be_visible()
    banorte_card = page.locator(".card", has_text="Banorte")
    with page.expect_navigation():
        banorte_card.get_by_role("button", name="Access Dashboard").click()

    # --- 2. Verify processes.html ---
    print("Verifying processes.html...")
    # Navigate to Processes page
    page.get_by_role("button", name="Menu").click()
    with page.expect_navigation():
        page.get_by_role("link", name="Processes").click()

    # Check that the main page content is there
    expect(page.get_by_role("heading", name="Processes - Banorte")).to_be_visible()
    expect(page.get_by_text("PROCESO NOCTURNO BANORTE")).to_be_visible(timeout=10000)

    # Open the modal and verify its complex content was restored
    page.get_by_role("button", name="Add New Process").click()
    expect(page.get_by_role("heading", name="Add New Process")).to_be_visible()
    # Check for a few key fields from the original implementation
    expect(page.get_by_label("Frequency")).to_be_visible()
    expect(page.get_by_label("Process Mode")).to_be_visible()
    expect(page.get_by_role("button", name="+ Vincular Hijo")).to_be_visible()
    expect(page.get_by_role("heading", name="Define Internal Phases")).to_be_visible()

    # Close the modal
    page.get_by_role("button", name="Close").click()
    print("processes.html verification PASSED.")

    # --- 3. Verify monitoring.html ---
    print("Verifying monitoring.html...")
    # Navigate to Monitoring page
    page.get_by_role("button", name="Menu").click()
    with page.expect_navigation():
        page.get_by_role("link", name="Monitoring").click()

    # Verify the page loaded and contains data
    expect(page.get_by_role("heading", name="Monitoring - Banorte")).to_be_visible()
    expect(page.get_by_text("PROCESO NOCTURNO BANORTE")).to_be_visible(timeout=10000)
    print("monitoring.html verification PASSED.")

    # --- 4. Take Screenshot ---
    page.screenshot(path="jules-scratch/verification/final_verification.png")
    print("Screenshot taken.")

    browser.close()

if __name__ == "__main__":
    with sync_playwright() as p:
        run_test(p)
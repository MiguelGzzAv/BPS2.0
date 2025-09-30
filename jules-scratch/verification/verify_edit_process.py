import re
from playwright.sync_api import Page, expect, sync_playwright

def run_test(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    base_url = "http://localhost:3000"
    process_to_edit_name = "PROCESO NOCTURNO BANORTE"

    # --- 1. Login and Navigate ---
    print("Logging in as superadmin...")
    page.goto(f"{base_url}/login.html")
    page.get_by_label("Username:").fill("superadmin")
    page.get_by_label("Password:").fill("password123")
    page.get_by_role("button", name="Login").click()

    expect(page.get_by_role("heading", name=re.compile("Welcome"))).to_be_visible()
    banorte_card = page.locator(".card", has_text="Banorte")
    with page.expect_navigation():
        banorte_card.get_by_role("button", name="Access Dashboard").click()

    # Navigate to Processes page
    expect(page.get_by_role("heading", name="Dashboard - Banorte")).to_be_visible()
    page.get_by_role("button", name="Menu").click()
    with page.expect_navigation():
        page.get_by_role("link", name="Processes").click()

    expect(page.get_by_role("heading", name="Processes - Banorte")).to_be_visible()

    # --- 2. Find and click the Edit button ---
    print(f"Attempting to edit process: {process_to_edit_name}")
    # Find the table row containing the process name, then find the edit button within that row.
    process_row = page.locator("tr", has_text=process_to_edit_name)
    edit_button = process_row.get_by_role("button", name="Edit")

    edit_button.click()
    print("Edit button clicked.")

    # --- 3. Verify the modal opened with the correct data ---
    print("Verifying edit modal...")
    modal = page.locator("#addProcessModal")

    # Check that the modal and its title are visible
    expect(modal.get_by_role("heading", name="Edit Process")).to_be_visible()

    # Check that the process name field is populated with the correct name
    expect(modal.get_by_label("Process Name")).to_have_value(process_to_edit_name)
    print("Modal verified successfully.")

    # --- 4. Take Screenshot ---
    page.screenshot(path="jules-scratch/verification/edit_process_verified.png")
    print("Screenshot taken.")

    browser.close()

if __name__ == "__main__":
    with sync_playwright() as p:
        run_test(p)
import re
from playwright.sync_api import Page, expect, sync_playwright

def run_test(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    base_url = "http://localhost:3000"
    new_process_id = "TEST999"
    new_process_name = "Superadmin Test Process"

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

    # --- 2. Create a new process ---
    print(f"Creating new process: {new_process_name}")
    page.get_by_role("button", name="Add New Process").click()

    # Fill the modal form
    modal = page.locator("#addProcessModal")
    expect(modal.get_by_role("heading", name="Add New Process")).to_be_visible()
    modal.get_by_label("Process ID").fill(new_process_id)
    modal.get_by_label("Process Name").fill(new_process_name)

    # Save the process
    modal.get_by_role("button", name="Save Process").click()
    print("Save button clicked.")

    # --- 3. Verify the process was created ---
    print("Verifying process creation...")
    # The modal should close, and the new process should be in the table.
    # We use a higher timeout here to give the server time to respond and the UI to update.
    expect(page.get_by_text(new_process_name)).to_be_visible(timeout=10000)
    print("Process found in the table.")

    # --- 4. Take Screenshot ---
    page.screenshot(path="jules-scratch/verification/process_creation_verified.png")
    print("Screenshot taken.")

    browser.close()

if __name__ == "__main__":
    with sync_playwright() as p:
        run_test(p)
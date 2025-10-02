import re
from playwright.sync_api import Page, expect, sync_playwright

def run_test(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    base_url = "http://localhost:5173"

    # --- 1. Test redirection for unauthenticated user ---
    print("Verifying redirection for unauthenticated user...")
    page.goto(f"{base_url}/selection")
    expect(page).to_have_url(f"{base_url}/login")
    expect(page.get_by_role("heading", name="Login")).to_be_visible()
    print("Redirect successful.")

    # --- 2. Test successful login and navigation ---
    print("Testing login...")
    page.get_by_label("Username").fill("admin_banorte")
    page.get_by_label("Password").fill("password123")
    page.get_by_role("button", name="Login").click()

    # The correct way to test this is to wait for an element on the
    # destination page to appear, rather than checking the URL immediately.
    # The routing logic in App.jsx will handle the redirect.
    print("Waiting for selection page to load...")
    welcome_heading = page.get_by_role("heading", name=re.compile("Welcome, Admin Banorte!"))
    expect(welcome_heading).to_be_visible(timeout=10000)

    # Now that we've confirmed the page loaded, we can also assert the URL is correct.
    expect(page).to_have_url(f"{base_url}/selection")

    # Verify that the correct company is shown
    expect(page.get_by_text("Banorte")).to_be_visible()
    expect(page.get_by_text("Banamex")).not_to_be_visible()
    print("Login and navigation to selection page successful.")

    # --- 3. Take Screenshot ---
    page.screenshot(path="jules-scratch/verification/react_login_flow_verified.png")
    print("Screenshot taken.")

    browser.close()

if __name__ == "__main__":
    with sync_playwright() as p:
        run_test(p)
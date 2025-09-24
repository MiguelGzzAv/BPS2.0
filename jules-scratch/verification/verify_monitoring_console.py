import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Listen for console events and print them
        page.on("console", lambda msg: print(f"BROWSER CONSOLE: {msg.text}"))

        # Navigate to the monitoring page with a companyId
        await page.goto("http://localhost:3000/monitoring.html?companyId=1")

        # Wait for a moment to ensure the page loads and the fetch completes
        await page.wait_for_timeout(2000)

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
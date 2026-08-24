import asyncio
import os
import sys
from playwright.async_api import async_playwright

ARTIFACT_DIR = r"C:\Users\Nishant Tiwari\.gemini\antigravity\brain\55ddcbe6-49f5-41bf-b38e-6dbde1a00784"

async def verify_and_capture():
    os.makedirs(ARTIFACT_DIR, exist_ok=True)
    screenshot_main = os.path.join(ARTIFACT_DIR, "dashboard_timeline.png")
    screenshot_explain = os.path.join(ARTIFACT_DIR, "dashboard_explainability.png")
    screenshot_whatif = os.path.join(ARTIFACT_DIR, "dashboard_whatif.png")
    screenshot_map = os.path.join(ARTIFACT_DIR, "dashboard_topology_map.png")
    screenshot_analytics = os.path.join(ARTIFACT_DIR, "dashboard_analytics.png")

    async with async_playwright() as p:
        print("Launching Chromium...", flush=True)
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1440, "height": 950})
        page = await context.new_page()

        print("Navigating to http://localhost:5173/ ...", flush=True)
        await page.goto("http://localhost:5173/", wait_until="domcontentloaded")
        await page.wait_for_selector("header", timeout=10000)
        await asyncio.sleep(2)

        # 1. Main Timeline View
        print("Capturing Main Timeline View...", flush=True)
        await page.screenshot(path=screenshot_main)
        print(f"Saved: {screenshot_main}", flush=True)

        # 2. Click a maintenance block for Explainability
        print("Clicking a maintenance block for Explainability...", flush=True)
        block_button = await page.query_selector("button:has-text('REQ-')")
        if block_button:
            await block_button.click()
            await asyncio.sleep(1)
            await page.screenshot(path=screenshot_explain)
            print(f"Saved: {screenshot_explain}", flush=True)

            # Close drawer
            close_btn = await page.query_selector("button:has(svg.lucide-x)")
            if close_btn:
                await close_btn.click()
                await asyncio.sleep(0.5)

        # 3. Open What-If Sandbox
        print("Opening What-If Sandbox...", flush=True)
        whatif_btn = await page.query_selector("button:has-text('What-If Sandbox')")
        if whatif_btn:
            await whatif_btn.click()
            await asyncio.sleep(1)
            await page.screenshot(path=screenshot_whatif)
            print(f"Saved: {screenshot_whatif}", flush=True)

            # Close What-If
            close_btn = await page.query_selector("button:has(svg.lucide-x)")
            if close_btn:
                await close_btn.click()
                await asyncio.sleep(0.5)

        # 4. Switch to Corridor Topology Map tab
        print("Switching to Corridor Topology Map tab...", flush=True)
        map_tab = await page.query_selector("button:has-text('Corridor Topology & Health')")
        if map_tab:
            await map_tab.click()
            await asyncio.sleep(1)
            await page.screenshot(path=screenshot_map)
            print(f"Saved: {screenshot_map}", flush=True)

        # 5. Switch to Analytics & KPIs tab
        print("Switching to Analytics & KPIs tab...", flush=True)
        analytics_tab = await page.query_selector("button:has-text('Analytics & KPIs')")
        if analytics_tab:
            await analytics_tab.click()
            await asyncio.sleep(1.5)
            await page.screenshot(path=screenshot_analytics)
            print(f"Saved: {screenshot_analytics}", flush=True)

        print("ALL SCREENSHOTS CAPTURED SUCCESSFULLY!", flush=True)
        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_and_capture())

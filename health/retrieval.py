import asyncio

from playwright.async_api import async_playwright


class RetrievalError(Exception):
    pass


async def get_hps(player, cookie_value):
    """Get player data from D&D Beyond"""
    async with async_playwright() as p:
        browser = await p.chromium.launch()

        context = await browser.new_context(**p.devices["iPhone 13 Pro"])
        await context.add_cookies(
            [
                {
                    "name": "CobaltSession",
                    "value": cookie_value,
                    "url": player["url"],
                    "httpOnly": True,
                    "secure": True,
                }
            ]
        )

        page = await context.new_page()
        await page.goto(player["url"])

        async def get_hp(selector):
            value = await page.locator(selector).inner_text()

            try:
                return int(value)
            except ValueError:
                raise RetrievalError

        current, max_hp = await asyncio.gather(
            get_hp(".ct-status-summary-mobile__hp-current"),
            get_hp(".ct-status-summary-mobile__hp-max"),
        )

        await browser.close()

        half = round(max_hp / 2)

        return {
            **player,
            "current": current,
            "half": half,
            "max": max_hp,
        }

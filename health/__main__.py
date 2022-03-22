import asyncio
import itertools
import sys
from time import sleep

from rich.live import Live
from rich.progress import Progress, SpinnerColumn

from .retrieval import get_hps
from .ui import build_columns, build_table, current_colour


players = [
    {"name": "Björn", "url": "https://www.dndbeyond.com/characters/48002358"},
    {"name": "Einarr", "url": "https://www.dndbeyond.com/characters/43201577"},
    {"name": "Gramdoul", "url": "https://www.dndbeyond.com/characters/95971"},
    {"name": "Knuckles", "url": "https://www.dndbeyond.com/characters/37239100"},
    {"name": "Malcon", "url": "https://www.dndbeyond.com/characters/48112517"},
    {"name": "Searos", "url": "https://www.dndbeyond.com/characters/37246059"},
]

# store current player data here
session = {}


async def get_all_data(cookie_value):
    """Get data for all players, asynchronously"""
    coroutines = [get_hps(player, cookie_value) for player in players]

    for p in await asyncio.gather(*coroutines):
        session[p["name"]] = p


def update_table(updating=None):
    """Update the table with player data"""
    table = build_table()

    for player in players:
        progress = ""

        # if a player is about to update, create a spinner to show it's stats
        # are currently being fetched
        if player == updating:
            progress = Progress(SpinnerColumn())
            progress.add_task("")

        data = session[player["name"]]

        colour = current_colour(data)
        columns = build_columns(data, colour)

        # update the row with any data we have and maybe a spinner
        table.add_row(
            progress,
            player["name"],
            *columns,
        )

    return table


async def main(cookie_value):
    await get_all_data(cookie_value)

    with Live(update_table(), refresh_per_second=10, screen=True) as live:
        for player in itertools.cycle(players):
            live.update(update_table(updating=player))

            # pull data from D&D Beyond
            session[player["name"]] = await get_hps(player, cookie_value)

            sleep(1)


if __name__ == "__main__":
    cookie_value = sys.argv[0] if len(sys.argv) > 1 else ""

    try:
        asyncio.run(main(cookie_value))
    except KeyboardInterrupt:
        sys.exit()

from rich.table import Table
from rich.text import Text

from .maths import difference, percentage


def build_columns(data, colour):
    current = Text(str(data["current"]), style=colour)
    max_hp = Text(str(data["max"]), style="green")

    hp = current.append("/").append(max_hp)
    perc = Text(f"{percentage(data)}%", style=colour)
    diff = Text(str(difference(data)), style="cyan")
    half = Text(str(data["half"]), style="cyan")

    return [
        hp,
        perc,
        diff,
        half,
    ]


def build_table():
    table = Table()
    table.add_column("", no_wrap=True)
    table.add_column("Player", no_wrap=True)
    table.add_column("HP", justify="right", no_wrap=True)
    table.add_column("%", justify="right", no_wrap=True)
    table.add_column("∆", justify="right", no_wrap=True)
    table.add_column("½", justify="right", no_wrap=True)
    return table


def current_colour(player):
    if player["current"] >= player["half"]:
        return "green"

    if (player["current"] < player["max"]) and (player["current"] > player["half"]):
        return "magenta"
    return "bold red"

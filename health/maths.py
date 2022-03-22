def difference(p):
    if p["current"] >= p["half"]:
        return "-"

    return p["half"] - p["current"]


def percentage(p):
    return round((p["current"] / p["max"]) * 100)

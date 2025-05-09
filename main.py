# main.py
from fastapi import FastAPI, Query
from fastapi.responses import JSONResponse
import pandas as pd

app = FastAPI()

# Lae andmed faili käivitamisel
df = pd.read_csv("LE.txt", sep=";")  # või ',', '\t' sõltuvalt formaadist

@app.get("/spare-parts")
def get_spare_parts(
    page: int = 1,
    name: str = None,
    sn: str = None,
    sort: str = None
):
    per_page = 30
    data = df.copy()

    # Filtreerimine
    if name:
        data = data[data['name'].str.contains(name, case=False, na=False)]
    if sn:
        data = data[data['serial_number'].astype(str).str.contains(sn)]

    # Sorteerimine
    if sort:
        ascending = not sort.startswith("-")
        col = sort.lstrip("-")
        if col in data.columns:
            data = data.sort_values(by=col, ascending=ascending)

    # Lehekülgede jagamine
    start = (page - 1) * per_page
    end = start + per_page
    results = data.iloc[start:end].to_dict(orient="records")

    return JSONResponse(content={"results": results, "total": len(data)})

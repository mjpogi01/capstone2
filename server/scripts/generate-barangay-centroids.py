import csv
from pathlib import Path

import shapefile  # pyshp
from pyproj import Transformer
from shapely.geometry import shape


SHAPE_PATH = Path(__file__).parent / "data" / "PH_Adm4" / "PH_Adm4_BgySubMuns.shp"
OUTPUT_PATH = Path(__file__).parent / "data" / "barangay-centroids.csv"

# Province PSGC codes (numeric) for CALABARZON + Oriental Mindoro
TARGET_PROVINCES = {
    "041000000",  # Batangas
    "042100000",  # Cavite
    "043400000",  # Laguna
    "045600000",  # Quezon
    "045800000",  # Rizal
    "175200000",  # Oriental Mindoro
}


def normalize_psgc(value: int) -> str:
    """
    Convert PSGC numeric value from the shapefile into a zero-padded 9-digit code.

    The PSGC values in the source shapefile are stored with an extra digit inserted
    after the first two characters. We normalise them by zero-padding to 10 digits
    then removing the third character.
    """
    raw = f"{int(value):010d}"
    return raw[:2] + raw[3:]


def main() -> None:
    reader = shapefile.Reader(str(SHAPE_PATH), encoding="latin-1")
    transformer = Transformer.from_crs("EPSG:32651", "EPSG:4326", always_xy=True)

    rows: list[dict[str, str | float]] = []
    for record, shp in zip(reader.records(), reader.shapes()):
        data = record.as_dict()
        province_code = normalize_psgc(data["adm2_psgc"])
        if province_code not in TARGET_PROVINCES:
            continue

        geom = shape(shp.__geo_interface__)
        centroid = geom.centroid
        lon, lat = transformer.transform(centroid.x, centroid.y)

        rows.append(
            {
                "region_psgc": normalize_psgc(data["adm1_psgc"]),
                "province_psgc": province_code,
                "city_muni_psgc": normalize_psgc(data["adm3_psgc"]),
                "barangay_psgc": normalize_psgc(data["adm4_psgc"]),
                "barangay_name": data["adm4_en"],
                "latitude": f"{lat:.6f}",
                "longitude": f"{lon:.6f}",
            }
        )

    rows.sort(key=lambda r: (r["province_psgc"], r["city_muni_psgc"], r["barangay_psgc"]))

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_PATH.open("w", encoding="utf-8", newline="") as csvfile:
        writer = csv.DictWriter(
            csvfile,
            fieldnames=[
                "region_psgc",
                "province_psgc",
                "city_muni_psgc",
                "barangay_psgc",
                "barangay_name",
                "latitude",
                "longitude",
            ],
        )
        writer.writeheader()
        writer.writerows(rows)

    print(f"Wrote {len(rows)} barangay centroids to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()


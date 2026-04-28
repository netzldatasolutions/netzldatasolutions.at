from __future__ import annotations

import argparse
import csv
import io
from pathlib import Path


def decode_source(raw: bytes) -> tuple[str, str]:
    for encoding in ("utf-8-sig", "utf-8", "cp1252", "latin-1"):
        try:
            return raw.decode(encoding), encoding
        except UnicodeDecodeError:
            continue
    raise UnicodeDecodeError("utf-8", raw, 0, 1, "Unsupported encoding")


def convert_csv_text(source_text: str, pad_short_rows: bool = True) -> tuple[str, list[dict[str, int]]]:
    reader = csv.reader(io.StringIO(source_text.lstrip("\ufeff"), newline=""), delimiter=",", quotechar='"')

    try:
        header = next(reader)
    except StopIteration as exc:
        raise ValueError("The CSV file is empty.") from exc

    header_len = len(header)
    rows: list[list[str]] = []
    padded_rows: list[dict[str, int]] = []

    for line_number, row in enumerate(reader, start=2):
        row_len = len(row)
        if row_len == header_len:
            rows.append(row)
            continue

        if row_len < header_len and pad_short_rows:
            rows.append(row + [""] * (header_len - row_len))
            padded_rows.append({"line": line_number, "found": row_len, "expected": header_len})
            continue

        raise ValueError(
            f"Line {line_number} has {row_len} columns, expected {header_len}. "
            "Check the source CSV before converting."
        )

    output = io.StringIO(newline="")
    writer = csv.writer(
        output,
        delimiter=";",
        quotechar='"',
        quoting=csv.QUOTE_MINIMAL,
        lineterminator="\r\n",
    )
    writer.writerow(header)
    writer.writerows(rows)
    return output.getvalue(), padded_rows


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Convert a comma-separated CSV to a semicolon-separated CSV without breaking quoted text fields."
    )
    parser.add_argument("source", type=Path, help="Path to the source CSV file")
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        help="Path to the converted output file. Defaults to <source>-semicolon.csv",
    )
    parser.add_argument(
        "--no-pad-short-rows",
        action="store_true",
        help="Fail instead of padding rows that are only missing trailing empty columns.",
    )
    args = parser.parse_args()

    output_path = args.output or args.source.with_name(f"{args.source.stem}-semicolon.csv")
    raw = args.source.read_bytes()
    source_text, encoding = decode_source(raw)
    converted_text, padded_rows = convert_csv_text(source_text, pad_short_rows=not args.no_pad_short_rows)
    output_path.write_text(converted_text, encoding="utf-8", newline="")

    print(f"Read: {args.source}")
    print(f"Detected encoding: {encoding}")
    print(f"Wrote: {output_path}")
    print(f"Padded rows: {len(padded_rows)}")
    if padded_rows:
        line_list = ", ".join(str(item["line"]) for item in padded_rows[:10])
        suffix = "" if len(padded_rows) <= 10 else ", ..."
        print(f"Padded line numbers: {line_list}{suffix}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

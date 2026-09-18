"""SQLite prediction log.

Every /predict call is recorded here, which lets /trends report *real* usage
over time instead of fabricated numbers. Uses the stdlib sqlite3 driver, so
there are no extra dependencies.
"""

from __future__ import annotations

import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone

from . import config


@contextmanager
def _conn():
    conn = sqlite3.connect(config.DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db() -> None:
    with _conn() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS predictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT NOT NULL,
                churn_probability REAL NOT NULL,
                risk_level TEXT NOT NULL,
                monthly_charges REAL
            )
            """
        )


def log_prediction(prob: float, risk: str, monthly_charges: float) -> None:
    with _conn() as conn:
        conn.execute(
            "INSERT INTO predictions (created_at, churn_probability, risk_level, "
            "monthly_charges) VALUES (?, ?, ?, ?)",
            (datetime.now(timezone.utc).isoformat(), prob, risk, monthly_charges),
        )


def prediction_trends(days: int = 14) -> list[dict]:
    """Daily prediction volume and average churn risk from the live log."""
    with _conn() as conn:
        rows = conn.execute(
            """
            SELECT substr(created_at, 1, 10) AS day,
                   COUNT(*)               AS predictions,
                   AVG(churn_probability) AS avg_risk,
                   SUM(CASE WHEN risk_level = 'high' THEN 1 ELSE 0 END) AS high_risk
            FROM predictions
            GROUP BY day
            ORDER BY day DESC
            LIMIT ?
            """,
            (days,),
        ).fetchall()
    return [dict(r) for r in reversed(rows)]

import sys
import os
from sqlalchemy import text

# Ensure backend package is on sys.path when running from scripts/
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.core.db import engine

with engine.begin() as conn:
    conn.execute(text('ALTER TABLE "file" ADD COLUMN IF NOT EXISTS file_path VARCHAR'))

print('column added')

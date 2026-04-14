import db.DataBaseSetup as s
import os

setup = s.Setup(
    HOST=os.environ.get("DB_HOST", "localhost"),
    PORT=int(os.environ.get("DB_PORT", "5432")),
    BASE_NAME=os.environ.get("DB_NAME", "baza_danych"),
    USER=os.environ.get("DB_USER", "postgres"),
    PASSWORD=os.environ.get("DB_PASSWORD", "1234"),
)
setup.initialize()
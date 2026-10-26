#!/usr/bin/env python3
"""Run the built app against the protected local invoice experiment configuration."""
import importlib.util
import json
import os
from pathlib import Path
import sys
import urllib.parse

root = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("receiver_invoices", root / "scripts/receiver-invoices.py")
worker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(worker)
config = worker.load_config(root / ".env.invoice-experiment/worker.json")
database = urllib.parse.urlsplit(config["database_url"])
app = urllib.parse.urlsplit(config["app_url"])
if database.hostname != "127.0.0.1" or database.path != "/shadowbid_invoice_experiment":
    raise RuntimeError("Refusing a non-experiment database")
os.chdir(root)
os.environ.update(DATABASE_URL=config["database_url"], WORKER_SECRET=config["worker_secret"],
    ZCASH_NETWORK="testnet", LOCAL_AUTH_BYPASS="true", ALLOW_SHORT_AUCTIONS="true",
    EMAIL_VERIFICATION_MODE="disabled", RESEND_API_KEY="", VERCEL_ENV="",
    PUBLIC_APP_URL=config["app_url"])
if sys.argv[1:] == ["migrate"]:
    args = ["node", "--import", "tsx", "scripts/db-schema.ts", "--migrate"]
elif sys.argv[1:] == ["serve"]:
    args = ["node", "node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", str(app.port or 80)]
elif sys.argv[1:] == ["build"]:
    args = ["npm", "run", "build"]
elif sys.argv[1:] == ["checkout"]:
    args = ["node", "scripts/check-receiver-checkout.mjs"]
elif sys.argv[1:] == ["prepare"]:
    args = ["node", "--import", "tsx", "scripts/prepare-receiver-invoices.ts"]
elif sys.argv[1:] in (["observe"], ["watch"]):
    fixture = json.loads((root / ".env.invoice-experiment/fixture.json").read_text())
    os.environ["SHADOWBID_ZINGO_INVOICE_CLI"] = str(root / ".env.nu7-receiver/bin/zingo-invoice-cli")
    args = ["python3", "scripts/receiver-invoices.py", sys.argv[1], fixture["invoices"][0]["id"],
        "--config", str(root / ".env.invoice-experiment/worker.json")]
else:
    raise SystemExit("Usage: run-invoice-experiment.py migrate|serve|build|prepare|observe|watch|checkout")
os.execvp(args[0], args)

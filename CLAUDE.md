# When you need to run a dev server or retrieve server logs to monitor status

If `--make` is in user request or user require requires running of a dev server or retrieval of server logs to check for status/issues, you **must** use make commands

## Development commands

| Command         | Description            |
| --------------- | ---------------------- |
| make dev        | Start all services     |
| make status     | Show running processes |
| make logs       | Tail ./dev.log         |
| make clean-logs | Truncate unified log   |

Services log to `./dev.log` with timestamps. Each service can be run individually via `make run-<LABEL>`.

**Run from the `dashboard/` directory:**

```bash
cd dashboard
make dev      # Start Next.js dev server on port 3000
make logs     # Tail unified log in another terminal
```

### Components

| Label     | Directory   | Command      | Port |
| --------- | ----------- | ------------ | ---- |
| DASHBOARD | dashboard/  | next dev     | 3000 |

# Portable OSI Troubleshooter Guide

This application is packaged using `uv` and exposes a FastAPI interface for corporate network usage.

## Prerequisites

1.  **Python 3.12** (managed by uv)
2.  **uv** (Package Manager) - [Install Guide](https://github.com/astral-sh/uv)

## How to Run Portably

1.  **Copy this folder** (`osi_troubleshooter`) to your target machine.
2.  Open a terminal in the folder.
3.  Run the API server:
    ```bash
    uv run main.py
    ```
    This will automatically:
    - Create a virtual environment `.venv`.
    - Install all dependencies (`fastapi`, `pysnmp`, `paramiko`, etc.).
    - Start the server on `http://0.0.0.0:8000`.

## API Usage

The application exposes the following endpoints for external integrations:

*   **SNMP Check**:
    - `POST /api/snmp/check`
    - Body: `{"ip": "1.2.3.4", "community": "public", "oid": "1.3.6..."}`

*   **VLAN Audit**:
    - `POST /api/vlan/audit`
    - Body: `{"ip": "1.2.3.4", "username": "admin", "password": "...", "command": "show vlan"}`

## Agent Integration

The AutoGen agents (configured in `osi_team_config.json`) contain embeded logic that mirrors these utilities. You can use the `setup_team.py` (if applicable) or import the JSON to use the agents directly.

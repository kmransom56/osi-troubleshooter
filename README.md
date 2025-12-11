# OSI Model Troubleshooting App

This application provides a set of autonomous agents for troubleshooting network issues across different layers of the OSI model, as well as a centralized dashboard for monitoring results.

## Components

### Agents
1.  **ErrorDetectionAgent** (`snmp_utils.py`)
    *   **Task**: Analyze frame errors, CRC errors, or collisions.
    *   **Input**: SNMP counters or switch error logs.
    *   **Output**: Error summary and recommendations.
    *   **Tools**: `fetch_snmp_counters` (Uses PySNMP)

2.  **VLANTroubleshootingAgent** (`vlan_utils.py`)
    *   **Task**: Verify VLAN configurations and detect tagging mismatches.
    *   **Input**: VLAN database and trunk port configurations.
    *   **Output**: Mismatch details, invalid VLAN IDs, and resolution suggestions.
    *   **Tools**: `fetch_vlan_config` (Uses Paramiko/SSH)

3.  **SwitchPortDiagnosticsAgent**
    *   **Task**: Analyze spanning tree status, port states, and trunk configurations.
    *   **Input**: STP data, port status logs.
    *   **Tools**: Extends `fetch_vlan_config` logic.

### Dashboard
*   **Centralized Dashboard** (`dashboard.py`)
    *   Aggregates data from all agents into a shared memory structure.
    *   Exposes a REST API (`/dashboard`) to view the current system state.
    *   Built with Flask.

## Setup

1.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

2.  Run the dashboard (and simulated agents):
    ```bash
    python dashboard.py
    ```

3.  Access the dashboard at `http://localhost:5000/dashboard`.

## Integration with AutoGen Studio

*   **ErrorDetectionAgent**: Configure to use `snmp_utils.py` for execution.
*   **VLANTroubleshootingAgent**: Configure to use `vlan_utils.py` for execution.
*   **System Messages**: Use the prompt templates provided in the documentation/PDF for each agent.

# AutoGen Studio Integration Guide

This guide details how to configure your AutoGen Studio instance at `https://network-topology.netintegrate.net/` with the OSI Troubleshooting agents.

## Phase 1: Create Skills

Navigate to the **Build** tab -> **Skills** -> **New Skill**.

### 1. Skill: `fetch_snmp`
*   **Name**: `fetch_snmp`
*   **Description**: Fetch SNMP counters from network devices.
*   **Content**:
    ```python
    from pysnmp.hlapi import *

    def fetch_snmp_counters(ip: str, community: str, oid: str) -> str:
        """
        Fetch SNMP data for a given OID.
        :param ip: Device IP address
        :param community: SNMP community string
        :param oid: Object Identifier (OID) for the desired data e.g. '1.3.6.1.2.1.2.2.1.14'
        :return: Value of the OID or None if failed
        """
        try:
            iterator = getCmd(
                SnmpEngine(),
                CommunityData(community, mpModel=0),
                UdpTransportTarget((ip, 161)),
                ContextData(),
                ObjectType(ObjectIdentity(oid))
            )

            errorIndication, errorStatus, errorIndex, varBinds = next(iterator)

            if errorIndication:
                return f"Error: {errorIndication}"
            elif errorStatus:
                return f"Error: {errorStatus.prettyPrint()}"
            else:
                for varBind in varBinds:
                    return f"{varBind[1]}"
        except Exception as e:
            return f"Exception: {e}"
    ```

### 2. Skill: `fetch_vlan`
*   **Name**: `fetch_vlan`
*   **Description**: Fetch VLAN configuration via SSH.
*   **Content**:
    ```python
    import paramiko

    def fetch_vlan_config(ip: str, username: str, password: str, command: str = "show vlan brief") -> str:
        """
        Fetch VLAN configuration from a network device using SSH.
        :param ip: Device IP address
        :param username: SSH username
        :param password: SSH password
        :param command: Command to fetch VLAN data (default: 'show vlan brief')
        :return: Command output
        """
        try:
            ssh = paramiko.SSHClient()
            ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            ssh.connect(ip, username=username, password=password)

            stdin, stdout, stderr = ssh.exec_command(command)
            output = stdout.read().decode()
            ssh.close()
            return output
        except Exception as e:
            print(f"Error connecting to {ip}: {e}")
            return f"Error: {e}"
    ```

---

## Phase 2: Create Agents

Navigate to **Build** tab -> **Agents** -> **New Agent**.

### 1. Agent: `ErrorDetectionAgent`
*   **Description**: Analyzes frame errors, CRC errors, and collisions.
*   **System Message**:
    ```text
    You are an ErrorDetectionAgent. Your task is to analyze network device health by checking SNMP counters.
    Use the `fetch_snmp` skill to retrieve data for OIDs like `ifInErrors` (1.3.6.1.2.1.2.2.1.14).
    Analyze the returned values. If errors are > 0, report them as critical.
    ```
*   **Skills**: Add `fetch_snmp`.

### 2. Agent: `VLANTroubleshootingAgent`
*   **Description**: Verifies VLAN configurations and tagging.
*   **System Message**:
    ```text
    You are a VLANTroubleshootingAgent. Your task is to verify VLAN configurations.
    Use the `fetch_vlan` skill to connect to devices and retrieve the VLAN database.
    Check for missing VLANs or tagging mismatches compared to your known requirements.
    ```
*   **Skills**: Add `fetch_vlan`.

### 3. Agent: `SwitchPortDiagnosticsAgent`
*   **Description**: Diagnoses STP and port states.
*   **System Message**:
    ```text
    You are a SwitchPortDiagnosticsAgent. Analyze Spanning Tree Protocol (STP) states and port status.
    Use the `fetch_vlan` skill (which runs SSH commands) to run `show spanning-tree` or `show interfaces status`.
    Identify blocked ports or root bridge inconsistencies.
    ```
*   **Skills**: Add `fetch_vlan`.

---

## Phase 3: Create Workflow

Navigate to **Build** tab -> **Workflows** -> **New Workflow**.

*   **Name**: `OSI_Troubleshooter_Team`
*   **Type**: `Group Chat`
*   **Sender**: `UserProxyAgent` (or use the default user proxy)
*   **Receivers**:
    *   `ErrorDetectionAgent`
    *   `VLANTroubleshootingAgent`
    *   `SwitchPortDiagnosticsAgent`
*   **Speaker Selection Method**: `Auto` or `Round Robin`.

## Phase 4: Usage

Go to **Playground**.
1.  Select the `OSI_Troubleshooter_Team` workflow.
2.  Enter a prompt:
    > "Check device 192.168.1.5 for input errors using community 'public'."

## Phase 5: Alternative - JSON Import (Recommended for v0.4.x)

If you cannot find the "New Skill" button in the Web UI, use the generated JSON configuration:

1.  Open `osi_troubleshooter/osi_team_config.json`.
2.  Copy the entire content.
3.  In AutoGen Studio, go to the **Workflows** (or Team Builder) page.
4.  Toggle the **JSON Mode** (usually a switch or curly braces icon `{ }` in the top right).
5.  Paste the configuration.
6.  This will create the entire team with agents and tools attached.

**Note**: The generated config uses placeholder Python code for tools. You may need to edit the tool definitions in the JSON or UI to paste the real `snmp_utils.py` code if the import doesn't include the full logic cleanly.

import json
from autogen_agentchat.agents import AssistantAgent
from autogen_agentchat.teams import RoundRobinGroupChat
from autogen_agentchat.conditions import TextMentionTermination
from autogen_ext.models.openai import OpenAIChatCompletionClient
from autogen_core.tools import FunctionTool

# Define Skills (Tools) with FULL Logic

def fetch_snmp_counters(ip: str, community: str, oid: str) -> str:
    """
    Fetch SNMP data for a given OID.
    """
    # Imports must be inside for portability in some serialization contexts
    # or ensure they are available in the global scope of the execution environment.
    # For safety, we put them inside.
    from pysnmp.hlapi import getCmd, SnmpEngine, CommunityData, UdpTransportTarget, ContextData, ObjectType, ObjectIdentity

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
            # Return the first variable binding value
            for varBind in varBinds:
                return f"{varBind[1]}"
            return "No data returned"
    except Exception as e:
        return f"Exception: {e}"

def fetch_vlan_config(ip: str, username: str, password: str, command: str = "show vlan brief") -> str:
    """
    Fetch VLAN configuration from a network device using SSH.
    """
    import paramiko
    
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(ip, username=username, password=password)

        stdin, stdout, stderr = ssh.exec_command(command)
        output = stdout.read().decode()
        ssh.close()
        return output
    except Exception as e:
        return f"Error connecting to {ip}: {e}"

# Create Function Tools
# We pass global_imports to ensure the environment knows about them if needed, 
# though putting them inside the function is usually enough for the source_code inspection.
snmp_tool = FunctionTool(
    fetch_snmp_counters, 
    description="Fetch SNMP counters from network devices.",
    global_imports=["pysnmp.hlapi"]
)

vlan_tool = FunctionTool(
    fetch_vlan_config, 
    description="Fetch VLAN configuration via SSH.",
    global_imports=["paramiko"]
)

# Define Model Client (Placeholder)
model_client = OpenAIChatCompletionClient(model="gpt-4o-mini")

# Define Agents
error_agent = AssistantAgent(
    name="ErrorDetectionAgent",
    model_client=model_client,
    tools=[snmp_tool],
    system_message="You are an ErrorDetectionAgent. Analyze network health using SNMP tools. Use fetch_snmp_counters to check for errors."
)

vlan_agent = AssistantAgent(
    name="VLANTroubleshootingAgent",
    model_client=model_client,
    tools=[vlan_tool],
    system_message="You are a VLANTroubleshootingAgent. Verify VLAN configurations using fetch_vlan_config."
)

switch_agent = AssistantAgent(
    name="SwitchPortDiagnosticsAgent",
    model_client=model_client,
    tools=[vlan_tool], # Reusing vlan tool for SSH access
    system_message="You are a SwitchPortDiagnosticsAgent. Diagnose STP and port states using fetch_vlan_config (running STP commands)."
)

# Define Team
team = RoundRobinGroupChat(
    [error_agent, vlan_agent, switch_agent],
    termination_condition=TextMentionTermination("TERMINATE")
)

# Dump Configuration
try:
    config = team.dump_component()
    json_config = config.model_dump_json(indent=2)
    
    with open("osi_team_config.json", "w") as f:
        f.write(json_config)
    
    print("Successfully generated osi_team_config.json (with real code)")
except Exception as e:
    print(f"Error generating config: {e}")

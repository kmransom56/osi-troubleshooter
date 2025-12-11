from pysnmp.hlapi import *

def fetch_snmp_counters(ip, community, oid):
    """
    Fetch SNMP data for a given OID.
    :param ip: Device IP address
    :param community: SNMP community string
    :param oid: Object Identifier (OID) for the desired data
    :return: Value of the OID
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
            print(f"Error: {errorIndication}")
            return None
        elif errorStatus:
            print(f"Error: {errorStatus.prettyPrint()}")
            return None
        else:
            for varBind in varBinds:
                return f"{varBind[1]}"
    except Exception as e:
        print(f"Exception: {e}")
        return None

# Example Usage
if __name__ == "__main__":
    device_ip = "192.168.1.1"
    community_string = "public"
    oid_ifInErrors = "1.3.6.1.2.1.2.2.1.14"  # Example OID for `ifInErrors`

    in_errors = fetch_snmp_counters(device_ip, community_string, oid_ifInErrors)
    print(f"Input Errors: {in_errors}")

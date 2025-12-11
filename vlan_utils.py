import paramiko

def fetch_vlan_config(ip, username, password, command):
    """
    Fetch VLAN configuration from a network device using SSH.
    :param ip: Device IP address
    :param username: SSH username
    :param password: SSH password
    :param command: Command to fetch VLAN data
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
        return None

# Example Usage
if __name__ == "__main__":
    device_ip = "192.168.1.1"
    ssh_user = "admin"
    ssh_pass = "password"
    command = "show vlan brief"

    vlan_output = fetch_vlan_config(device_ip, ssh_user, ssh_pass, command)
    print(f"VLAN Configuration:\n{vlan_output}")

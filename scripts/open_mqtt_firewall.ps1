#Requires -Version 5.1
#Requires -RunAsAdministrator

[CmdletBinding(SupportsShouldProcess)]
param(
    [string]$LocalIPAddress = '192.168.0.102',
    [string]$RemoteSubnet = '192.168.0.0/24',
    [string]$InterfaceAlias = 'Wi-Fi'
)

$ErrorActionPreference = 'Stop'
$ruleName = 'ESP32SmartHome-MQTT1883'

$address = Get-NetIPAddress -InterfaceAlias $InterfaceAlias -AddressFamily IPv4 |
    Where-Object { $_.IPAddress -eq $LocalIPAddress }
if (-not $address) {
    throw "IP $LocalIPAddress is not assigned to $InterfaceAlias. Check ipconfig and pass the current -LocalIPAddress and -RemoteSubnet."
}

$connection = Get-NetConnectionProfile -InterfaceAlias $InterfaceAlias
$profile = [string]$connection.NetworkCategory
if ($profile -eq 'DomainAuthenticated') {
    $profile = 'Domain'
}
if ($profile -notin @('Public', 'Private', 'Domain')) {
    throw "Cannot determine the firewall profile for $InterfaceAlias."
}

$ruleOptions = @{
    Name = $ruleName
    DisplayName = 'ESP32 Smart Home MQTT TCP 1883 - project Wi-Fi'
    Direction = 'Inbound'
    Action = 'Allow'
    Enabled = 'True'
    Protocol = 'TCP'
    LocalPort = 1883
    LocalAddress = $LocalIPAddress
    RemoteAddress = $RemoteSubnet
    InterfaceAlias = $InterfaceAlias
    Profile = $profile
}

if ($PSCmdlet.ShouldProcess("$InterfaceAlias / $LocalIPAddress`:1883 from $RemoteSubnet", 'Configure project MQTT firewall rule')) {
    $existingRule = Get-NetFirewallRule -Name $ruleName -ErrorAction SilentlyContinue
    if ($existingRule) {
        $updateOptions = $ruleOptions.Clone()
        $updateOptions.Remove('DisplayName')
        $updateOptions.NewDisplayName = $ruleOptions.DisplayName
        Set-NetFirewallRule @updateOptions
    } else {
        New-NetFirewallRule @ruleOptions | Out-Null
    }
    Write-Output "MQTT firewall rule ready: TCP $LocalIPAddress`:1883, remote $RemoteSubnet, interface $InterfaceAlias, profile $profile."
}

# IaC scanning demo (Azure) - INTENTIONALLY MISCONFIGURED. Do NOT `terraform apply`.
provider "azurerm" {
  features {}
  subscription_id = "00000000-0000-0000-0000-000000000000"
  client_id       = "11111111-1111-1111-1111-111111111111"
  client_secret   = "Acm3~FakeDemoClientSecret.DoNotUse0000000"   # hardcoded SP secret (fake)
  tenant_id       = "22222222-2222-2222-2222-222222222222"
}

resource "azurerm_resource_group" "acme" {
  name     = "acme-payments-rg"
  location = "eastus"
}

resource "azurerm_storage_account" "receipts" {
  name                            = "acmecustomerreceipts"
  resource_group_name             = azurerm_resource_group.acme.name
  location                        = azurerm_resource_group.acme.location
  account_tier                    = "Standard"
  account_replication_type        = "LRS"
  https_traffic_only_enabled      = false                       # HTTP allowed
  min_tls_version                 = "TLS1_0"                    # weak TLS
  allow_nested_items_to_be_public = true                        # anonymous blob access
  public_network_access_enabled   = true

  network_rules {
    default_action = "Allow"                                    # open to all networks
  }
}

resource "azurerm_storage_container" "receipts" {
  name                  = "receipts"
  storage_account_name  = azurerm_storage_account.receipts.name
  container_access_type = "blob"                                # public container
}

resource "azurerm_network_security_group" "api" {
  name                = "acme-api-nsg"
  location            = azurerm_resource_group.acme.location
  resource_group_name = azurerm_resource_group.acme.name

  security_rule {
    name                       = "allow-ssh-any"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "22"
    source_address_prefix      = "*"                            # SSH open to the world
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "allow-rdp-any"
    priority                   = 110
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "3389"
    source_address_prefix      = "*"                            # RDP open to the world
    destination_address_prefix = "*"
  }
}

resource "azurerm_mssql_server" "payments" {
  name                          = "acme-payments-sql"
  resource_group_name           = azurerm_resource_group.acme.name
  location                      = azurerm_resource_group.acme.location
  version                       = "12.0"
  administrator_login           = "acme_admin"
  administrator_login_password  = "Pr0d_DB_P@ssw0rd!"           # hardcoded password
  public_network_access_enabled = true
  minimum_tls_version           = "1.0"
}

resource "azurerm_mssql_firewall_rule" "allow_all" {
  name             = "allow-all"
  server_id        = azurerm_mssql_server.payments.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "255.255.255.255"                          # DB reachable from anywhere
}

resource "azurerm_key_vault" "secrets" {
  name                       = "acme-payments-kv"
  location                   = azurerm_resource_group.acme.location
  resource_group_name        = azurerm_resource_group.acme.name
  tenant_id                  = "22222222-2222-2222-2222-222222222222"
  sku_name                   = "standard"
  purge_protection_enabled   = false                            # no purge protection
  soft_delete_retention_days = 7
  public_network_access_enabled = true

  network_acls {
    default_action = "Allow"
    bypass         = "AzureServices"
  }
}

resource "azurerm_kubernetes_cluster" "acme" {
  name                = "acme-aks"
  location            = azurerm_resource_group.acme.location
  resource_group_name = azurerm_resource_group.acme.name
  dns_prefix          = "acme"
  role_based_access_control_enabled = false                     # RBAC off

  default_node_pool {
    name       = "default"
    node_count = 1
    vm_size    = "Standard_B2s"
  }

  identity {
    type = "SystemAssigned"
  }
}

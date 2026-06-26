import type { DoPaginated } from '~/types/digitalocean'

/**
 * DigitalOcean Managed Databases types — hand-written from the official `godo` structs
 * (github.com/digitalocean/godo/blob/main/databases.go), field names verified against the API.
 *
 * Two shape gotchas vs. Droplets: a cluster's `id` is a UUID **string** (not a number), and its
 * `region`/`size` are slug **strings** (not objects). Connection blocks carry live credentials.
 */

export type DatabaseEngine = 'pg' | 'mysql' | 'redis' | 'valkey' | 'mongodb' | 'kafka' | 'opensearch'

/** Cluster lifecycle. DO returns `online` for a ready cluster; the rest are transitional. */
export type DatabaseStatus = 'creating' | 'online' | 'resizing' | 'migrating' | 'forking' | (string & {})

export interface DatabaseConnection {
  protocol?: string
  uri: string
  database: string
  host: string
  port: number
  user: string
  password: string
  ssl: boolean
}

export interface DatabaseUser {
  name: string
  role?: string
  password?: string
  /** MongoDB carries the user's role + databases here rather than via the top-level `role`. */
  settings?: {
    mongo_user_settings?: { databases?: string[], role?: string }
  }
}

export interface DatabaseMaintenanceWindow {
  day: string
  hour: string
  pending: boolean
  description?: string[]
}

/** A trusted source (firewall rule). `type` scopes `value` (an IP/CIDR, Droplet id, tag, …). */
export interface DatabaseFirewallRule {
  uuid?: string
  cluster_uuid?: string
  type: 'ip_addr' | 'droplet' | 'k8s' | 'tag' | 'app' | (string & {})
  value: string
  created_at?: string
}

export interface DatabaseCluster {
  id: string
  name: string
  engine: DatabaseEngine
  version: string
  num_nodes: number
  size: string
  region: string
  status: DatabaseStatus
  created_at: string
  tags: string[] | null
  private_network_uuid?: string
  project_id?: string
  storage_size_mib?: number
  connection?: DatabaseConnection
  private_connection?: DatabaseConnection
  standby_connection?: DatabaseConnection
  standby_private_connection?: DatabaseConnection
  users?: DatabaseUser[] | null
  db_names?: string[] | null
  maintenance_window?: DatabaseMaintenanceWindow | null
}

// --- Response envelopes ---
export interface DatabasesResponse extends DoPaginated {
  databases: DatabaseCluster[]
}
export interface DatabaseResponse { database: DatabaseCluster }
export interface DatabaseUsersResponse { users: DatabaseUser[] }
export interface DatabaseUserResponse { user: DatabaseUser }
export interface DatabaseDbItem { name: string }
export interface DatabaseDbsResponse { dbs: DatabaseDbItem[] }
export interface DatabaseDbResponse { db: DatabaseDbItem }
export interface DatabaseFirewallResponse { rules: DatabaseFirewallRule[] }
export interface DatabaseCaResponse { ca: { certificate: string } }

// --- Request bodies ---
export interface DatabaseCreateRequest {
  name: string
  engine: DatabaseEngine
  version?: string
  size: string
  region: string
  num_nodes: number
  tags?: string[]
  private_network_uuid?: string
  project_id?: string
  storage_size_mib?: number
}
export interface DatabaseResizeRequest {
  size: string
  num_nodes: number
  storage_size_mib?: number
}
export interface DatabaseMigrateRequest {
  region: string
  private_network_uuid?: string
}
export interface DatabaseMaintenanceRequest {
  day: string
  hour: string
}
export interface DatabaseCreateUserRequest {
  name: string
}
export interface DatabaseCreateDbRequest {
  name: string
}
export interface DatabaseFirewallUpdateRequest {
  rules: { type: string, value: string }[]
}

// --- Options (drives the create wizard) ---
export interface DatabaseLayout {
  num_nodes: number
  sizes: string[]
}
export interface DatabaseEngineOptions {
  regions: string[]
  versions: string[]
  layouts: DatabaseLayout[]
}
export interface DatabaseOptionsResponse {
  options: Partial<Record<DatabaseEngine, DatabaseEngineOptions>>
}

// --- Connection pools (PostgreSQL) ---
export type DatabasePoolMode = 'transaction' | 'session' | 'statement'
export interface DatabasePool {
  name: string
  mode: string
  size: number
  db: string
  user: string
  connection?: DatabaseConnection
  private_connection?: DatabaseConnection
}
export interface DatabasePoolCreateRequest {
  name: string
  mode: string
  size: number
  db: string
  user: string
}
export interface DatabasePoolsResponse { pools: DatabasePool[] | null }

// --- Read-only replicas ---
export interface DatabaseReplica {
  id?: string
  name: string
  region: string
  size?: string
  status: DatabaseStatus
  connection?: DatabaseConnection
  private_connection?: DatabaseConnection
  created_at: string
  tags?: string[] | null
  storage_size_mib?: number
}
export interface DatabaseReplicaCreateRequest {
  name: string
  region?: string
  size?: string
  storage_size_mib?: number
  tags?: string[]
}
export interface DatabaseReplicasResponse { replicas: DatabaseReplica[] | null }
export interface DatabaseReplicaResponse { replica: DatabaseReplica }

// --- Backups ---
export interface DatabaseBackup {
  created_at: string
  size_gigabytes: number
}
export interface DatabaseBackupSchedule {
  backup_hour?: number
  backup_minute?: number
  backup_interval_hours?: number
}
export interface DatabaseBackupsResponse {
  backups: DatabaseBackup[] | null
  scheduled_backup_time?: DatabaseBackupSchedule
}

// --- Events (activity log) ---
export interface DatabaseEvent {
  id: string
  cluster_name: string
  event_type: string
  create_time: string
}
export interface DatabaseEventsResponse { events: DatabaseEvent[] | null }

// --- Config (engine-specific; modeled as a flat key/value map for a generic editor) ---
export type DatabaseConfig = Record<string, unknown>
export interface DatabaseConfigResponse { config: DatabaseConfig }

// --- Redis/Valkey eviction policy + MySQL SQL mode ---
export interface EvictionPolicyResponse { eviction_policy: string }
export interface SqlModeResponse { sql_mode: string }

// --- Kafka topics ---
export interface DatabaseTopic {
  name: string
  partition_count?: number
  replication_factor?: number
  state?: string
}
export interface DatabaseTopicCreateRequest {
  name: string
  partition_count?: number
  replication_factor?: number
}
export interface DatabaseTopicsResponse { topics: DatabaseTopic[] | null }

// --- OpenSearch indexes ---
export interface DatabaseIndex {
  index_name: string
  number_of_shards?: number
  number_of_replicas?: number
  size?: number
  health?: string
  status?: string
  docs?: number
  create_time?: string
}
export interface DatabaseIndexesResponse { indexes: DatabaseIndex[] | null }

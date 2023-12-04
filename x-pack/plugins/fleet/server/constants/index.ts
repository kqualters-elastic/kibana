/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

export {
  AGENT_TYPE_PERMANENT,
  AGENT_TYPE_EPHEMERAL,
  AGENT_TYPE_TEMPORARY,
  AGENT_POLLING_THRESHOLD_MS,
  AGENT_POLLING_REQUEST_TIMEOUT_MARGIN_MS,
  AGENT_POLLING_INTERVAL,
  AGENT_UPDATE_LAST_CHECKIN_INTERVAL_MS,
  AGENT_POLICY_ROLLOUT_RATE_LIMIT_REQUEST_PER_INTERVAL,
  AGENT_POLICY_ROLLOUT_RATE_LIMIT_INTERVAL_MS,
  AGENT_UPDATE_ACTIONS_INTERVAL_MS,
  MAX_TIME_COMPLETE_INSTALL,
  // Routes
  LIMITED_CONCURRENCY_ROUTE_TAG,
  PLUGIN_ID,
  EPM_API_ROUTES,
  DATA_STREAM_API_ROUTES,
  PACKAGE_POLICY_API_ROUTES,
  AGENT_API_ROUTES,
  AGENT_POLICY_API_ROUTES,
  AGENTS_SETUP_API_ROUTES,
  ENROLLMENT_API_KEY_ROUTES,
  INSTALL_SCRIPT_API_ROUTES,
  OUTPUT_API_ROUTES,
  SETUP_API_ROUTE,
  SETTINGS_API_ROUTES,
  APP_API_ROUTES,
  PRECONFIGURATION_API_ROUTES,
  DOWNLOAD_SOURCE_API_ROOT,
  DOWNLOAD_SOURCE_API_ROUTES,
  // Saved Object indices
  INGEST_SAVED_OBJECT_INDEX,
  // Saved object types
  SO_SEARCH_LIMIT,
  AGENTS_PREFIX,
  AGENT_POLICY_SAVED_OBJECT_TYPE,
  PACKAGE_POLICY_SAVED_OBJECT_TYPE,
  OUTPUT_SAVED_OBJECT_TYPE,
  PACKAGES_SAVED_OBJECT_TYPE,
  ASSETS_SAVED_OBJECT_TYPE,
  GLOBAL_SETTINGS_SAVED_OBJECT_TYPE,
  MESSAGE_SIGNING_KEYS_SAVED_OBJECT_TYPE,
  UNINSTALL_TOKENS_SAVED_OBJECT_TYPE,
  // Defaults
  DEFAULT_OUTPUT,
  DEFAULT_OUTPUT_ID,
  PACKAGE_POLICY_DEFAULT_INDEX_PRIVILEGES,
  AGENT_POLICY_DEFAULT_MONITORING_DATASETS,
  // Fleet Server index
  FLEET_SERVER_SERVERS_INDEX,
  ENROLLMENT_API_KEYS_INDEX,
  AGENTS_INDEX,
  // Preconfiguration
  PRECONFIGURATION_DELETION_RECORD_SAVED_OBJECT_TYPE,
  PRECONFIGURATION_LATEST_KEYWORD,
  AUTO_UPDATE_PACKAGES,
  // EPM
  USER_SETTINGS_TEMPLATE_SUFFIX,
  PACKAGE_TEMPLATE_SUFFIX,
  // Download sources
  DEFAULT_DOWNLOAD_SOURCE_URI,
  DOWNLOAD_SOURCE_SAVED_OBJECT_TYPE,
  DEFAULT_DOWNLOAD_SOURCE_ID,
  // Fleet server host
  DEFAULT_FLEET_SERVER_HOST_ID,
  FLEET_SERVER_HOST_SAVED_OBJECT_TYPE,
  // Proxy
  FLEET_PROXY_SAVED_OBJECT_TYPE,
  // Authz
  ENDPOINT_PRIVILEGES,
  ENDPOINT_EXCEPTIONS_PRIVILEGES,
  // Message signing service
  MESSAGE_SIGNING_SERVICE_API_ROUTES,
  // secrets
  SECRETS_ENDPOINT_PATH,
  SECRETS_MINIMUM_FLEET_SERVER_VERSION,
  type PrivilegeMapObject,
} from '../../common/constants';

export {
  FLEET_GLOBALS_COMPONENT_TEMPLATE_NAME,
  FLEET_GLOBALS_COMPONENT_TEMPLATE_CONTENT,
  FLEET_AGENT_ID_VERIFY_COMPONENT_TEMPLATE_NAME,
  FLEET_AGENT_ID_VERIFY_COMPONENT_TEMPLATE_CONTENT,
  FLEET_COMPONENT_TEMPLATES,
  FLEET_FINAL_PIPELINE_ID,
  FLEET_FINAL_PIPELINE_CONTENT,
  FLEET_FINAL_PIPELINE_VERSION,
  FLEET_INSTALL_FORMAT_VERSION,
  FLEET_AGENT_POLICIES_SCHEMA_VERSION,
  STACK_COMPONENT_TEMPLATE_LOGS_SETTINGS,
  STACK_COMPONENT_TEMPLATE_METRICS_SETTINGS,
  STACK_COMPONENT_TEMPLATE_METRICS_TSDB_SETTINGS,
  STACK_COMPONENT_TEMPLATES,
} from './fleet_es_assets';
export { FILE_STORAGE_DATA_AGENT_INDEX } from './fleet_es_assets';
export { FILE_STORAGE_METADATA_AGENT_INDEX } from './fleet_es_assets';
export * from '../../common/constants/mappings';

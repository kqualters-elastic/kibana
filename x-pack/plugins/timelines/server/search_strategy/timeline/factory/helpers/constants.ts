/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { ALERT_RULE_CONSUMER, ALERT_RISK_SCORE, ALERT_SEVERITY } from '@kbn/rule-data-utils';

// TODO: share with security_solution/common/cti/constants.ts
export const ENRICHMENT_DESTINATION_PATH = 'threat.enrichments';

export const MATCHED_ATOMIC = 'matched.atomic';
export const MATCHED_FIELD = 'matched.field';
export const MATCHED_TYPE = 'matched.type';
export const INDICATOR_MATCH_SUBFIELDS = [MATCHED_ATOMIC, MATCHED_FIELD, MATCHED_TYPE];

export const INDICATOR_MATCHED_ATOMIC = `${ENRICHMENT_DESTINATION_PATH}.${MATCHED_ATOMIC}`;
export const INDICATOR_MATCHED_FIELD = `${ENRICHMENT_DESTINATION_PATH}.${MATCHED_FIELD}`;
export const INDICATOR_MATCHED_TYPE = `${ENRICHMENT_DESTINATION_PATH}.${MATCHED_TYPE}`;

export const EVENT_DATASET = 'event.dataset';

export const FIRST_SEEN = 'indicator.first_seen';
export const LAST_SEEN = 'indicator.last_seen';
export const PROVIDER = 'indicator.provider';
export const REFERENCE = 'indicator.reference';
export const FEED_NAME = 'feed.name';

export const INDICATOR_FIRSTSEEN = `${ENRICHMENT_DESTINATION_PATH}.${FIRST_SEEN}`;
export const INDICATOR_LASTSEEN = `${ENRICHMENT_DESTINATION_PATH}.${LAST_SEEN}`;
export const INDICATOR_PROVIDER = `${ENRICHMENT_DESTINATION_PATH}.${PROVIDER}`;
export const INDICATOR_REFERENCE = `${ENRICHMENT_DESTINATION_PATH}.${REFERENCE}`;
export const FEED_NAME_REFERENCE = `${ENRICHMENT_DESTINATION_PATH}.${FEED_NAME}`;

export const CTI_ROW_RENDERER_FIELDS = [
  INDICATOR_MATCHED_ATOMIC,
  INDICATOR_MATCHED_FIELD,
  INDICATOR_MATCHED_TYPE,
  INDICATOR_REFERENCE,
  INDICATOR_PROVIDER,
  FEED_NAME_REFERENCE,
];

export const TIMELINE_EVENTS_FIELDS = [
  ALERT_RULE_CONSUMER,
  '@timestamp',
  'kibana.alert.workflow_status',
  'kibana.alert.group.id',
  'kibana.alert.original_time',
  'kibana.alert.reason',
  'kibana.alert.rule.from',
  'kibana.alert.rule.name',
  'kibana.alert.rule.to',
  'kibana.alert.rule.uuid',
  'kibana.alert.rule.type',
  'kibana.alert.original_event.kind',
  'kibana.alert.original_event.module',
  'kibana.alert.rule.version',
  ALERT_SEVERITY,
  ALERT_RISK_SCORE,
  'kibana.alert.threshold_result',
  'kibana.alert.building_block_type',
  'event.code',
  'event.module',
  'event.action',
  'event.category',
  'host.name',
  'user.name',
  'source.ip',
  'destination.ip',
  'message',
  'system.auth.ssh.signature',
  'system.auth.ssh.method',
  'system.audit.package.arch',
  'system.audit.package.entity_id',
  'system.audit.package.name',
  'system.audit.package.size',
  'system.audit.package.summary',
  'system.audit.package.version',
  'event.created',
  'event.dataset',
  'event.duration',
  'event.end',
  'event.hash',
  'event.id',
  'event.kind',
  'event.original',
  'event.outcome',
  'event.risk_score',
  'event.risk_score_norm',
  'event.severity',
  'event.start',
  'event.timezone',
  'event.type',
  'agent.type',
  'auditd.result',
  'auditd.session',
  'auditd.data.acct',
  'auditd.data.terminal',
  'auditd.data.op',
  'auditd.summary.actor.primary',
  'auditd.summary.actor.secondary',
  'auditd.summary.object.primary',
  'auditd.summary.object.secondary',
  'auditd.summary.object.type',
  'auditd.summary.how',
  'auditd.summary.message_type',
  'auditd.summary.sequence',
  'file.Ext.original.path',
  'file.name',
  'file.target_path',
  'file.extension',
  'file.type',
  'file.device',
  'file.inode',
  'file.uid',
  'file.owner',
  'file.gid',
  'file.group',
  'file.mode',
  'file.size',
  'file.mtime',
  'file.ctime',
  'file.path',
  // NOTE: 7.10+ file.Ext.code_signature populated
  // as array of objects, prior to that populated as
  // single object
  'file.Ext.code_signature',
  'file.Ext.code_signature.subject_name',
  'file.Ext.code_signature.trusted',
  'file.hash.sha256',
  'host.os.family',
  'host.id',
  'host.ip',
  'registry.key',
  'registry.path',
  'rule.reference',
  'source.bytes',
  'source.packets',
  'source.port',
  'source.geo.continent_name',
  'source.geo.country_name',
  'source.geo.country_iso_code',
  'source.geo.city_name',
  'source.geo.region_iso_code',
  'source.geo.region_name',
  'destination.bytes',
  'destination.packets',
  'destination.port',
  'destination.geo.continent_name',
  'destination.geo.country_name',
  'destination.geo.country_iso_code',
  'destination.geo.city_name',
  'destination.geo.region_iso_code',
  'destination.geo.region_name',
  'dns.question.name',
  'dns.question.type',
  'dns.resolved_ip',
  'dns.response_code',
  'endgame.exit_code',
  'endgame.file_name',
  'endgame.file_path',
  'endgame.logon_type',
  'endgame.parent_process_name',
  'endgame.pid',
  'endgame.process_name',
  'endgame.subject_domain_name',
  'endgame.subject_logon_id',
  'endgame.subject_user_name',
  'endgame.target_domain_name',
  'endgame.target_logon_id',
  'endgame.target_user_name',
  'kibana.alert.rule.timeline_id',
  'kibana.alert.rule.timeline_title',
  'kibana.alert.rule.note',
  'kibana.alert.rule.exceptions_list',
  'kibana.alert.rule.building_block_type',
  'suricata.eve.proto',
  'suricata.eve.flow_id',
  'suricata.eve.alert.signature',
  'suricata.eve.alert.signature_id',
  'network.bytes',
  'network.community_id',
  'network.direction',
  'network.packets',
  'network.protocol',
  'network.transport',
  'http.version',
  'http.request.method',
  'http.request.body.bytes',
  'http.request.body.content',
  'http.request.referrer',
  'http.response.status_code',
  'http.response.body.bytes',
  'http.response.body.content',
  'tls.client_certificate.fingerprint.sha1',
  'tls.fingerprints.ja3.hash',
  'tls.server_certificate.fingerprint.sha1',
  'user.domain',
  'winlog.event_id',
  'process.exit_code',
  'process.hash.md5',
  'process.hash.sha1',
  'process.hash.sha256',
  'process.parent.name',
  'process.parent.pid',
  'process.pid',
  'process.name',
  'process.ppid',
  'process.args',
  'process.entity_id',
  'process.executable',
  'process.title',
  'process.working_directory',
  'process.entry_leader.entity_id',
  'process.entry_leader.name',
  'process.entry_leader.pid',
  'process.session_leader.entity_id',
  'process.session_leader.name',
  'process.session_leader.pid',
  'process.group_leader.entity_id',
  'process.group_leader.name',
  'process.group_leader.pid',
  'zeek.session_id',
  'zeek.connection.local_resp',
  'zeek.connection.local_orig',
  'zeek.connection.missed_bytes',
  'zeek.connection.state',
  'zeek.connection.history',
  'zeek.notice.suppress_for',
  'zeek.notice.msg',
  'zeek.notice.note',
  'zeek.notice.sub',
  'zeek.notice.dst',
  'zeek.notice.dropped',
  'zeek.notice.peer_descr',
  'zeek.dns.AA',
  'zeek.dns.qclass_name',
  'zeek.dns.RD',
  'zeek.dns.qtype_name',
  'zeek.dns.qtype',
  'zeek.dns.query',
  'zeek.dns.trans_id',
  'zeek.dns.qclass',
  'zeek.dns.RA',
  'zeek.dns.TC',
  'zeek.http.resp_mime_types',
  'zeek.http.trans_depth',
  'zeek.http.status_msg',
  'zeek.http.resp_fuids',
  'zeek.http.tags',
  'zeek.files.session_ids',
  'zeek.files.timedout',
  'zeek.files.local_orig',
  'zeek.files.tx_host',
  'zeek.files.source',
  'zeek.files.is_orig',
  'zeek.files.overflow_bytes',
  'zeek.files.sha1',
  'zeek.files.duration',
  'zeek.files.depth',
  'zeek.files.analyzers',
  'zeek.files.mime_type',
  'zeek.files.rx_host',
  'zeek.files.total_bytes',
  'zeek.files.fuid',
  'zeek.files.seen_bytes',
  'zeek.files.missing_bytes',
  'zeek.files.md5',
  'zeek.ssl.cipher',
  'zeek.ssl.established',
  'zeek.ssl.resumed',
  'zeek.ssl.version',
  ...CTI_ROW_RENDERER_FIELDS,
];

export const ECS_METADATA_FIELDS = ['_id', '_index', '_type', '_score'];

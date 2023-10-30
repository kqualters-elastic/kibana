/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { QueryDslQueryContainer } from '@elastic/elasticsearch/lib/api/typesWithBodyKey';
import { useKibana } from '@kbn/kibana-react-plugin/public';
import { ALERT_CASE_IDS } from '@kbn/rule-data-utils';
import {
  Alerts,
  AlertsTableConfigurationRegistry,
  BulkActionsConfig,
  BulkActionsPanelConfig,
  BulkActionsState,
  BulkActionsVerbs,
  UseBulkActionsRegistry,
} from '../../../../types';
import { BulkActionsContext } from '../bulk_actions/context';
import {
  getLeadingControlColumn as getBulkActionsLeadingControlColumn,
  GetLeadingControlColumn,
} from '../bulk_actions/get_leading_control_column';
import { CasesService } from '../types';
import {
  ADD_TO_EXISTING_CASE,
  ADD_TO_NEW_CASE,
  ALERTS_ALREADY_ATTACHED_TO_CASE,
  MARK_AS_UNTRACKED,
  NO_ALERTS_ADDED_TO_CASE,
} from './translations';
import { TimelineItem } from '../bulk_actions/components/toolbar';
import { useBulkUntrackAlerts } from './use_bulk_untrack_alerts';

interface BulkActionsProps {
  query: Pick<QueryDslQueryContainer, 'bool' | 'ids'>;
  alerts: Alerts;
  casesConfig?: AlertsTableConfigurationRegistry['cases'];
  useBulkActionsConfig?: UseBulkActionsRegistry;
  refresh: () => void;
}

export interface UseBulkActions {
  isBulkActionsColumnActive: boolean;
  getBulkActionsLeadingControlColumn: GetLeadingControlColumn;
  bulkActionsState: BulkActionsState;
  bulkActions: BulkActionsPanelConfig[];
  setIsBulkActionsLoading: (isLoading: boolean) => void;
  clearSelection: () => void;
}

type UseBulkAddToCaseActionsProps = Pick<BulkActionsProps, 'casesConfig' | 'refresh'> &
  Pick<UseBulkActions, 'clearSelection'>;

type UseBulkUntrackActionsProps = Pick<BulkActionsProps, 'refresh'> &
  Pick<UseBulkActions, 'clearSelection' | 'setIsBulkActionsLoading'>;

const filterAlertsAlreadyAttachedToCase = (alerts: TimelineItem[], caseId: string) =>
  alerts.filter(
    (alert) =>
      !alert.data.some(
        (field) => field.field === ALERT_CASE_IDS && field.value?.some((id) => id === caseId)
      )
  );

const getCaseAttachments = ({
  alerts,
  caseId,
  groupAlertsByRule,
}: {
  caseId: string;
  groupAlertsByRule?: CasesService['helpers']['groupAlertsByRule'];
  alerts?: TimelineItem[];
}) => {
  const filteredAlerts = filterAlertsAlreadyAttachedToCase(alerts ?? [], caseId);
  return groupAlertsByRule?.(filteredAlerts) ?? [];
};

const addItemsToInitialPanel = ({
  panels,
  items,
}: {
  panels: BulkActionsPanelConfig[];
  items: BulkActionsConfig[];
}) => {
  if (panels.length > 0) {
    if (panels[0].items) {
      console.log('lol', panels[0].items, items);
      panels[0].items.push(...items);
    }
    return panels;
  } else {
    return [{ id: 0, items }];
  }
};

export const useBulkAddToCaseActions = ({
  casesConfig,
  refresh,
  clearSelection,
}: UseBulkAddToCaseActionsProps): BulkActionsConfig[] => {
  const prop1 = useRef(null);
  const prop2 = useRef(null);
  const prop3 = useRef(null);
  const prop4 = useRef(null);
  const prop5 = useRef(null);
  const prop6 = useRef(null);
  const { cases: casesService } = useKibana<{ cases?: CasesService }>().services;

  const userCasesPermissions = useMemo(() => {
    return casesService?.helpers.canUseCases(casesConfig?.owner ?? []);
  }, [casesConfig?.owner, casesService?.helpers]);
  const CasesContext = useMemo(() => {
    return casesService?.ui.getCasesContext();
  }, [casesService?.ui]);
  const isCasesContextAvailable = Boolean(casesService && CasesContext);

  const onSuccess = useCallback(() => {
    refresh();
    clearSelection();
  }, [clearSelection, refresh]);

  const createCaseArgs = useMemo(() => {
    return { onSuccess };
  }, [onSuccess]);

  const selectCaseArgs = useMemo(() => {
    return {
      onSuccess,
      noAttachmentsToaster: {
        title: NO_ALERTS_ADDED_TO_CASE,
        content: ALERTS_ALREADY_ATTACHED_TO_CASE,
      },
    };
  }, [onSuccess]);

  const createCaseFlyout = casesService?.hooks.useCasesAddToNewCaseFlyout(createCaseArgs).open;
  const selectCaseModal = casesService?.hooks.useCasesAddToExistingCaseModal(selectCaseArgs).open;
  // console.log(
  //   prop1.current === createCaseFlyout,
  //   prop2.current === selectCaseModal,
  //   prop3.current === userCasesPermissions,
  //   prop4.current === isCasesContextAvailable,
  //   prop5.current === casesService
  // );
  prop1.current = createCaseFlyout;
  prop2.current = selectCaseModal;
  prop3.current = userCasesPermissions;
  prop4.current = isCasesContextAvailable;
  prop5.current = casesService;

  return useMemo(() => {
    if (
      isCasesContextAvailable &&
      createCaseFlyout &&
      selectCaseModal &&
      userCasesPermissions?.create &&
      userCasesPermissions?.read
    ) {
      const addToNewCase = {
        label: ADD_TO_NEW_CASE,
        key: 'attach-new-case',
        'data-test-subj': 'attach-new-case',
        disableOnQuery: true,
        disabledLabel: ADD_TO_NEW_CASE,
        onClick: (alerts?: TimelineItem[]) => {
          const caseAttachments = alerts
            ? casesService?.helpers.groupAlertsByRule(alerts) ?? []
            : [];

          createCaseFlyout({
            attachments: caseAttachments,
          });
        },
      };
      const addToExistingCase = {
        label: ADD_TO_EXISTING_CASE,
        key: 'attach-existing-case',
        disableOnQuery: true,
        disabledLabel: ADD_TO_EXISTING_CASE,
        'data-test-subj': 'attach-existing-case',
        onClick: (alerts?: TimelineItem[]) => {
          selectCaseModal({
            getAttachments: ({ theCase }) => {
              if (theCase == null) {
                return alerts ? casesService?.helpers.groupAlertsByRule(alerts) ?? [] : [];
              }

              return getCaseAttachments({
                alerts,
                caseId: theCase.id,
                groupAlertsByRule: casesService?.helpers.groupAlertsByRule,
              });
            },
          });
        },
      };
      return [addToNewCase, addToExistingCase];
    } else {
      return [];
    }
  }, [
    casesService?.helpers,
    createCaseFlyout,
    isCasesContextAvailable,
    selectCaseModal,
    userCasesPermissions?.create,
    userCasesPermissions?.read,
  ]);
};

export const useBulkUntrackActions = ({
  setIsBulkActionsLoading,
  refresh,
  clearSelection,
}: UseBulkUntrackActionsProps) => {
  const onSuccess = useCallback(() => {
    refresh();
    clearSelection();
  }, [clearSelection, refresh]);

  const { application } = useKibana().services;
  const { mutateAsync: untrackAlerts } = useBulkUntrackAlerts();
  // Check if at least one Observability feature is enabled
  const hasApmPermission = application?.capabilities.apm?.['alerting:show'];
  const hasInfrastructurePermission = application?.capabilities.infrastructure?.show;
  const hasLogsPermission = application?.capabilities.logs?.show;
  const hasUptimePermission = application?.capabilities.uptime?.show;
  const hasSloPermission = application?.capabilities.slo?.show;
  const hasObservabilityPermission = application?.capabilities.observability?.show;

  return useMemo(() => {
    if (!application?.capabilities) return [];
    if (
      !hasApmPermission &&
      !hasInfrastructurePermission &&
      !hasLogsPermission &&
      !hasUptimePermission &&
      !hasSloPermission &&
      !hasObservabilityPermission
    )
      return [];
    return [
      {
        label: MARK_AS_UNTRACKED,
        key: 'mark-as-untracked',
        disableOnQuery: true,
        disabledLabel: MARK_AS_UNTRACKED,
        'data-test-subj': 'mark-as-untracked',
        onClick: async (alerts?: TimelineItem[]) => {
          if (!alerts) return;
          const alertUuids = alerts.map((alert) => alert._id);
          const indices = alerts.map((alert) => alert._index ?? '');
          try {
            setIsBulkActionsLoading(true);
            await untrackAlerts({ indices, alertUuids });
            onSuccess();
          } finally {
            setIsBulkActionsLoading(false);
          }
        },
      },
    ];
  }, [
    onSuccess,
    setIsBulkActionsLoading,
    untrackAlerts,
    application?.capabilities,
    hasApmPermission,
    hasInfrastructurePermission,
    hasLogsPermission,
    hasUptimePermission,
    hasSloPermission,
    hasObservabilityPermission,
  ]);
};

export function useBulkActions({
  alerts,
  casesConfig,
  query,
  refresh,
  useBulkActionsConfig = () => [],
}: BulkActionsProps): UseBulkActions {
  const [bulkActionsState, updateBulkActionsState] = useContext(BulkActionsContext);
  const prop10 = useRef(null);
  const configBulkActionPanels = useBulkActionsConfig(query);
  // console.log('config', configBulkActionPanels === prop10.current, configBulkActionPanels, prop10.current);
  // prop10.current = configBulkActionPanels;
  const oldReturn = useRef(null);
  const prop1 = useRef(null);
  const prop2 = useRef(null);
  const prop3 = useRef(null);
  const prop4 = useRef(null);
  const prop5 = useRef(null);
  const prop6 = useRef(null);
  const prop7 = useRef(null);
  const prop8 = useRef(null);
  const clearSelection = useCallback(() => {
    updateBulkActionsState({ action: BulkActionsVerbs.clear });
  }, [updateBulkActionsState]);
  const setIsBulkActionsLoading = useCallback(
    (isLoading: boolean = true) => {
      updateBulkActionsState({ action: BulkActionsVerbs.updateAllLoadingState, isLoading });
    },
    [updateBulkActionsState]
  );
  const caseBulkActions = useBulkAddToCaseActions({ casesConfig, refresh, clearSelection });
  // console.log('cases', caseBulkActions === prop7.current, caseBulkActions, prop7.current);
  // prop7.current = caseBulkActions;
  const untrackBulkActions = useBulkUntrackActions({
    setIsBulkActionsLoading,
    refresh,
    clearSelection,
  });
  // console.log('bulk', untrackBulkActions === prop8.current, untrackBulkActions, prop8.current);
  // prop8.current = untrackBulkActions;

  const bulkActions = useMemo(() => {
    const initialItems = [...caseBulkActions, ...untrackBulkActions];
    return initialItems.length
      ? addItemsToInitialPanel({
          panels: configBulkActionPanels,
          items: initialItems,
        })
      : configBulkActionPanels;
  }, [caseBulkActions, configBulkActionPanels, untrackBulkActions]);

  const isBulkActionsColumnActive = bulkActions.length !== 0;

  useEffect(() => {
    updateBulkActionsState({ action: BulkActionsVerbs.rowCountUpdate, rowCount: alerts.length });
  }, [alerts, updateBulkActionsState]);

  const ret = useMemo(() => {
    return {
      isBulkActionsColumnActive,
      getBulkActionsLeadingControlColumn,
      bulkActionsState,
      bulkActions,
      setIsBulkActionsLoading,
      clearSelection,
    };
  }, [
    bulkActions,
    bulkActionsState,
    clearSelection,
    isBulkActionsColumnActive,
    setIsBulkActionsLoading,
  ]);
  // console.log(
  //   ret === oldReturn.current,
  //   prop1.current === isBulkActionsColumnActive,
  //   prop2.current === getBulkActionsLeadingControlColumn,
  //   prop3.current === bulkActionsState,
  //   prop4.current === bulkActions,
  //   prop5.current === setIsBulkActionsLoading,
  //   prop6.current === clearSelection
  // );
  // console.log(bulkActions, prop4.current);
  oldReturn.current = ret;
  prop1.current = isBulkActionsColumnActive;
  prop2.current = getBulkActionsLeadingControlColumn;
  prop3.current = bulkActionsState;
  prop4.current = bulkActions;
  prop5.current = setIsBulkActionsLoading;
  prop6.current = clearSelection;
  return ret;
}

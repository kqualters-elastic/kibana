/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { ALERT_UUID } from '@kbn/rule-data-utils';
import React, { useState, Suspense, lazy, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  EuiDataGrid,
  EuiDataGridCellValueElementProps,
  EuiFlexGroup,
  EuiFlexItem,
  EuiToolTip,
  EuiButtonIcon,
  EuiDataGridStyle,
  EuiLoadingContent,
  EuiDataGridRefProps,
} from '@elastic/eui';
import { useQueryClient } from '@tanstack/react-query';
import type { RuleRegistrySearchRequestPagination } from '@kbn/rule-registry-plugin/common';
import { useSorting, usePagination, useBulkActions, useActionsColumn } from './hooks';
import { AlertsTableProps, FetchAlertData } from '../../../types';
import {
  ALERTS_TABLE_CONTROL_COLUMNS_ACTIONS_LABEL,
  ALERTS_TABLE_CONTROL_COLUMNS_VIEW_DETAILS_LABEL,
} from './translations';

import './alerts_table.scss';
import { useGetToolbarVisibility } from './toolbar';
import { InspectButtonContainer } from './toolbar/components/inspect';
import { SystemCellId } from './types';
import { SystemCellFactory, systemCells } from './cells';
import { triggersActionsUiQueriesKeys } from '../../hooks/constants';

const AlertsFlyout = lazy(() => import('./alerts_flyout'));
const DefaultGridStyle: EuiDataGridStyle = {
  border: 'none',
  header: 'underline',
  fontSize: 's',
};

const basicRenderCellValue = ({
  data,
  columnId,
}: {
  data: Array<{ field: string; value: string[] }>;
  ecsData?: FetchAlertData['ecsAlertsData'][number];
  columnId: string;
}) => {
  const value = data.find((d) => d.field === columnId)?.value ?? [];
  if (Array.isArray(value)) {
    return <>{value.length ? value.join() : '--'}</>;
  }
  return <>{value}</>;
};

const defaultUseCellActions = {
  getCellActions: () => null,
  visibleCellActions: undefined,
  disabledCellActions: [],
};

const RenderCell = React.memo(
  (
    _props: EuiDataGridCellValueElementProps &
      FetchAlertData & { pagination: RuleRegistrySearchRequestPagination }
  ) => {
    // https://github.com/elastic/eui/issues/5811
    const {
      rowIndex,
      pagination,
      alerts,
      ecsAlertsData,
      isLoading,
      isLoadingCases,
      cases,
      showAlertStatusWithFlapping,
      renderCellValue,
      columnId,
    } = _props;
    const idx = rowIndex - pagination.pageSize * pagination.pageIndex;
    const alert = alerts[idx];
    // ecsAlert is needed for security solution
    const ecsAlert = ecsAlertsData[idx];
    const isSystemCell = useMemo(() => {
      return systemCells.includes(columnId as SystemCellId);
    }, [columnId]);
    const data = useMemo(() => {
      const cellData: Array<{ field: string; value: string[] }> = [];
      Object.entries(alert ?? {}).forEach(([key, value]) => {
        cellData.push({ field: key, value: value as string[] });
      });
      return cellData;
    }, [alert]);
    const renderProps = useMemo(() => {
      return {
        ..._props,
        data,
        ecsData: ecsAlert,
      };
    }, [_props, data, ecsAlert]);
    if (alert) {
      if (isSystemCell) {
        return (
          <SystemCellFactory
            alert={alert}
            columnId={columnId}
            isLoading={isLoading || isLoadingCases}
            cases={cases}
            showAlertStatusWithFlapping={showAlertStatusWithFlapping}
          />
        );
      } else {
        return renderCellValue(renderProps);
      }
    } else if (isLoading) {
      return <EuiLoadingContent lines={1} />;
    }
    return null;
  }
);

const ExpandColumnRowCellRender = React.memo(
  (
    props: EuiDataGridCellValueElementProps &
      FetchAlertData & { pagination: RuleRegistrySearchRequestPagination }
  ) => {
    const {
      visibleRowIndex,
      showExpandToDetails,
      renderCustomActionsRow,
      alerts,
      ecsAlertsData,
      oldAlertsData,
      handleFlyoutAlert,
      id,
      getSetIsActionLoadingCallback,
      refresh,
      clearSelection,
    } = props;
    return (
      <EuiFlexGroup gutterSize="none" responsive={false}>
        {showExpandToDetails && (
          <EuiFlexItem grow={false}>
            <EuiToolTip content={ALERTS_TABLE_CONTROL_COLUMNS_VIEW_DETAILS_LABEL}>
              <EuiButtonIcon
                size="s"
                iconType="expand"
                color="primary"
                onClick={() => {
                  showExpandToDetails(visibleRowIndex);
                }}
                data-test-subj={`expandColumnCellOpenFlyoutButton-${visibleRowIndex}`}
                aria-label={ALERTS_TABLE_CONTROL_COLUMNS_VIEW_DETAILS_LABEL}
              />
            </EuiToolTip>
          </EuiFlexItem>
        )}
        {renderCustomActionsRow &&
          ecsAlertsData[visibleRowIndex] &&
          renderCustomActionsRow({
            alert: alerts[visibleRowIndex],
            ecsAlert: ecsAlertsData[visibleRowIndex],
            nonEcsData: oldAlertsData[visibleRowIndex],
            rowIndex: visibleRowIndex,
            setFlyoutAlert: handleFlyoutAlert,
            id: props.id,
            cveProps: props,
            setIsActionLoading: getSetIsActionLoadingCallback(visibleRowIndex),
            refresh,
            clearSelection,
          })}
      </EuiFlexGroup>
    );
  }
);

const AlertsTable: React.FunctionComponent<AlertsTableProps> = (props: AlertsTableProps) => {
  const dataGridRef = useRef<EuiDataGridRefProps>(null);
  const [activeRowClasses, setActiveRowClasses] = useState<
    NonNullable<EuiDataGridStyle['rowClasses']>
  >({});
  const alertsData = props.useFetchAlertsData();
  const {
    activePage,
    alerts,
    oldAlertsData,
    ecsAlertsData,
    alertsCount,
    isLoading,
    onPageChange,
    onSortChange,
    sort: sortingFields,
    refresh: alertsRefresh,
    getInspectQuery,
  } = alertsData;
  const queryClient = useQueryClient();
  const { data: cases, isLoading: isLoadingCases } = props.cases;

  const { sortingColumns, onSort } = useSorting(onSortChange, sortingFields);

  const { renderCustomActionsRow, actionsColumnWidth, getSetIsActionLoadingCallback } =
    useActionsColumn({
      options: props.alertsTableConfiguration.useActionsColumn,
    });

  const {
    isBulkActionsColumnActive,
    getBulkActionsLeadingControlColumn,
    bulkActionsState,
    bulkActions,
    setIsBulkActionsLoading,
    clearSelection,
  } = useBulkActions({
    alerts,
    casesConfig: props.alertsTableConfiguration.cases,
    query: props.query,
    useBulkActionsConfig: props.alertsTableConfiguration.useBulkActions,
    refresh: alertsRefresh,
  });

  const refreshData = useCallback(() => {
    alertsRefresh();
    queryClient.invalidateQueries(triggersActionsUiQueriesKeys.cases());
  }, [alertsRefresh, queryClient]);

  const refresh = useCallback(() => {
    refreshData();
    clearSelection();
  }, [clearSelection, refreshData]);

  const {
    pagination,
    onChangePageSize,
    onChangePageIndex,
    onPaginateFlyout,
    flyoutAlertIndex,
    setFlyoutAlertIndex,
  } = usePagination({
    onPageChange,
    pageIndex: activePage,
    pageSize: props.pageSize,
  });

  const {
    visibleColumns,
    onToggleColumn,
    onResetColumns,
    updatedAt,
    browserFields,
    onChangeVisibleColumns,
    showAlertStatusWithFlapping = false,
    showInspectButton = false,
  } = props;

  // TODO when every solution is using this table, we will be able to simplify it by just passing the alert index
  const handleFlyoutAlert = useCallback(
    (alert) => {
      const idx = alerts.findIndex((a) =>
        (a as any)[ALERT_UUID].includes(alert.fields[ALERT_UUID])
      );
      setFlyoutAlertIndex(idx);
    },
    [alerts, setFlyoutAlertIndex]
  );

  const fieldBrowserOptions = props.alertsTableConfiguration.useFieldBrowserOptions
    ? props.alertsTableConfiguration?.useFieldBrowserOptions({
        onToggleColumn,
      })
    : undefined;
  const { rowSelection } = bulkActionsState;

  const toolbarVisibility = useGetToolbarVisibility({
    bulkActions,
    alertsCount,
    rowSelection,
    alerts: alertsData.alerts,
    updatedAt,
    isLoading,
    columnIds: visibleColumns,
    onToggleColumn,
    onResetColumns,
    browserFields,
    controls: props.controls,
    setIsBulkActionsLoading,
    clearSelection,
    refresh,
    fieldBrowserOptions,
    getInspectQuery,
    showInspectButton,
    toolbarVisiblityProp: props.toolbarVisibility,
  });

  const bulkActionControlColumn = useMemo(() => {
    if (isBulkActionsColumnActive) {
      return [getBulkActionsLeadingControlColumn()];
    } else {
      return [];
    }
  }, [getBulkActionsLeadingControlColumn, isBulkActionsColumnActive]);

  useEffect(() => {
    // Row classes do not deal with visible row indices, so we need to handle page offset
    const rowIndex = flyoutAlertIndex + pagination.pageIndex * pagination.pageSize;
    setActiveRowClasses({
      [rowIndex]: 'alertsTableActiveRow',
    });
  }, [flyoutAlertIndex, pagination.pageIndex, pagination.pageSize]);

  // Update highlighted rows when alerts or pagination changes
  const highlightedRowClasses = useMemo(() => {
    let mappedRowClasses: EuiDataGridStyle['rowClasses'] = {};
    const shouldHighlightRowCheck = props.shouldHighlightRow;
    if (shouldHighlightRowCheck) {
      mappedRowClasses = alerts.reduce<NonNullable<EuiDataGridStyle['rowClasses']>>(
        (rowClasses, alert, index) => {
          if (shouldHighlightRowCheck(alert)) {
            rowClasses[index + pagination.pageIndex * pagination.pageSize] =
              'alertsTableHighlightedRow';
          }
          return rowClasses;
        },
        {}
      );
    }
    return mappedRowClasses;
  }, [props.shouldHighlightRow, alerts, pagination.pageIndex, pagination.pageSize]);

  const handleFlyoutClose = useCallback(() => setFlyoutAlertIndex(-1), [setFlyoutAlertIndex]);

  const renderCellValue = useCallback(
    () =>
      props.alertsTableConfiguration?.getRenderCellValue
        ? props.alertsTableConfiguration?.getRenderCellValue({
            setFlyoutAlert: handleFlyoutAlert,
          })
        : basicRenderCellValue,
    [handleFlyoutAlert, props.alertsTableConfiguration]
  )();

  const actionButtonControlColumn = useMemo(() => {
    const isActionButtonsColumnActive =
      props.showExpandToDetails || Boolean(renderCustomActionsRow);
    if (isActionButtonsColumnActive) {
      return [
        {
          id: 'expandColumn',
          width: actionsColumnWidth,
          headerCellRender: () => {
            return (
              <span data-test-subj="expandColumnHeaderLabel">
                {ALERTS_TABLE_CONTROL_COLUMNS_ACTIONS_LABEL}
              </span>
            );
          },
          rowCellRender: (cveProps) => {
            return (
              <ExpandColumnRowCellRender
                {...cveProps}
                alerts={alerts}
                ecsAlertsData={ecsAlertsData}
                isLoading={isLoading}
                isLoadingCases={isLoadingCases}
                pagination={pagination}
                showAlertStatusWithFlapping={showAlertStatusWithFlapping}
                showExpandToDetails={props.showExpandToDetails}
                renderCustomActionsRow={renderCustomActionsRow}
                oldAlertsData={oldAlertsData}
                handleFlyoutAlert={handleFlyoutAlert}
                id={props.id}
                getSetIsActionLoadingCallback={getSetIsActionLoadingCallback}
                refresh={refresh}
                clearSelection={clearSelection}
              />
            );
          },
        },
      ];
    } else {
      return [];
    }
  }, [
    alerts,
    clearSelection,
    ecsAlertsData,
    getSetIsActionLoadingCallback,
    handleFlyoutAlert,
    oldAlertsData,
    refresh,
    actionsColumnWidth,
    props.id,
    props.showExpandToDetails,
    renderCustomActionsRow,
    isLoading,
    isLoadingCases,
    pagination,
    showAlertStatusWithFlapping,
  ]);
  const leadingControlColumns = useMemo(() => {
    return [
      ...bulkActionControlColumn,
      ...actionButtonControlColumn,
      ...props.leadingControlColumns,
    ];
  }, [actionButtonControlColumn, bulkActionControlColumn, props.leadingControlColumns]);
  const handleRenderCellValue = useCallback(
    (_props: EuiDataGridCellValueElementProps) => {
      return (
        <RenderCell
          {..._props}
          alerts={alerts}
          ecsAlertsData={ecsAlertsData}
          cases={cases}
          isLoading={isLoading}
          isLoadingCases={isLoadingCases}
          pagination={pagination}
          renderCellValue={renderCellValue}
          showAlertStatusWithFlapping={showAlertStatusWithFlapping}
        />
      );
    },
    [
      alerts,
      ecsAlertsData,
      cases,
      isLoading,
      isLoadingCases,
      pagination,
      renderCellValue,
      showAlertStatusWithFlapping,
    ]
  );

  const cellActionProps = useMemo(() => {
    return {
      columns: props.columns,
      data: oldAlertsData,
      ecsData: ecsAlertsData,
      dataGridRef,
      pageSize: pagination.pageSize,
    };
  }, [ecsAlertsData, oldAlertsData, dataGridRef, pagination.pageSize, props.columns]);
  const { getCellActions, visibleCellActions, disabledCellActions } = props.alertsTableConfiguration
    ?.useCellActions
    ? props.alertsTableConfiguration?.useCellActions(cellActionProps)
    : defaultUseCellActions;

  const columnsWithCellActions = useMemo(() => {
    if (getCellActions) {
      return props.columns.map((col, idx) => ({
        ...col,
        ...(!(disabledCellActions ?? []).includes(col.id)
          ? {
              cellActions: getCellActions(col.id, idx) ?? [],
              visibleCellActions,
            }
          : {}),
      }));
    } else {
      return props.columns;
    }
  }, [props.columns, getCellActions, visibleCellActions, disabledCellActions]);
  // Merges the default grid style with the grid style that comes in through props.
  const actualGridStyle = useMemo(() => {
    const propGridStyle: NonNullable<EuiDataGridStyle> = props.gridStyle ?? {};
    // Merges default row classes, custom ones and adds the active row class style
    const mergedGridStyle: EuiDataGridStyle = {
      ...DefaultGridStyle,
      ...propGridStyle,
      rowClasses: {
        // We're spreadind the highlighted row classes first, so that the active
        // row classed can override the highlighted row classes.
        ...highlightedRowClasses,
        ...activeRowClasses,
      },
    };

    // If ANY additional rowClasses have been provided, we need to merge them with our internal ones
    if (propGridStyle.rowClasses) {
      // Get all row indices with a rowClass.
      const mergedKeys = [
        ...Object.keys(mergedGridStyle.rowClasses || {}),
        ...Object.keys(propGridStyle.rowClasses || {}),
      ];
      // Deduplicate keys to avoid extra iterations
      const dedupedKeys = Array.from(new Set(mergedKeys));

      // For each index, merge row classes
      const mergedRowClasses = dedupedKeys.reduce<NonNullable<EuiDataGridStyle['rowClasses']>>(
        (rowClasses, key) => {
          const intKey = parseInt(key, 10);
          // Use internal row classes over custom row classes.
          rowClasses[intKey] =
            mergedGridStyle.rowClasses?.[intKey] || propGridStyle.rowClasses?.[intKey] || '';
          return rowClasses;
        },
        {}
      );
      mergedGridStyle.rowClasses = mergedRowClasses;
    }
    return mergedGridStyle;
  }, [activeRowClasses, highlightedRowClasses, props.gridStyle]);

  const paginationProps = useMemo(() => {
    return {
      ...pagination,
      pageSizeOptions: props.pageSizeOptions,
      onChangeItemsPerPage: onChangePageSize,
      onChangePage: onChangePageIndex,
    };
  }, [onChangePageIndex, onChangePageSize, props.pageSizeOptions, pagination]);

  const sortingProps = useMemo(() => {
    return { columns: sortingColumns, onSort };
  }, [onSort, sortingColumns]);

  const columnVisibility = useMemo(() => {
    return { visibleColumns, setVisibleColumns: onChangeVisibleColumns };
  }, [visibleColumns, onChangeVisibleColumns]);
  console.log({ alertsCount, flyoutAlertIndex, leadingControlColumns });
  return (
    <InspectButtonContainer>
      <section style={{ width: '100%' }} data-test-subj={props['data-test-subj']}>
        <Suspense fallback={null}>
          {flyoutAlertIndex > -1 && (
            <AlertsFlyout
              alert={alerts[flyoutAlertIndex]}
              alertsCount={alertsCount}
              onClose={handleFlyoutClose}
              alertsTableConfiguration={props.alertsTableConfiguration}
              flyoutIndex={flyoutAlertIndex + pagination.pageIndex * pagination.pageSize}
              onPaginate={onPaginateFlyout}
              isLoading={isLoading}
              id={props.id}
            />
          )}
        </Suspense>
        {alertsCount > 0 && (
          <EuiDataGrid
            aria-label="Alerts table"
            data-test-subj="alertsTable"
            columns={columnsWithCellActions}
            columnVisibility={columnVisibility}
            trailingControlColumns={props.trailingControlColumns}
            leadingControlColumns={leadingControlColumns}
            rowCount={alertsCount}
            renderCellValue={handleRenderCellValue}
            gridStyle={actualGridStyle}
            sorting={sortingProps}
            toolbarVisibility={toolbarVisibility}
            pagination={paginationProps}
            rowHeightsOptions={props.rowHeightsOptions}
            ref={dataGridRef}
          />
        )}
      </section>
    </InspectButtonContainer>
  );
};

export { AlertsTable };
// eslint-disable-next-line import/no-default-export
export { AlertsTable as default };

/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { ALERT_UUID } from '@kbn/rule-data-utils';
import React, {
  useState,
  Suspense,
  lazy,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  memo,
} from 'react';
import {
  EuiDataGrid,
  EuiDataGridCellValueElementProps,
  EuiFlexGroup,
  EuiFlexItem,
  EuiToolTip,
  EuiButtonIcon,
  EuiDataGridStyle,
  EuiSkeletonText,
  EuiDataGridRefProps,
} from '@elastic/eui';
import { noop } from 'lodash/fp';
import { useQueryClient } from '@tanstack/react-query';
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

const getCellActionsStub = {
  getCellActions: () => null,
  visibleCellActions: undefined,
  disabledCellActions: [],
};

const LmaoRenderCellValue = React.memo(() => <div />);

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

const isSystemCell = (columnId: string): columnId is SystemCellId => {
  return systemCells.includes(columnId as SystemCellId);
};

const useFieldBrowserOptionsOrDefault = (useFieldBrowserOptions, onToggleColumn) => {
  const args = useMemo(() => ({ onToggleColumn }), [onToggleColumn]);
  return useFieldBrowserOptions(args);
};

const useCellActionsOrStub = (
  useCellActions,
  columns,
  oldAlertsData,
  ecsAlertsData,
  dataGridRef,
  pageSize
) => {
  const cellActionArgs = useMemo(() => {
    return {
      columns,
      data: oldAlertsData,
      ecsData: ecsAlertsData,
      dataGridRef,
      pageSize,
    };
  }, [columns, oldAlertsData, ecsAlertsData, dataGridRef, pageSize]);
  const customCellActions = useCellActions(cellActionArgs);
  if (customCellActions === undefined) {
    return getCellActionsStub;
  } else {
    return customCellActions;
  }
};

const useRenderCellOrBasic = (
  renderCellValue,
  handleFlyoutAlert,
  alerts,
  ecsAlertsData,
  cases,
  maintenanceWindows,
  isLoading,
  isLoadingCases,
  isLoadingMaintenanceWindows,
  pageIndex,
  pageSize,
  showAlertStatusWithFlapping
) => {
  const renderCellArgs = useMemo(
    () => ({ setFlyoutAlert: handleFlyoutAlert }),
    [handleFlyoutAlert]
  );
  const renderCellResult = useMemo(() => {
    const result = renderCellValue(renderCellArgs);
    if (result === undefined) {
      return basicRenderCellValue;
    } else {
      return result;
    }
  }, [renderCellValue, renderCellArgs]);
  return;
};

const AlertsTable: React.FunctionComponent<AlertsTableProps> = memo((props: AlertsTableProps) => {
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
  const { data: maintenanceWindows, isLoading: isLoadingMaintenanceWindows } =
    props.maintenanceWindows;

  const { sortingColumns, onSort } = useSorting(onSortChange, sortingFields);

  const { renderCustomActionsRow, actionsColumnWidth, getSetIsActionLoadingCallback } =
    useActionsColumn({
      options: props.alertsTableConfiguration.useActionsColumn,
    });

  const bulkActionArgs = useMemo(() => {
    return {
      alerts,
      casesConfig: props.alertsTableConfiguration.cases,
      query: props.query,
      useBulkActionsConfig: props.alertsTableConfiguration.useBulkActions,
      refresh: alertsRefresh,
    };
  }, [alerts, props.alertsTableConfiguration, props.query, alertsRefresh]);

  const {
    isBulkActionsColumnActive,
    getBulkActionsLeadingControlColumn,
    bulkActionsState,
    bulkActions,
    setIsBulkActionsLoading,
    clearSelection,
  } = useBulkActions(bulkActionArgs);

  const refreshData = useCallback(() => {
    alertsRefresh();
    queryClient.invalidateQueries(triggersActionsUiQueriesKeys.cases());
    queryClient.invalidateQueries(triggersActionsUiQueriesKeys.maintenanceWindows());
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
    onColumnResize,
    showAlertStatusWithFlapping = false,
    showInspectButton = false,
    alertsTableConfiguration,
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
  const fieldBrowserOptions = useFieldBrowserOptionsOrDefault(
    alertsTableConfiguration.useFieldBrowserOptions ?? noop,
    onToggleColumn
  );

  const prop1 = useRef(null);
  const prop2 = useRef(null);
  const prop3 = useRef(null);
  const prop4 = useRef(null);
  const prop5 = useRef(null);
  const prop6 = useRef(null);
  const prop7 = useRef(null);
  const prop8 = useRef(null);
  const prop9 = useRef(null);
  const prop10 = useRef(null);
  const prop11 = useRef(null);
  const prop12 = useRef(null);
  const prop13 = useRef(null);
  const prop14 = useRef(null);
  const prop15 = useRef(null);
  const prop16 = useRef(null);
  const prop17 = useRef(null);
  const prop18 = useRef(null);

  const toolbarVisiblityProps = useMemo(() => {
    const { rowSelection } = bulkActionsState;
    return {
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
    };
  }, [
    bulkActionsState,
    bulkActions,
    alertsCount,
    alertsData.alerts,
    updatedAt,
    isLoading,
    visibleColumns,
    onToggleColumn,
    onResetColumns,
    browserFields,
    props.controls,
    setIsBulkActionsLoading,
    clearSelection,
    refresh,
    fieldBrowserOptions,
    getInspectQuery,
    showInspectButton,
    props.toolbarVisibility,
  ]);

  const toolbarVisibility = useGetToolbarVisibility(toolbarVisiblityProps);

  // console.log(
  //   'toolbarVisibility',
  //   bulkActionsState === prop1.current,
  //   bulkActions === prop2.current,
  //   alertsCount === prop3.current,
  //   alertsData.alerts === prop4.current,
  //   updatedAt === prop5.current,
  //   isLoading === prop6.current,
  //   visibleColumns === prop7.current,
  //   onToggleColumn === prop8.current,
  //   onResetColumns === prop9.current,
  //   browserFields === prop10.current,
  //   props.controls === prop11.current,
  //   setIsBulkActionsLoading === prop12.current,
  //   clearSelection === prop13.current,
  //   refresh === prop14.current,
  //   fieldBrowserOptions === prop15.current,
  //   getInspectQuery === prop16.current,
  //   showInspectButton === prop17.current,
  //   props.toolbarVisibility === prop18.current
  // );
  // prop1.current = bulkActionsState;
  // prop2.current = bulkActions; // false
  // prop3.current = alertsCount;
  // prop4.current = alertsData.alerts;
  // prop5.current = updatedAt;
  // prop6.current = isLoading;
  // prop7.current = visibleColumns;
  // prop8.current = onToggleColumn;
  // prop9.current = onResetColumns;
  // prop10.current = browserFields;
  // prop11.current = props.controls;
  // prop12.current = setIsBulkActionsLoading;
  // prop13.current = clearSelection;
  // prop14.current = refresh;
  // prop15.current = fieldBrowserOptions; // false
  // prop16.current = getInspectQuery;
  // prop17.current = showInspectButton;
  // prop18.current = props.toolbarVisibility;

  const leadingControlColumns = useMemo(() => {
    const isActionButtonsColumnActive =
      props.showExpandToDetails || Boolean(renderCustomActionsRow);

    let controlColumns = [...props.leadingControlColumns];

    if (isActionButtonsColumnActive) {
      controlColumns = [
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
          rowCellRender: (cveProps: EuiDataGridCellValueElementProps) => {
            const { visibleRowIndex } = cveProps as EuiDataGridCellValueElementProps & {
              visibleRowIndex: number;
            };

            return (
              <EuiFlexGroup gutterSize="none" responsive={false}>
                {props.showExpandToDetails && (
                  <EuiFlexItem grow={false}>
                    <EuiToolTip content={ALERTS_TABLE_CONTROL_COLUMNS_VIEW_DETAILS_LABEL}>
                      <EuiButtonIcon
                        size="s"
                        iconType="expand"
                        color="primary"
                        onClick={() => {
                          setFlyoutAlertIndex(visibleRowIndex);
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
                    cveProps,
                    setIsActionLoading: getSetIsActionLoadingCallback(visibleRowIndex),
                    refresh,
                    clearSelection,
                  })}
              </EuiFlexGroup>
            );
          },
        },
        ...controlColumns,
      ];
    }

    if (isBulkActionsColumnActive) {
      controlColumns = [getBulkActionsLeadingControlColumn(), ...controlColumns];
    }

    return controlColumns;
  }, [
    actionsColumnWidth,
    alerts,
    oldAlertsData,
    ecsAlertsData,
    getBulkActionsLeadingControlColumn,
    handleFlyoutAlert,
    isBulkActionsColumnActive,
    props.id,
    props.leadingControlColumns,
    props.showExpandToDetails,
    renderCustomActionsRow,
    setFlyoutAlertIndex,
    getSetIsActionLoadingCallback,
    refresh,
    clearSelection,
  ]);

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
          if (props.gridStyle?.stripes && index % 2 !== 0) {
            // manually add stripes if props.gridStyle.stripes is true because presence of rowClasses
            // overrides the props.gridStyle.stripes option. And rowClasses will always be there.
            // Adding strips only on even rows. It will be replace by alertsTableHighlightedRow if
            // shouldHighlightRow is correct
            rowClasses[index + pagination.pageIndex * pagination.pageSize] =
              'euiDataGridRow--striped';
          }
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
  }, [
    props.shouldHighlightRow,
    alerts,
    pagination.pageIndex,
    pagination.pageSize,
    props.gridStyle,
  ]);

  const handleFlyoutClose = useCallback(() => setFlyoutAlertIndex(-1), [setFlyoutAlertIndex]);
  const renderCellArgs = useMemo(() => {
    return {
      setFlyoutAlert: handleFlyoutAlert,
    };
  }, [handleFlyoutAlert]);
  const renderCellValue = useCallback(
    () =>
      props.alertsTableConfiguration?.getRenderCellValue
        ? props.alertsTableConfiguration?.getRenderCellValue(renderCellArgs)
        : basicRenderCellValue,
    [props.alertsTableConfiguration, renderCellArgs]
  )();
  // const renderCellValue = useRenderCellOrBasic(
  //   props.alertsTableConfiguration?.getRenderCellValue ?? noop,
  //   handleFlyoutAlert,
  //   alerts,
  //   ecsAlertsData,
  //   cases,
  //   maintenanceWindows,
  //   isLoading,
  //   isLoadingCases,
  //   isLoadingMaintenanceWindows,
  //   pagination.pageIndex,
  //   pagination.pageSize,
  //   showAlertStatusWithFlapping
  // );

  // console.log({ renderCellValue });

  const handleRenderCellValue = useCallback(
    (_props: EuiDataGridCellValueElementProps) => {
      // https://github.com/elastic/eui/issues/5811
      const idx = _props.rowIndex - pagination.pageSize * pagination.pageIndex;
      const alert = alerts[idx];
      // ecsAlert is needed for security solution
      const ecsAlert = ecsAlertsData[idx];
      if (alert) {
        const data: Array<{ field: string; value: string[] }> = [];
        Object.entries(alert ?? {}).forEach(([key, value]) => {
          data.push({ field: key, value: value as string[] });
        });

        if (isSystemCell(_props.columnId)) {
          return (
            <SystemCellFactory
              alert={alert}
              columnId={_props.columnId}
              isLoading={isLoading || isLoadingCases || isLoadingMaintenanceWindows}
              cases={cases}
              maintenanceWindows={maintenanceWindows}
              showAlertStatusWithFlapping={showAlertStatusWithFlapping}
            />
          );
        }

        return renderCellValue({
          ..._props,
          data,
          ecsData: ecsAlert,
        });
      } else if (isLoading) {
        return <EuiSkeletonText lines={1} />;
      }
      return null;
    },
    [
      alerts,
      ecsAlertsData,
      cases,
      maintenanceWindows,
      isLoading,
      isLoadingCases,
      isLoadingMaintenanceWindows,
      pagination.pageIndex,
      pagination.pageSize,
      renderCellValue,
      showAlertStatusWithFlapping,
    ]
  );

  const { getCellActions, visibleCellActions, disabledCellActions } = useCellActionsOrStub(
    props.alertsTableConfiguration?.useCellActions ?? noop,
    props.columns,
    oldAlertsData,
    ecsAlertsData,
    dataGridRef,
    pagination.pageSize
  );

  // const { getCellActions, visibleCellActions, disabledCellActions } = props.alertsTableConfiguration
  //   ?.useCellActions
  //   ? props.alertsTableConfiguration?.useCellActions({
  //       columns: props.columns,
  //       data: oldAlertsData,
  //       ecsData: ecsAlertsData,
  //       dataGridRef,
  //       pageSize: pagination.pageSize,
  //     })
  //   : getCellActionsStub;

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
    }
    return props.columns;
  }, [getCellActions, disabledCellActions, props.columns, visibleCellActions]);

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
  }, [props.gridStyle, activeRowClasses, highlightedRowClasses]);

  const sortProps = useMemo(() => {
    return { columns: sortingColumns, onSort };
  }, [sortingColumns, onSort]);

  const paginationProps = useMemo(() => {
    return {
      ...pagination,
      pageSizeOptions: props.pageSizeOptions,
      onChangeItemsPerPage: onChangePageSize,
      onChangePage: onChangePageIndex,
    };
  }, [pagination, props.pageSizeOptions, onChangePageSize, onChangePageIndex]);

  const columnVisibility = useMemo(() => {
    return { visibleColumns, setVisibleColumns: onChangeVisibleColumns };
  }, [visibleColumns, onChangeVisibleColumns]);

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
            sorting={sortProps}
            toolbarVisibility={toolbarVisibility}
            pagination={paginationProps}
            rowHeightsOptions={props.rowHeightsOptions}
            onColumnResize={onColumnResize}
            ref={dataGridRef}
          />
        )}
      </section>
    </InspectButtonContainer>
  );
});

AlertsTable.displayName = 'AlertsTable';

export { AlertsTable };
// eslint-disable-next-line import/no-default-export
export { AlertsTable as default };

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
  EuiDataGridCellValueElementPropsWithContext,
  EuiDataGridStyle,
  EuiDataGridRefProps,
  EuiFlexGroup,
  EuiDataGridProps,
  renderCellValueWithContext,
} from '@elastic/eui';
import { noop } from 'lodash/fp';
import { useQueryClient } from '@tanstack/react-query';
import styled from '@emotion/styled';
import { RuleRegistrySearchRequestPagination } from '@kbn/rule-registry-plugin/common';
import { useSorting, usePagination, useBulkActions, useActionsColumn } from './hooks';
import { AlertsTableProps, FetchAlertData } from '../../../types';
import { ALERTS_TABLE_CONTROL_COLUMNS_ACTIONS_LABEL } from './translations';

import './alerts_table.scss';
import { useGetToolbarVisibility } from './toolbar';
import { InspectButtonContainer } from './toolbar/components/inspect';
import { SystemCellId } from './types';
// import { SystemCellFactory, systemCells } from './cells';
import { systemCells } from './cells';
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

interface BasicRenderProps {
  data?: Array<{ field: string; value: string[] }>;
  ecsData?: FetchAlertData['ecsAlertsData'][number];
  columnId: string;
}

const BasicRenderCellValue: renderCellValueWithContext = memo(
  ({ data, columnId }: EuiDataGridCellValueElementPropsWithContext<BasicRenderProps>) => {
    const value = (Array.isArray(data) && data.find((d) => d.field === columnId)?.value) ?? [];
    if (Array.isArray(value)) {
      return <>{value.length ? value.join() : '--'}</>;
    }
    return <>{value}</>;
  }
);

const isSystemCell = (columnId: string): columnId is SystemCellId => {
  return systemCells.includes(columnId as SystemCellId);
};

const useFieldBrowserOptionsOrDefault = (useFieldBrowserOptions, onToggleColumn) => {
  const args = useMemo(() => ({ onToggleColumn }), [onToggleColumn]);
  return useFieldBrowserOptions(args);
};

const Row = styled.div`
  display: flex;
  min-width: fit-content;
`;

type CustomGridBodyProps = Pick<
  Parameters<Exclude<EuiDataGridProps['renderCustomGridBody'], undefined>>['0'],
  'Cell' | 'visibleColumns'
> & {
  alertsData: FetchAlertData['oldAlertsData'];
  isLoading: boolean;
  pagination: RuleRegistrySearchRequestPagination;
  actualGridStyle: EuiDataGridStyle;
  stripes?: boolean;
};

const CustomGridBody = memo(
  ({
    alertsData,
    isLoading,
    pagination,
    actualGridStyle,
    visibleColumns,
    Cell,
    stripes,
  }: CustomGridBodyProps) => {
    return (
      <>
        {alertsData
          .concat(isLoading ? Array.from({ length: pagination.pageSize - alertsData.length }) : [])
          .map((_row, rowIndex) => (
            <Row
              role="row"
              key={`${rowIndex},${pagination.pageIndex}`}
              // manually add stripes if props.gridStyle.stripes is true because presence of rowClasses
              // overrides the props.gridStyle.stripes option. And rowClasses will always be there.
              // Adding stripes only on even rows. It will be replaced by alertsTableHighlightedRow if
              // shouldHighlightRow is correct
              className={`euiDataGridRow ${
                stripes && rowIndex % 2 !== 0 ? 'euiDataGridRow--striped' : ''
              } ${actualGridStyle.rowClasses?.[rowIndex] ?? ''}`}
            >
              {visibleColumns.map((_col, colIndex) => (
                <Cell
                  colIndex={colIndex}
                  visibleRowIndex={rowIndex}
                  key={`${rowIndex},${colIndex}`}
                />
              ))}
            </Row>
          ))}
      </>
    );
  }
);

// const RenderCellWithCustomContext = memo(
//   ({ ...props }: EuiDataGridCellValueElementPropsWithContext) => {
//     const {
//       isLoading,
//       columnId,
//       rowIndex,
//       pagination: { pageSize, pageIndex },
//       alerts,
//       ecsData,
//       isLoadingCases,
//       isLoadingMaintenanceWindows,
//       cases,
//       maintenanceWindows,
//       showAlertStatusWithFlapping,
//       RenderCellValue,
//     } = props;
//     const idx = rowIndex - pageSize * pageIndex;
//     const alert = alerts[idx];
//     const Alert = useMemo(() => {
//       const ecsAlert = ecsData[idx];
//       const data: Array<{ field: string; value: string[] }> = [];
//       Object.entries(alert ?? {}).forEach(([key, value]) => {
//         data.push({ field: key, value: value as string[] });
//       });
//       return <RenderCellValue {...props} data={data} ecsData={ecsAlert} />;
//     }, [RenderCellValue, props, alert, ecsData, idx]);

//     if (isLoading) {
//       return <EuiSkeletonText lines={1} />;
//     } else if (isSystemCell(columnId)) {
//       return (
//         <SystemCellFactory
//           alert={alert}
//           columnId={props.columnId}
//           isLoading={isLoading || isLoadingCases || isLoadingMaintenanceWindows}
//           cases={cases}
//           maintenanceWindows={maintenanceWindows}
//           showAlertStatusWithFlapping={showAlertStatusWithFlapping}
//         />
//       );
//     } else if (alert) {
//       return Alert;
//     } else {
//       return null;
//     }
//   }
// );

const AlertsTable: React.FunctionComponent<AlertsTableProps> = memo((props: AlertsTableProps) => {
  const dataGridRef = useRef<EuiDataGridRefProps>(null);
  const { renderCellContext: passedRenderCellContext, RenderCellValue } = props;
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
      featureIds: props.featureIds,
    };
  }, [alerts, props.alertsTableConfiguration, props.query, alertsRefresh, props.featureIds]);

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

  const leadingControlColumns = useMemo(() => {
    // TODO: use cool new renderCellContext
    let controlColumns = [...props.leadingControlColumns];

    if (renderCustomActionsRow) {
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

            if (!ecsAlertsData[visibleRowIndex]) {
              return null;
            }

            return (
              <EuiFlexGroup gutterSize="none" responsive={false}>
                {renderCustomActionsRow({
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
    renderCustomActionsRow,
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

  // TODO: optional hooks were a mistake, use cool new renderCellContext
  const { getCellActions, visibleCellActions, disabledCellActions } = props.alertsTableConfiguration
    ?.useCellActions
    ? props.alertsTableConfiguration?.useCellActions({
        columns: props.columns,
        data: oldAlertsData,
        ecsData: ecsAlertsData,
        dataGridRef,
        pageSize: pagination.pageSize,
      })
    : getCellActionsStub;

  const renderCellContext = useCallback(() => {
    const additionalContext = passedRenderCellContext ? passedRenderCellContext() : {};
    return {
      ...additionalContext,
      ecsData: ecsAlertsData,
      alerts,
      browserFields,
      pagination,
      isLoading,
      setFlyoutAlert: handleFlyoutAlert,
      // RenderCellValue: renderCellValue,
      isLoadingCases,
      isLoadingMaintenanceWindows,
      cases,
      maintenanceWindows,
      showAlertStatusWithFlapping,
      'test-test-custom-attribute': 'ello cool api',
    };
  }, [
    passedRenderCellContext,
    ecsAlertsData,
    handleFlyoutAlert,
    browserFields,
    isLoading,
    pagination,
    alerts,
    isLoadingCases,
    isLoadingMaintenanceWindows,
    cases,
    maintenanceWindows,
    showAlertStatusWithFlapping,
  ]);

  const dataGridPagination = useMemo(
    () => ({
      ...pagination,
      pageSizeOptions: props.pageSizeOptions,
      onChangeItemsPerPage: onChangePageSize,
      onChangePage: onChangePageIndex,
    }),
    [onChangePageIndex, onChangePageSize, pagination, props.pageSizeOptions]
  );

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

  const columnVisibility = useMemo(() => {
    return { visibleColumns, setVisibleColumns: onChangeVisibleColumns };
  }, [visibleColumns, onChangeVisibleColumns]);

  const renderCustomGridBody = useCallback<
    Exclude<EuiDataGridProps['renderCustomGridBody'], undefined>
  >(
    ({ visibleColumns: _visibleColumns, Cell }) => (
      <CustomGridBody
        visibleColumns={_visibleColumns}
        Cell={Cell}
        actualGridStyle={actualGridStyle}
        alertsData={oldAlertsData}
        pagination={pagination}
        isLoading={isLoading}
        stripes={props.gridStyle?.stripes}
      />
    ),
    [actualGridStyle, oldAlertsData, pagination, isLoading, props.gridStyle?.stripes]
  );

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
            renderCellValue={RenderCellValue ?? BasicRenderCellValue}
            renderCellContext={renderCellContext}
            gridStyle={actualGridStyle}
            sorting={sortProps}
            toolbarVisibility={toolbarVisibility}
            pagination={dataGridPagination}
            rowHeightsOptions={props.rowHeightsOptions}
            onColumnResize={onColumnResize}
            ref={dataGridRef}
            renderCustomGridBody={props.dynamicRowHeight ? renderCustomGridBody : undefined}
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

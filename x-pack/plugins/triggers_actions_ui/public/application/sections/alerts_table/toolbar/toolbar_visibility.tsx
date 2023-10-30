/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  EuiDataGridToolBarAdditionalControlsOptions,
  EuiDataGridToolBarVisibilityOptions,
} from '@elastic/eui';
import React, { lazy, Suspense, memo, useMemo, useRef } from 'react';
import { BrowserFields } from '@kbn/rule-registry-plugin/common';
import { AlertsCount } from './components/alerts_count/alerts_count';
import type {
  Alerts,
  BulkActionsPanelConfig,
  GetInspectQuery,
  RowSelection,
} from '../../../../types';
import { LastUpdatedAt } from './components/last_updated_at';
import { FieldBrowser } from '../../field_browser';
import { FieldBrowserOptions } from '../../field_browser/types';
import { InspectButton } from './components/inspect';
import { ALERTS_TABLE_TITLE } from '../translations';

const BulkActionsToolbar = lazy(() => import('../bulk_actions/components/toolbar'));

const RightControl = memo(
  ({
    controls,
    updatedAt,
    getInspectQuery,
    showInspectButton,
  }: {
    controls?: EuiDataGridToolBarAdditionalControlsOptions;
    updatedAt: number;
    getInspectQuery: GetInspectQuery;
    showInspectButton: boolean;
  }) => {
    return (
      <>
        {showInspectButton && (
          <InspectButton inspectTitle={ALERTS_TABLE_TITLE} getInspectQuery={getInspectQuery} />
        )}
        <LastUpdatedAt updatedAt={updatedAt} />
        {controls?.right}
      </>
    );
  }
);

const LeftAppendControl = memo(
  ({
    alertsCount,
    hasBrowserFields,
    columnIds,
    browserFields,
    onResetColumns,
    onToggleColumn,
    fieldBrowserOptions,
  }: {
    alertsCount: number;
    columnIds: string[];
    onToggleColumn: (columnId: string) => void;
    onResetColumns: () => void;
    controls?: EuiDataGridToolBarAdditionalControlsOptions;
    fieldBrowserOptions?: FieldBrowserOptions;
    getInspectQuery: GetInspectQuery;
    showInspectButton: boolean;
    hasBrowserFields: boolean;
    browserFields: BrowserFields;
  }) => {
    return (
      <>
        <AlertsCount count={alertsCount} />
        {hasBrowserFields && (
          <FieldBrowser
            columnIds={columnIds}
            browserFields={browserFields}
            onResetColumns={onResetColumns}
            onToggleColumn={onToggleColumn}
            options={fieldBrowserOptions}
          />
        )}
      </>
    );
  }
);

const useGetDefaultVisibility = ({
  alertsCount,
  updatedAt,
  columnIds,
  onToggleColumn,
  onResetColumns,
  browserFields,
  controls,
  fieldBrowserOptions,
  getInspectQuery,
  showInspectButton,
}: {
  alertsCount: number;
  updatedAt: number;
  columnIds: string[];
  onToggleColumn: (columnId: string) => void;
  onResetColumns: () => void;
  browserFields: BrowserFields;
  controls?: EuiDataGridToolBarAdditionalControlsOptions;
  fieldBrowserOptions?: FieldBrowserOptions;
  getInspectQuery: GetInspectQuery;
  showInspectButton: boolean;
}): EuiDataGridToolBarVisibilityOptions => {
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
  const prop19 = useRef(null);
  const defaultVisibility = useMemo(() => {
    const hasBrowserFields = Object.keys(browserFields).length > 0;
    return {
      additionalControls: {
        right: (
          <RightControl
            controls={controls}
            updatedAt={updatedAt}
            getInspectQuery={getInspectQuery}
            showInspectButton={showInspectButton}
          />
        ),
        left: {
          append: (
            <LeftAppendControl
              alertsCount={alertsCount}
              hasBrowserFields={hasBrowserFields}
              columnIds={columnIds}
              browserFields={browserFields}
              onResetColumns={onResetColumns}
              onToggleColumn={onToggleColumn}
              fieldBrowserOptions={fieldBrowserOptions}
            />
          ),
        },
      },
      showColumnSelector: {
        allowHide: false,
      },
      showSortSelector: true,
    };
  }, [
    alertsCount,
    browserFields,
    columnIds,
    fieldBrowserOptions,
    getInspectQuery,
    onResetColumns,
    onToggleColumn,
    showInspectButton,
    controls,
    updatedAt,
  ]);
  console.log(
    'useGetDefaultVisibility',
    alertsCount === prop2.current,
    updatedAt === prop6.current,
    columnIds === prop7.current,
    onToggleColumn === prop8.current,
    onResetColumns === prop9.current,
    browserFields === prop10.current,
    controls === prop13.current,
    fieldBrowserOptions === prop15.current, // false
    getInspectQuery === prop16.current,
    showInspectButton === prop17.current,
    defaultVisibility === prop19.current // false
  );
  prop2.current = alertsCount;
  prop6.current = updatedAt;
  prop7.current = columnIds;
  prop8.current = onToggleColumn;
  prop9.current = onResetColumns;
  prop10.current = browserFields;
  prop13.current = controls;
  prop15.current = fieldBrowserOptions;
  prop16.current = getInspectQuery;
  prop17.current = showInspectButton;
  prop19.current = defaultVisibility;
  return defaultVisibility;
};

export const useGetToolbarVisibility = ({
  bulkActions,
  alertsCount,
  rowSelection,
  alerts,
  isLoading,
  updatedAt,
  columnIds,
  onToggleColumn,
  onResetColumns,
  browserFields,
  setIsBulkActionsLoading,
  clearSelection,
  controls,
  refresh,
  fieldBrowserOptions,
  getInspectQuery,
  showInspectButton,
  toolbarVisiblityProp,
}: {
  bulkActions: BulkActionsPanelConfig[];
  alertsCount: number;
  rowSelection: RowSelection;
  alerts: Alerts;
  isLoading: boolean;
  updatedAt: number;
  columnIds: string[];
  onToggleColumn: (columnId: string) => void;
  onResetColumns: () => void;
  browserFields: any;
  setIsBulkActionsLoading: (isLoading: boolean) => void;
  clearSelection: () => void;
  controls?: EuiDataGridToolBarAdditionalControlsOptions;
  refresh: () => void;
  fieldBrowserOptions?: FieldBrowserOptions;
  getInspectQuery: GetInspectQuery;
  showInspectButton: boolean;
  toolbarVisiblityProp?: EuiDataGridToolBarVisibilityOptions;
}): EuiDataGridToolBarVisibilityOptions => {
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
  const prop19 = useRef(null);
  const selectedRowsCount = rowSelection.size;
  const defaultVisibilityProps = useMemo(() => {
    return {
      alertsCount,
      updatedAt,
      columnIds,
      onToggleColumn,
      onResetColumns,
      browserFields,
      controls,
      fieldBrowserOptions,
      getInspectQuery,
      showInspectButton,
    };
  }, [
    alertsCount,
    updatedAt,
    columnIds,
    onToggleColumn,
    onResetColumns,
    browserFields,
    controls,
    fieldBrowserOptions,
    getInspectQuery,
    showInspectButton,
  ]);
  const defaultVisibility = useGetDefaultVisibility(defaultVisibilityProps);
  console.log(
    'useGetToolbarVisibility',
    bulkActions === prop1.current,
    alertsCount === prop2.current,
    rowSelection === prop3.current,
    alerts === prop4.current,
    isLoading === prop5.current,
    updatedAt === prop6.current,
    columnIds === prop7.current,
    onToggleColumn === prop8.current,
    onResetColumns === prop9.current,
    browserFields === prop10.current,
    setIsBulkActionsLoading === prop11.current,
    clearSelection === prop12.current,
    controls === prop13.current,
    refresh === prop14.current,
    fieldBrowserOptions === prop15.current, // false
    getInspectQuery === prop16.current,
    showInspectButton === prop17.current,
    toolbarVisiblityProp === prop18.current,
    defaultVisibility === prop19.current // false
  );
  prop1.current = bulkActions;
  prop2.current = alertsCount;
  prop3.current = rowSelection;
  prop4.current = alerts;
  prop5.current = isLoading;
  prop6.current = updatedAt;
  prop7.current = columnIds;
  prop8.current = onToggleColumn;
  prop9.current = onResetColumns;
  prop10.current = browserFields;
  prop11.current = setIsBulkActionsLoading;
  prop12.current = clearSelection;
  prop13.current = controls;
  prop14.current = refresh;
  prop15.current = fieldBrowserOptions;
  prop16.current = getInspectQuery;
  prop17.current = showInspectButton;
  prop18.current = toolbarVisiblityProp;
  prop19.current = defaultVisibility;
  const options = useMemo(() => {
    const isBulkActionsActive =
      selectedRowsCount === 0 || selectedRowsCount === undefined || bulkActions.length === 0;

    if (isBulkActionsActive)
      return {
        ...defaultVisibility,
        ...(toolbarVisiblityProp ?? {}),
      };
    return {
      showColumnSelector: false,
      showSortSelector: false,
      additionalControls: {
        right: (
          <RightControl
            controls={controls}
            updatedAt={updatedAt}
            getInspectQuery={getInspectQuery}
            showInspectButton={showInspectButton}
          />
        ),
        left: {
          append: (
            <>
              <AlertsCount count={alertsCount} />
              <Suspense fallback={null}>
                <BulkActionsToolbar
                  totalItems={alertsCount}
                  panels={bulkActions}
                  alerts={alerts}
                  setIsBulkActionsLoading={setIsBulkActionsLoading}
                  clearSelection={clearSelection}
                  refresh={refresh}
                />
              </Suspense>
            </>
          ),
        },
      },
      ...(toolbarVisiblityProp ?? {}),
    };
  }, [
    alertsCount,
    bulkActions,
    defaultVisibility,
    selectedRowsCount,
    toolbarVisiblityProp,
    alerts,
    clearSelection,
    refresh,
    setIsBulkActionsLoading,
    updatedAt,
    controls,
    getInspectQuery,
    showInspectButton,
  ]);

  return options;
};

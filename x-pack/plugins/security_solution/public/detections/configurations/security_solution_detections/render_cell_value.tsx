/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { EuiIcon, EuiToolTip, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import type { EuiDataGridSetCellProps } from '@elastic/eui';
import React, { useMemo, memo } from 'react';
import { find, getOr } from 'lodash/fp';
import type { TimelineNonEcsData } from '@kbn/timelines-plugin/common';
import { tableDefaults, dataTableSelectors } from '@kbn/securitysolution-data-table';
import type { EcsSecurityExtension as Ecs } from '@kbn/securitysolution-ecs';
import { useLicense } from '../../../common/hooks/use_license';
import { useDeepEqualSelector } from '../../../common/hooks/use_selector';
import type { RowRenderer, ColumnHeaderOptions } from '../../../../common/types/timeline';
import type { BrowserFields } from '../../../../common/search_strategy';
import type { AlertsUserProfilesData } from './fetch_page_context';
import { defaultRowRenderers } from '../../../timelines/components/timeline/body/renderers';
import { GuidedOnboardingTourStep } from '../../../common/components/guided_onboarding_tour/tour_step';
import { isDetectionsAlertsTable } from '../../../common/components/top_n/helpers';
import {
  AlertsCasesTourSteps,
  SecurityStepId,
} from '../../../common/components/guided_onboarding_tour/tour_config';
import { SIGNAL_RULE_NAME_FIELD_NAME } from '../../../timelines/components/timeline/body/renderers/constants';
import { useSourcererDataView } from '../../../sourcerer/containers';
import { DefaultCellRenderer } from '../../../timelines/components/timeline/cell_rendering/default_cell_renderer';

import { SUPPRESSED_ALERT_TOOLTIP } from './translations';
import { VIEW_SELECTION } from '../../../../common/constants';
import { getAllFieldsByName } from '../../../common/containers/source';
import { eventRenderedViewColumns, getColumns } from './columns';
import type { GetSecurityAlertsTableProp } from '../../components/alerts_table/types';

const OnboardingWrapper: React.FC<{
  isTourAnchor: boolean;
  browserFields?: BrowserFields;
  columnId: string;
  finalData: TimelineNonEcsData[];
  ecsAlert: Ecs;
  eventId: string;
  myHeader: ColumnHeaderOptions;
  isDetails: boolean;
  isDraggable: boolean;
  isExpandable: boolean;
  isExpanded: boolean;
  linkValues: string[];
  localLinkValues: string[];
  rowIndex: number;
  colIndex: number;
  rowRenderers: RowRenderer[];
  setCellProps: (props: EuiDataGridSetCellProps) => void;
  scopeId: string;
  truncate: boolean;
  context?: AlertsUserProfilesData;
}> = memo(
  ({
    isTourAnchor,
    browserFields,
    columnId,
    finalData,
    ecsAlert,
    eventId,
    myHeader,
    isDetails,
    isDraggable,
    isExpandable,
    isExpanded,
    linkValues,
    localLinkValues,
    rowIndex,
    colIndex,
    rowRenderers,
    setCellProps,
    scopeId,
    truncate,
    context,
  }) => {
    return (
      <GuidedOnboardingTourStep
        isTourAnchor={isTourAnchor}
        step={AlertsCasesTourSteps.pointToAlertName}
        tourId={SecurityStepId.alertsCases}
      >
        <DefaultCellRenderer
          browserFields={browserFields}
          columnId={columnId}
          data={finalData}
          ecsData={ecsAlert}
          eventId={eventId}
          header={myHeader}
          isDetails={isDetails}
          isDraggable={isDraggable}
          isExpandable={isExpandable}
          isExpanded={isExpanded}
          linkValues={linkValues ?? localLinkValues}
          rowIndex={rowIndex}
          colIndex={colIndex}
          rowRenderers={rowRenderers ?? defaultRowRenderers}
          setCellProps={setCellProps}
          scopeId={scopeId}
          truncate={truncate}
          asPlainText={false}
          context={context}
        />
      </GuidedOnboardingTourStep>
    );
  }
);

OnboardingWrapper.displayName = 'OnboardingWrapper';

const EMPTY_LOCAL_LINK_VALUES: string[] = [];
/**
 * This implementation of `EuiDataGrid`'s `renderCellValue`
 * accepts `EuiDataGridCellValueElementProps`, plus `data`
 * from the TGrid
 */

export const CellValue: GetSecurityAlertsTableProp<'renderCellValue'> = memo(
  function RenderCellValue(props) {
    const {
      columnId,
      rowIndex,
      scopeId,
      tableId,
      tableType,
      header,
      legacyAlert,
      ecsAlert,
      linkValues,
      rowRenderers,
      isDetails,
      isExpandable,
      isDraggable = false,
      isExpanded,
      colIndex,
      eventId,
      setCellProps,
      truncate,
      context,
    } = props;
    const isTourAnchor = useMemo(
      () =>
        columnId === SIGNAL_RULE_NAME_FIELD_NAME &&
        isDetectionsAlertsTable(tableType) &&
        rowIndex === 0 &&
        !props.isDetails,
      [columnId, props.isDetails, rowIndex, tableType]
    );
    const { browserFields } = useSourcererDataView(scopeId);
    const browserFieldsByName = useMemo(() => getAllFieldsByName(browserFields), [browserFields]);
    const getTable = useMemo(() => dataTableSelectors.getTableByIdSelector(), []);
    const license = useLicense();
    const viewMode =
      useDeepEqualSelector((state) => (getTable(state, tableId ?? '') ?? tableDefaults).viewMode) ??
      tableDefaults.viewMode;

    const gridColumns = useMemo(() => {
      return getColumns(license);
    }, [license]);

    const columnHeaders = useMemo(() => {
      return viewMode === VIEW_SELECTION.gridView ? gridColumns : eventRenderedViewColumns;
    }, [gridColumns, viewMode]);

    /**
     * There is difference between how `triggers actions` fetched data v/s
     * how security solution fetches data via timelineSearchStrategy
     *
     * _id and _index fields are array in timelineSearchStrategy  but not in
     * ruleStrategy
     *
     *
     */

    const finalData = useMemo(() => {
      if (!legacyAlert) return [];

      return (legacyAlert as TimelineNonEcsData[]).reduce((acc, field) => {
        if (['_id', '_index'].includes(field.field)) {
          const newValue = field.value ?? '';
          acc.push({
            field: field.field,
            value: Array.isArray(newValue) ? newValue : [newValue],
          });
        } else {
          acc.push(field);
        }
        return acc;
      }, [] as TimelineNonEcsData[]);
    }, [legacyAlert]);

    const actualSuppressionCount = useMemo(() => {
      // We check both ecsAlert and data for the suppression count because it could be in either one,
      // depending on where RenderCellValue is being used - when used in cases, data is populated,
      // whereas in the regular security alerts table it's in ecsAlert
      const ecsSuppressionCount = ecsAlert?.kibana?.alert.suppression?.docs_count?.[0];
      const dataSuppressionCount = find(
        { field: 'kibana.alert.suppression.docs_count' },
        legacyAlert
      )?.value?.[0] as number | undefined;
      return ecsSuppressionCount ? parseInt(ecsSuppressionCount, 10) : dataSuppressionCount;
    }, [ecsAlert, legacyAlert]);

    const myHeader = useMemo(() => {
      return header ?? { id: columnId, ...browserFieldsByName[columnId] };
    }, [header, columnId, browserFieldsByName]);

    const localLinkValues = useMemo(() => {
      const colHeader = columnHeaders.find((col) => col.id === columnId);
      return getOr(EMPTY_LOCAL_LINK_VALUES, colHeader?.linkField ?? '', ecsAlert);
    }, [ecsAlert, columnId, columnHeaders]);

    const Renderer = useMemo(() => {
      return (
        <OnboardingWrapper
          isTourAnchor={isTourAnchor}
          browserFields={browserFields}
          columnId={columnId}
          finalData={finalData}
          ecsAlert={ecsAlert}
          eventId={eventId}
          myHeader={myHeader}
          isDetails={isDetails}
          isDraggable={isDraggable}
          isExpandable={isExpandable}
          isExpanded={isExpanded}
          linkValues={linkValues}
          localLinkValues={localLinkValues}
          rowIndex={rowIndex}
          colIndex={colIndex}
          rowRenderers={rowRenderers}
          setCellProps={setCellProps}
          scopeId={scopeId}
          truncate={truncate}
          context={context}
        />
      );
    }, [
      myHeader,
      columnId,
      ecsAlert,
      isTourAnchor,
      localLinkValues,
      browserFields,
      finalData,
      eventId,
      isDetails,
      isDraggable,
      isExpandable,
      isExpanded,
      linkValues,
      rowIndex,
      colIndex,
      rowRenderers,
      setCellProps,
      scopeId,
      truncate,
      context,
    ]);

    return columnId === SIGNAL_RULE_NAME_FIELD_NAME && actualSuppressionCount ? (
      <EuiFlexGroup gutterSize="xs">
        <EuiFlexItem grow={false}>
          <EuiToolTip position="top" content={SUPPRESSED_ALERT_TOOLTIP(actualSuppressionCount)}>
            <EuiIcon type="layers" />
          </EuiToolTip>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>{Renderer}</EuiFlexItem>
      </EuiFlexGroup>
    ) : (
      <>{Renderer}</>
    );
  }
);

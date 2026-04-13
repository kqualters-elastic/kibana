/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useDispatch } from 'react-redux';
import type { Filter, Query } from '@kbn/es-query';
import type { DataView, DataViewSpec } from '@kbn/data-views-plugin/common';
import {
  type GroupOption,
  type GroupStatsItem,
  isNoneGroup,
  type NamedAggregation,
  type RawBucket,
  useGrouping,
  type GroupSettings,
} from '@kbn/grouping';
import { isEqual } from 'lodash/fp';
import type { Storage } from '@kbn/kibana-utils-plugin/public';
import type { estypes } from '@elastic/elasticsearch';
import type { TableIdLiteral } from '@kbn/securitysolution-data-table';
import type {
  GetAdditionalActionButtons,
  GetGroupStats,
  GroupChildComponentRenderer,
  GroupingArgs,
  GroupingSort,
  GroupPanelRenderer,
  ParsedGroupingAggregation,
  DynamicGroupingProps,
} from '@kbn/grouping/src';
import type { PageScope } from '../../../data_view_manager/constants';
import { useIsExperimentalFeatureEnabled } from '../../../common/hooks/use_experimental_features';
import type { GroupTakeActionItems } from './types';
import type { AlertsGroupingAggregation } from './grouping_settings/types';
import { groupIdSelector } from '../../../common/store/grouping/selectors';
import { useDeepEqualSelector } from '../../../common/hooks/use_selector';
import { updateGroups } from '../../../common/store/grouping/actions';
import { defaultUnit } from '../../../common/components/toolbar/unit';
import type { RunTimeMappings } from '../../../sourcerer/store/model';
import { useKibana } from '../../../common/lib/kibana';
import { GroupedSubLevel } from './alerts_sub_grouping';
import { AlertsEventTypes, track } from '../../../common/lib/telemetry';
import * as i18n from './translations';

export interface AlertsTableComponentProps {
  /**
   * Allows to customize the `buttonContent` props of the EuiAccordion.
   * It basically renders the text next to the chevron, used to expand/collapse the accordion.
   * If none provided, the DefaultGroupPanelRenderer will be used (see kbn-grouping package).
   */
  accordionButtonContent?: GroupPanelRenderer<AlertsGroupingAggregation>;
  /**
   * Allow to partially customize the `extraAction` props of the EuiAccordion.
   * It basically renders the statistics to right side of the title and the left side of the Take actions button.
   * If none provided, we display the number of alerts for the group.
   */
  accordionExtraActionGroupStats?: {
    /**
     * Responsible to fetch the aggregation data to populate the UI values
     */
    aggregations: (field: string) => NamedAggregation[];
    /**
     * Responsible for rendering the aggregation data
     */
    renderer: GetGroupStats<AlertsGroupingAggregation>;
  };
  /**
   * Data view scope
   */
  pageScope?: PageScope;
  // TODO remove when we remove the newDataViewPickerEnabled feature flag
  /**
   * DataViewSpec object to use internally to fetch the data
   */
  dataViewSpec: DataViewSpec;
  // TODO this should probably not be optional anymore once we remove the newDataViewPickerEnabled feature flag
  /**
   * DataView object to use internally to fetch the data.
   */
  dataView?: DataView;
  defaultFilters?: Filter[];
  /**
   * Default values to display in the group selection dropdown.
   * If none are provided, the only options there will None (default) and be Custom field.
   */
  defaultGroupingOptions?: GroupOption[];
  from: string;
  globalFilters: Filter[];
  globalQuery: Query;
  /**
   * Allows to customize the content of the Take actions button rendered at the group level.
   * If no value is provided, the Take actins button is not displayed.
   */
  groupTakeActionItems?: GroupTakeActionItems;
  loading: boolean;
  renderChildComponent: GroupChildComponentRenderer<AlertsGroupingAggregation>;
  tableId: TableIdLiteral;
  to: string;
  settings?: GroupSettings;

  /**
   * A callback function that is invoked whenever the grouping aggregations are updated.
   * It receives the parsed aggregation data as its only argument. This can be used to
   * react to changes in the grouped data, for example, to extract information from
   * the aggregation results.
   */
  onAggregationsChange?: (
    aggs: ParsedGroupingAggregation<AlertsGroupingAggregation>,
    groupingLevel?: number
  ) => void;

  /** Optional array of custom controls to display in the toolbar alongside the group selector */
  additionalToolbarControls?: JSX.Element[];

  /** Optional custom component to render when there are no grouping results */
  emptyGroupingComponent?: React.ReactElement;

  /** Optional function to get additional action buttons to display in group stats before the Take actions button */
  getAdditionalActionButtons?: GetAdditionalActionButtons<AlertsGroupingAggregation>;

  /**
   * Sort order for the grouping results.
   */
  sort?: GroupingSort;

  /**
   * Filter specifically for the unitsCount aggregation
   */
  unitsCountFilter?: estypes.QueryDslQueryContainer;
}

const DEFAULT_PAGE_SIZE = 25;
const DEFAULT_PAGE_INDEX = 0;
const MAX_GROUPING_LEVELS = 3;
export const DEFAULT_GROUPING_OPTIONS: GroupOption[] = [];

/**
 * This is used as default behavior if no group renderer is passed via props.
 * This will render the number of alerts.
 * It's paired with the DEFAULT_GROUP_STATS_AGGREGATION which retrieves the aggregation data.
 */
export const DEFAULT_GROUP_STATS_RENDERER: GetGroupStats<AlertsGroupingAggregation> = (
  _: string,
  bucket: RawBucket<AlertsGroupingAggregation>
): GroupStatsItem[] => [
  {
    title: i18n.STATS_GROUP_ALERTS,
    badge: {
      value: bucket.doc_count,
      width: 50,
      color: '#a83632',
    },
  },
];
/**
 * This is used as default behavior if no group aggregations is passed via props.
 * This will render retrieve the values to render the DEFAULT_GROUP_STATS_RENDERER above.
 */
export const DEFAULT_GROUP_STATS_AGGREGATION: (field: string) => NamedAggregation[] = () => [
  {
    unitsCount: {
      cardinality: {
        field: 'kibana.alert.uuid',
      },
    },
  },
];

const useStorage = (storage: Storage, tableId: string) =>
  useMemo(
    () => ({
      getStoragePageSize: (): number[] => {
        const pageSizes = storage.get(`grouping-table-${tableId}`);
        if (!pageSizes) {
          return Array(MAX_GROUPING_LEVELS).fill(DEFAULT_PAGE_SIZE);
        }
        return pageSizes;
      },
      setStoragePageSize: (pageSizes: number[]) => {
        storage.set(`grouping-table-${tableId}`, pageSizes);
      },
    }),
    [storage, tableId]
  );

/**
 * Returns a stable reference to a Filter array using deep equality.
 * Prevents downstream useCallback/useMemo from invalidating when a new
 * array with identical contents is passed on each render.
 */
function useStableFilters(filters: Filter[]): Filter[] {
  const ref = useRef(filters);
  if (!isEqual(ref.current, filters)) {
    ref.current = filters;
  }
  return ref.current;
}

type GetGroupingFn = (
  props: Omit<DynamicGroupingProps<AlertsGroupingAggregation>, 'groupSelector' | 'pagination'>
) => React.ReactElement;

/**
 * Context shared across all GroupingLevel instances for a given GroupedAlertsTable tree.
 * Avoids prop-drilling the values that don't vary per level.
 */
interface AlertsGroupingCtx {
  selectedGroups: string[];
  getGrouping: GetGroupingFn;
  groupStatsAggregations: (field: string) => NamedAggregation[];
  pageIndex: number[];
  pageSize: number[];
  setPageVar: (newNumber: number, groupingLevel: number, pageType: 'index' | 'size') => void;
  resetGroupChildrenPagination: (parentLevel: number) => void;
  dataViewTitle: string | undefined;
  runtimeMappings: RunTimeMappings;
  multiValueFieldsToFlatten: string[];
  leafRenderChildComponent: GroupChildComponentRenderer<AlertsGroupingAggregation>;
  from: string;
  to: string;
  defaultFilters?: Filter[];
  globalFilters: Filter[];
  globalQuery: Query;
  loading: boolean;
  tableId: TableIdLiteral;
  groupTakeActionItems?: GroupTakeActionItems;
  additionalToolbarControls?: JSX.Element[];
  onAggregationsChange?: (
    aggs: ParsedGroupingAggregation<AlertsGroupingAggregation>,
    groupingLevel?: number
  ) => void;
  unitsCountFilter?: estypes.QueryDslQueryContainer;
  pageScope?: PageScope;
  sort?: GroupingSort;
}

const AlertsGroupingContext = createContext<AlertsGroupingCtx | null>(null);

interface GroupingLevelProps {
  level: number;
  parentGroupingFilters?: Filter[];
}

/**
 * Renders one level of the grouped alerts accordion. Recursively renders itself
 * (via renderChildComponent) for intermediate levels, and renders the leaf alerts
 * table for the deepest level.
 *
 * Reads all shared state from AlertsGroupingContext so that per-level callbacks
 * (rcc, onGroupClose, setPageIndex, setPageSize) can be properly memoized and
 * won't change identity when unrelated state like `loading` updates. This keeps
 * open flyouts alive across table auto-refreshes.
 */
const GroupingLevelComponent: React.FC<GroupingLevelProps> = ({
  level,
  parentGroupingFilters = [],
}) => {
  const ctx = useContext(AlertsGroupingContext);
  if (!ctx) throw new Error('GroupingLevel must be rendered inside GroupedAlertsTable');

  const {
    selectedGroups,
    getGrouping,
    groupStatsAggregations,
    pageIndex,
    pageSize,
    setPageVar,
    resetGroupChildrenPagination,
    dataViewTitle,
    runtimeMappings,
    multiValueFieldsToFlatten,
    leafRenderChildComponent,
    from,
    to,
    defaultFilters,
    globalFilters,
    globalQuery,
    loading,
    tableId,
    groupTakeActionItems,
    additionalToolbarControls,
    onAggregationsChange,
    unitsCountFilter,
    pageScope,
    sort,
  } = ctx;

  const selectedGroup = selectedGroups[level];
  const isLeafLevel = level >= selectedGroups.length - 1;

  // Stabilize the incoming filter array so callbacks that depend on it don't
  // unnecessarily invalidate when a new-but-equal array is passed.
  const stableParentFilters = useStableFilters(parentGroupingFilters);

  const leafRcc = useCallback(
    (
      groupingFilters: Filter[],
      sg?: string,
      fieldBucket?: RawBucket<AlertsGroupingAggregation>
    ) => {
      return leafRenderChildComponent(
        [...groupingFilters, ...stableParentFilters],
        sg,
        fieldBucket
      );
    },
    [leafRenderChildComponent, stableParentFilters]
  );

  const intermediateRcc = useCallback(
    (groupingFilters: Filter[]) => {
      return (
        <GroupingLevel
          level={level + 1}
          parentGroupingFilters={[...groupingFilters, ...stableParentFilters]}
        />
      );
    },
    [level, stableParentFilters]
  );

  const rcc = isLeafLevel ? leafRcc : intermediateRcc;

  const onGroupClose = useCallback(
    () => resetGroupChildrenPagination(level),
    [resetGroupChildrenPagination, level]
  );

  const setPageIndexForLevel = useCallback(
    (newIndex: number) => setPageVar(newIndex, level, 'index'),
    [setPageVar, level]
  );

  const setPageSizeForLevel = useCallback(
    (newSize: number) => setPageVar(newSize, level, 'size'),
    [setPageVar, level]
  );

  return (
    <GroupedSubLevel
      additionalToolbarControls={additionalToolbarControls}
      defaultFilters={defaultFilters}
      from={from}
      getGrouping={getGrouping}
      globalFilters={globalFilters}
      globalQuery={globalQuery}
      groupingLevel={level}
      groupStatsAggregations={groupStatsAggregations}
      groupTakeActionItems={groupTakeActionItems}
      loading={loading}
      multiValueFieldsToFlatten={multiValueFieldsToFlatten}
      onAggregationsChange={onAggregationsChange}
      onGroupClose={onGroupClose}
      pageIndex={pageIndex[level] ?? DEFAULT_PAGE_INDEX}
      pageScope={pageScope}
      pageSize={pageSize[level] ?? DEFAULT_PAGE_SIZE}
      parentGroupingFilters={stableParentFilters}
      renderChildComponent={rcc}
      runtimeMappings={runtimeMappings}
      selectedGroup={selectedGroup}
      setPageIndex={setPageIndexForLevel}
      setPageSize={setPageSizeForLevel}
      signalIndexName={dataViewTitle}
      sort={sort}
      tableId={tableId}
      to={to}
      unitsCountFilter={unitsCountFilter}
    />
  );
};

const GroupingLevel = React.memo(GroupingLevelComponent);

const GroupedAlertsTableComponent: React.FC<AlertsTableComponentProps> = (props) => {
  const dispatch = useDispatch();
  const newDataViewPickerEnabled = useIsExperimentalFeatureEnabled('newDataViewPickerEnabled');
  const {
    services: { storage, telemetry },
  } = useKibana();

  const { getStoragePageSize, setStoragePageSize } = useStorage(storage, props.tableId);

  const { onGroupChange, onGroupToggle } = useMemo(
    () => ({
      onGroupChange: ({ groupByField, tableId }: { groupByField: string; tableId: string }) => {
        telemetry.reportEvent(AlertsEventTypes.AlertsGroupingChanged, { groupByField, tableId });
      },
      onGroupToggle: (param: {
        isOpen: boolean;
        groupName?: string | undefined;
        groupNumber: number;
        groupingId: string;
      }) =>
        telemetry.reportEvent(AlertsEventTypes.AlertsGroupingToggled, {
          ...param,
          tableId: param.groupingId,
        }),
    }),
    [telemetry]
  );

  const onOptionsChange = useCallback<NonNullable<GroupingArgs<{}>['onOptionsChange']>>(
    (options) => {
      dispatch(
        updateGroups({
          tableId: props.tableId,
          options,
        })
      );
    },
    [dispatch, props.tableId]
  );

  useEffect(() => {
    dispatch(
      updateGroups({
        tableId: props.tableId,
        settings: props.settings,
      })
    );
  }, [dispatch, props.tableId, props.settings]);

  const fields = useMemo(
    () =>
      newDataViewPickerEnabled
        ? props.dataView?.fields.map((field) => field.spec) || []
        : Object.values(props.dataViewSpec.fields || {}),
    [newDataViewPickerEnabled, props.dataView?.fields, props.dataViewSpec.fields]
  );

  const multiValueFieldsToFlatten = useMemo(
    () => fields.filter((field) => field.aggregatable).map((field) => field.name),
    [fields]
  );

  const runtimeMappings = useMemo(
    () =>
      newDataViewPickerEnabled
        ? (props.dataView?.getRuntimeMappings() as RunTimeMappings)
        : (props.dataViewSpec?.runtimeFieldMap as RunTimeMappings),
    [newDataViewPickerEnabled, props.dataView, props.dataViewSpec?.runtimeFieldMap]
  );

  const dataViewTitle = useMemo(
    () => (newDataViewPickerEnabled ? props.dataView?.title : props.dataViewSpec.title),
    [newDataViewPickerEnabled, props.dataView?.title, props.dataViewSpec.title]
  );

  const groupingOptions = useMemo(
    () => props.defaultGroupingOptions || DEFAULT_GROUPING_OPTIONS,
    [props.defaultGroupingOptions]
  );

  const groupStatsRenderer = useMemo(
    () => props.accordionExtraActionGroupStats?.renderer || DEFAULT_GROUP_STATS_RENDERER,
    [props.accordionExtraActionGroupStats?.renderer]
  );

  const groupStatsAggregations = useMemo(
    () => props.accordionExtraActionGroupStats?.aggregations || DEFAULT_GROUP_STATS_AGGREGATION,
    [props.accordionExtraActionGroupStats?.aggregations]
  );

  const { getGrouping, selectedGroups, setSelectedGroups } = useGrouping({
    componentProps: {
      groupPanelRenderer: props.accordionButtonContent,
      getGroupStats: groupStatsRenderer,
      onGroupToggle,
      unit: defaultUnit,
      multiValueFields: multiValueFieldsToFlatten,
      emptyGroupingComponent: props.emptyGroupingComponent,
      getAdditionalActionButtons: props.getAdditionalActionButtons,
    },
    defaultGroupingOptions: groupingOptions,
    fields,
    groupingId: props.tableId,
    maxGroupingLevels: MAX_GROUPING_LEVELS,
    onGroupChange,
    onOptionsChange,
    tracker: track,
    settings: props.settings,
  });

  const groupId = useMemo(() => groupIdSelector(), []);
  const groupInRedux = useDeepEqualSelector((state) => groupId(state, props.tableId));

  useEffect(() => {
    // only ever set to `none` - siem only handles group selector when `none` is selected
    if (isNoneGroup(selectedGroups)) {
      dispatch(
        updateGroups({
          activeGroups: selectedGroups,
          tableId: props.tableId,
        })
      );
    }
  }, [dispatch, props.tableId, selectedGroups]);

  useEffect(() => {
    if (groupInRedux != null && !isNoneGroup(groupInRedux.activeGroups)) {
      setSelectedGroups(groupInRedux.activeGroups);
    }
  }, [groupInRedux, setSelectedGroups]);

  const [pageIndex, setPageIndex] = useState<number[]>(
    Array(MAX_GROUPING_LEVELS).fill(DEFAULT_PAGE_INDEX)
  );
  const [pageSize, setPageSize] = useState<number[]>(getStoragePageSize);

  const resetAllPagination = useCallback(() => {
    setPageIndex((curr) => curr.map(() => DEFAULT_PAGE_INDEX));
  }, []);

  const setPageVar = useCallback(
    (newNumber: number, groupingLevel: number, pageType: 'index' | 'size') => {
      if (pageType === 'index') {
        setPageIndex((currentIndex) => {
          const newArr = [...currentIndex];
          newArr[groupingLevel] = newNumber;
          return newArr;
        });
      }

      if (pageType === 'size') {
        setPageSize((currentIndex) => {
          const newArr = [...currentIndex];
          newArr[groupingLevel] = newNumber;
          setStoragePageSize(newArr);
          return newArr;
        });
        // set page index to 0 when page size is changed
        setPageIndex((currentIndex) => {
          const newArr = [...currentIndex];
          newArr[groupingLevel] = 0;
          return newArr;
        });
      }
    },
    [setStoragePageSize]
  );

  const resetGroupChildrenPagination = useCallback((parentLevel: number) => {
    setPageIndex((allPages) => {
      const newArr = [...allPages];
      for (let i = parentLevel + 1; i < newArr.length; i++) {
        newArr[i] = DEFAULT_PAGE_INDEX;
      }
      return newArr;
    });
  }, []);

  const paginationResetTriggers = useRef({
    defaultFilters: props.defaultFilters,
    globalFilters: props.globalFilters,
    globalQuery: props.globalQuery,
    selectedGroups,
  });

  useEffect(() => {
    const triggers = {
      defaultFilters: props.defaultFilters,
      globalFilters: props.globalFilters,
      globalQuery: props.globalQuery,
      selectedGroups,
    };
    if (!isEqual(paginationResetTriggers.current, triggers)) {
      resetAllPagination();
      paginationResetTriggers.current = triggers;
    }
  }, [
    props.defaultFilters,
    props.globalFilters,
    props.globalQuery,
    resetAllPagination,
    selectedGroups,
  ]);

  const ctxValue = useMemo<AlertsGroupingCtx>(
    () => ({
      selectedGroups,
      getGrouping,
      groupStatsAggregations,
      pageIndex,
      pageSize,
      setPageVar,
      resetGroupChildrenPagination,
      dataViewTitle,
      runtimeMappings,
      multiValueFieldsToFlatten,
      leafRenderChildComponent: props.renderChildComponent,
      from: props.from,
      to: props.to,
      defaultFilters: props.defaultFilters,
      globalFilters: props.globalFilters,
      globalQuery: props.globalQuery,
      loading: props.loading,
      tableId: props.tableId,
      groupTakeActionItems: props.groupTakeActionItems,
      additionalToolbarControls: props.additionalToolbarControls,
      onAggregationsChange: props.onAggregationsChange,
      unitsCountFilter: props.unitsCountFilter,
      pageScope: props.pageScope,
      sort: props.sort,
    }),
    [
      selectedGroups,
      getGrouping,
      groupStatsAggregations,
      pageIndex,
      pageSize,
      setPageVar,
      resetGroupChildrenPagination,
      dataViewTitle,
      runtimeMappings,
      multiValueFieldsToFlatten,
      props.renderChildComponent,
      props.from,
      props.to,
      props.defaultFilters,
      props.globalFilters,
      props.globalQuery,
      props.loading,
      props.tableId,
      props.groupTakeActionItems,
      props.additionalToolbarControls,
      props.onAggregationsChange,
      props.unitsCountFilter,
      props.pageScope,
      props.sort,
    ]
  );

  if (!dataViewTitle) {
    return null;
  }

  return (
    <AlertsGroupingContext.Provider value={ctxValue}>
      <GroupingLevel level={0} />
    </AlertsGroupingContext.Provider>
  );
};

export const GroupedAlertsTable = React.memo(GroupedAlertsTableComponent);

/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  EuiComboBoxOptionOption,
  EuiSuperSelectOption,
  EuiIcon,
  EuiBadge,
  EuiButtonEmpty,
  EuiFormRow,
  EuiFormRowProps,
} from '@elastic/eui';
import { useDispatch } from 'react-redux';

import styled, { css } from 'styled-components';
import { StyledBadge } from './helpers';
import { getSourcererDataview } from '../../containers/sourcerer/api';
import { getScopePatternListSelection } from '../../store/sourcerer/helpers';
import { sourcererActions, sourcererModel } from '../../store/sourcerer';
import { SourcererScopeName, KibanaDataView } from '../../store/sourcerer/model';
import * as i18n from './translations';

interface UsePickIndexPatternsProps {
  dataViewId: string | null;
  defaultDataViewId: string;
  isOnlyDetectionAlerts: boolean;
  kibanaDataViews: sourcererModel.SourcererModel['kibanaDataViews'];
  missingPatterns: string[];
  scopeId: sourcererModel.SourcererScopeName;
  selectedDataViewId: string | null;
  selectedPatterns: string[];
  signalIndexName: string | null;
}

export type ModifiedTypes = 'modified' | 'alerts' | 'deprecated' | 'missingPatterns' | '';

interface UsePickIndexPatterns {
  allOptions: Array<EuiComboBoxOptionOption<string>>;
  dataViewSelectOptions: Array<EuiSuperSelectOption<string>>;
  loadingIndexPatterns: boolean;
  handleOutsideClick: () => void;
  isModified: ModifiedTypes;
  onChangeCombo: (newSelectedDataViewId: Array<EuiComboBoxOptionOption<string>>) => void;
  selectedOptions: Array<EuiComboBoxOptionOption<string>>;
  setIndexPatternsByDataView: (newSelectedDataViewId: string, isAlerts?: boolean) => void;
}

interface UseDataViewSelectOptionsProps {
  dataViewId: string | null;
  defaultDataViewId: sourcererModel.KibanaDataView['id'];
  isModified: boolean;
  isOnlyDetectionAlerts: boolean;
  kibanaDataViews: sourcererModel.KibanaDataView[];
}

export const useDataViewSelectOptions = ({
  dataViewId,
  defaultDataViewId,
  isModified,
  isOnlyDetectionAlerts,
  kibanaDataViews,
}: UseDataViewSelectOptionsProps): Array<EuiSuperSelectOption<string>> => {
  const onlyDetectionAlertOptions = useMemo(() => {
    console.log('new memo 1');
    return [
      {
        inputDisplay: (
          <span data-test-subj="security-alerts-option-super">
            <EuiIcon type="logoSecurity" size="s" /> {i18n.SIEM_SECURITY_DATA_VIEW_LABEL}
            <StyledBadge data-test-subj="security-alerts-option-badge">
              {i18n.ALERTS_BADGE_TITLE}
            </StyledBadge>
          </span>
        ),
        value: defaultDataViewId,
      },
    ];
  }, [defaultDataViewId]);
  const dataViewSpecificOptions = useMemo(() => {
    console.log('new memo 2');
    return kibanaDataViews.map(({ title, id }) => ({
      inputDisplay:
        id === defaultDataViewId ? (
          <span data-test-subj="security-option-super">
            <EuiIcon type="logoSecurity" size="s" /> {i18n.SECURITY_DEFAULT_DATA_VIEW_LABEL}
            {isModified && id === dataViewId && (
              <StyledBadge data-test-subj="security-modified-option-badge">
                {i18n.MODIFIED_BADGE_TITLE}
              </StyledBadge>
            )}
          </span>
        ) : (
          <span data-test-subj="dataView-option-super">
            <EuiIcon type="logoKibana" size="s" /> {title}
            {isModified && id === dataViewId && (
              <StyledBadge data-test-subj="security-modified-option-badge">
                {i18n.MODIFIED_BADGE_TITLE}
              </StyledBadge>
            )}
          </span>
        ),
      value: id,
    }));
  }, [dataViewId, defaultDataViewId, isModified, kibanaDataViews]);
  return isOnlyDetectionAlerts ? onlyDetectionAlertOptions : dataViewSpecificOptions;
};

export const getPatternListWithoutSignals = (
  patternList: string[],
  signalIndexName: string | null
): string[] => patternList.filter((p) => p !== signalIndexName);

const usePatternListToOptions = (patternList: string | string[] | null) => {
  return useMemo(() => {
    console.log('new joint');
    if (patternList === null) {
      return [];
    } else if (typeof patternList === 'string') {
      return [{ label: patternList, value: patternList }];
    } else {
      return patternList.sort().map((s) => ({
        label: s,
        value: s,
      }));
    }
  }, [patternList]);
};

export const usePickIndexPatterns = ({
  dataViewId,
  defaultDataViewId,
  isOnlyDetectionAlerts,
  kibanaDataViews,
  missingPatterns,
  scopeId,
  selectedDataViewId,
  selectedPatterns,
  signalIndexName,
}: UsePickIndexPatternsProps): UsePickIndexPatterns => {
  const dispatch = useDispatch();
  const abortCtrl = useRef<AbortController>(new AbortController());
  const [loadingIndexPatterns, setLoadingIndexPatterns] = useState(false);
  const [newSelectedDataViewId, setNewSelectedDataViewId] = useState<string | null>(null);
  const signalIndexOptions = usePatternListToOptions(signalIndexName);
  const alertsOptions = useMemo(
    () => (signalIndexName ? signalIndexOptions : []),
    [signalIndexName, signalIndexOptions]
  );
  const selectedPatternOptions = usePatternListToOptions(selectedPatterns);
  const [mapOfDataViewsToPatterns, _] = useState(new Map<string, string[]>());

  const [fetchedView, setFetchedView] = useState<KibanaDataView | null>(null);

  const theDataView = useMemo(() => {
    return kibanaDataViews.find((dataView) => dataView.id === dataViewId);
  }, [dataViewId, kibanaDataViews]);

  const { allPatterns, selectablePatterns } = useMemo<{
    allPatterns: string[];
    selectablePatterns: string[];
  }>(() => {
    if (isOnlyDetectionAlerts && signalIndexName) {
      return {
        allPatterns: [signalIndexName],
        selectablePatterns: [signalIndexName],
      };
    }

    if (theDataView == null) {
      return {
        allPatterns: [],
        selectablePatterns: [],
      };
    }

    const titleAsList = [...new Set(theDataView.title.split(','))];

    return scopeId === sourcererModel.SourcererScopeName.default
      ? {
          allPatterns: getPatternListWithoutSignals(titleAsList, signalIndexName),
          selectablePatterns: getPatternListWithoutSignals(
            theDataView.patternList,
            signalIndexName
          ),
        }
      : {
          allPatterns: titleAsList,
          selectablePatterns: theDataView.patternList,
        };
  }, [isOnlyDetectionAlerts, scopeId, signalIndexName, theDataView]);
  const allPatternsOptions = usePatternListToOptions(allPatterns);

  const allOptions = useMemo(
    () => [...new Set([...allPatternsOptions, ...selectedPatternOptions])],
    [allPatternsOptions, selectedPatternOptions]
  );

  useEffect(() => {
    console.log('my effect');
    kibanaDataViews.map((dataView) => {
      mapOfDataViewsToPatterns.set(
        dataView.id,
        getScopePatternListSelection(
          dataView,
          scopeId,
          signalIndexName,
          dataView.id === defaultDataViewId
        )
      );
      return null;
    });
  }, [kibanaDataViews, defaultDataViewId, scopeId, signalIndexName, mapOfDataViewsToPatterns]);

  const selectedDataViewPatterns = useMemo(() => {
    console.log('selectedDataViewPatterns');
    if (dataViewId !== null && mapOfDataViewsToPatterns.has(dataViewId)) {
      return mapOfDataViewsToPatterns.get(dataViewId) ?? [];
    } else {
      return [];
    }
  }, [mapOfDataViewsToPatterns, dataViewId]);

  const selectedDataViewPatternOptions = usePatternListToOptions(selectedDataViewPatterns);

  const getDefaultSelectedOptionsByDataView = useMemo(() => {
    console.log('getDefaultSelectedOptionsByDataView');
    return scopeId === SourcererScopeName.detections || isOnlyDetectionAlerts
      ? alertsOptions
      : selectedDataViewPatternOptions;
  }, [alertsOptions, scopeId, selectedDataViewPatternOptions, isOnlyDetectionAlerts]);

  const isModified: ModifiedTypes = useMemo(() => {
    const isPatternsModified =
      getDefaultSelectedOptionsByDataView.length !== selectedPatterns.length ||
      !getDefaultSelectedOptionsByDataView.every((option) =>
        selectedPatterns.find((pattern) => option.value === pattern)
      );
    if (selectedDataViewId == null) {
      return 'deprecated';
    } else if (missingPatterns.length > 0) {
      return 'missingPatterns';
    } else if (isOnlyDetectionAlerts) {
      return 'alerts';
    } else if (isPatternsModified) {
      return 'modified';
    } else {
      return '';
    }
  }, [
    selectedPatterns,
    selectedDataViewId,
    getDefaultSelectedOptionsByDataView,
    isOnlyDetectionAlerts,
    missingPatterns.length,
  ]);

  useEffect(() => {
    console.log('setSelectedOptions');
    // setSelectedOptions(
    //   scopeId === SourcererScopeName.detections ? alertsOptions : selectedPatternOptions
    // );
  }, [selectedPatterns, scopeId, alertsOptions, selectedPatternOptions]);

  const onChangeCombo = useCallback((newSelectedOptions) => {
    console.log('onChangeCombo', newSelectedOptions);
    // setSelectedOptions(newSelectedOptions);
  }, []);

  const pickedDataViewPatterns = useMemo(() => {
    console.log('pickedDataViewPatterns');
    if (newSelectedDataViewId !== null) {
      if (mapOfDataViewsToPatterns.has(newSelectedDataViewId)) {
        return mapOfDataViewsToPatterns.get(newSelectedDataViewId) ?? [];
      } else {
        return [];
      }
    } else {
      return [];
    }
  }, [newSelectedDataViewId, mapOfDataViewsToPatterns]);

  const pickedDataViewToOptions = usePatternListToOptions(pickedDataViewPatterns);

  const setIndexPatternsByDataView = useCallback(
    async (id: string, isAlerts?: boolean) => {
      console.log('setIndexPatternsByDataView');
      if (
        kibanaDataViews.some((kdv) => kdv.id === id && kdv.indexFields.length === 0) &&
        loadingIndexPatterns === false
      ) {
        try {
          setLoadingIndexPatterns(true);
          // setSelectedOptions([]);
          setNewSelectedDataViewId(id);
          // TODO We will need to figure out how to pass an abortController, but as right now this hook is
          // constantly getting destroy and re-init
          abortCtrl.current = new AbortController();
          const pickedDataViewData = await getSourcererDataview(id, abortCtrl.current.signal);
          dispatch(
            sourcererActions.updateSourcererDataViews({
              dataView: pickedDataViewData,
            })
          );
          setFetchedView(pickedDataViewData);
        } catch (err) {
          // Nothing to do
          console.log('caught');
        }
        // setSelectedOptions(isOnlyDetectionAlerts ? alertsOptions : pickedDataViewToOptions);
        setLoadingIndexPatterns(false);
      } else {
        // setSelectedOptions(getDefaultSelectedOptionsByDataView);
        setFetchedView(null);
      }
    },
    [
      // alertsOptions,
      dispatch,
      // getDefaultSelectedOptionsByDataView,
      // isOnlyDetectionAlerts,
      kibanaDataViews,
      // pickedDataViewToOptions,
      loadingIndexPatterns,
    ]
  );

  const dataViewSelectOptions = useDataViewSelectOptions({
    dataViewId,
    defaultDataViewId,
    isModified: isModified === 'modified',
    isOnlyDetectionAlerts,
    kibanaDataViews,
  });

  // const dataViewSelectOptions = useMemo(() => {
  //   console.log('dataViewSelectOptions');
  //   return dataViewId != null
  //     ? getDataViewSelectOptions({
  //         dataViewId,
  //         defaultDataViewId,
  //         isModified: isModified === 'modified',
  //         isOnlyDetectionAlerts,
  //         kibanaDataViews,
  //       })
  //     : [];
  // }, [dataViewId, defaultDataViewId, isModified, isOnlyDetectionAlerts, kibanaDataViews]);

  const selectedOptions = useMemo(() => {
    if (loadingIndexPatterns) {
      return [];
    } else if (isOnlyDetectionAlerts) {
      return alertsOptions;
    } else if (fetchedView) {
      console.log({fetchedView});
      return selectedPatternOptions;
    } else {
      return selectedPatternOptions;
    }
  }, [
    alertsOptions,
    selectedPatternOptions,
    isOnlyDetectionAlerts,
    loadingIndexPatterns,
    fetchedView,
  ]);
  useEffect(() => {
    return () => {
      console.log('later nerd');
      abortCtrl.current.abort();
    };
  });

  const handleOutsideClick = useCallback(() => {
    console.log('handleOutsideClick');
    // setSelectedOptions(selectedPatternOptions);
  }, [selectedPatternOptions]);
  console.log({
    allOptions,
    dataViewSelectOptions,
    loadingIndexPatterns,
    handleOutsideClick,
    isModified,
    onChangeCombo,
    selectedOptions,
    setIndexPatternsByDataView,
  });
  return useMemo(() => {
    return {
      allOptions,
      dataViewSelectOptions,
      loadingIndexPatterns,
      handleOutsideClick,
      isModified,
      onChangeCombo: () => console.log('lol2'),
      selectedOptions,
      setIndexPatternsByDataView,
    };
  }, [
    allOptions,
    dataViewSelectOptions,
    handleOutsideClick,
    isModified,
    loadingIndexPatterns,
    selectedOptions,
    setIndexPatternsByDataView,
  ]);
};

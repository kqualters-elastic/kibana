/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  EuiComboBox,
  EuiForm,
  EuiOutsideClickDetector,
  EuiPopover,
  EuiPopoverTitle,
  EuiSpacer,
  EuiSuperSelect,
} from '@elastic/eui';
import type { EuiComboBoxOptionOption, EuiSuperSelectOption } from '@elastic/eui';
import type { ChangeEventHandler } from 'react';
import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useDispatch } from 'react-redux';

import * as i18n from './translations';
import { sourcererModel } from '../../store/sourcerer';
import { sourcererActions, sourcererSelectors } from '../../store/sourcerer';
import {
  stimelineScope,
  sdefaultScope,
  sdetectionsScope,
  stimelineDataView,
  sdefaultDataView,
  sdetectionsDataView,
  sin,
  kv,
} from '../../store/sourcerer/selectors';
import { useDeepEqualSelector } from '../../hooks/use_selector';
import type { SourcererUrlState } from '../../store/sourcerer/model';
import { getScopePatternListSelection } from '../../store/sourcerer/helpers';
import { SourcererScopeName } from '../../store/sourcerer/model';
import { sortWithExcludesAtEnd } from '../../../../common/utils/sourcerer';
import {
  FormRow,
  PopoverContent,
  StyledButton,
  StyledFormRow,
  useDataViewSelectOptions,
  getPatternListWithoutSignals,
} from './helpers';
import { TemporarySourcerer } from './temporary';
import { useSourcererDataView } from '../../containers/sourcerer';
import { useUpdateDataView } from './use_update_data_view';
import { Trigger } from './trigger';
import { AlertsCheckbox, SaveButtons, SourcererCallout } from './sub_components';
import { useSignalHelpers } from '../../containers/sourcerer/use_signal_helpers';
import { useUpdateUrlParam } from '../../utils/global_query_string';
import { URL_PARAM_KEY } from '../../hooks/use_url_state';
import { getSourcererDataView } from '../../containers/sourcerer/get_sourcerer_data_view';
import { useKibana } from '../../lib/kibana';

export interface SourcererComponentProps {
  scope: sourcererModel.SourcererScopeName;
}

interface UsePickIndexPatternsProps {
  isOnlyDetectionAlerts: boolean;
  scopeId: sourcererModel.SourcererScopeName;
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

const patternListToOptions = (patternList: string[], selectablePatterns?: string[]) => {
  return sortWithExcludesAtEnd(patternList).map((s) => ({
    label: s,
    value: s,
    ...(selectablePatterns != null ? { disabled: !selectablePatterns.includes(s) } : {}),
  }));
};

export const usePickIndexPatterns = ({
  isOnlyDetectionAlerts,
  scopeId,
}: UsePickIndexPatternsProps): UsePickIndexPatterns => {
  const dispatch = useDispatch();
  const signalIndexName = useDeepEqualSelector((state) => sin(state));
  const detectionsSourcerer = useDeepEqualSelector((state) => {
    return sdetectionsScope(state);
  });

  const timelineSourcerer = useDeepEqualSelector((state) => {
    return stimelineScope(state);
  });
  const defaultSourcerer = useDeepEqualSelector((state) => {
    return sdefaultScope(state);
  });

  const { selectedPatterns, missingPatterns, selectedDataViewId } = useMemo(() => {
    if (scopeId === SourcererScopeName.detections) {
      return detectionsSourcerer;
    } else if (scopeId === SourcererScopeName.timeline) {
      return timelineSourcerer;
    } else {
      return defaultSourcerer;
    }
  }, [detectionsSourcerer, defaultSourcerer, scopeId, timelineSourcerer]);
  const dataViewId = selectedDataViewId;
  const timelineDataView = useDeepEqualSelector((state) => {
    return stimelineDataView(state);
  });
  const defaultDataView = useDeepEqualSelector((state) => {
    return sdefaultDataView(state);
  });

  const detectionsDataView = useDeepEqualSelector((state) => {
    return sdetectionsDataView(state);
  });
  const kibanaDataViews = useDeepEqualSelector((state) => {
    return kv(state);
  });
  const {
    data: { dataViews },
  } = useKibana().services;
  const isHookAlive = useRef(true);
  const [loadingIndexPatterns, setLoadingIndexPatterns] = useState(false);
  const alertsOptions = useMemo(
    () => (signalIndexName ? patternListToOptions([signalIndexName]) : []),
    [signalIndexName]
  );
  const [selectedOptions, setSelectedOptions] = useState<Array<EuiComboBoxOptionOption<string>>>(
    isOnlyDetectionAlerts ? alertsOptions : patternListToOptions(selectedPatterns)
  );
  // const [isModified, setIsModified] = useState<ModifiedTypes>(
  //   dataViewId == null ? 'deprecated' : missingPatterns.length > 0 ? 'missingPatterns' : ''
  // );

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
    const theDataView = kibanaDataViews.find((dataView) => dataView.id === dataViewId);

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
  }, [dataViewId, isOnlyDetectionAlerts, kibanaDataViews, scopeId, signalIndexName]);

  const allOptions = useMemo(
    () => patternListToOptions(allPatterns, selectablePatterns),
    [allPatterns, selectablePatterns]
  );

  const getDefaultSelectedOptionsByDataView = useCallback(
    (id: string, isAlerts: boolean = false): Array<EuiComboBoxOptionOption<string>> =>
      scopeId === SourcererScopeName.detections || isAlerts
        ? alertsOptions
        : patternListToOptions(
            getScopePatternListSelection(
              kibanaDataViews.find((dataView) => dataView.id === id),
              scopeId,
              signalIndexName,
              id === defaultDataView?.id
            )
          ),
    [alertsOptions, kibanaDataViews, scopeId, signalIndexName, defaultDataView?.id]
  );

  const defaultSelectedPatternsAsOptions = useMemo(
    () => (dataViewId != null ? getDefaultSelectedOptionsByDataView(dataViewId) : []),
    [dataViewId, getDefaultSelectedOptionsByDataView]
  );

  // const onSetIsModified = useCallback(
  //   (patterns: string[], id: string | null) => {
  //     if (id == null) {
  //       return setIsModified('deprecated');
  //     }
  //     if (missingPatterns.length > 0) {
  //       return setIsModified('missingPatterns');
  //     }
  //     if (isOnlyDetectionAlerts) {
  //       return setIsModified('alerts');
  //     }
  //     const isPatternsModified =
  //       defaultSelectedPatternsAsOptions.length !== patterns.length ||
  //       !defaultSelectedPatternsAsOptions.every((option) =>
  //         patterns.find((pattern) => option.value === pattern)
  //       );
  //     return setIsModified(isPatternsModified ? 'modified' : '');
  //   },
  //   [defaultSelectedPatternsAsOptions, isOnlyDetectionAlerts, missingPatterns.length]
  // );
  // useEffect(() => {
  //   onSetIsModified(selectedPatterns, selectedDataViewId);
  // }, [
  //   isOnlyDetectionAlerts,
  //   selectedDataViewId,
  //   missingPatterns,
  //   scopeId,
  //   selectedPatterns,
  //   onSetIsModified,
  // ]);

  const isModified: ModifiedTypes = useMemo(() => {
    if (selectedDataViewId == null) {
      return 'deprecated';
    }
    if (missingPatterns.length > 0) {
      return 'missingPatterns';
    }
    if (isOnlyDetectionAlerts) {
      return 'alerts';
    }
    const isPatternsModified =
      defaultSelectedPatternsAsOptions.length !== selectedPatterns.length ||
      !defaultSelectedPatternsAsOptions.every((option) =>
        selectedPatterns.find((pattern) => option.value === pattern)
      );
    if (isPatternsModified) {
      return 'modified';
    }
    return '';
  }, [
    defaultSelectedPatternsAsOptions,
    selectedPatterns,
    missingPatterns.length,
    isOnlyDetectionAlerts,
    selectedDataViewId,
  ]);

  useEffect(() => {
    setSelectedOptions(
      scopeId === SourcererScopeName.detections
        ? alertsOptions
        : patternListToOptions(selectedPatterns)
    );
  }, [selectedPatterns, scopeId, alertsOptions]);
  // when scope updates, check modified to set/remove alerts label

  const onChangeCombo = useCallback((newSelectedOptions) => {
    setSelectedOptions(newSelectedOptions);
  }, []);

  const setIndexPatternsByDataView = useCallback(
    async (newSelectedDataViewId: string, isAlerts?: boolean) => {
      if (
        kibanaDataViews.some(
          (kdv) => kdv.id === newSelectedDataViewId && kdv.indexFields.length === 0
        )
      ) {
        try {
          setLoadingIndexPatterns(true);
          setSelectedOptions([]);
          const dataView = await getSourcererDataView(newSelectedDataViewId, dataViews);

          if (isHookAlive.current) {
            dispatch(sourcererActions.setDataView(dataView));
            setSelectedOptions(
              isOnlyDetectionAlerts ? alertsOptions : patternListToOptions(dataView.patternList)
            );
          }
        } catch (err) {
          // Nothing to do
        }
        setLoadingIndexPatterns(false);
      } else {
        setSelectedOptions(getDefaultSelectedOptionsByDataView(newSelectedDataViewId, isAlerts));
      }
    },
    [
      alertsOptions,
      dispatch,
      getDefaultSelectedOptionsByDataView,
      isOnlyDetectionAlerts,
      kibanaDataViews,
      dataViews,
    ]
  );

  // const dataViewSelectOptions = useMemo(
  //   () =>
  //     dataViewId != null
  //       ? getDataViewSelectOptions({
  //           dataViewId,
  //           defaultDataViewId: defaultDataView?.id ?? '',
  //           isModified: isModified === 'modified',
  //           isOnlyDetectionAlerts,
  //           kibanaDataViews,
  //         })
  //       : [],
  //   [dataViewId, defaultDataView?.id, isModified, isOnlyDetectionAlerts, kibanaDataViews]
  // );

  const dataViewSelectOptions = useDataViewSelectOptions({
    dataViewId,
    defaultDataViewId: defaultDataView?.id ?? '',
    isModified: isModified === 'modified',
    isOnlyDetectionAlerts,
    kibanaDataViews,
  });
  useEffect(() => {
    isHookAlive.current = true;
    return () => {
      isHookAlive.current = false;
    };
  }, []);

  const handleOutsideClick = useCallback(() => {
    setSelectedOptions(patternListToOptions(selectedPatterns));
  }, [selectedPatterns]);

  return {
    allOptions,
    dataViewSelectOptions,
    loadingIndexPatterns,
    handleOutsideClick,
    isModified,
    onChangeCombo,
    selectedOptions,
    setIndexPatternsByDataView,
  };
};

export const Sourcerer = React.memo<SourcererComponentProps>(({ scope: scopeId }) => {
  const dispatch = useDispatch();
  const isDetectionsSourcerer = scopeId === SourcererScopeName.detections;
  const isTimelineSourcerer = scopeId === SourcererScopeName.timeline;
  const isDefaultSourcerer = scopeId === SourcererScopeName.default;
  const updateUrlParam = useUpdateUrlParam<SourcererUrlState>(URL_PARAM_KEY.sourcerer);
  const signalIndexName = useDeepEqualSelector((state) => sin(state));
  const detectionsSourcerer = useDeepEqualSelector((state) => {
    return sdetectionsScope(state);
  });

  const timelineSourcerer = useDeepEqualSelector((state) => {
    return stimelineScope(state);
  });
  const defaultSourcerer = useDeepEqualSelector((state) => {
    return sdefaultScope(state);
  });

  const {
    selectedPatterns,
    missingPatterns: sourcererMissingPatterns,
    selectedDataViewId,
  } = useMemo(() => {
    if (scopeId === SourcererScopeName.detections) {
      return detectionsSourcerer;
    } else if (scopeId === SourcererScopeName.timeline) {
      return timelineSourcerer;
    } else {
      return defaultSourcerer;
    }
  }, [detectionsSourcerer, defaultSourcerer, scopeId, timelineSourcerer]);

  const timelineDataView = useDeepEqualSelector((state) => {
    return stimelineDataView(state);
  });
  const defaultDataView = useDeepEqualSelector((state) => {
    return sdefaultDataView(state);
  });

  const detectionsDataView = useDeepEqualSelector((state) => {
    return sdetectionsDataView(state);
  });
  const kibanaDataViews = useDeepEqualSelector((state) => {
    return kv(state);
  });

  const { pollForSignalIndex } = useSignalHelpers();

  useEffect(() => {
    if (pollForSignalIndex != null && (isTimelineSourcerer || isDetectionsSourcerer)) {
      pollForSignalIndex();
    }
  }, [isDetectionsSourcerer, isTimelineSourcerer, pollForSignalIndex]);

  const { activePatterns, indicesExist, loading } = useSourcererDataView(scopeId);
  const [missingPatterns, setMissingPatterns] = useState<string[]>(
    activePatterns && activePatterns.length > 0
      ? sourcererMissingPatterns.filter((p) => activePatterns.includes(p))
      : []
  );
  useEffect(() => {
    if (activePatterns && activePatterns.length > 0) {
      setMissingPatterns(sourcererMissingPatterns.filter((p) => activePatterns.includes(p)));
    }
  }, [activePatterns, sourcererMissingPatterns]);

  const [isOnlyDetectionAlertsChecked, setIsOnlyDetectionAlertsChecked] = useState(
    isTimelineSourcerer && selectedPatterns.join() === signalIndexName
  );

  const onUpdateDetectionAlertsChecked = useCallback(() => {
    setIsOnlyDetectionAlertsChecked(
      isTimelineSourcerer && selectedPatterns.join() === signalIndexName
    );
  }, [isTimelineSourcerer, selectedPatterns, signalIndexName]);

  useEffect(() => {
    onUpdateDetectionAlertsChecked();
  }, [selectedPatterns, onUpdateDetectionAlertsChecked]);

  const isOnlyDetectionAlerts =
    isDetectionsSourcerer || (isTimelineSourcerer && isOnlyDetectionAlertsChecked);

  const [isPopoverOpen, setPopoverIsOpen] = useState(false);

  const {
    allOptions,
    dataViewSelectOptions,
    loadingIndexPatterns,
    isModified,
    handleOutsideClick,
    onChangeCombo: onChangeIndexPatterns,
    selectedOptions,
    setIndexPatternsByDataView,
  } = usePickIndexPatterns({
    isOnlyDetectionAlerts,
    scopeId,
  });

  const setDataViewId = useCallback(
    (id) => {
      dispatch(
        sourcererActions.setSelectedDataView({
          id: scopeId,
          selectedDataViewId: id,
          selectedPatterns: selectedOptions.map((so) => so.label),
        })
      );
    },
    [dispatch, scopeId, selectedOptions]
  );

  const onCheckboxChanged: ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      setIsOnlyDetectionAlertsChecked(e.target.checked);
      setDataViewId(defaultDataView?.id);
      setIndexPatternsByDataView(defaultDataView?.id, e.target.checked);
    },
    [defaultDataView?.id, setIndexPatternsByDataView, setDataViewId]
  );

  const [expandAdvancedOptions, setExpandAdvancedOptions] = useState(false);
  const [isShowingUpdateModal, setIsShowingUpdateModal] = useState(false);

  const setPopoverIsOpenCb = useCallback(() => {
    setPopoverIsOpen((prevState) => !prevState);
    setExpandAdvancedOptions(false); // we always want setExpandAdvancedOptions collapsed by default when popover opened
  }, []);
  const dispatchChangeDataView = useCallback(
    (
      newSelectedDataView: string,
      newSelectedPatterns: string[],
      shouldValidateSelectedPatterns?: boolean
    ) => {
      dispatch(
        sourcererActions.setSelectedDataView({
          id: scopeId,
          selectedDataViewId: newSelectedDataView,
          selectedPatterns: newSelectedPatterns,
          shouldValidateSelectedPatterns,
        })
      );

      if (isDefaultSourcerer) {
        updateUrlParam({
          [SourcererScopeName.default]: {
            id: newSelectedDataView,
            selectedPatterns: newSelectedPatterns,
          },
        });
      }
    },
    [dispatch, scopeId, isDefaultSourcerer, updateUrlParam]
  );

  const onChangeDataView = useCallback(
    (newSelectedOption) => {
      debugger;
      setDataViewId(newSelectedOption);
      setIndexPatternsByDataView(newSelectedOption);
    },
    [setIndexPatternsByDataView, setDataViewId]
  );

  const resetDataSources = useCallback(() => {
    setDataViewId(defaultDataView?.id);
    setIndexPatternsByDataView(defaultDataView?.id);
    setIsOnlyDetectionAlertsChecked(false);
    setMissingPatterns([]);
  }, [defaultDataView?.id, setIndexPatternsByDataView, setDataViewId]);

  const handleSaveIndices = useCallback(() => {
    const patterns = selectedOptions.map((so) => so.label);
    if (selectedDataViewId != null) {
      dispatchChangeDataView(selectedDataViewId, patterns);
    }
    setPopoverIsOpen(false);
  }, [dispatchChangeDataView, selectedDataViewId, selectedOptions]);

  const handleClosePopOver = useCallback(() => {
    setPopoverIsOpen(false);
    setExpandAdvancedOptions(false);
  }, []);

  // deprecated timeline index pattern handlers
  const onContinueUpdateDeprecated = useCallback(() => {
    setIsShowingUpdateModal(false);
    const patterns = selectedPatterns.filter((pattern) =>
      defaultDataView?.patternList.includes(pattern)
    );
    dispatchChangeDataView(defaultDataView?.id, patterns);
    setPopoverIsOpen(false);
  }, [defaultDataView?.id, defaultDataView?.patternList, dispatchChangeDataView, selectedPatterns]);

  const onUpdateDeprecated = useCallback(() => {
    // are all the patterns in the default?
    if (missingPatterns.length === 0) {
      onContinueUpdateDeprecated();
    } else {
      // open modal
      setIsShowingUpdateModal(true);
    }
  }, [missingPatterns, onContinueUpdateDeprecated]);

  const [isTriggerDisabled, setIsTriggerDisabled] = useState(false);

  const onOpenAndReset = useCallback(() => {
    setPopoverIsOpen(true);
    resetDataSources();
  }, [resetDataSources]);

  const updateDataView = useUpdateDataView(onOpenAndReset);
  const onUpdateDataView = useCallback(async () => {
    const isUiSettingsSuccess = await updateDataView(missingPatterns);
    setIsShowingUpdateModal(false);
    setPopoverIsOpen(false);

    if (isUiSettingsSuccess) {
      dispatchChangeDataView(
        defaultDataView?.id,
        // to be at this stage, activePatterns is defined, the ?? selectedPatterns is to make TS happy
        activePatterns ?? selectedPatterns,
        false
      );
      setIsTriggerDisabled(true);
    }
  }, [
    activePatterns,
    defaultDataView?.id,
    missingPatterns,
    dispatchChangeDataView,
    selectedPatterns,
    updateDataView,
  ]);

  const onOutsideClick = useCallback(() => {
    setDataViewId(selectedDataViewId);
    setMissingPatterns(sourcererMissingPatterns);
    onUpdateDetectionAlertsChecked();
    handleOutsideClick();
  }, [
    handleOutsideClick,
    onUpdateDetectionAlertsChecked,
    selectedDataViewId,
    sourcererMissingPatterns,
    setDataViewId,
  ]);

  const onExpandAdvancedOptionsClicked = useCallback(() => {
    setExpandAdvancedOptions((prevState) => !prevState);
  }, []);

  const renderOption = useCallback(
    ({ value }) => <span data-test-subj="sourcerer-combo-option">{value}</span>,
    []
  );

  // always show sourcerer in timeline
  return indicesExist || scopeId === SourcererScopeName.timeline ? (
    <EuiPopover
      panelClassName="sourcererPopoverPanel"
      button={
        <Trigger
          activePatterns={activePatterns}
          disabled={isTriggerDisabled}
          isModified={isModified}
          isOnlyDetectionAlerts={isOnlyDetectionAlerts}
          isPopoverOpen={isPopoverOpen}
          isTimelineSourcerer={isTimelineSourcerer}
          loading={loading}
          onClick={setPopoverIsOpenCb}
          selectedPatterns={selectedPatterns}
          signalIndexName={signalIndexName}
        />
      }
      closePopover={handleClosePopOver}
      data-test-subj={isTimelineSourcerer ? 'timeline-sourcerer-popover' : 'sourcerer-popover'}
      display="block"
      isOpen={isPopoverOpen}
      ownFocus
      repositionOnScroll
    >
      <EuiOutsideClickDetector onOutsideClick={onOutsideClick}>
        <PopoverContent>
          <EuiPopoverTitle data-test-subj="sourcerer-title">
            <>{i18n.SELECT_DATA_VIEW}</>
          </EuiPopoverTitle>
          <SourcererCallout
            isOnlyDetectionAlerts={isOnlyDetectionAlerts}
            title={isTimelineSourcerer ? i18n.CALL_OUT_TIMELINE_TITLE : i18n.CALL_OUT_TITLE}
          />
          <EuiSpacer size="s" />
          {(selectedDataViewId === null && isModified === 'deprecated') ||
          isModified === 'missingPatterns' ? (
            <TemporarySourcerer
              activePatterns={activePatterns}
              indicesExist={indicesExist}
              isModified={isModified}
              isShowingUpdateModal={isShowingUpdateModal}
              missingPatterns={missingPatterns}
              onContinueWithoutUpdate={onContinueUpdateDeprecated}
              onDismiss={setPopoverIsOpenCb}
              onDismissModal={() => setIsShowingUpdateModal(false)}
              onReset={resetDataSources}
              onUpdateStepOne={isModified === 'deprecated' ? onUpdateDeprecated : onUpdateDataView}
              onUpdateStepTwo={onUpdateDataView}
              selectedPatterns={selectedPatterns}
            />
          ) : (
            <EuiForm component="form">
              <>
                <AlertsCheckbox
                  isShow={isTimelineSourcerer}
                  checked={isOnlyDetectionAlertsChecked}
                  onChange={onCheckboxChanged}
                />
                {selectedDataViewId && (
                  <StyledFormRow label={i18n.INDEX_PATTERNS_CHOOSE_DATA_VIEW_LABEL}>
                    <EuiSuperSelect
                      data-test-subj="sourcerer-select"
                      isLoading={loadingIndexPatterns}
                      disabled={isOnlyDetectionAlerts}
                      fullWidth
                      onChange={onChangeDataView}
                      options={dataViewSelectOptions}
                      placeholder={i18n.INDEX_PATTERNS_CHOOSE_DATA_VIEW_LABEL}
                      valueOfSelected={selectedDataViewId}
                    />
                  </StyledFormRow>
                )}

                <EuiSpacer size="m" />
                <StyledButton
                  color="text"
                  data-test-subj="sourcerer-advanced-options-toggle"
                  iconType={expandAdvancedOptions ? 'arrowDown' : 'arrowRight'}
                  onClick={onExpandAdvancedOptionsClicked}
                >
                  {i18n.INDEX_PATTERNS_ADVANCED_OPTIONS_TITLE}
                </StyledButton>
                {expandAdvancedOptions && <EuiSpacer size="m" />}
                <FormRow
                  isDisabled={loadingIndexPatterns}
                  $expandAdvancedOptions={expandAdvancedOptions}
                  helpText={isOnlyDetectionAlerts ? undefined : i18n.INDEX_PATTERNS_DESCRIPTIONS}
                  label={i18n.INDEX_PATTERNS_LABEL}
                >
                  <EuiComboBox
                    data-test-subj="sourcerer-combo-box"
                    fullWidth
                    isDisabled={isOnlyDetectionAlerts || loadingIndexPatterns}
                    onChange={onChangeIndexPatterns}
                    options={allOptions}
                    placeholder={i18n.PICK_INDEX_PATTERNS}
                    renderOption={renderOption}
                    selectedOptions={selectedOptions}
                  />
                </FormRow>

                <SaveButtons
                  disableSave={selectedOptions.length === 0}
                  isShow={!isDetectionsSourcerer}
                  onReset={resetDataSources}
                  onSave={handleSaveIndices}
                />
              </>
              <EuiSpacer size="s" />
            </EuiForm>
          )}
        </PopoverContent>
      </EuiOutsideClickDetector>
    </EuiPopover>
  ) : null;
});
Sourcerer.displayName = 'Sourcerer';

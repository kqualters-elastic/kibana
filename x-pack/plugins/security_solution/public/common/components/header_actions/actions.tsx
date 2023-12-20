/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useCallback, useContext, useMemo, useRef, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { EuiButtonIcon, EuiCheckbox, EuiLoadingSpinner, EuiToolTip } from '@elastic/eui';
import styled from 'styled-components';

import { TimelineTabs, TableId } from '@kbn/securitysolution-data-table';
import { NOTES_BUTTON_CLASS_NAME } from '../../../timelines/components/timeline/properties/helpers';
import type { NotesMap } from '../../../timelines/components/timeline/unified_components/render_custom_body';
import { TimelineDataTableContext } from '../../../timelines/components/timeline/unified_components/render_custom_body';
import {
  eventHasNotes,
  getEventType,
  getPinOnClick,
  isEvenEqlSequence,
  isEventBuildingBlockType,
} from '../../../timelines/components/timeline/body/helpers';
import { getScopedActions, isTimelineScope } from '../../../helpers';
import { useIsInvestigateInResolverActionEnabled } from '../../../detections/components/alerts_table/timeline_actions/investigate_in_resolver';
import { timelineActions, timelineSelectors } from '../../../timelines/store';
import type { ActionProps, OnPinEvent } from '../../../../common/types';
import { TimelineId } from '../../../../common/types';
import { AddEventNoteAction } from './add_note_icon_item';
import { PinEventAction } from './pin_event_action';
import { useShallowEqualSelector } from '../../hooks/use_selector';
import { timelineDefaults } from '../../../timelines/store/defaults';
import { useStartTransaction } from '../../lib/apm/use_start_transaction';
import { useLicense } from '../../hooks/use_license';
import { useGlobalFullScreen, useTimelineFullScreen } from '../../containers/use_full_screen';
import { ALERTS_ACTIONS } from '../../lib/apm/user_actions';
import { setActiveTabTimeline } from '../../../timelines/store/actions';
import { EventsTdContent } from '../../../timelines/components/timeline/styles';
import { AlertContextMenu } from '../../../detections/components/alerts_table/timeline_actions/alert_context_menu';
import { InvestigateInTimelineAction } from '../../../detections/components/alerts_table/timeline_actions/investigate_in_timeline_action';
import * as i18n from './translations';
import { useTourContext } from '../guided_onboarding_tour';
import { AlertsCasesTourSteps, SecurityStepId } from '../guided_onboarding_tour/tour_config';
import { isDetectionsAlertsTable } from '../top_n/helpers';
import { GuidedOnboardingTourStep } from '../guided_onboarding_tour/tour_step';
import { DEFAULT_ACTION_BUTTON_WIDTH, isAlert } from './helpers';

const ActionsContainer = styled.div.attrs(
  ({ className = '', $ariaRowindex }: { className?: string; $ariaRowindex: number }) => ({
    'aria-rowindex': `${$ariaRowindex}`,
    className: `timeline__actionsGroup ${className}`,
  })
)<{
  className?: string;
}>`
  align-items: center;
  display: flex;
  height: 25px;
`;

const ActionsComponent: React.FC<ActionProps> = ({
  ariaRowindex,
  checked,
  columnValues,
  ecsData,
  eventId,
  eventIdToNoteIds,
  expandedDoc,
  setCellProps,
  isEventPinned = false,
  isEventViewer = false,
  loadingEventIds,
  onEventDetailsPanelOpened,
  onRowSelected,
  onRuleChange,
  showCheckboxes,
  showNotes,
  timelineId,
  toggleShowNotes,
  refetch,
  setEventsLoading,
  isUnifiedDataTable = false,
}) => {
  const dispatch = useDispatch();
  const { notesMap, setNotesMap } = useContext(TimelineDataTableContext);
  const trGroupRef = useRef<HTMLDivElement | null>(null);

  const emptyNotes: string[] = [];
  const getTimeline = useMemo(() => timelineSelectors.getTimelineByIdSelector(), []);
  const timelineType = useShallowEqualSelector(
    (state) =>
      (isTimelineScope(timelineId) ? getTimeline(state, timelineId) : timelineDefaults).timelineType
  );
  const { startTransaction } = useStartTransaction();

  const isEnterprisePlus = useLicense().isEnterprise();

  const onPinEvent: OnPinEvent = useCallback(
    (evtId) => dispatch(timelineActions.pinEvent({ id: timelineId, eventId: evtId })),
    [dispatch, timelineId]
  );

  const onUnPinEvent: OnPinEvent = useCallback(
    (evtId) => dispatch(timelineActions.unPinEvent({ id: timelineId, eventId: evtId })),
    [dispatch, timelineId]
  );

  const handleSelectEvent = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) =>
      onRowSelected({
        eventIds: [eventId],
        isSelected: event.currentTarget.checked,
      }),
    [eventId, onRowSelected]
  );

  useEffect(() => {
    if (expandedDoc && expandedDoc.id === eventId && setCellProps) {
      setCellProps({
        className: 'dscDocsGrid__cell--expanded',
      });
    } else if (setCellProps) {
      setCellProps({ style: undefined });
    }
  }, [eventId, expandedDoc, setCellProps]);

  const toggleShowNotesEvent = useCallback(() => {
    setNotesMap((prevShowNotes: NotesMap) => {
      const row = notesMap[eventId];
      if (row?.isAddingNote) return notesMap; // If we're already adding a note, no need to update

      if (prevShowNotes[eventId]) {
        // notes are closing, so focus the notes button on the next tick, after escaping the EuiFocusTrap
        setTimeout(() => {
          const notesButtonElement = trGroupRef.current?.querySelector<HTMLButtonElement>(
            `.${NOTES_BUTTON_CLASS_NAME}`
          );
          notesButtonElement?.focus();
        }, 0);
      }
      return {
        ...prevShowNotes,
        [eventId]: { ...row, isAddingNote: true },
      };
    });
  }, [eventId, notesMap, setNotesMap]);

  const handlePinClicked = useCallback(
    () =>
      getPinOnClick({
        allowUnpinning: eventIdToNoteIds ? !eventHasNotes(eventIdToNoteIds[eventId]) : true,
        eventId,
        onPinEvent,
        onUnPinEvent,
        isEventPinned,
      }),
    [eventIdToNoteIds, eventId, isEventPinned, onPinEvent, onUnPinEvent]
  );
  const eventType = getEventType(ecsData);

  const isContextMenuDisabled = useMemo(() => {
    return (
      eventType !== 'signal' &&
      !(ecsData.event?.kind?.includes('event') && ecsData.agent?.type?.includes('endpoint'))
    );
  }, [ecsData, eventType]);

  const isDisabled = !useIsInvestigateInResolverActionEnabled(ecsData);
  const { setGlobalFullScreen } = useGlobalFullScreen();
  const { setTimelineFullScreen } = useTimelineFullScreen();
  const scopedActions = getScopedActions(timelineId);
  const handleClick = useCallback(() => {
    startTransaction({ name: ALERTS_ACTIONS.OPEN_ANALYZER });

    const dataGridIsFullScreen = document.querySelector('.euiDataGrid--fullScreen');
    if (scopedActions) {
      dispatch(scopedActions.updateGraphEventId({ id: timelineId, graphEventId: ecsData._id }));
    }
    if (timelineId === TimelineId.active) {
      if (dataGridIsFullScreen) {
        setTimelineFullScreen(true);
      }
      dispatch(setActiveTabTimeline({ id: timelineId, activeTab: TimelineTabs.graph }));
    } else {
      if (dataGridIsFullScreen) {
        setGlobalFullScreen(true);
      }
    }
  }, [
    startTransaction,
    scopedActions,
    timelineId,
    dispatch,
    ecsData._id,
    setTimelineFullScreen,
    setGlobalFullScreen,
  ]);

  const sessionViewConfig = useMemo(() => {
    const { process, _id, _index, timestamp, kibana } = ecsData;
    const sessionEntityId = process?.entry_leader?.entity_id?.[0];
    const sessionStartTime = process?.entry_leader?.start?.[0];
    const index = kibana?.alert?.ancestors?.index?.[0] || _index;

    if (index === undefined || sessionEntityId === undefined || sessionStartTime === undefined) {
      return null;
    }

    const jumpToEntityId = process?.entity_id?.[0];
    const investigatedAlertId = eventType === 'signal' || eventType === 'eql' ? _id : undefined;
    const jumpToCursor =
      (investigatedAlertId && ecsData.kibana?.alert.original_time?.[0]) || timestamp;

    return {
      index,
      sessionEntityId,
      sessionStartTime,
      jumpToEntityId,
      jumpToCursor,
      investigatedAlertId,
    };
  }, [ecsData, eventType]);

  const openSessionView = useCallback(() => {
    const dataGridIsFullScreen = document.querySelector('.euiDataGrid--fullScreen');
    startTransaction({ name: ALERTS_ACTIONS.OPEN_SESSION_VIEW });

    if (timelineId === TimelineId.active) {
      if (dataGridIsFullScreen) {
        setTimelineFullScreen(true);
      }
      if (sessionViewConfig !== null) {
        dispatch(setActiveTabTimeline({ id: timelineId, activeTab: TimelineTabs.session }));
      }
    } else {
      if (dataGridIsFullScreen) {
        setGlobalFullScreen(true);
      }
    }
    if (sessionViewConfig !== null) {
      if (scopedActions) {
        dispatch(scopedActions.updateSessionViewConfig({ id: timelineId, sessionViewConfig }));
      }
    }
  }, [
    startTransaction,
    timelineId,
    sessionViewConfig,
    setTimelineFullScreen,
    dispatch,
    setGlobalFullScreen,
    scopedActions,
  ]);

  const { activeStep, isTourShown, incrementStep } = useTourContext();

  const isTourAnchor = useMemo(
    () =>
      isTourShown(SecurityStepId.alertsCases) &&
      eventType === 'signal' &&
      isDetectionsAlertsTable(timelineId) &&
      ariaRowindex === 1,
    [isTourShown, ariaRowindex, eventType, timelineId]
  );

  const onExpandEvent = useCallback(() => {
    if (
      isTourAnchor &&
      activeStep === AlertsCasesTourSteps.expandEvent &&
      isTourShown(SecurityStepId.alertsCases)
    ) {
      incrementStep(SecurityStepId.alertsCases);
    }
    onEventDetailsPanelOpened();
  }, [activeStep, incrementStep, isTourAnchor, isTourShown, onEventDetailsPanelOpened]);

  const evetTypeClassName = useMemo(
    () =>
      eventType === 'raw'
        ? 'rawEvent'
        : eventType === 'eql'
        ? isEvenEqlSequence(ecsData)
          ? 'eqlSequence'
          : 'eqlNonSequence'
        : 'nonRawEvent',
    [ecsData, eventType]
  );
  const buildingBlockTypeClassName = useMemo(
    () => (isEventBuildingBlockType(ecsData) ? 'buildingBlockType' : ''),
    [ecsData]
  );

  return (
    <ActionsContainer className={`${evetTypeClassName} ${buildingBlockTypeClassName}`}>
      {!isUnifiedDataTable ? (
        <>
          {showCheckboxes && (
            <div key="select-event-container" data-test-subj="select-event-container">
              <EventsTdContent textAlign="center" width={DEFAULT_ACTION_BUTTON_WIDTH}>
                {loadingEventIds.includes(eventId) ? (
                  <EuiLoadingSpinner size="m" data-test-subj="event-loader" />
                ) : (
                  <EuiCheckbox
                    aria-label={i18n.CHECKBOX_FOR_ROW({ ariaRowindex, columnValues, checked })}
                    data-test-subj="select-event"
                    id={eventId}
                    checked={checked}
                    onChange={handleSelectEvent}
                  />
                )}
              </EventsTdContent>
            </div>
          )}
          <GuidedOnboardingTourStep
            isTourAnchor={isTourAnchor}
            onClick={onExpandEvent}
            step={AlertsCasesTourSteps.expandEvent}
            tourId={SecurityStepId.alertsCases}
          >
            <div key="expand-event">
              <EventsTdContent textAlign="center" width={DEFAULT_ACTION_BUTTON_WIDTH}>
                <EuiToolTip data-test-subj="expand-event-tool-tip" content={i18n.VIEW_DETAILS}>
                  <EuiButtonIcon
                    aria-label={i18n.VIEW_DETAILS_FOR_ROW({ ariaRowindex, columnValues })}
                    data-test-subj="expand-event"
                    iconType="expand"
                    onClick={onExpandEvent}
                    size="s"
                  />
                </EuiToolTip>
              </EventsTdContent>
            </div>
          </GuidedOnboardingTourStep>
        </>
      ) : null}
      <>
        {timelineId !== TimelineId.active && (
          <InvestigateInTimelineAction
            ariaLabel={i18n.SEND_ALERT_TO_TIMELINE_FOR_ROW({ ariaRowindex, columnValues })}
            key="investigate-in-timeline"
            ecsRowData={ecsData}
          />
        )}

        {!isEventViewer && (
          <>
            <AddEventNoteAction
              ariaLabel={i18n.ADD_NOTES_FOR_ROW({ ariaRowindex, columnValues })}
              key="add-event-note"
              showNotes={showNotes ?? false}
              toggleShowNotes={toggleShowNotesEvent}
              timelineType={timelineType}
            />
            <PinEventAction
              ariaLabel={i18n.PIN_EVENT_FOR_ROW({ ariaRowindex, columnValues, isEventPinned })}
              isAlert={isAlert(eventType)}
              key="pin-event"
              onPinClicked={handlePinClicked}
              noteIds={eventIdToNoteIds ? eventIdToNoteIds[eventId] || emptyNotes : emptyNotes}
              eventIsPinned={isEventPinned}
              timelineType={timelineType}
            />
          </>
        )}
        <AlertContextMenu
          ariaLabel={i18n.MORE_ACTIONS_FOR_ROW({ ariaRowindex, columnValues })}
          ariaRowindex={ariaRowindex}
          columnValues={columnValues}
          key="alert-context-menu"
          ecsRowData={ecsData}
          scopeId={timelineId}
          disabled={isContextMenuDisabled}
          onRuleChange={onRuleChange}
          refetch={refetch}
        />
        {isDisabled === false ? (
          <div>
            <EventsTdContent textAlign="center" width={DEFAULT_ACTION_BUTTON_WIDTH}>
              <EuiToolTip
                data-test-subj="view-in-analyzer-tool-tip"
                content={i18n.ACTION_INVESTIGATE_IN_RESOLVER}
              >
                <EuiButtonIcon
                  aria-label={i18n.ACTION_INVESTIGATE_IN_RESOLVER_FOR_ROW({
                    ariaRowindex,
                    columnValues,
                  })}
                  data-test-subj="view-in-analyzer"
                  iconType="analyzeEvent"
                  onClick={handleClick}
                  size="s"
                />
              </EuiToolTip>
            </EventsTdContent>
          </div>
        ) : null}
        {sessionViewConfig !== null &&
        (isEnterprisePlus || timelineId === TableId.kubernetesPageSessions) ? (
          <div>
            <EventsTdContent textAlign="center" width={DEFAULT_ACTION_BUTTON_WIDTH}>
              <EuiToolTip data-test-subj="expand-event-tool-tip" content={i18n.OPEN_SESSION_VIEW}>
                <EuiButtonIcon
                  aria-label={i18n.VIEW_DETAILS_FOR_ROW({ ariaRowindex, columnValues })}
                  data-test-subj="session-view-button"
                  iconType="sessionViewer"
                  onClick={openSessionView}
                  size="s"
                />
              </EuiToolTip>
            </EventsTdContent>
          </div>
        ) : null}
      </>
    </ActionsContainer>
  );
};

ActionsComponent.displayName = 'ActionsComponent';

export const Actions = React.memo(ActionsComponent);

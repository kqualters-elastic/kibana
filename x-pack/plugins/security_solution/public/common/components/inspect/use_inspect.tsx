/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { InputsModelId } from '../../store/inputs/constants';
import type { State } from '../../store';
import { inputsSelectors } from '../../store';
import { inputsActions } from '../../store/actions';

interface UseInspectModalProps {
  inputId?: InputsModelId.global | InputsModelId.timeline;
  inspectIndex?: number;
  isDisabled?: boolean;
  multiple?: boolean;
  onClick?: () => void;
  onCloseInspect?: () => void;
  queryId: string;
}

export const useInspect = ({
  inputId = InputsModelId.global,
  inspectIndex = 0,
  isDisabled,
  multiple = false, // If multiple = true we ignore the inspectIndex and pass all requests and responses to the inspect modal
  onClick,
  onCloseInspect,
  queryId,
}: UseInspectModalProps) => {
  const dispatch = useDispatch();

  const getGlobalQuery = useMemo(() => inputsSelectors.globalQueryByIdSelector(), []);
  const getTimelineQuery = useMemo(() => inputsSelectors.timelineQueryByIdSelector(), []);
  const globalQuery = useSelector((state: State) => getGlobalQuery(state, queryId));
  const timelineQuery = useSelector((state: State) => getTimelineQuery(state, queryId));
  const { loading, inspect, selectedInspectIndex, isInspected } = useMemo(() => {
    if (inputId === InputsModelId.global) {
      return globalQuery;
    } else {
      return timelineQuery;
    }
  }, [globalQuery, inputId, timelineQuery]);

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick();
    }
    dispatch(
      inputsActions.setInspectionParameter({
        id: queryId,
        inputId,
        isInspected: true,
        selectedInspectIndex: inspectIndex,
      })
    );
  }, [onClick, dispatch, queryId, inputId, inspectIndex]);

  const handleCloseModal = useCallback(() => {
    if (onCloseInspect != null) {
      onCloseInspect();
    }
    dispatch(
      inputsActions.setInspectionParameter({
        id: queryId,
        inputId,
        isInspected: false,
        selectedInspectIndex: inspectIndex,
      })
    );
  }, [onCloseInspect, dispatch, queryId, inputId, inspectIndex]);

  let request: string | null = null;
  let additionalRequests: string[] | null = null;
  if (inspect != null && inspect.dsl.length > 0) {
    if (multiple) {
      [request, ...additionalRequests] = inspect.dsl;
    } else {
      request = inspect.dsl[inspectIndex];
    }
  }

  let response: string | null = null;
  let additionalResponses: string[] | null = null;
  if (inspect != null && inspect.response.length > 0) {
    if (multiple) {
      [response, ...additionalResponses] = inspect.response;
    } else {
      response = inspect.response[inspectIndex];
    }
  }

  const isShowingModal = useMemo(
    () => !loading && selectedInspectIndex === inspectIndex && isInspected,
    [inspectIndex, isInspected, loading, selectedInspectIndex]
  );

  const isButtonDisabled = useMemo(
    () => loading || isDisabled || request == null || response == null || queryId == null,
    [isDisabled, loading, queryId, request, response]
  );

  return {
    additionalRequests,
    additionalResponses,
    handleClick,
    handleCloseModal,
    isButtonDisabled,
    isShowingModal,
    loading,
    request,
    response,
  };
};

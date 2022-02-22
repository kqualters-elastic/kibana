/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import React from 'react';
import { render, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HostName } from './host_name';
import { TestProviders } from '../../../../../common/mock';
import { TimelineId, TimelineTabs } from '../../../../../../common/types';
import { StatefulEventContext } from '../../../../../../../timelines/public';
import { timelineActions } from '../../../../store/timeline';
import { activeTimeline } from '../../../../containers/active_timeline_context';

jest.mock('react-redux', () => {
  const origin = jest.requireActual('react-redux');
  return {
    ...origin,
    useDispatch: jest.fn().mockReturnValue(jest.fn()),
  };
});

jest.mock('../../../../../common/lib/kibana/kibana_react', () => {
  return {
    useKibana: jest.fn().mockReturnValue({
      services: {
        application: {
          getUrlForApp: jest.fn(),
          navigateToApp: jest.fn(),
        },
      },
    }),
  };
});

jest.mock('../../../../../common/components/draggables', () => ({
  DefaultDraggable: () => <div data-test-subj="DefaultDraggable" />,
}));

jest.mock('../../../../store/timeline', () => {
  const original = jest.requireActual('../../../../store/timeline');
  return {
    ...original,
    timelineActions: {
      ...original.timelineActions,
      toggleDetailPanel: jest.fn(),
    },
  };
});

describe('HostName', () => {
  const props = {
    fieldName: 'host.name',
    contextId: 'test-context-id',
    eventId: 'test-event-id',
    isDraggable: false,
    value: 'Mock Host',
  };

  let toggleExpandedDetail: jest.SpyInstance;

  beforeAll(() => {
    toggleExpandedDetail = jest.spyOn(activeTimeline, 'toggleExpandedDetail');
  });

  afterEach(() => {
    toggleExpandedDetail.mockClear();
    cleanup();
  });
  test('should render host name', () => {
    const wrapper = render(
      <TestProviders>
        <HostName {...props} />
      </TestProviders>
    );

    expect(wrapper.find('[data-test-subj="host-details-button"]').last().text()).toEqual(
      props.value
    );
  });

  test('should render DefaultDraggable if isDraggable is true', () => {
    const testProps = {
      ...props,
      isDraggable: true,
    };
    const wrapper = render(
      <TestProviders>
        <HostName {...testProps} />
      </TestProviders>
    );

    expect(wrapper.find('[data-test-subj="DefaultDraggable"]').exists()).toEqual(true);
  });

  test('if not enableHostDetailsFlyout, should go to hostdetails page', async () => {
    const wrapper = render(
      <TestProviders>
        <HostName {...props} />
      </TestProviders>
    );

    const button = wrapper.getByTestId('host-details-button');
    userEvent.click(button);
    expect(timelineActions.toggleDetailPanel).not.toHaveBeenCalled();
  });

  test('if enableHostDetailsFlyout, should open HostDetailsSidePanel', async () => {
    const context = {
      enableHostDetailsFlyout: true,
      enableIpDetailsFlyout: true,
      timelineID: TimelineId.active,
      tabType: TimelineTabs.query,
    };
    const wrapper = render(
      <TestProviders>
        <StatefulEventContext.Provider value={context}>
          <HostName {...props} />
        </StatefulEventContext.Provider>
      </TestProviders>
    );

    const button = wrapper.getByTestId('host-details-button');
    userEvent.click(button);
    expect(timelineActions.toggleDetailPanel).toHaveBeenCalledWith({
      panelView: 'hostDetail',
      params: {
        hostName: props.value,
      },
      tabType: TimelineTabs.query,
      timelineId: TimelineId.active,
    });
  });

  test('if enableHostDetailsFlyout and timelineId equals to `timeline-1`, should call toggleExpandedDetail', async () => {
    const context = {
      enableHostDetailsFlyout: true,
      enableIpDetailsFlyout: true,
      timelineID: TimelineId.active,
      tabType: TimelineTabs.query,
    };
    const wrapper = render(
      <TestProviders>
        <StatefulEventContext.Provider value={context}>
          <HostName {...props} />
        </StatefulEventContext.Provider>
      </TestProviders>
    );

    const button = wrapper.getByTestId('host-details-button');
    userEvent.click(button);
    expect(timelineActions.toggleDetailPanel).toHaveBeenCalledWith({
      panelView: 'hostDetail',
      params: {
        hostName: props.value,
      },
      tabType: TimelineTabs.query,
    };
    const wrapper = render(
      <TestProviders>
        <StatefulEventContext.Provider value={context}>
          <HostName {...props} />
        </StatefulEventContext.Provider>
      </TestProviders>
    );

    wrapper.find('[data-test-subj="host-details-button"]').first().simulate('click');
    await waitFor(() => {
      expect(timelineActions.toggleDetailPanel).toHaveBeenCalledWith({
        panelView: 'hostDetail',
        params: {
          hostName: props.value,
        },
        tabType: context.tabType,
        timelineId: context.timelineID,
      });
      expect(toggleExpandedDetail).not.toHaveBeenCalled();
    });
  });
});

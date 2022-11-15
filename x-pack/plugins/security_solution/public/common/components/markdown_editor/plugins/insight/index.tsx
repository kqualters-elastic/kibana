/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { Plugin } from 'unified';
import React, { useContext } from 'react';
import type { RemarkTokenizer } from '@elastic/eui';
import { EuiSpacer, EuiCodeBlock, EuiLoadingSpinner, EuiIcon } from '@elastic/eui';
import type { EuiMarkdownEditorUiPluginEditorProps } from '@elastic/eui/src/components/markdown_editor/markdown_types';
import { useAppToasts } from '../../../../hooks/use_app_toasts';
import { useInsightQuery } from './use_insight_query';
import { useInsightDataProviders } from './use_insight_data_providers';
import { BasicAlertDataContext } from '../../../event_details/investigation_guide_view';
import { InvestigateInTimelineButton } from '../../../event_details/table/investigate_in_timeline_button';

interface InsightComponentProps {
  label?: string;
  description?: string;
  providers?: string;
}

export const parser: Plugin = function () {
  const Parser = this.Parser;
  const tokenizers = Parser.prototype.inlineTokenizers;
  const methods = Parser.prototype.inlineMethods;

  const tokenizeInsight: RemarkTokenizer = function (eat, value, silent) {
    const insightPrefix = '!{insight';
    if (value.startsWith(insightPrefix) === false) {
      return false;
    }

    const nextChar = value[insightPrefix.length];
    if (nextChar !== '{' && nextChar !== '}') return false;
    if (silent) {
      return true;
    }

    // is there a configuration?
    const hasConfiguration = nextChar === '{';

    let configuration: InsightComponentProps = {};
    if (hasConfiguration) {
      let configurationString = '';
      let match = '';

      let openObjects = 0;

      for (let i = insightPrefix.length; i < value.length; i++) {
        const char = value[i];
        if (char === '{') {
          openObjects++;
          configurationString += char;
        } else if (char === '}') {
          openObjects--;
          if (openObjects === -1) {
            break;
          }
          configurationString += char;
        } else {
          configurationString += char;
        }
      }

      match += configurationString;
      try {
        configuration = JSON.parse(configurationString);
        return eat(value)({
          type: 'insight',
          ...configuration,
          providers: JSON.stringify(configuration.providers),
        });
      } catch (e) {
        const now = eat.now();
        this.file.fail(`Unable to parse insight JSON configuration: ${e}`, {
          line: now.line,
          column: now.column + insightPrefix.length,
        });
      }
    }
    return false;
  };

  tokenizers.insight = tokenizeInsight;
  methods.splice(methods.indexOf('text'), 0, 'insight');
};

// receives the configuration from the parser and renders
const InsightComponent = ({ label, description, providers }: InsightComponentProps) => {
  const { addError } = useAppToasts();
  let parsedProviders = [];
  try {
    if (providers !== undefined) {
      parsedProviders = JSON.parse(providers);
    }
  } catch (err) {
    addError(err, { title: 'parse failure' });
  }
  const { data: alertData } = useContext(BasicAlertDataContext);
  const dataProviders = useInsightDataProviders({
    providers: parsedProviders,
    alertData,
  });
  const { totalCount, isQueryLoading, oldestTimestamp } = useInsightQuery({
    dataProviders,
  });
  if (isQueryLoading) {
    return <EuiLoadingSpinner size="l" />;
  } else {
    return (
      <InvestigateInTimelineButton
        asEmptyButton={false}
        dataProviders={dataProviders}
        timeRange={oldestTimestamp}
        keepDataView={true}
      >
        <EuiIcon type="timeline" />
        {` ${label} (${totalCount}) - ${description}`}
      </InvestigateInTimelineButton>
    );
  }
};

export { InsightComponent as renderer };

const InsightEditorComponent = ({
  node,
  onSave,
  onCancel,
}: EuiMarkdownEditorUiPluginEditorProps<InsightComponentProps>) => {
  return (
    <form>
      <input type="text" />
    </form>
  );
};

export const plugin = {
  name: 'insight',
  button: {
    label: 'Insights',
    iconType: 'timeline',
  },
  helpText: (
    <div>
      <EuiCodeBlock language="md" fontSize="l" paddingSize="s" isCopyable>
        {'!{insight{options}}'}
      </EuiCodeBlock>
      <EuiSpacer size="s" />
    </div>
  ),
  editor: InsightEditorComponent,
};

/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { i18n } from '@kbn/i18n';

import type { KibanaFeatureConfig } from '@kbn/features-plugin/common';
import { hiddenTypes as filesSavedObjectTypes } from '@kbn/files-plugin/server/saved_objects';
import { DEFAULT_APP_CATEGORIES } from '@kbn/core/server';

import { KibanaFeatureScope } from '@kbn/features-plugin/common';
import { APP_ID, FEATURE_ID, FEATURE_ID_V2 } from '../common/constants';
import { createUICapabilities, getApiTags } from '../common';

/**
 * The order of appearance in the feature privilege page
 * under the management section. Cases should be under
 * the Actions and Connectors feature
 */

const FEATURE_ORDER = 3100;

export const getCasesKibanaFeature = (): KibanaFeatureConfig => {
  const capabilities = createUICapabilities();
  const apiTags = getApiTags(APP_ID);

  return {
    deprecated: {
      // TODO: Add docLinks to link to documentation about the deprecation
      notice: i18n.translate('xpack.cases.features.casesFeature.deprecationMessage', {
        defaultMessage:
          'The {currentId} permissions are deprecated, please see {casesFeatureIdV2}.',
        values: {
          currentId: FEATURE_ID,
          casesFeatureIdV2: FEATURE_ID_V2,
        },
      }),
    },
    id: FEATURE_ID,
    name: i18n.translate('xpack.cases.features.casesFeatureNameDeprecated', {
      defaultMessage: 'Cases (Deprecated)',
    }),
    category: DEFAULT_APP_CATEGORIES.management,
    scope: [KibanaFeatureScope.Spaces, KibanaFeatureScope.Security],
    app: [],
    order: FEATURE_ORDER,
    management: {
      insightsAndAlerting: [APP_ID],
    },
    cases: [APP_ID],
    privileges: {
      all: {
        api: apiTags.all,
        cases: {
          create: [APP_ID],
          read: [APP_ID],
          update: [APP_ID],
          push: [APP_ID],
        },
        management: {
          insightsAndAlerting: [APP_ID],
        },
        savedObject: {
          all: [...filesSavedObjectTypes],
          read: [...filesSavedObjectTypes],
        },
        ui: capabilities.all,
        replacedBy: [
          { feature: FEATURE_ID_V2, privileges: ['minimal_all', 'create_comment', 'case_reopen'] },
        ],
      },
      read: {
        api: apiTags.read,
        cases: {
          read: [APP_ID],
        },
        management: {
          insightsAndAlerting: [APP_ID],
        },
        savedObject: {
          all: [],
          read: [...filesSavedObjectTypes],
        },
        ui: capabilities.read,
        replacedBy: [{ feature: FEATURE_ID_V2, privileges: ['read'] }],
      },
    },
    subFeatures: [
      {
        name: i18n.translate('xpack.cases.features.deleteSubFeatureName', {
          defaultMessage: 'Delete',
        }),
        privilegeGroups: [
          {
            groupType: 'independent',
            privileges: [
              {
                api: apiTags.delete,
                id: 'cases_delete',
                name: i18n.translate('xpack.cases.features.deleteSubFeatureDetails', {
                  defaultMessage: 'Delete cases and comments',
                }),
                includeIn: 'all',
                savedObject: {
                  all: [...filesSavedObjectTypes],
                  read: [...filesSavedObjectTypes],
                },
                cases: {
                  delete: [APP_ID],
                },
                ui: capabilities.delete,
                replacedBy: [{ feature: FEATURE_ID_V2, privileges: ['cases_delete'] }],
              },
            ],
          },
        ],
      },
      {
        name: i18n.translate('xpack.cases.features.casesSettingsSubFeatureName', {
          defaultMessage: 'Case settings',
        }),
        privilegeGroups: [
          {
            groupType: 'independent',
            privileges: [
              {
                id: 'cases_settings',
                name: i18n.translate('xpack.cases.features.casesSettingsSubFeatureDetails', {
                  defaultMessage: 'Edit case settings',
                }),
                includeIn: 'all',
                savedObject: {
                  all: [...filesSavedObjectTypes],
                  read: [...filesSavedObjectTypes],
                },
                cases: {
                  settings: [APP_ID],
                },
                ui: capabilities.settings,
                replacedBy: [{ feature: FEATURE_ID_V2, privileges: ['cases_settings'] }],
              },
            ],
          },
        ],
      },
    ],
  };
};

/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React, { Component } from 'react';

import { I18nProvider } from '@kbn/i18n-react';
import { i18n } from '@kbn/i18n';
import { EuiContextMenu, EuiContextMenuPanelDescriptor } from '@elastic/eui';

import type { Capabilities } from '@kbn/core/public';

import type { LocatorPublic } from '../../common';
import { UrlPanelContent } from './url_panel_content';
import { ShareMenuItemLegacy, ShareContextMenuPanelItem, UrlParamExtension } from '../types';
import { AnonymousAccessServiceContract } from '../../common/anonymous_access';
import type { BrowserUrlService } from '../types';

export interface ShareContextMenuProps {
  allowEmbed: boolean;
  allowShortUrl: boolean;
  objectId?: string;
  objectType: string;
  shareableUrl?: string;
  shareableUrlForSavedObject?: string;
  shareableUrlLocatorParams?: {
    locator: LocatorPublic<any>;
    params: any;
  };
  shareMenuItems: ShareMenuItemLegacy[];
  sharingData: any;
  onClose: () => void;
  embedUrlParamExtensions?: UrlParamExtension[];
  anonymousAccess?: AnonymousAccessServiceContract;
  showPublicUrlSwitch?: (anonymousUserCapabilities: Capabilities) => boolean;
  urlService: BrowserUrlService;
  snapshotShareWarning?: string;
  objectTypeTitle?: string;
  disabledShareUrl?: boolean;
}
// Needed for Canvas
export class ShareContextMenu extends Component<ShareContextMenuProps> {
  public render() {
    const { panels, initialPanelId } = this.getPanels();
    return (
      <I18nProvider>
        <EuiContextMenu
          initialPanelId={initialPanelId}
          panels={panels}
          data-test-subj="shareContextMenu"
        />
      </I18nProvider>
    );
  }

  private getPanels = () => {
    const panels: EuiContextMenuPanelDescriptor[] = [];
    const menuItems: ShareContextMenuPanelItem[] = [];

    const permalinkPanel = {
      id: panels.length + 1,
      title: i18n.translate('share.contextMenu.permalinkPanelTitle', {
        defaultMessage: 'Get link',
      }),
      content: (
        <UrlPanelContent
          allowShortUrl={this.props.allowShortUrl}
          objectId={this.props.objectId}
          objectType={this.props.objectType}
          shareableUrl={this.props.shareableUrl}
          shareableUrlForSavedObject={this.props.shareableUrlForSavedObject}
          shareableUrlLocatorParams={this.props.shareableUrlLocatorParams}
          anonymousAccess={this.props.anonymousAccess}
          showPublicUrlSwitch={this.props.showPublicUrlSwitch}
          urlService={this.props.urlService}
          snapshotShareWarning={this.props.snapshotShareWarning}
        />
      ),
    };
    menuItems.push({
      name: i18n.translate('share.contextMenu.permalinksLabel', {
        defaultMessage: 'Get links',
      }),
      icon: 'link',
      panel: permalinkPanel.id,
      sortOrder: 0,
      disabled: Boolean(this.props.disabledShareUrl),
      // do not break functional tests
      'data-test-subj': 'Permalinks',
    });
    panels.push(permalinkPanel);

    if (this.props.allowEmbed) {
      const embedPanel = {
        id: panels.length + 1,
        title: i18n.translate('share.contextMenu.embedCodePanelTitle', {
          defaultMessage: 'Embed Code',
        }),
        content: (
          <UrlPanelContent
            allowShortUrl={this.props.allowShortUrl}
            isEmbedded
            objectId={this.props.objectId}
            objectType={this.props.objectType}
            shareableUrl={this.props.shareableUrl}
            shareableUrlForSavedObject={this.props.shareableUrlForSavedObject}
            shareableUrlLocatorParams={this.props.shareableUrlLocatorParams}
            urlParamExtensions={this.props.embedUrlParamExtensions}
            anonymousAccess={this.props.anonymousAccess}
            showPublicUrlSwitch={this.props.showPublicUrlSwitch}
            urlService={this.props.urlService}
            snapshotShareWarning={this.props.snapshotShareWarning}
          />
        ),
      };
      panels.push(embedPanel);
      menuItems.push({
        name: i18n.translate('share.contextMenu.embedCodeLabel', {
          defaultMessage: 'Embed code',
        }),
        icon: 'console',
        panel: embedPanel.id,
        sortOrder: 0,
      });
    }

    this.props.shareMenuItems.forEach(({ shareMenuItem }) => {
      const panelId = panels.length + 1;
      panels.push({
        id: panelId,
      });
      menuItems.push({
        ...shareMenuItem,
        name: shareMenuItem!.name,
        panel: panelId,
      });
    });

    if (menuItems.length > 1) {
      const topLevelMenuPanel = {
        id: panels.length + 1,
        title: i18n.translate('share.contextMenuTitle', {
          defaultMessage: 'Share this {objectType}',
          values: {
            objectType: this.props.objectTypeTitle || this.props.objectType,
          },
        }),
        items: menuItems
          // Sorts ascending on sort order first and then ascending on name
          .sort((a, b) => {
            const aSortOrder = a.sortOrder || 0;
            const bSortOrder = b.sortOrder || 0;
            if (aSortOrder > bSortOrder) {
              return 1;
            }
            if (aSortOrder < bSortOrder) {
              return -1;
            }
            if (a.name.toLowerCase().localeCompare(b.name.toLowerCase()) > 0) {
              return 1;
            }
            return -1;
          })
          .map((menuItem) => {
            menuItem['data-test-subj'] = `sharePanel-${
              menuItem['data-test-subj'] ?? menuItem.name.replace(' ', '')
            }`;
            delete menuItem.sortOrder;
            return menuItem;
          }),
      };
      panels.push(topLevelMenuPanel);
    }

    const lastPanelIndex = panels.length - 1;
    const initialPanelId = panels[lastPanelIndex].id;
    return { panels, initialPanelId };
  };
}

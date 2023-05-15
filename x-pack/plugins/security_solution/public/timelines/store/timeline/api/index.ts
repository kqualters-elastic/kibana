/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import { KibanaServices } from '../../../../common/lib/kibana';

export const kibanaBaseQuery =
  (
    { baseUrl }: { baseUrl: string } = { baseUrl: '' }
  ): BaseQueryFn<
    {
      url: string;
      method: string;
      data?: object;
      params?: object;
    },
    unknown,
    unknown
  > =>
  async ({ url, method, data, params }) => {
    let requestBody;
    let response;
    try {
      requestBody = JSON.stringify({ params });
    } catch (err) {
      return { error: { status: `Failed to stringify query: ${JSON.stringify(err)}`, data: null } };
    }
    try {
      if (method === 'GET') {
        response = await KibanaServices.get().http.get(baseUrl, {
          method,
          body: requestBody,
        });
      } else if (method === 'DELETE') {
        response = await KibanaServices.get().http.delete(baseUrl, {
          method,
          body: requestBody,
        });
      } else if (method === 'PATCH') {
        response = await KibanaServices.get().http.patch(baseUrl, {
          method,
          body: requestBody,
        });
      } else if (method === 'PUT') {
        response = await KibanaServices.get().http.put(baseUrl, {
          method,
          body: requestBody,
        });
      } else if (method === 'POST') {
        response = await KibanaServices.get().http.post(baseUrl, {
          method,
          body: requestBody,
        });
      }

      return response;
    } catch (err) {
      return {
        error: {
          status: err.stats,
          data: err,
        },
      };
    }
  };

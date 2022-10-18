/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { useQueryClient, useMutation } from '@tanstack/react-query';
interface MutationArgs {
  endpoint_ids: string[];
  parameters: { entity_id: string };
}
export const useUpdateCases = () => {
  const queryClient = useQueryClient();
  return useMutation(
    ({ cases }: MutationArgs) => {
      const abortCtrlRef = new AbortController();
      return updateCases(cases, abortCtrlRef.signal);
    },
    {
      mutationKey: id,
      onSuccess: (_, { successToasterTitle }) => {
        console.log('success');
      },
      onError: (error) => {
        console.log('error: ', error);
      },
    }
  );
};

export type UseUpdateCases = ReturnType<typeof useUpdateCases>;

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const usersApi = createApi({
    reducerPath: 'usersApi',
    baseQuery: fetchBaseQuery({ baseUrl: `${import.meta.env.VITE_API_URL}` }),
    endpoints: (builder) => ({
        getRankings: builder.query({
            query: ({ page = 1, limit = 10, search, minElo, minWinRate, maxPb }) => {
                const params = new URLSearchParams({ page, limit });
                if (search) params.append('search', search);
                if (minElo !== undefined) params.append('minElo', minElo);
                if (minWinRate !== undefined) params.append('minWinRate', minWinRate);
                if (maxPb !== undefined) params.append('maxPb', maxPb);
                return `/rankings?${params.toString()}`;
            },
        }),
    }),
});

export const { useGetRankingsQuery } = usersApi;

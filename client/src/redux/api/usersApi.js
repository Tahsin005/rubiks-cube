import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const usersApi = createApi({
    reducerPath: 'usersApi',
    baseQuery: fetchBaseQuery({ 
        baseUrl: `${import.meta.env.VITE_API_URL}`,
        prepareHeaders: (headers, { getState }) => {
            const token = getState().auth.token;
            if (token) {
                headers.set('authorization', `Bearer ${token}`);
            }
            return headers;
        },
    }),
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
        getProfile: builder.query({
            query: (username) => `/users/${username}`,
        }),
        getAchievements: builder.query({
            query: ({ username, page = 1, limit = 10, category } = {}) => {
                const params = new URLSearchParams({ page, limit });
                if (username) params.append('username', username);
                if (category) params.append('category', category);
                return `/achievements?${params.toString()}`;
            },
        }),
        getMyMatches: builder.query({
            query: ({ page = 1, limit = 10 } = {}) => {
                const params = new URLSearchParams({ page, limit });
                return `/matches?${params.toString()}`;
            },
        }),
        getMatchHistory: builder.query({
            query: ({ opponentUsername, page = 1, limit = 10 } = {}) => {
                const params = new URLSearchParams({ page, limit });
                return `/matches/history/${opponentUsername}?${params.toString()}`;
            },
        }),
    }),
});

export const { useGetRankingsQuery, useGetProfileQuery, useGetAchievementsQuery, useGetMyMatchesQuery, useGetMatchHistoryQuery } = usersApi;

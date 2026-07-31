import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const friendsApi = createApi({
    reducerPath: 'friendsApi',
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
        getFriends: builder.query({
            query: ({ status, search, page = 1, limit = 10 } = {}) => {
                const params = new URLSearchParams({ page, limit });
                if (status) params.append('status', status);
                if (search) params.append('search', search);
                return `/friends?${params.toString()}`;
            },
        }),
        sendFriendRequest: builder.mutation({
            query: (username) => ({
                url: `/friends/${username}`,
                method: 'POST',
            }),
        }),
        acceptFriendRequest: builder.mutation({
            query: (username) => ({
                url: `/friends/${username}/accept`,
                method: 'POST',
            }),
        }),
        rejectFriendRequest: builder.mutation({
            query: (username) => ({
                url: `/friends/${username}/reject`,
                method: 'POST',
            }),
        }),
        removeFriend: builder.mutation({
            query: (username) => ({
                url: `/friends/${username}`,
                method: 'DELETE',
            }),
        }),
    }),
});

export const {
    useGetFriendsQuery,
    useSendFriendRequestMutation,
    useAcceptFriendRequestMutation,
    useRejectFriendRequestMutation,
    useRemoveFriendMutation,
} = friendsApi;

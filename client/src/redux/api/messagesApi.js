import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const messagesApi = createApi({
    reducerPath: 'messagesApi',
    baseQuery: fetchBaseQuery({
        baseUrl: `${import.meta.env.VITE_API_URL}/messages`,
        prepareHeaders: (headers, { getState }) => {
            const token = getState().auth.token;
            if (token) {
                headers.set('authorization', `Bearer ${token}`);
            }
            return headers;
        },
    }),
    tagTypes: ['Conversation', 'Message'],
    endpoints: (builder) => ({
        getConversations: builder.query({
            query: () => '/',
            providesTags: ['Conversation'],
        }),
        getMessagesWithUser: builder.query({
            query: ({ friendUsername, page = 1, limit = 50 }) => {
                const params = new URLSearchParams({ page, limit });
                return `/${friendUsername}?${params.toString()}`;
            },
            providesTags: (result, error, arg) => [{ type: 'Message', id: arg.friendUsername }],
        }),
        markAsRead: builder.mutation({
            query: (friendUsername) => ({
                url: `/${friendUsername}/read`,
                method: 'POST',
            }),
            invalidatesTags: ['Conversation', 'Message'],
        }),
    }),
});

export const {
    useGetConversationsQuery,
    useGetMessagesWithUserQuery,
    useMarkAsReadMutation,
} = messagesApi;

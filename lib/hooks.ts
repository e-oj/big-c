import useSWR from 'swr';
import { ErrorProps, QueryParams } from '@types';
import { useSession } from '../context/session';

async function fetcher(url: string, query: string) {
    const res = await fetch(`${url}?${query}`);

    // If the status code is not in the range 200-299, throw an error
    if (!res.ok) {
        const { message } = await res.json();
        const error: ErrorProps = new Error(message || 'An error occurred while fetching the data.');
        error.status = res.status; // e.g. 500
        throw error;
    }

    return res.json();
}

// Reusable SWR hooks
// https://swr.vercel.app/
export function useProductList(query?: QueryParams) {
    const { context } = useSession();
    const params = new URLSearchParams({ ...query, context }).toString();

    // Use an array to send multiple arguments to fetcher
    const { data, error, mutate: mutateList } = useSWR(context ? ['/api/products/list', params] : null, fetcher);

    return {
        list: data?.data,
        meta: data?.meta,
        isLoading: !data && !error,
        error,
        mutateList,
    };
}
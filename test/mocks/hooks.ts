import { TableItem } from '@types';

// useProductList Mock
export const ROW_NUMBERS = 5;

// Generate mock tableItems
const generateList = (): TableItem[] => (
    [...Array(ROW_NUMBERS)].map((_, index) => ({
        id: index,
        name: `Product ${index}`,
        price: (index + 1) * 10,
        stock: 7,
    }))
);

export const useProductList = jest.fn().mockImplementation(() => ({
    list: generateList(),
    meta: { pagination: { total: ROW_NUMBERS } }
}));

import Index from '@pages/index';
import { render } from '@test/utils';

jest.mock('@lib/hooks', () => require('@mocks/hooks'));

describe('Homepage', () => {
    test('renders correctly', () => {
        const { container } = render(<Index />);

        expect(container.firstChild).toMatchSnapshot();
    });
});

import { Box, Tabs } from '@bigcommerce/big-design';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export const TabIds = {
    HOME: 'home',
};

export const TabRoutes = {
    [TabIds.HOME]: '/',
};

const Header = () => {
    const [activeTab, setActiveTab] = useState<string>('');
    const router = useRouter();
    const { pathname } = router;

    useEffect(() => {
        // Check if new route matches TabRoutes
        const tabKey = Object.keys(TabRoutes).find(key => TabRoutes[key] === pathname);

        // Set the active tab to tabKey or set no active tab if route doesn't match (404)
        setActiveTab(tabKey ?? '');
    }, [pathname]);

    const items = [
        { id: TabIds.HOME, title: 'Home' },
    ];

    const handleTabClick = (tabId: string) => {
        setActiveTab(tabId);

        return router.push(TabRoutes[tabId]);
    };

    return (
        <Box marginBottom="xxLarge">
            <Tabs
                activeTab={activeTab}
                items={items}
                onTabClick={handleTabClick}
            />
        </Box>
    );
};

export default Header;

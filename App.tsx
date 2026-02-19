import React from 'react';
import {
    Button,
    Grid,
    Column,
    Theme,
    Content,
    Header,
    HeaderContainer,
    HeaderName,
    HeaderGlobalBar,
    HeaderGlobalAction,
    HeaderMenuButton,
    HeaderMenuItem,
    HeaderNavigation,
    SkipToContent
} from '@carbon/react';
import { Settings, ArrowRight, Document } from '@carbon/icons-react';
import ChatWidget from './components/ChatWidget';

function getCookie(name: string): string | undefined {
    if (typeof document === 'undefined') { // Check if running in browser
        return undefined;
    }
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) {
            return decodeURIComponent(c.substring(nameEQ.length, c.length));
        }
    }
    return undefined;
}

const onLoadCall = async () => {
    let ci_id = getCookie("user_cookie");
    console.log("CI_ID from cookie: >> ", ci_id);
    return { "ci_id": ci_id };
}

const App: React.FC = () => {
    return (
        <HeaderContainer
            render={({ isSideNavExpanded, onClickSideNavExpand }) => (
                <>
                    <Theme theme="white">
                        <Header aria-label="Carbon Design">
                            <SkipToContent />
                            <HeaderMenuButton
                                aria-label="Open menu"
                                onClick={onClickSideNavExpand}
                                isActive={isSideNavExpanded}
                            />
                            <HeaderName href="#" prefix="Carbon">
                                Design
                            </HeaderName>
                            <HeaderNavigation aria-label="Carbon Design">
                                <HeaderMenuItem href="#">Components</HeaderMenuItem>
                                <HeaderMenuItem href="#">Patterns</HeaderMenuItem>
                                <HeaderMenuItem href="#">Guidelines</HeaderMenuItem>
                            </HeaderNavigation>
                            <HeaderGlobalBar>
                                <HeaderGlobalAction aria-label="Settings" tooltipAlignment="end">
                                    <Settings size={20} />
                                </HeaderGlobalAction>
                            </HeaderGlobalBar>
                        </Header>
                    </Theme>

                    <Content>
                        <Grid className="landing-page-grid" fullWidth>
                            <Column lg={16} md={8} sm={4}>
                                <div style={{ paddingTop: '6rem', paddingBottom: '4rem' }}>
                                    <Grid>
                                        <Column lg={8} md={4} sm={4}>
                                            <Theme theme="g10">
                                                <div style={{ padding: '0.25rem 0.5rem', display: 'inline-block', marginBottom: '1rem', fontWeight: 'bold', fontSize: '0.75rem', letterSpacing: '0.1rem' }}>
                                                    NEW FEATURE
                                                </div>
                                            </Theme>
                                            <h1 style={{ fontSize: '4rem', fontWeight: 300, lineHeight: 1.1, marginBottom: '2rem' }}>
                                                AI Powered <br />
                                                <span style={{ fontWeight: 600 }}>Conversations.</span>
                                            </h1>
                                            <p style={{ fontSize: '1.25rem', marginBottom: '2rem', maxWidth: '32rem', lineHeight: 1.6 }}>
                                                Embed intelligent agentic capabilities directly into your website.
                                                Experience real-time reasoning, tool usage, and seamless streaming responses.
                                            </p>
                                            <div style={{ display: 'flex', gap: '1rem' }}>
                                                <Button renderIcon={ArrowRight}>Get Started</Button>
                                                <Button kind="tertiary" renderIcon={Document}>View Documentation</Button>
                                            </div>
                                        </Column>
                                        <Column lg={8} md={4} sm={4} className="hidden-sm-down">
                                            {/* Visual Abstract - using Carbon Colors via Inline Styles for now as tokens might need JS access or classes */}
                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: '1fr 1fr',
                                                gap: '1rem',
                                                opacity: 0.2,
                                                height: '100%'
                                            }}>
                                                <div style={{ background: '#161616', height: '160px', width: '100%' }}></div>
                                                <div style={{ background: '#0f62fe', height: '160px', width: '100%', marginTop: '3rem' }}></div>
                                                <div style={{ background: '#8d8d8d', height: '160px', width: '100%', marginTop: '-3rem' }}></div>
                                                <div style={{ background: '#f4f4f4', height: '160px', width: '100%', border: '1px solid #161616' }}></div>
                                            </div>
                                        </Column>
                                    </Grid>
                                </div>
                            </Column>
                        </Grid>
                        <ChatWidget onLoad={onLoadCall} />
                    </Content>
                </>
            )}
        />
    );
};

export default App;
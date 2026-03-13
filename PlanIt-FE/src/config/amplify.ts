/**
 * AWS Amplify 설정
 */

import { Amplify } from 'aws-amplify';

const amplifyConfig = {
    Auth: {
        Cognito: {
            userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
            userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
            loginWith: {
                oauth: {
                    domain: import.meta.env.VITE_COGNITO_DOMAIN,
                    scopes: ['openid', 'email', 'profile'],
                    redirectSignIn: [import.meta.env.VITE_COGNITO_REDIRECT_URI],
                    redirectSignOut: [import.meta.env.VITE_APP_URL || window.location.origin],
                    responseType: 'code' as const,
                },
            },
        },
    },
};

// 디버깅을 위한 설정 로그
console.log('[Amplify Config]', {
    userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
    clientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
    domain: import.meta.env.VITE_COGNITO_DOMAIN,
    redirectSignIn: import.meta.env.VITE_COGNITO_REDIRECT_URI,
    redirectSignOut: import.meta.env.VITE_APP_URL,
});

Amplify.configure(amplifyConfig);

export default amplifyConfig;

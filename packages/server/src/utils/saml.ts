import { ServiceProvider, IdentityProvider, setSchemaValidator } from 'samlify';
import * as validator from '@authenio/samlify-xsd-schema-validator';
import { readFile } from 'fs-extra';
import config from '../config';
import { PostBindingContext } from 'samlify/types/src/entity';
import { _ } from '@joplin/lib/locale';

function checkIfSamlIsEnabled() {
	if (!config().saml.enabled) {
		throw new Error('SAML support is disabled for this server.');
	}
}

export async function serviceProvider(relayState: string = null) {
	checkIfSamlIsEnabled();

	return ServiceProvider({
		metadata: await readFile(config().saml.serviceProviderConfigFile),
		relayState,
	});
}

export async function identityProvider() {
	checkIfSamlIsEnabled();

	return IdentityProvider({
		metadata: await readFile(config().saml.identityProviderConfigFile),
	});
}

export function setupSamlAuthentication() {
	setSchemaValidator(validator);
}

export async function getLoginRequest(relayState: string = null) {
	const [sp, idp] = await Promise.all([
		serviceProvider(relayState),
		identityProvider(),
	]);

	return sp.createLoginRequest(idp, 'post') as PostBindingContext;
}

export async function generateRedirectHtml(relayState: string = null) {
	const loginRequest = await getLoginRequest(relayState);

	return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${_('Joplin SSO Authentication')}</title>
</head>
<body>
    <p>${_('Please wait while we load your organization sign-in page...')}</p>

    <form id="saml-form" method="post" action="${loginRequest.entityEndpoint}" autocomplete="off">
        <input type="hidden" name="${loginRequest.type}" value="${loginRequest.context}"/>

        ${loginRequest.relayState ? `<input type="hidden" name="RelayState" value="${loginRequest.relayState}"/>` : ''}
    </form>

    <script type="text/javascript">
        (() => {
            document.querySelector('#saml-form').submit();
        })();
    </script>
</body>
</html>`;
}

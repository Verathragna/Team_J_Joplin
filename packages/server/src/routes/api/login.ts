import config from '../../config';
import Router from '../../utils/Router';
import { redirect, SubPath } from '../../utils/routeUtils';
import { generateRedirectHtml, identityProvider, serviceProvider } from '../../utils/saml';
import { AppContext, RouteType, SamlPostResponse } from '../../utils/types';
import { bodyFields } from '../../utils/requestUtils';
import { InternalServerError } from '../../utils/errors';
import { FlowResult } from 'samlify/types/src/flow';
import { cookieSet } from '../../utils/cookies';
import defaultView from '../../utils/defaultView';

export const router = new Router(RouteType.Api);

router.public = true;

function samlNotAvailable(ctx: AppContext) {
	ctx.status = 403;
	ctx.body = { error: 'This server does not accept SAML authentication.' };
}

router.get('api/login_flows', async (_path: SubPath, ctx: AppContext) => {
	return ctx.joplin.models.user().getAllowedLoginFlows();
});

router.get('api/saml', async (_path: SubPath, ctx: AppContext) => {
	if (config().saml.enabled) {
		return await generateRedirectHtml();
	} else {
		return samlNotAvailable(ctx);
	}
});

router.post('api/saml', async (_path: SubPath, ctx: AppContext) => {
	if (config().saml.enabled) {
		const [sp, idp] = await Promise.all([
			serviceProvider(),
			identityProvider(),
		]);

		const fields = await bodyFields<SamlPostResponse>(ctx.req);

		let result: FlowResult;

		try {
			result = await sp.parseLoginResponse(idp, 'post', { body: fields });
		} catch (error) {
			throw new InternalServerError('Failed to parse the SAML response! Please check server configuration.', { details: { originalError: error } });
		}

		const user = await ctx.joplin.models.user().samlLogin(result.extract.attributes);

		if (!user) {
			throw new InternalServerError('Failed to fetch an user account from the SAML response! Please check server configuration.', { details: result.extract });
		}

		const session = await ctx.joplin.models.session().createUserSession(user.id);

		if (fields.RelayState) {
			switch (fields.RelayState) {
				case 'web-login': {
					cookieSet(ctx, 'sessionId', session.id);
					return redirect(ctx, `${config().baseUrl}/home`);
				}

				case 'app-login': {
					const view = defaultView('samlAppRedirect', 'Login');
					const redirectUrl = `joplin://x-callback-url/samlLogin?id=${session.id}&user_id=${session.user_id}`;

					view.content = {
						samlOrganizationName: config().saml.enabled && config().saml.organizationDisplayName ? config().saml.organizationDisplayName : undefined,
						redirectUrl,
					};

					return view;
				}
			}
		} else {
			return { id: session.id, user_id: session.user_id };
		}
	} else {
		return samlNotAvailable(ctx);
	}
});

export default router;

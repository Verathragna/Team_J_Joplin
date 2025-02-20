import * as bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
	const salt = await bcrypt.genSalt(10);
	return bcrypt.hash(password, salt);
}

export async function checkPassword(password: string, hash: string): Promise<boolean> {
	// If no hash is stored for a given user, that means that this user was created using a SSO solution
	// such as a SAML login, and is expected to log in through that.
	if (!hash) {
		return false;
	}

	return bcrypt.compare(password, hash);
}

export const isHashedPassword = (password: string) => {
	return password.startsWith('$2a$10');
};

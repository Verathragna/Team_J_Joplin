// Check that a given URL starts with "http://" or "https://". If not, prefix it with "https://".
// @param url The URL to check.
// @returns The given URL if it starts with "http://" or "https://", and if that is not the case, add "https://" as a prefix.
function httpPrefix(url: string) {
	if (!url.startsWith('http://') && !url.startsWith('https://')) {
		return `https://${url}`;
	} else {
		return url;
	}
}

export default httpPrefix;

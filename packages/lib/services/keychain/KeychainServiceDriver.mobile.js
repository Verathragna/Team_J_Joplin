'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const KeychainServiceDriverBase_1 = require('./KeychainServiceDriverBase');
class KeychainServiceDriver extends KeychainServiceDriverBase_1.default {
	constructor() {
		super(...arguments);
		this.driverId = 'mobile-unknown';
	}
	async supported() {
		return false;
	}
	async setPassword(/* name:string, password:string*/) {
		return false;
	}
	async password(/* name:string*/) {
		return null;
	}
	async deletePassword(/* name:string*/) {
	}
	async upgradeStorageBackend(_secureKeys, _newDatabaseVersion) {
	}
}
exports.default = KeychainServiceDriver;
// # sourceMappingURL=KeychainServiceDriver.mobile.js.map

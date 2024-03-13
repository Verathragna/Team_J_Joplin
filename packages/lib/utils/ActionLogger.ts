import Logger from '@joplin/utils/Logger';

export enum ItemActionType {
	Delete = 'DeleteAction',
}

const actionTypeToLogger = {
	[ItemActionType.Delete]: Logger.create(ItemActionType.Delete),
};

export default class ActionLogger {
	private descriptions: string[] = [];

	private constructor(private source: string) { }

	public clone() {
		const clone = new ActionLogger(this.source);
		clone.descriptions = [...this.descriptions];
		return clone;
	}

	// addDescription is used to add labels with information that may not be available
	// when .log is called. For example, to include the title of a deleted note.
	public addDescription(description: string) {
		this.descriptions.push(description);
	}

	public log(action: ItemActionType, itemIds: string|string[]) {
		const logger = actionTypeToLogger[action];
		logger.info(`${this.source}: ${this.descriptions.join(',')}; Item IDs: ${JSON.stringify(itemIds)}`);
	}

	public static from(source: ActionLogger|string|undefined) {
		if (!source) {
			source = 'Unknown source';
		}

		if (typeof source === 'string') {
			return new ActionLogger(source);
		}

		return source;
	}
}

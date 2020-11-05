import {isOfType, throttle} from 'lib/utils';

export type SettingsData = Record<string, null | undefined | number | string | boolean>;

export type Callback<T> = (data: T) => void;

export interface SyncedSettingsControls<T extends any> {
	_assign(obj: Partial<T>): void;
	_reset(): void;
	_subscribe(callback: Callback<T>): void;
	_unsubscribe(callback: Callback<T>): void;
	_defaults: T;
}

export type SyncedSettings<T extends SettingsData> = T & SyncedSettingsControls<T>;

export interface StorageDriver {
	subscribersMap: Map<any, any>;
	get<T extends unknown = unknown>(name: string): T | undefined;
	set(name: string, value: unknown): void;
	subscribe(name: string, callback: (name: string, oldValue: unknown, newValue: unknown) => void): () => void;
	unsubscribe(id: any): void;
}

export const localStorageDriver: StorageDriver = {
	subscribersMap: new Map(),
	get: (name) => {
		try {
			return JSON.parse(localStorage.getItem(name) as any);
		} catch {
			return undefined;
		}
	},
	set: (name, value) => localStorage.setItem(name, JSON.stringify(value)),
	subscribe: (name, callback) => {
		const listener = () => callback(name, undefined, localStorage.getItem(name));
		localStorageDriver.subscribersMap.set(callback, listener);
		window.addEventListener('storage', listener);
		return () => localStorageDriver.unsubscribe(callback);
	},
	unsubscribe: (callback) => {
		const listener = localStorageDriver.subscribersMap.get(callback);
		if (listener) {
			window.removeEventListener('storage', listener);
			localStorageDriver.subscribersMap.delete(callback);
		}
	},
};

export const greaseMonkeyDriver: StorageDriver = {
	subscribersMap: new Map(),
	get: (name) => GM_getValue(name),
	set: (name, value) => GM_setValue(name, value),
	subscribe: (name, callback) => {
		const id = GM_addValueChangeListener(name, callback);
		greaseMonkeyDriver.subscribersMap.set(callback, id);
		return () => greaseMonkeyDriver.unsubscribe(callback);
	},
	unsubscribe: (callback) => {
		const id = localStorageDriver.subscribersMap.get(callback);
		if (id) {
			GM_removeValueChangeListener(id);
			greaseMonkeyDriver.subscribersMap.delete(callback);
		}
	},
};

/**
 * localStorage wrapper that saves into a namespaced key as json, and provides
 * synchronization between tabs and change subscriptions.
 *
 * ```
 * let settings = syncedSettings('storageKey', {defaults: 'foo}); // pre-loads
 * settings.foo; // retrieve
 * settings.foo = 5; // saves to localStorage automatically (debounced by 10ms)
 * const unsubscribe = settings._subscribe((settings) => {}); // called when this or other tab changes settings
 * ```
 */
export function syncedSettings<T extends SettingsData>(
	storageKey: string,
	defaults: T,
	driver: StorageDriver = greaseMonkeyDriver
): SyncedSettings<T> {
	const listeners: Set<Callback<T>> = new Set();
	let savingPromise: Promise<void> | null = null;
	let settings: T = load();

	function triggerListeners() {
		for (let callback of listeners) callback(settings);
	}

	function load(): T {
		let data = driver.get(storageKey);
		return typeof data === 'object' ? {...defaults, ...data} : {...defaults};
	}

	function save() {
		if (savingPromise) return savingPromise;
		savingPromise = new Promise((resolve) =>
			setTimeout(() => {
				driver.set(storageKey, settings);
				savingPromise = null;
				resolve();
			}, 10)
		);
		return savingPromise;
	}

	// Listen for changes from another tab
	driver.subscribe(
		storageKey,
		throttle(() => {
			let newData = load();
			let hasChanges = false;
			for (let key in newData) {
				if (newData[key] !== settings[key]) {
					hasChanges = true;
					settings[key] = newData[key];
				}
			}
			if (hasChanges) triggerListeners();
		}, 500)
	);

	const control: SyncedSettingsControls<T> = {
		_assign(obj) {
			Object.assign(settings, obj);
			save();
			triggerListeners();
		},
		_reset() {
			control._assign(defaults);
		},
		_subscribe(callback) {
			listeners.add(callback);
			return () => listeners.delete(callback);
		},
		_unsubscribe(callback) {
			listeners.delete(callback);
		},
		get _defaults() {
			return defaults;
		},
	};

	// @ts-ignore please I don't want to type another proxy in TS
	return (new Proxy(settings, {
		get(_, prop) {
			if (isOfType<keyof typeof control>(prop, prop in control)) return control[prop];
			if (isOfType<keyof T>(prop, prop in settings)) return settings[prop];
			throw new Error(`SyncedStorage: property "${String(prop)}" does not exist in "${storageKey}".`);
		},
		set(_, prop, value) {
			if (isOfType<keyof T>(prop, prop in settings)) {
				settings[prop as keyof T] = value;
				save();
				triggerListeners();
				return true;
			}
			throw new Error(`Trying to set an unknown "${storageKey}" property "${String(prop)}"`);
		},
	}) as unknown) as T;
}

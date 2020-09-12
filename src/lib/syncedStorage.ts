import {isOfType, throttle} from 'lib/utils';

export type StorageData = Record<string, null | undefined | number | string | boolean>;

export type Callback<T> = (data: T) => void;

export interface SyncedStorageControls<T extends any> {
	_assign(obj: Partial<T>): void;
	_reset(): void;
	_subscribe(callback: Callback<T>): void;
	_unsubscribe(callback: Callback<T>): void;
	_defaults: T;
}

export type SyncedStorage<T extends StorageData> = T & SyncedStorageControls<T>;

/**
 * localStorage wrapper that saves into a namespaced key as json, and provides
 * synchronization between tabs and change subscriptions.
 *
 * ```
 * let storage = syncedStorage('localStorageKey'); // pre-loads
 * storage.foo; // retrieve
 * storage.foo = 5; // saves to localStorage automatically (debounced by 10ms)
 * const unsubscribe = storage._subscribe((storage) => {}); // called when this or other tab changes storage
 * ```
 */
export function syncedStorage<T extends StorageData>(localStorageKey: string, defaults: T): SyncedStorage<T> {
	const listeners: Set<Callback<T>> = new Set();
	let savingPromise: Promise<void> | null = null;
	let storage: T = load();

	function triggerListeners() {
		for (let callback of listeners) callback(storage);
	}

	function load(): T {
		let json = localStorage.getItem(localStorageKey);
		let data;
		try {
			data = json ? {...defaults, ...JSON.parse(json)} : {...defaults};
		} catch (error) {
			data = {...defaults};
		}
		return data;
	}

	function save() {
		if (savingPromise) return savingPromise;
		savingPromise = new Promise((resolve) =>
			setTimeout(() => {
				localStorage.setItem(localStorageKey, JSON.stringify(storage));
				savingPromise = null;
				resolve();
			}, 10)
		);
		return savingPromise;
	}

	// Listen for changes from another tab
	window.addEventListener(
		'storage',
		throttle(() => {
			let newData = load();
			let hasChanges = false;
			for (let key in newData) {
				if (newData[key] !== storage[key]) {
					hasChanges = true;
					storage[key] = newData[key];
				}
			}
			if (hasChanges) triggerListeners();
		}, 500)
	);

	const control: SyncedStorageControls<T> = {
		_assign(obj) {
			Object.assign(storage, obj);
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
	return (new Proxy(storage, {
		get(_, prop) {
			if (isOfType<keyof typeof control>(prop, prop in control)) return control[prop];
			if (isOfType<keyof T>(prop, prop in storage)) return storage[prop];
			throw new Error(
				`SyncedStorage: property "${String(prop)}" does not exist in "${localStorageKey}" storage.`
			);
		},
		set(_, prop, value) {
			if (isOfType<keyof T>(prop, prop in storage)) {
				storage[prop as keyof T] = value;
				save();
				triggerListeners();
				return true;
			}
			throw new Error(`Trying to set an unknown "${localStorageKey}" storage property "${String(prop)}"`);
		},
	}) as unknown) as T;
}

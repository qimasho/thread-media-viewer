export interface VNode<P = {}> {
	type: string;
	props: P & {children: ComponentChildren};
	key: Key;
	ref?: Ref<any> | null;
	startTime?: number;
	endTime?: number;
}

export type ComponentChild = VNode<any> | object | string | number | boolean | null | undefined;
export type ComponentChildren = ComponentChild[] | ComponentChild;

export type Key = string | number | any;

export type Ref<T> = {current?: T | null};

export interface Attributes {
	key?: Key;
	jsx?: boolean;
}

export type RenderableProps<P, RefType = any> = P &
	Readonly<Attributes & {children?: ComponentChildren; ref?: Ref<RefType>}>;

export interface FunctionComponent<P = {}> {
	(props: RenderableProps<P>, context?: any): VNode<any> | null;
	displayName?: string;
	defaultProps?: Partial<P>;
}

export interface Consumer<T>
	extends FunctionComponent<{
		children: (value: T) => ComponentChildren;
	}> {}

export interface Provider<T>
	extends FunctionComponent<{
		value: T;
		children?: ComponentChildren;
	}> {}

export interface Context<T> {
	Consumer: Consumer<T>;
	Provider: Provider<T>;
}
export interface PreactContext<T> extends Context<T> {}

export type Inputs = ReadonlyArray<unknown>;

export type StateUpdater<S> = (value: S | ((prevState: S) => S)) => void;

export type Reducer<S, A> = (prevState: S, action: A) => S;

export type EffectCallback = () => void | (() => void);

declare namespace preact {
	function h(type: string, props: Record<string, any> | null, ...children: ComponentChildren[]): VNode<any>;
	function h<P>(
		type: FunctionComponent<P>,
		props: P extends {} ? (Attributes & P) : null,
		...children: ComponentChildren[]
	): VNode<any>;

	function render(
		vnode: ComponentChild,
		parent: Element | Document | ShadowRoot | DocumentFragment,
		replaceNode?: Element | Text
	): void;

	function createContext<T>(defaultValue: T): Context<T>;
}

declare namespace preactHooks {
	function useState<S>(initialState: S | (() => S)): [S, StateUpdater<S>];
	function useReducer<S, A>(reducer: Reducer<S, A>, initialState: S): [S, (action: A) => void];
	function useReducer<S, A, I>(reducer: Reducer<S, A>, initialArg: I, init: (arg: I) => S): [S, (action: A) => void];
	function useRef<T>(initialValue?: T | null): Ref<T>;
	function useRef<T = unknown>(): Ref<T>;
	function useEffect(effect: EffectCallback, inputs?: Inputs): void;
	function useLayoutEffect(effect: EffectCallback, inputs?: Inputs): void;
	function useCallback<T extends Function>(callback: T, inputs: Inputs): T;
	function useMemo<T>(factory: () => T, inputs: Inputs | undefined): T;
	function useContext<T>(context: PreactContext<T>): T;
}

export const h = preact.h;
export const render = preact.render;
export const createContext = preact.createContext;
export const useState = preactHooks.useState;
export const useEffect = preactHooks.useEffect;
export const useLayoutEffect = preactHooks.useLayoutEffect;
export const useRef = preactHooks.useRef;
export const useMemo = preactHooks.useMemo;
export const useCallback = preactHooks.useCallback;
export const useContext = preactHooks.useContext;

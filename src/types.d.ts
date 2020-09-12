declare function GM_addStyle(style: string): void;
declare function GM_openInTab(
	url: string,
	options?: {
		active?: boolean; // decides whether the new tab should be focused
		insert?: boolean; // inserts the new tab after the current one
		setParent?: boolean; // makes the browser re-focus the current tab on close
		incognito?: boolean; // makes the tab being opened inside a incognito mode/private mode window.
	}
): void;

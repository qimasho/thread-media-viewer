import {syncedSettings} from 'lib/syncedSettings';
import {SERIALIZERS} from './serializers';
import {h, render} from 'lib/preact';
import {ns, throttle} from 'lib/utils';
import {defaultSettings, Settings} from 'settings';
import {MediaWatcher} from 'lib/mediaWatcher';
import {CatalogWatcher} from 'lib/catalogWatcher';
import {ThreadMediaViewer} from 'components/ThreadMediaViewer';
import {CatalogNavigator} from 'components/CatalogNavigator';

// Build and insert styles into dom
import 'styles';

// Check if there is a serializer for this website
const serializer = SERIALIZERS.find((serializer) => serializer.urlMatches.exec(location.host + location.pathname));

if (serializer) {
	const {threadSerializer, catalogSerializer} = serializer;
	const settings = syncedSettings<Settings>(ns('settings'), defaultSettings);
	let mediaWatcher: MediaWatcher | null = null;
	let catalogWatcher: CatalogWatcher | null = null;

	// Create and attach container
	const container = Object.assign(document.createElement('div'), {className: ns('CONTAINER')});
	document.body.appendChild(container);

	const refreshMounts = throttle(() => {
		/**
		 * Un-mount components with detached targets
		 */

		if (mediaWatcher && !document.body.contains(mediaWatcher.container)) {
			render(null, container);
			mediaWatcher.destroy();
			mediaWatcher = null;
		}

		if (catalogWatcher && !document.body.contains(catalogWatcher.container)) {
			render(null, container);
			catalogWatcher.destroy();
			catalogWatcher = null;
		}

		/**
		 * Mount appropriate component for current view
		 */

		if (!mediaWatcher && !catalogWatcher) {
			if (threadSerializer) {
				try {
					// Throws when no container
					mediaWatcher = new MediaWatcher(threadSerializer);
					render(h(ThreadMediaViewer, {settings, watcher: mediaWatcher}), container);
				} catch (error) {}
			}

			if (catalogSerializer) {
				try {
					// Throws when no container
					catalogWatcher = new CatalogWatcher(catalogSerializer);
					render(h(CatalogNavigator, {settings, watcher: catalogWatcher}), container);
				} catch (error) {}
			}
		}
	}, 100);

	// Observer page DOM and mount appropriate components that work with it
	new MutationObserver(refreshMounts).observe(document.body, {childList: true, subtree: true});

	refreshMounts();
}

export type ThemeName = 'light' | 'dark';

const STORAGE_KEY = 'stepwise:theme';

function storedChoice(): ThemeName | null {
	try {
		const value = localStorage.getItem(STORAGE_KEY);
		return value === 'light' || value === 'dark' ? value : null;
	} catch {
		return null;
	}
}

/**
 * Follows the OS until the user picks one; the pick is remembered per browser.
 * app.html applies the same rule before first paint, so there is no flash.
 */
class Theme {
	#choice = $state<ThemeName | null>(storedChoice());
	#systemDark = $state(false);

	constructor() {
		const query = matchMedia('(prefers-color-scheme: dark)');
		this.#systemDark = query.matches;
		query.addEventListener('change', (event) => {
			this.#systemDark = event.matches;
			this.#apply();
		});
	}

	get current(): ThemeName {
		return this.#choice ?? (this.#systemDark ? 'dark' : 'light');
	}

	toggle(): void {
		this.#choice = this.current === 'dark' ? 'light' : 'dark';
		try {
			localStorage.setItem(STORAGE_KEY, this.#choice);
		} catch {
			// Private mode or storage disabled: the choice just lasts for this visit.
		}
		this.#apply();
	}

	#apply(): void {
		document.documentElement.dataset.theme = this.current;
	}
}

export const theme = new Theme();

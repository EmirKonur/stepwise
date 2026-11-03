/** Keys a natively focused control already uses, which shortcuts must not steal. */
const NATIVE_KEYS: Record<string, readonly string[]> = {
	button: [' ', 'Enter'],
	link: ['Enter'],
	radio: [' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'],
	checkbox: [' '],
	range: ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown']
};

function role(element: HTMLElement): string | null {
	if (element instanceof HTMLButtonElement || element.getAttribute('role') === 'button')
		return 'button';
	if (element instanceof HTMLAnchorElement) return 'link';
	if (element instanceof HTMLInputElement) return element.type;
	return null;
}

let pointerAt = 0;
let pointerFocused: EventTarget | null = null;

/**
 * Remembers whether the focused element got focus from a pointer. This cannot
 * be read from `:focus-visible` at keydown time: the key press itself flips
 * the browser into keyboard modality. Label clicks focus their input on the
 * click event, after pointerup, hence the time window rather than a flag.
 */
export function watchFocusOrigin(): () => void {
	const onPointer = () => (pointerAt = performance.now());
	const onFocus = (event: FocusEvent) => {
		pointerFocused = performance.now() - pointerAt < 150 ? event.target : null;
	};
	window.addEventListener('pointerdown', onPointer, true);
	window.addEventListener('click', onPointer, true);
	window.addEventListener('focusin', onFocus, true);
	return () => {
		window.removeEventListener('pointerdown', onPointer, true);
		window.removeEventListener('click', onPointer, true);
		window.removeEventListener('focusin', onFocus, true);
	};
}

/**
 * Whether a global shortcut should handle this key press. Typing fields
 * always keep their keys. Other controls keep their native keys only when
 * they were reached by keyboard; after a mouse click on, say, an algorithm
 * option, Space should still mean play/pause.
 */
export function shortcutAllowed(event: KeyboardEvent): boolean {
	if (event.metaKey || event.ctrlKey || event.altKey) return false;
	const target = event.target;
	if (!(target instanceof HTMLElement)) return true;
	if (target.closest('[data-shortcuts]')) return true;
	if (
		target.isContentEditable ||
		target instanceof HTMLTextAreaElement ||
		target instanceof HTMLSelectElement
	) {
		return false;
	}
	const kind = role(target);
	if (target instanceof HTMLInputElement && kind !== null && !(kind in NATIVE_KEYS)) return false;
	if (kind === null || target === pointerFocused) return true;
	return !(NATIVE_KEYS[kind] ?? []).includes(event.key);
}

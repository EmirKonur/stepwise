import { expect, test } from '@playwright/test';
import { findSort, recordSort } from '../../src/lib/algorithms/sorting/index.ts';

const VALUES = [5, 2, 4, 1, 3];
const SHARED = `/sort?algo=insertion&input=custom&values=${VALUES.join(',')}&step=7`;

/** What the engine says frame `step` looks like; the page must agree. */
function expected(step: number) {
	const insertion = findSort('insertion');
	if (!insertion) throw new Error('insertion sort is not registered');
	const frame = recordSort(insertion, VALUES).seek(step);
	return { line: frame.line, swaps: frame.counts.swaps };
}

test('a shared link opens on the same step, line and counters', async ({ page }) => {
	await page.goto(SHARED);
	const { line, swaps } = expected(7);

	await expect(page.getByTestId('step')).toHaveText(/^0*7$/);
	await expect(page.locator('li[aria-current="step"]')).toHaveAttribute('data-line', String(line));
	await expect(page.getByTestId('counter-swaps')).toHaveText(String(swaps));
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Insertion sort');
});

test('keyboard stepping moves the highlight and rewrites the URL', async ({ page }) => {
	await page.goto(SHARED);
	await expect(page.getByTestId('step')).toHaveText(/^0*7$/);

	await page.keyboard.press('ArrowRight');
	await expect(page.getByTestId('step')).toHaveText(/^0*8$/);
	await expect(page.locator('li[aria-current="step"]')).toHaveAttribute(
		'data-line',
		String(expected(8).line)
	);
	await expect(page).toHaveURL(/[?&]step=8(&|$)/);

	await page.keyboard.press('Home');
	await expect(page.getByTestId('step')).toHaveText(/^0+$/);
	await page.keyboard.press('End');
	await expect(page.getByTestId('caption')).toContainText('Sorted.');
});

test('the path finder reports a found path on a linked final frame', async ({ page }) => {
	await page.goto('/path?algo=dijkstra&size=s&layout=open&seed=1919&step=100000');
	await expect(page.getByTestId('path-status')).toHaveText(/Path found: \d+ moves, cost \d+/);
});

test('a tree insert plays through to its result', async ({ page }) => {
	await page.goto('/tree?algo=avl&ops=i50,i30,i70');
	await page.getByRole('spinbutton').fill('20');
	await page.getByRole('button', { name: 'Insert', exact: true }).click();
	await page.keyboard.press('End');
	await expect(page.getByTestId('caption')).toHaveText(/Inserted 20\./);
});

test('unknown routes get the designed 404', async ({ page }) => {
	await page.goto('/no-such-visualizer');
	await expect(page.getByRole('heading', { name: 'This step is out of range.' })).toBeVisible();
});

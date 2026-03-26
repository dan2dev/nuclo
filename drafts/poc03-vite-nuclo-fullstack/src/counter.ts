let count = 0;

export function counterComponent() {
	return div(
		{ class: 'counter' },
		h1('Nuclo Counter'),
		p({ class: 'count-display' }, () => `Count: ${count}`),
		div(
			{ class: 'buttons' },
			button(on('click', () => { count--; update(); }), '−'),
			button(on('click', () => { count++; update(); }), '+'),
		),
	);
}

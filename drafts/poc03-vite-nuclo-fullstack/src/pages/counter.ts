import { navBar } from '../components/nav.ts';

export function counterPage(pathname: string): NodeModFn<'div'> {
  let count = 0;

  return div(
    { class: 'page counter-page' },
    navBar(pathname),
    main(
      { class: 'content' },
      h1('Counter'),
      p({ class: 'count-display' }, () => String(count)),
      div(
        { class: 'counter-buttons' },
        button(
          { class: 'btn btn-secondary', 'aria-label': 'Decrement' },
          on('click', () => { count--; update(); }),
          '−',
        ),
        button(
          { class: 'btn btn-secondary', 'aria-label': 'Increment' },
          on('click', () => { count++; update(); }),
          '+',
        ),
      ),
      button(
        { class: 'btn btn-ghost', style: 'margin-top:1rem' },
        on('click', () => { count = 0; update(); }),
        'Reset',
      ),
    ),
  );
}

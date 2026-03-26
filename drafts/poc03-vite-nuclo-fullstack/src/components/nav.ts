type NavLink = { href: string; label: string };

const NAV_LINKS: NavLink[] = [
  { href: '/counter', label: 'Counter' },
  { href: '/todo', label: 'Todo' },
];

export function navBar(pathname: string) {
  return header(
    { class: 'navbar' },
    a({ href: '/', class: 'nav-brand' }, 'Nuclo'),
    nav(
      { class: 'nav-links' },
      ...NAV_LINKS.map(({ href, label }) =>
        a({ href, class: pathname === href ? 'nav-link active' : 'nav-link' }, label),
      ),
    ),
  );
}

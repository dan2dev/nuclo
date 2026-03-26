import { setCurrentRoute, type Route } from './router.ts';
import { Header } from './components/Header.ts';
import { Footer } from './components/Footer.ts';

import { HomePage } from './pages/Home.ts';
import { GettingStartedPage } from './pages/GettingStarted.ts';
import { CoreApiPage } from './pages/CoreApi.ts';
import { TagBuildersPage } from './pages/TagBuilders.ts';
import { StylingPage } from './pages/Styling.ts';
import { PitfallsPage } from './pages/Pitfalls.ts';
import { ExamplesPage } from './pages/Examples.ts';
import { CounterExamplePage } from './pages/examples/CounterExample.ts';
import { TodoExamplePage } from './pages/examples/TodoExample.ts';
import { SubtasksExamplePage } from './pages/examples/SubtasksExample.ts';
import { SearchExamplePage } from './pages/examples/SearchExample.ts';
import { AsyncExamplePage } from './pages/examples/AsyncExample.ts';
import { FormsExamplePage } from './pages/examples/FormsExample.ts';
import { NestedExamplePage } from './pages/examples/NestedExample.ts';
import { AnimationsExamplePage } from './pages/examples/AnimationsExample.ts';
import { RoutingExamplePage } from './pages/examples/RoutingExample.ts';
import { StyledCardExamplePage } from './pages/examples/StyledCardExample.ts';

function getPage(route: string): ReturnType<typeof div> {
  switch (route) {
    case 'getting-started': return GettingStartedPage();
    case 'core-api':        return CoreApiPage();
    case 'tag-builders':    return TagBuildersPage();
    case 'styling':         return StylingPage();
    case 'pitfalls':        return PitfallsPage();
    case 'examples':        return ExamplesPage();
    case 'examples/counter':     return CounterExamplePage();
    case 'examples/todo':        return TodoExamplePage();
    case 'examples/subtasks':    return SubtasksExamplePage();
    case 'examples/search':      return SearchExamplePage();
    case 'examples/async':       return AsyncExamplePage();
    case 'examples/forms':       return FormsExamplePage();
    case 'examples/nested':      return NestedExamplePage();
    case 'examples/animations':  return AnimationsExamplePage();
    case 'examples/routing':     return RoutingExamplePage();
    case 'examples/styled-card': return StyledCardExamplePage();
    default:                return HomePage();
  }
}

/**
 * Returns a full-page Nuclo element for SSR rendering.
 * Sets the current route so Header nav highlights correctly.
 */
export function ssrMatchRoute(route: string): ReturnType<typeof div> {
  setCurrentRoute(route as Route);

  return div(
    Header(),
    main({
      id: 'page-container',
      style: {
        minHeight: 'calc(100vh - 160px)',
        paddingTop: '64px',
      },
    }, getPage(route)),
    Footer(),
  );
}

import './style.css';
import 'nuclo';
import { counterComponent } from './counter.ts';

// Replace SSR-rendered HTML with live Nuclo component
const app = document.getElementById('app')!;
app.innerHTML = '';
render(counterComponent(), app);

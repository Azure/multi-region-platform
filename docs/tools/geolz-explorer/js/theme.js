/* theme.js: applies the theme before the first paint (loaded in <head>, so the page never flashes the wrong theme).
   Precedence: ?theme= in the URL > the theme saved in this browser > auto. The theme lives under its own localStorage
   key, separate from the spec; when storage is unavailable the page silently uses auto. */
const THEME_KEY = 'geolz-explorer.theme', THEMES = ['auto', 'light', 'dark'];
const PLANNER_MODE = new URLSearchParams(location.search).get('embed') === 'planner' ? 'embedded' :
  new URLSearchParams(location.search).get('presentation') === 'planner' ? 'presentation' : '';
if (PLANNER_MODE) document.documentElement.classList.add('planner-' + PLANNER_MODE);
const prefGet = key => { try { return window.localStorage.getItem(key); } catch { return null; } };
const prefSet = (key, value) => {
  try { if (value === null) window.localStorage.removeItem(key); else window.localStorage.setItem(key, value); }
  catch { /* storage unavailable: not remembered */ }
};
const saveTheme = theme => prefSet(THEME_KEY, theme), forgetTheme = () => prefSet(THEME_KEY, null);
function startTheme() {
  if (PLANNER_MODE) return 'auto';
  const asked = new URLSearchParams(location.search).get('theme');
  return [asked, prefGet(THEME_KEY)].find(theme => THEMES.includes(theme)) || 'auto';
}
// Auto = no data-theme attribute: the CSS follows prefers-color-scheme.
function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'light' || theme === 'dark') root.setAttribute('data-theme', theme);
  else root.removeAttribute('data-theme');
}
applyTheme(startTheme());

// The app's components expect a browser's globals and a host to ask (fetch). A film's page has neither: these stand
// in, doing nothing, so the components show the world they were built with and nothing else.
const g = globalThis as Record<string, any>;
const noop = () => {};
const store = new Map<string, string>();
const storage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, String(v)), removeItem: (k: string) => void store.delete(k), clear: () => store.clear(), key: () => null, length: 0 };
g.fetch ??= () => new Promise(() => {});
g.window ??= g;
g.addEventListener ??= noop;
g.removeEventListener ??= noop;
g.dispatchEvent ??= () => true;
g.localStorage ??= storage;
g.sessionStorage ??= storage;
g.location ??= { hash: "", href: "raea://film/", origin: "raea://film", pathname: "/", search: "", host: "film", hostname: "film", protocol: "raea:" };
g.navigator ??= { userAgent: "raea", platform: "raea", language: "en", onLine: false, clipboard: {} };
g.matchMedia ??= () => ({ matches: true, media: "", addEventListener: noop, removeEventListener: noop, addListener: noop, removeListener: noop });
g.requestAnimationFrame ??= () => 0;
g.cancelAnimationFrame ??= noop;
g.BroadcastChannel ??= class { postMessage = noop; close = noop; addEventListener = noop; removeEventListener = noop; onmessage = null; };
g.EventSource ??= class { close = noop; addEventListener = noop; removeEventListener = noop; };
g.WebSocket ??= class { close = noop; send = noop; addEventListener = noop; removeEventListener = noop; };
g.ResizeObserver ??= class { observe = noop; unobserve = noop; disconnect = noop; };
g.IntersectionObserver ??= class { observe = noop; unobserve = noop; disconnect = noop; };
g.MutationObserver ??= class { observe = noop; disconnect = noop; takeRecords = () => []; };
g.history ??= { pushState: noop, replaceState: noop, state: null };
export {};
const el = (): any => ({ style: {}, classList: { add: noop, remove: noop, toggle: noop, contains: () => false }, setAttribute: noop, removeAttribute: noop, appendChild: noop, removeChild: noop, addEventListener: noop, removeEventListener: noop, contains: () => false, getBoundingClientRect: () => ({ x: 0, y: 0, left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 }), querySelector: () => null, querySelectorAll: () => [], focus: noop, blur: noop, children: [], childNodes: [] });
g.document ??= { ...el(), body: el(), head: el(), documentElement: el(), activeElement: null, createElement: el, createElementNS: el, createTextNode: el, getElementById: () => null, hasFocus: () => true, visibilityState: "visible", fonts: { ready: Promise.resolve() } };

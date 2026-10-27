// Polyfill XMLHttpRequest for Babylon.js NullEngine testing in Node.js environment
import { XMLHttpRequest } from 'xhr2';
(global as unknown as { XMLHttpRequest: typeof XMLHttpRequest }).XMLHttpRequest = XMLHttpRequest;

// Also polyfill other browser globals that Babylon.js might expect
class HTMLElement {}
(global as unknown as { HTMLElement: typeof HTMLElement }).HTMLElement = HTMLElement;

import {createFilm} from '../../src/php-series/scene.ts';
import film from './film.json';
import captions from './display-captions.json';

// Keep the presentation canvas CPU-backed. GPU-backed 2D copies on this
// Chromium/GB10 path can lose tiles and exhaust the WebGL capture context.
const presentation = document.getElementById('world') as HTMLCanvasElement;
presentation.getContext('2d', {alpha: false, willReadFrequently: true});
createFilm(film, captions);

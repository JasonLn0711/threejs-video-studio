import {createWordpressFilm} from '../../src/php-series/wordpress.ts';
import film from './film.json';
import captions from './display-captions.json';
createWordpressFilm(film,captions);

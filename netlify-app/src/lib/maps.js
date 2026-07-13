/**
 * maps.js — Free Fire map registry
 * 
 * MAP_IMAGES: map name → image URL
 * Custom map images can be uploaded via ImgBB in DesignStudio → Maps tab.
 * Custom images override defaults and are stored in design.mapImages (Firebase).
 */

// Default fallback images — publicly hosted, no CORS issues
export const MAP_IMAGES_DEFAULT = {
  'Bermuda':     'https://static.wikia.nocookie.net/freefire/images/5/5e/Map_FF_Bermuda_allmode.png',
  'Bermuda 2.0': 'https://static.wikia.nocookie.net/freefire/images/c/cf/Map_FF_Bermuda_20_allmode.png',
  'Kalahari':    'https://static.wikia.nocookie.net/freefire/images/a/ab/Map_FF_Kalahari_allmode.png',
  'Purgatory':   'https://static.wikia.nocookie.net/freefire/images/5/5c/Map_FF_Purgatory_allmode.png',
  'Alpine':      'https://static.wikia.nocookie.net/freefire/images/b/b1/Map_FF_Alpine_allmode.png',
  'Nexterra':    'https://static.wikia.nocookie.net/freefire/images/0/0c/Map_FF_Nexterra_allmode.png',
  'Solara':      'https://static.wikia.nocookie.net/freefire/images/4/4d/Map_FF_Solara_allmode.png',
};

export const MAPS = Object.keys(MAP_IMAGES_DEFAULT);

// Runtime map images — starts as defaults, can be overridden by design.mapImages from DB
// The overlay and director panel call getMapImages() to always get the latest merged set.
let _customMapImages = {};

export function setCustomMapImages(customImages = {}) {
  _customMapImages = customImages || {};
}

export function getMapImages() {
  return { ...MAP_IMAGES_DEFAULT, ..._customMapImages };
}

// Legacy export — components that import MAP_IMAGES directly get defaults.
// Use getMapImages() for live custom-override support.
export const MAP_IMAGES = MAP_IMAGES_DEFAULT;

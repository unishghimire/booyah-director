/**
 * maps.js — Free Fire map registry
 *
 * Default map images are empty — users upload custom images via
 * DesignStudio → Maps tab (ImgBB hosted).
 * The Overlay renders an AAA-grade styled fallback when no image is set.
 */

// No default URLs — all dead 3rd-party CDNs are unreliable
// Upload your map images via DesignStudio → Maps tab
export const MAP_IMAGES_DEFAULT = {};

export const MAPS = ['Bermuda','Bermuda 2.0','Kalahari','Purgatory','Alpine','Nexterra','Solara'];

let _customMapImages = {};

export function setCustomMapImages(customImages = {}) {
  _customMapImages = customImages || {};
}

export function getMapImages() {
  return { ..._customMapImages };
}

export const MAP_IMAGES = MAP_IMAGES_DEFAULT;

// One-off data-prep steps for the Voronoi paint layer. These used to live inside the editor,
// which forced it to bundle every slice file. Run them from a throwaway page or the dev console.
// Order: sortCellsBySize -> cropToLandmasses (per batch) -> mergeCroppedBatches -> buildPaintLayer
import * as turf from '@turf/turf';
import { downloadJSON } from './downloadJSON';
import divisibleCutouts from './cutouts_divisible.json';
import indivisibleCutouts from './cutouts_indivisible.json';
import voronoiGeoData from './voronoi_data.json';
import sorted from './sorted_data.json';
import concat from './concat.json';
import slice0 from './cropped_data_0.json';
import slice1000 from './cropped_data_1000.json';
import slice11000 from './cropped_data_11000.json';
import slice21000 from './cropped_data_21000.json';
import slice31000 from './cropped_data_31000.json';
import slice41000 from './cropped_data_41000.json';
import slice51000 from './cropped_data_51000.json';
import slice61000 from './cropped_data_61000.json';

// Saves the raw Voronoi cells largest-first. (Saved as a bare array, same as before;
// wrap it in a FeatureCollection if cropToLandmasses reads it via `.features`.)
export function sortCellsBySize() {
  const features = voronoiGeoData.features;
  features.forEach(f => { f.properties.area = turf.area(f); });
  features.sort((a, b) => b.properties.area - a.properties.area);
  downloadJSON(features, 'sorted_data.json');
}

// Clips cells [startIndex, startIndex + batchLength) to the divisible landmasses.
// Next batch's startIndex = this startIndex + batchLength.
export function cropToLandmasses(startIndex, batchLength = 10000) {
  const cells = sorted.features.slice(startIndex, startIndex + batchLength);
  const pieces = [];
  cells.forEach(cell => {
    divisibleCutouts.features.forEach(cutout => {
      if (!turf.booleanIntersects(cell, cutout)) return;
      const piece = turf.intersect(turf.featureCollection([cell, cutout]));
      if (piece) pieces.push(piece); // edge-only contact yields null
    });
  });
  downloadJSON(turf.featureCollection(pieces), `cropped_data_${startIndex}.json`);
}

export function mergeCroppedBatches() {
  const slices = [slice0, slice1000, slice11000, slice21000, slice31000, slice41000, slice51000, slice61000];
  downloadJSON(turf.featureCollection(slices.flatMap(s => s.features)), 'concat.json');
}

// Cropped cells + indivisible landmasses -> the file you then hand-edit into paint_layer_full_edited.json
export function buildPaintLayer() {
  downloadJSON(turf.featureCollection([...concat.features, ...indivisibleCutouts.features]), 'paint_layer_full.json');
}

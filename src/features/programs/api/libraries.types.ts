// Wire shapes for the reference-library endpoints. Only the calorie-band list
// is consumed today (it drives the diet-plan Category dropdown); the exercise /
// meal / workout-template catalogs are not fetched — the plans are free rich
// text and carry no ids to resolve.

/** `GET /libraries/calorie-bands` response. */
export type CalorieBandsDto = {
  bands: number[]
}

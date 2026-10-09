/**
 * ============================================================
 * MTBP - IndicatorCache
 *
 * Stores indicator instances by:
 * Exchange + Symbol + Timeframe + Indicator
 *
 * ============================================================
 */


class IndicatorCache {


constructor() {

this.cache = new Map();

}





/**
 * Create unique cache key.
 */

buildKey(
exchange,
symbol,
timeframe,
indicator
) {

return `${exchange}:${symbol}:${timeframe}:${indicator}`;

}





/**
 * Check if indicator exists.
 */

has(
exchange,
symbol,
timeframe,
indicator
) {


const key =
this.buildKey(
exchange,
symbol,
timeframe,
indicator
);



return this.cache.has(key);


}





/**
 * Get indicator instance.
 */

get(
exchange,
symbol,
timeframe,
indicator
) {


const key =
this.buildKey(
exchange,
symbol,
timeframe,
indicator
);



return (
this.cache.get(key)
||
null
);


}





/**
 * Store indicator instance.
 */

set(
exchange,
symbol,
timeframe,
indicator,
instance
) {


const key =
this.buildKey(
exchange,
symbol,
timeframe,
indicator
);



this.cache.set(
key,
instance
);


}





/**
 * Remove one indicator.
 */

remove(
exchange,
symbol,
timeframe,
indicator
) {


const key =
this.buildKey(
exchange,
symbol,
timeframe,
indicator
);



this.cache.delete(key);


}





/**
 * Clear all.
 */

clear() {

this.cache.clear();

}





/**
 * Number of cached indicators.
 */

size() {

return this.cache.size;

}





/**
 * Return all keys.
 */

keys() {

return [
...this.cache.keys()
];

}



}


export default new IndicatorCache();
// Supplementary deterministic use case; not infrastructure or a capacity benchmark.
export function reviewBlueprint(settings) {
 const feed=settings.publish&&settings.fanout?['นิด · 10:00','มิน · 10:05']:[];
 if(settings.newest)feed.reverse();
 const missing=['publish','fanout','newest','feedback'].filter(key=>settings[key]!==true);
 return {feed,missing,ready:missing.length===0};
}

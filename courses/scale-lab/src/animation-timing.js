// Presentation milliseconds only: never model time, TTL, API or scoring clocks.
// Edit a lesson/stage here, then rebuild. Experiment and replay share consumers.
export const animationTiming = Object.freeze({
 lab01: Object.freeze({routeMs:1500}),
 lab02: Object.freeze({routeMs:850,blockedHoldMs:1920,blockedFadeMs:480}),
 lab03: Object.freeze({routeMs:2000}),
 lab04: Object.freeze({routeMs:1200}),
 lab05: Object.freeze({routeMs:2000}),
 lab06: Object.freeze({routeMs:2000}),
 lab07: Object.freeze({routeMs:2000}),
 lab08: Object.freeze({routeMs:2000}),
 lab09: Object.freeze({routeMs:2000}),
 lab10: Object.freeze({routeMs:1500}),
 lab11: Object.freeze({routeMs:1500}),
 lab12: Object.freeze({comparisonRouteMs:1500,comparisonCapacityMs:900,placementMs:1200,requestBatchMs:1000,shardingSummaryMs:1600}),
});

// Static source config is deliberately fail-fast, with no silent fallback.
export function validateAnimationTiming(config){
 for(const [lesson,stages] of Object.entries(config))for(const [stage,ms] of Object.entries(stages)){
  if(!Number.isFinite(ms)||ms<=0)throw new RangeError(`${lesson}.${stage} must be finite positive milliseconds`);
 }
}
validateAnimationTiming(animationTiming);

// The blocked timeline has two legs, then a separate endpoint hold and fade.
// Keep the original 48ms opacity lead at the default cadence, proportional to
// a leg (like the normal CSS timeline's visibility windows), not to the hold.
export function workloadBlockedFrames(t=animationTiming.lab02){
 validateAnimationTiming({lab02:t});
 const r=t.routeMs,duration=2*r+t.blockedHoldMs+t.blockedFadeMs;
 const lead=r*(802/850),frame=(ms,offsetDistance,opacity)=>({offset:ms/duration,offsetDistance,opacity});
 return {duration,
  http:[frame(0,'0%',1),frame(lead,`${lead/r*100}%`,1),frame(r,'100%',0),frame(duration,'100%',0)],
  query:[frame(0,'0%',0),frame(lead,'0%',0),frame(r,'0%',1),frame(2*r,'100%',1),frame(2*r+t.blockedHoldMs,'100%',1),frame(duration,'100%',0)],
 };
}

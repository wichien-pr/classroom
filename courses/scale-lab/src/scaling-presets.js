// LAB03 guided scenario preparation, never a scored experiment.
export function scalingPreset(topic){
 if(!Number.isInteger(topic)||topic<0||topic>4)throw Error('Unknown scaling topic');
 return {power:topic===0?1:3,servers:topic<2?1:3,traffic:topic===4?20:3,balanced:topic>=3,down:topic>=2};
}

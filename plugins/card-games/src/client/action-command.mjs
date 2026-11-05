export function actionCommand(proposal){
 const type=proposal?.type;
 switch(type){
  case 'call-landlord':case 'decline':case 'rob':case 'pass':case 'fold':case 'check':case 'call':case 'all-in':
   return {type};
  case 'double':return {type,factor:proposal.factor};
  case 'raise':return {type,raiseTo:proposal.raiseTo};
  case 'play':{
   const {cards,pattern,bodyRanks,moveId}=proposal;
   return {type,cards:[...cards],...(pattern!==undefined&&{pattern}),...(bodyRanks!==undefined&&{bodyRanks:[...bodyRanks]}),...(moveId!==undefined&&{moveId})};
  }
  default:throw Object.assign(Error('Unknown card action'),{code:'GAME_ACTION_INVALID'});
 }
}

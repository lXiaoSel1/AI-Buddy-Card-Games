const normalize=value=>({pending:'waiting',running:'waiting',submitted:'waiting',succeeded:'completed',ready:'completed',error:'failed'}[value]??value);
export function chatReceipt(value,{submissionId,previous=null}={}){
 const user=(value?.messages??[]).find(m=>m.role==='user'&&(m.id===submissionId||m.submissionId===submissionId)),assistant=value?.assistant??value?.assistantReceipt??{};
 const accepted=value?.inputAccepted===true||!!user||previous?.inputAccepted===true;
 let status=normalize(assistant.status??assistant.state??value?.assistantState??previous?.assistantStatus??'unknown');
 if(!['waiting','completed','failed','unavailable','cancelled','unknown','not-requested'].includes(status))status='unknown';
 return {submissionId,inputAccepted:accepted?true:value?.inputAccepted===false?false:null,messageId:value?.messageId??user?.id??previous?.messageId??null,assistantStatus:status,characterId:assistant.characterId??value?.characterId??previous?.characterId??null,requestId:assistant.requestId??previous?.requestId??null,retryAllowed:assistant.retryAllowed===true||assistant.retryAllowed===undefined&&previous?.retryAllowed===true,code:assistant.code??assistant.error?.code??value?.code??null};
}
export function retryChatPayload(original,receipt,newRequestId){const payload={...original,...receipt?.characterId?{characterId:receipt.characterId}:{}};if(receipt?.inputAccepted===true&&receipt.retryAllowed===true&&['failed','cancelled','unavailable'].includes(receipt.assistantStatus)){if(typeof newRequestId!=='string'||!newRequestId||newRequestId===original.submissionId)throw Error('A new assistant request identity is required');payload.retryAssistant=true;payload.replyRequestId=newRequestId;}else{delete payload.retryAssistant;delete payload.replyRequestId;}return payload;}
export function chatStatusText(receipt,busy=false,lang='zh'){
 if(lang==='en'){
  if(!receipt)return busy?'Submitting your message and waiting for the host.':'';
  const saved=receipt.inputAccepted===true?'Your message was saved.':receipt.inputAccepted===false?'Your message was not submitted.':'Message status is unconfirmed. Check before sending it again.';
  const assistant={waiting:'AI is replying.',completed:'AI reply completed.',failed:'AI reply failed.',unavailable:'This character’s chat connection is unavailable.',cancelled:'AI reply cancelled.',unknown:busy?'Waiting for the AI reply receipt.':'AI reply status is unconfirmed.','not-requested':'No AI reply was requested.'}[receipt.assistantStatus]??'AI reply status is unconfirmed.';
  return saved+' '+assistant+(receipt.code?' ('+receipt.code+')':'');
 }
 if(!receipt)return busy?'正在提交消息，等待宿主确认。':'';
 const saved=receipt.inputAccepted===true?'你的消息已保存。':receipt.inputAccepted===false?'你的消息未提交。':'消息保存状态待确认；核对前不要另发重复消息。';
 const assistant={waiting:'AI正在回复。',completed:'AI回复已完成。',failed:'AI回复失败。',unavailable:'当前AI聊天连接不可用。',cancelled:'AI回复已取消。',unknown:busy?'正在等待AI回复回执。':'AI回复结果待确认。','not-requested':'本次未请求AI回复。'}[receipt.assistantStatus]??'AI回复结果待确认。';
 return saved+' '+assistant+(receipt.code?' ('+receipt.code+')':'');
}

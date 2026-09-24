// Shared private-room transport. Credentials stay in this closure and local browser storage.
export class PartyClient {
 constructor(kind,onState,onInk,notice){this.kind=kind;this.onState=onState;this.onInk=onInk;this.notice=notice;this.endpoint=window.ArcadeRooms?.endpoint;this.room=new URLSearchParams(location.search).get('room');this.token=null;this.state=null;this.socket=null;this.epoch=0;this.manual=false;this.attempts=0;}
 key(){return 'duvera.'+(window.ArcadeCreator?.id||'default')+'.'+this.kind+'.room.'+this.room;}
 async enter(create,name,avatar){
  if(!this.endpoint)throw Error('Private rooms are local-only until the room service is deployed.');
  if(!create&&this.room)try{this.token=localStorage.getItem(this.key());}catch{}
  if(create||!this.token){const res=await fetch(this.endpoint+'/party/'+this.kind+'/rooms'+(create?'':'/'+this.room+'/join'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,avatar})});const data=await res.json();if(!res.ok)throw Error(data.error||'Room unavailable.');this.room=data.room||this.room;this.token=data.token;try{localStorage.setItem(this.key(),this.token);}catch{this.notice('Storage unavailable: keep this tab open to retain your seat.');}}
  const url=new URL(location.href);url.searchParams.set('room',this.room);history.replaceState(null,'',url);this.connect();return url.href;
 }
 connect(){
  if(!this.token||!this.room)return;clearTimeout(this.retry);this.manual=false;const epoch=++this.epoch;this.socket?.close();
  const ws=new WebSocket(this.endpoint.replace(/^http/,'ws')+'/party/'+this.kind+'/rooms/'+this.room+'/socket');this.socket=ws;let welcomed=false;this.notice('Connecting…');
  ws.onopen=()=>{if(epoch===this.epoch)ws.send(JSON.stringify({type:'auth',token:this.token}));};
  ws.onmessage=e=>{if(epoch!==this.epoch)return;let m;try{m=JSON.parse(e.data);}catch{return;}if(m.type==='state'){if(this.state&&m.revision<this.state.revision)return;this.attempts=0;this.state=m;if(!welcomed){this.notice('Connected. Invite only.');welcomed=true;}this.onState(m);}else if(m.type==='ink')this.onInk(m);else if(m.type==='error')this.notice(m.message);};
  ws.onclose=e=>{if(epoch!==this.epoch)return;this.notice(e.reason||'Disconnected. Reconnecting…');this.onDisconnect?.();if(!this.manual&&![1000,1008,1009].includes(e.code)&&this.attempts<5){this.retry=setTimeout(()=>this.connect(),Math.min(5000,500*2**this.attempts++));}};
  ws.onerror=()=>this.notice('Cannot reach rooms. Check the connection and reconnect.');
 }
 send(type,extra={}){if(this.socket?.readyState!==1){this.notice('Disconnected. Reconnect before sending.');return false;}this.socket.send(JSON.stringify({type,id:crypto.randomUUID(),roundId:this.state?.roundId,canvasVersion:this.state?.canvasVersion,...extra}));return true;}
 sync(){if(this.socket?.readyState===1)this.socket.send('{"type":"sync"}');}
 leave(){this.send('leave');this.manual=true;clearTimeout(this.retry);try{localStorage.removeItem(this.key());}catch{}this.token=null;}
}

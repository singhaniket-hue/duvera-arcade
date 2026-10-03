import {inspectAudio,MAX_BYTES} from './audio-upload-format.mjs';
const $=id=>document.getElementById(id),form=$('submission-form'),input=$('audio-file'),preview=$('local-preview'),button=$('send-clip'),status=$('submission-status');
let blobURL=null,valid=false,busy=false;
const endpoint=window.ArcadeSubmissions?.endpoint,creator=window.ArcadeCreator?.id;
function message(text,error=false){status.textContent=text;status.dataset.error=String(error);}
function clearPreview(){preview.pause();preview.removeAttribute('src');preview.load();preview.hidden=true;if(blobURL)URL.revokeObjectURL(blobURL);blobURL=null;}
input.addEventListener('change',async()=>{valid=false;clearPreview();$('file-detail').textContent='';const file=input.files[0];if(!file)return;try{if(file.size>MAX_BYTES)throw new Error('This file is too large. Use a clip of at most 1 MiB.');const info=inspectAudio(await file.arrayBuffer());if(input.files[0]!==file)return;blobURL=URL.createObjectURL(file);preview.src=blobURL;preview.hidden=false;valid=true;$('file-detail').textContent=`${info.duration.toFixed(2)} seconds · ${Math.ceil(info.bytes/1024)} KiB. Listen before sending.`;message('');}catch(error){message(error.message,true);}});
preview.addEventListener('error',()=>{valid=false;message('Your browser could not play this file. Try exporting a fresh MP3 or PCM WAV.',true);});
form.addEventListener('submit',async event=>{event.preventDefault();if(busy)return;if(!endpoint||!creator){message('Clip submissions are temporarily unavailable. Please try later.',true);return;}if(!valid){message('Choose a valid short MP3 or WAV clip first.',true);return;}const data=new FormData(form),start=Number(data.get('start')),end=Number(data.get('end'));if(end<=start||end-start>30){message('Source end must follow start, covering at most 30 seconds.',true);return;}
  busy=true;button.disabled=true;button.textContent='Sending…';preview.pause();message('Uploading for private review…');
  try{const response=await fetch(endpoint+'/submit/'+encodeURIComponent(creator),{method:'POST',body:data,signal:AbortSignal.timeout(30000)});const result=await response.json();if(!response.ok)throw new Error(result.error||'Upload failed.');form.reset();valid=false;clearPreview();$('file-detail').textContent='';message(result.message+' Reference: '+result.id);status.focus();}
  catch(error){message(error.name==='TimeoutError'?'The connection timed out. The upload may have arrived; retrying the same file will not duplicate it.':error.message,true);}
  finally{busy=false;button.disabled=false;button.textContent='Send for review';}
});
if(!endpoint){button.disabled=true;message('Clip submissions are temporarily unavailable. Please try later.',true);}
document.addEventListener('visibilitychange',()=>{if(document.hidden)preview.pause();});window.addEventListener('pagehide',clearPreview);

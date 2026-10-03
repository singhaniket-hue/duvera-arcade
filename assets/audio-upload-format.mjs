// Shared byte-level checks. Files remain untrusted, private review candidates.
export const MAX_BYTES = 1024 * 1024;
export const MAX_SECONDS = 15;
const fail = () => { throw new Error('Use a complete MP3 or uncompressed PCM WAV clip, 0.2–15 seconds and at most 1 MiB.'); };
export function inspectAudio(input) {
  const b = new Uint8Array(input);
  if (b.length < 44 || b.length > MAX_BYTES) fail();
  const text = (i,n) => String.fromCharCode(...b.subarray(i,i+n));
  let duration = 0, type, extension;
  if (text(0,4)==='RIFF' && text(8,4)==='WAVE') {
    const v=new DataView(b.buffer,b.byteOffset,b.byteLength);
    if(v.getUint32(4,true)+8!==b.length)fail();
    let fmt=null,size=null,i=12;
    for(;i+8<=b.length;){const n=v.getUint32(i+4,true),end=i+8+n;if(end>b.length)fail();
      if(text(i,4)==='fmt '){if(fmt||n<16)fail();fmt={codec:v.getUint16(i+8,true),channels:v.getUint16(i+10,true),rate:v.getUint32(i+12,true),bytes:v.getUint32(i+16,true),align:v.getUint16(i+20,true),bits:v.getUint16(i+22,true)};}
      if(text(i,4)==='data'){if(size!==null)fail();size=n;}
      i=end+(n%2);if(i>b.length)fail();
    }
    if(i!==b.length||!fmt||size===null||fmt.codec!==1||![1,2].includes(fmt.channels)||![8,16,24,32].includes(fmt.bits)||fmt.rate<8000||fmt.rate>96000||fmt.align!==fmt.channels*fmt.bits/8||fmt.bytes!==fmt.rate*fmt.align||size%fmt.align)fail();
    duration=size/fmt.bytes;type='audio/wav';extension='wav';
  } else {
    let i=0,frames=0;
    if(text(0,3)==='ID3'){if(b[3]<2||b[3]>4||[6,7,8,9].some(n=>b[n]>127))fail();i=10+(b[6]*2097152+b[7]*16384+b[8]*128+b[9])+((b[3]===4&&(b[5]&16))?10:0);}
    const end=text(b.length-128,3)==='TAG'?b.length-128:b.length;
    while(i<end){if(i+4>end||b[i]!==255||(b[i+1]&224)!==224)fail();const ver=(b[i+1]>>3)&3,layer=(b[i+1]>>1)&3,rateIndex=(b[i+2]>>2)&3,bitIndex=b[i+2]>>4;
      if(ver===1||layer!==1||rateIndex===3||bitIndex===0||bitIndex===15)fail();
      const rate=[44100,48000,32000][rateIndex]/(ver===3?1:ver===2?2:4);
      const bitrate=(ver===3?[0,32,40,48,56,64,80,96,112,128,160,192,224,256,320]:[0,8,16,24,32,40,48,56,64,80,96,112,128,144,160])[bitIndex];
      const length=Math.floor((ver===3?144000:72000)*bitrate/rate)+((b[i+2]>>1)&1);if(i+length>end)fail();
      duration+=(ver===3?1152:576)/rate;i+=length;frames++;if(duration>MAX_SECONDS+.05)fail();
    }
    if(frames<2)fail();type='audio/mpeg';extension='mp3';
  }
  if(duration<.2||duration>MAX_SECONDS+.05)fail();
  return {duration:Math.round(duration*1000)/1000,type,extension,bytes:b.length};
}

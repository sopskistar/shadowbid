"""Reproducible trims and original audio master. Never reads private keys or receipts."""
from pathlib import Path
import json, subprocess, wave, re
root=Path(__file__).resolve().parents[1]
ffmpeg=root/'node_modules/ffmpeg-static/ffmpeg'
probe=root/'node_modules/@remotion/compositor-linux-x64-gnu/ffprobe'
assert ffmpeg.exists(), 'Install ffmpeg-static first'
manifest=json.loads((root/'.private/capture-manifest.json').read_text())
clips={c['name']:c for c in manifest['clips']}
def mark(name,label):return next(m['second'] for m in clips[name]['marks'] if m['label']==label)
def run(args):
 result=subprocess.run([str(ffmpeg),'-hide_banner','-loglevel','error','-y',*map(str,args)],capture_output=True,text=True)
 if result.returncode:raise RuntimeError(result.stderr[:2000])
def duration(p):return float(subprocess.check_output([str(probe),'-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',str(p)],text=True).strip())
# start, source duration, output duration; longer output holds the last authentic frame.
shots=[
 ('live-inventory','production',mark('production','inventory')-.3,8,8),
 ('live-detail','production',mark('production','detail'),6,6),
 ('live-result','production',mark('production','detail'),6.1,11),
 ('seal-bid','bidder',mark('bidder','form')-.5,13,17),
 ('receipt','practice',mark('practice','seal-A')-.4,5,5),
 ('time-compressed','practice',mark('practice','receipt-B')+4,mark('practice','reveal-phase')-mark('practice','receipt-B')-5,3),
 ('invalid-reveal','practice',mark('practice','invalid-upload')-.6,5.2,6),
 ('valid-reveal','practice',mark('practice','valid-upload-A')-.5,8,8),
 ('practice-winner','practice',mark('practice','winner'),4,4),
 ('public-result','public-result',mark('public-result','final-price'),6.5,11),
 ('checkout','bidder',mark('bidder','checkout'),5,5),
]
for name,source,start,source_duration,target_duration in shots:
 target=root/f'public/captures/{name}.mp4'
 if not target.exists():
  filters=[]
  if source_duration>target_duration+.01:filters.append(f'setpts=PTS*{target_duration/source_duration:.9f}')
  elif target_duration>source_duration+.01:filters.append(f'tpad=stop_mode=clone:stop_duration={target_duration-source_duration+1}')
  filters+=['fps=30','format=yuv420p']
  run(['-ss',start,'-t',source_duration,'-i',root/clips[source]['source'],'-vf',','.join(filters),'-t',target_duration,'-an','-c:v','libx264','-preset','fast','-crf','18','-movflags','+faststart','-threads','2',target])
 print('Edited:',name,round(duration(target),3),'seconds',flush=True)
(root/'docs/edit-decision-list.json').write_text(json.dumps([{'name':n,'source':s,'source_start':st,'source_duration':sd,'output_duration':td,'time_compressed':sd>td+.01,'last_frame_hold':td>sd+.01} for n,s,st,sd,td in shots],indent=2))
scenes=json.loads((root/'scripts/narration.json').read_text());schedule=[];captions=[]
for scene in scenes:
 paths=[root/f"public/audio/{scene['id']}-{i}.wav" for i in range(len(scene['lines']))]
 lengths=[duration(p) for p in paths]
 slot=scene['end']-scene['start']; speed=max(1,sum(lengths)/(slot-1.6-.2*(len(paths)-1)))
 assert speed<1.18, f"Narration too fast in {scene['id']}"
 lengths=[n/speed for n in lengths];gap=min(1.8,max(.2,(slot-1.6-sum(lengths))/max(1,len(paths)-1)))
 time=scene['start']+.7
 for index,(p,seconds,text) in enumerate(zip(paths,lengths,scene['lines'])):
  edited=root/f"public/audio/mix-{scene['id']}-{index}.wav"
  run(['-i',p,'-af',f'atempo={speed:.6f},loudnorm=I=-18:TP=-2:LRA=7','-ar','48000','-ac','2',edited])
  seconds=duration(edited);schedule.append({'scene':scene['id'],'file':str(edited.relative_to(root/'public')),'start':time,'duration':seconds,'text':text,'speed':speed})
  # Sentence-level timing comes from each generated clip. Long sentences split at word boundaries.
  words=text.split();groups=[];chunk=[]
  for word in words:
   if chunk and len(' '.join(chunk+[word]))>67:groups.append(chunk);chunk=[]
   chunk.append(word)
  if chunk:groups.append(chunk)
  offset=0
  for group in groups:
   fraction=len(group)/len(words);length=seconds*fraction
   captions.append({'text':' '.join(group),'startMs':round((time+offset)*1000),'endMs':round((time+offset+length)*1000),'timestampMs':None,'confidence':None});offset+=length
  time+=seconds+gap
 assert time-gap<=scene['end']-.15,(scene['id'],time,scene['end'])
 print('Narration timed:',scene['id'],'speed',round(speed,3),'end',round(time-gap,2),flush=True)
inputs=[];filters=[]
for i,item in enumerate(schedule):inputs+=['-i',root/'public'/item['file']];filters.append(f"[{i}:a]adelay={round(item['start']*1000)}:all=1[a{i}]")
filters.append(''.join(f'[a{i}]' for i in range(len(schedule)))+f'amix=inputs={len(schedule)}:normalize=0,apad,atrim=duration=120[voice]')
voice=root/'public/audio/narration.wav';run([*inputs,'-filter_complex',';'.join(filters),'-map','[voice]','-ar','48000','-ac','2',voice])
# A quiet original score sits below narration; no third-party music assets.
raw=root/'public/audio/premaster.wav'
run(['-i',voice,'-i',root/'public/audio/original-score.wav','-filter_complex','[1:a]volume=0.45[m];[0:a][m]amix=inputs=2:normalize=0,atrim=duration=120[out]','-map','[out]','-ar','48000','-ac','2',raw])
analysis=subprocess.run([str(ffmpeg),'-hide_banner','-i',str(raw),'-af','loudnorm=I=-16:TP=-1:LRA=9:print_format=json','-f','null','-'],capture_output=True,text=True,check=True).stderr
stats=json.JSONDecoder().raw_decode(analysis[analysis.rfind('{'):])[0];(root/'output/loudness-premaster.json').write_text(json.dumps(stats,indent=2))
normalizer=f"loudnorm=I=-16:TP=-1:LRA=9:measured_I={stats['input_i']}:measured_TP={stats['input_tp']}:measured_LRA={stats['input_lra']}:measured_thresh={stats['input_thresh']}:offset={stats['target_offset']}:linear=true:print_format=json"
run(['-i',raw,'-af',normalizer,'-ar','48000','-ac','2',root/'public/audio/master.wav'])
(root/'src/captions.json').write_text(json.dumps(captions,indent=2));(root/'docs/narration-timing.json').write_text(json.dumps(schedule,indent=2))
def srt_time(ms):
 h,rem=divmod(ms,3600000);m,rem=divmod(rem,60000);s,ms=divmod(rem,1000);return f'{h:02d}:{m:02d}:{s:02d},{ms:03d}'
srt='\n\n'.join(f"{i+1}\n{srt_time(c['startMs'])} --> {srt_time(c['endMs'])}\n{c['text']}" for i,c in enumerate(captions))+'\n'
(root/'output/shadowbid-zecathon-demo.srt').write_text(srt);(root/'docs/subtitles.srt').write_text(srt)
print('Audio and subtitles ready: 120 seconds, target -16 LUFS / -1 dBTP.',flush=True)

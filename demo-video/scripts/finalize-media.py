"""Create the 117-second submission cut without overwriting the original master.

Keep all scenes and original voice assets. Omit one redundant closing sentence;
move the existing final invitation earlier, preserving natural voice speed.
"""
import json
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parents[1]
ffmpeg = root / 'node_modules/ffmpeg-static/ffmpeg'
schedule = json.loads((root / 'docs/narration-timing.json').read_text())
schedule = [s for s in schedule if s['file'] != 'audio/mix-closing-2.wav']
schedule[-1]['start'] = 113.298917
inputs, filters, captions = [], [], []
for i, item in enumerate(schedule):
    inputs += ['-i', str(root / 'public' / item['file'])]
    filters.append(f"[{i}:a]adelay={round(item['start'] * 1000)}:all=1[a{i}]")
    # One readable sentence-level cue per generated utterance, at its actual timing.
    captions.append({'text': item['text'], 'startMs': round(item['start'] * 1000),
                     'endMs': round((item['start'] + item['duration']) * 1000)})
n = len(schedule)
inputs += ['-i', str(root / 'public/audio/original-score.wav')]
filters.append(f'[{n}:a]volume=0.45,afade=t=out:st=115.6:d=1.4[m]')
filters.append(''.join(f'[a{i}]' for i in range(n)) +
               f'[m]amix=inputs={n+1}:normalize=0,apad,atrim=duration=117,afade=t=out:st=116.2:d=0.8[out]')
raw = root / 'public/audio/premaster-117.wav'
def run(args):
    subprocess.run([str(ffmpeg), '-hide_banner', '-loglevel', 'error', '-y', *args], check=True)
run([*inputs, '-filter_complex', ';'.join(filters), '-map', '[out]', '-ar', '48000', '-ac', '2', str(raw)])
analysis = subprocess.run([str(ffmpeg), '-hide_banner', '-i', str(raw), '-af',
    'loudnorm=I=-16:TP=-1:LRA=9:print_format=json', '-f', 'null', '-'], capture_output=True, text=True, check=True).stderr
stats = json.JSONDecoder().raw_decode(analysis[analysis.rfind('{'):])[0]
normalizer = (f"loudnorm=I=-16:TP=-1:LRA=9:measured_I={stats['input_i']}:measured_TP={stats['input_tp']}:"
    f"measured_LRA={stats['input_lra']}:measured_thresh={stats['input_thresh']}:offset={stats['target_offset']}:linear=true")
run(['-i', str(raw), '-af', normalizer, '-ar', '48000', '-ac', '2', str(root / 'public/audio/master-117.wav')])
(root / 'src/captions-final.json').write_text(json.dumps(captions, indent=2) + '\n')
(root / 'docs/narration-timing-final.json').write_text(json.dumps(schedule, indent=2) + '\n')
def timestamp(ms):
    h, rem = divmod(ms, 3600000)
    m, rem = divmod(rem, 60000)
    s, ms = divmod(rem, 1000)
    return f'{h:02d}:{m:02d}:{s:02d},{ms:03d}'
srt = '\n\n'.join(f"{i+1}\n{timestamp(c['startMs'])} --> {timestamp(c['endMs'])}\n{c['text']}" for i,c in enumerate(captions)) + '\n'
(root / 'docs/subtitles-final.srt').write_text(srt)
(root / 'output/shadowbid-zecathon-demo.srt').write_text(srt)
print(f'117-second master and {len(captions)} synchronized subtitle cues ready.')

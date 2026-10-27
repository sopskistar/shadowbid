"""Time the revised narration and mix a new master, preserving the original film."""
import json
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parents[1]
ffmpeg = root / 'node_modules/ffmpeg-static/ffmpeg'
probe = root / 'node_modules/@remotion/compositor-linux-x64-gnu/ffprobe'

def run(args):
    subprocess.run([str(ffmpeg), '-hide_banner', '-loglevel', 'error', '-y', *map(str, args)], check=True)

def duration(path):
    return float(subprocess.check_output([str(probe), '-v', 'error', '-show_entries',
        'format=duration', '-of', 'default=nw=1:nk=1', str(path)], text=True))

schedule = []
for scene in json.loads((root / 'scripts/narration.json').read_text()):
    paths = [root / f"public/audio/{scene['id']}-{i}.wav" for i in range(len(scene['lines']))]
    lengths = [duration(p) for p in paths]
    slot = scene['end'] - scene['start']
    speed = max(1, sum(lengths) / (slot - 1.4 - .25 * (len(paths) - 1)))
    assert speed <= 1.18, f"Rewrite narration to fit naturally: {scene['id']}"
    adjusted = [v / speed for v in lengths]
    gap = min(1.4, max(.25, (slot - 1.4 - sum(adjusted)) / max(1, len(paths) - 1)))
    start = scene['start'] + .6
    for i, (path, text) in enumerate(zip(paths, scene['lines'])):
        target = root / f"public/audio/mix-{scene['id']}-{i}.wav"
        run(['-i', path, '-af', f'atempo={speed:.6f},loudnorm=I=-18:TP=-2:LRA=7',
             '-ar', '48000', '-ac', '2', target])
        seconds = duration(target)
        schedule.append({'scene': scene['id'], 'file': str(target.relative_to(root / 'public')),
                         'start': start, 'duration': seconds, 'text': text, 'speed': speed})
        start += seconds + gap
    assert start - gap < scene['end'] - .1
    print(scene['id'], 'ends', round(start-gap, 3), 'speed', round(speed, 3), flush=True)

inputs, filters, captions = [], [], []
for i, line in enumerate(schedule):
    inputs += ['-i', root / 'public' / line['file']]
    filters.append(f"[{i}:a]adelay={round(line['start']*1000)}:all=1[a{i}]")
    captions.append({'text': line['text'], 'startMs': round(line['start']*1000),
                     'endMs': round((line['start']+line['duration'])*1000)})
n = len(schedule)
inputs += ['-i', root / 'public/audio/original-score.wav']
filters += [f'[{n}:a]volume=0.45,afade=t=out:st=115.6:d=1.4[m]',
    ''.join(f'[a{i}]' for i in range(n)) + f'[m]amix=inputs={n+1}:normalize=0,apad,atrim=duration=117,afade=t=out:st=116.2:d=0.8[out]']
raw = root / 'public/audio/premaster-revised.wav'
run([*inputs, '-filter_complex', ';'.join(filters), '-map', '[out]', '-ar', '48000', '-ac', '2', raw])
analysis = subprocess.run([str(ffmpeg), '-hide_banner', '-i', str(raw), '-af',
    'loudnorm=I=-16:TP=-1:LRA=9:print_format=json', '-f', 'null', '-'], capture_output=True, text=True, check=True).stderr
stats = json.JSONDecoder().raw_decode(analysis[analysis.rfind('{'):])[0]
normalizer = (f"loudnorm=I=-16:TP=-1:LRA=9:measured_I={stats['input_i']}:measured_TP={stats['input_tp']}:"
    f"measured_LRA={stats['input_lra']}:measured_thresh={stats['input_thresh']}:offset={stats['target_offset']}:linear=true")
run(['-i', raw, '-af', normalizer, '-ar', '48000', '-ac', '2', root / 'public/audio/master-revised.wav'])
(root / 'src/captions-revised.json').write_text(json.dumps(captions, indent=2)+'\n')
(root / 'docs/narration-timing-revised.json').write_text(json.dumps(schedule, indent=2)+'\n')
def timestamp(ms):
    h, rem = divmod(ms, 3600000); m, rem = divmod(rem, 60000); s, ms = divmod(rem, 1000)
    return f'{h:02d}:{m:02d}:{s:02d},{ms:03d}'
srt = '\n\n'.join(f"{i+1}\n{timestamp(c['startMs'])} --> {timestamp(c['endMs'])}\n{c['text']}" for i,c in enumerate(captions))+'\n'
(root / 'docs/subtitles-revised.srt').write_text(srt)
(root / 'output/shadowbid-zecathon-demo-revised.srt').write_text(srt)
print('Revised 117-second master and synchronized captions ready.')

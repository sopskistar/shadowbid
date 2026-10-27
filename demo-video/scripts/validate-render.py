"""Validate the exported MP4 and save inspectable reports and scene samples."""
import hashlib
import json
import re
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parents[1]
output = root / 'output'
video = output / 'shadowbid-zecathon-demo-revised.mp4'
ffmpeg = root / 'node_modules/ffmpeg-static/ffmpeg'
probe = root / 'node_modules/@remotion/compositor-linux-x64-gnu/ffprobe'
assert video.is_file() and video.stat().st_size > 1_000_000, 'Final MP4 missing or empty'
info = json.loads(subprocess.check_output([str(probe), '-v', 'error', '-show_format', '-show_streams', '-of', 'json', str(video)], text=True))
v = next(s for s in info['streams'] if s['codec_type'] == 'video')
a = next(s for s in info['streams'] if s['codec_type'] == 'audio')
assert (v['codec_name'], v['width'], v['height']) == ('h264', 1920, 1080)
# FFprobe calls full-range 8-bit 4:2:0 yuvj420p. Remotion's JPEG
# render pipeline can legitimately produce this instead of limited-range YUV.
assert v['pix_fmt'] in ('yuv420p', 'yuvj420p'), 'Expected 8-bit 4:2:0 video'
if v['pix_fmt'] == 'yuvj420p':
    assert v.get('color_range') == 'pc', 'Full-range video must be tagged correctly'
assert a['codec_name'] == 'aac' and int(a['channels']) == 2
assert 116.9 <= float(info['format']['duration']) <= 118, 'Submission duration out of range'
assert abs(float(v['duration']) - float(a['duration'])) < .1, 'A/V durations differ'
analysis = subprocess.run([str(ffmpeg), '-hide_banner', '-i', str(video), '-vf',
    'blackdetect=d=0.4:pix_th=0.02:pic_th=0.99', '-af',
    'silencedetect=n=-55dB:d=1,loudnorm=I=-16:TP=-1:LRA=9:print_format=json',
    '-f', 'null', '-'], capture_output=True, text=True, check=True).stderr
(output / 'revised-av-analysis.log').write_text(analysis)
assert 'black_start:' not in analysis, 'Review detected black section'
assert 'silence_start:' not in analysis, 'Review detected silent section'
loudness = json.JSONDecoder().raw_decode(analysis[analysis.rfind('{'):])[0]
captions = json.loads((root / 'src/captions-revised.json').read_text())
schedule = json.loads((root / 'docs/narration-timing-revised.json').read_text())
assert len(captions) == len(schedule)
for cue, line in zip(captions, schedule):
    assert cue['text'] == line['text']
    assert 0 <= cue['startMs'] < cue['endMs'] < 117000
    assert cue['startMs'] == round(line['start'] * 1000)
assert all(captions[i]['endMs'] <= captions[i+1]['startMs'] for i in range(len(captions)-1))
frames = output / 'validated-frames-revised'
frames.mkdir(exist_ok=True)
times = [1, 7, 18, 24, 28, 34, 42, 51, 56, 61, 66, 73, 78, 84, 93, 99, 107, 112, 115]
for second in times:
    subprocess.run([str(ffmpeg), '-hide_banner', '-loglevel', 'error', '-y', '-ss', str(second), '-i', str(video),
        '-frames:v', '1', str(frames / f'{second:03d}.png')], check=True)
subprocess.run([str(ffmpeg), '-hide_banner', '-loglevel', 'error', '-y', '-i', str(video),
    '-vf', 'fps=1/6,scale=480:270,tile=4x5', '-frames:v', '1', str(output / 'revised-contact-sheet.jpg')], check=True)
report = {'file': str(video), 'bytes': video.stat().st_size,
    'sha256': hashlib.file_digest(video.open('rb'), 'sha256').hexdigest(),
    'duration_seconds': float(info['format']['duration']), 'video_codec': v['codec_name'],
    'resolution': [v['width'], v['height']], 'fps': v['avg_frame_rate'],
    'pixel_format': v['pix_fmt'], 'color_range': v.get('color_range'),
    'audio_codec': a['codec_name'], 'audio_channels': a['channels'],
    'loudness': loudness, 'black_sections_over_0_4s': 0, 'silence_sections_over_1s': 0,
    'synchronized_utterance_captions': len(captions), 'sampled_scene_times': times,
    'visual_review_required': True}
(output / 'validation-revised.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))

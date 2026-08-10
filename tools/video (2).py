from __future__ import annotations

import io
import math
import random
import struct
import subprocess
import sys
import tempfile
import wave
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEPS = ROOT / ".video-deps"
if DEPS.exists():
    sys.path.insert(0, str(DEPS))

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps
import imageio_ffmpeg

WIDTH = 720
HEIGHT = 1280
FPS = 24
DURATION = 62
TOTAL_FRAMES = FPS * DURATION
OUTPUT_FILENAME = "video (2).mp4"
OUTPUT = ROOT / "assets" / "gift-videos" / OUTPUT_FILENAME
SOURCE_ROOT = ROOT / "assets" / "gift-videos" / "for_videos"
PREVIEW_DIR = ROOT / "assets" / "gift-videos" / "_preview"

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
VIDEO_EXTENSIONS = {".mp4", ".mov", ".m4v"}
VIDEO_FRAME_WIDTH = 450
VIDEO_FRAME_HEIGHT = 800


def first_existing(paths: list[str]) -> str | None:
    for path in paths:
        if Path(path).exists():
            return path
    return None


FONT_REGULAR = first_existing(
    [
        "C:/Windows/Fonts/NotoSansKR-VF.ttf",
        "C:/Windows/Fonts/malgun.ttf",
        "/mnt/c/Windows/Fonts/NotoSansKR-VF.ttf",
        "/mnt/c/Windows/Fonts/malgun.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
)
FONT_BOLD = first_existing(
    [
        "C:/Windows/Fonts/malgunbd.ttf",
        "C:/Windows/Fonts/NotoSansKR-VF.ttf",
        "/mnt/c/Windows/Fonts/malgunbd.ttf",
        "/mnt/c/Windows/Fonts/NotoSansKR-VF.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ]
)


def font(path: str | None, size: int) -> ImageFont.FreeTypeFont:
    if path is None:
        return ImageFont.load_default(size=size)
    return ImageFont.truetype(path, size=size)


TITLE = font(FONT_BOLD, 54)
TITLE_SMALL = font(FONT_BOLD, 44)
SUBTITLE = font(FONT_REGULAR, 29)
SUBTITLE_SMALL = font(FONT_REGULAR, 24)
CREDIT = font(FONT_REGULAR, 22)


@dataclass
class PhotoAsset:
    path: Path
    image: Image.Image
    category: str


@dataclass
class VideoAsset:
    path: Path
    frames: list[Image.Image]
    label: str


@dataclass
class Scene:
    start: float
    end: float
    kind: str
    asset_key: str
    title: str
    subtitle: str
    text_y: int
    pan_from: tuple[float, float]
    pan_to: tuple[float, float]
    zoom_from: float
    zoom_to: float
    grade: tuple[int, int, int]
    text_align: str = "center"


PHOTOS: dict[str, list[PhotoAsset]] = {"couple": [], "memories": []}
VIDEOS: dict[str, VideoAsset] = {}

# _8 영상에 쓰는 사진은 여기에서 직접 지정합니다.
# category는 assets/gift-videos/for_videos 아래 폴더명입니다.
# 사진 1장: "slot_name": ("couple", "for_videos (9).jpg")
# 장면 안에서 두 사진을 전환할 때: "slot_name": [("memories", "...jpg"), ("memories", "...jpg")]
SCENE_PHOTOS: dict[str, tuple[str, str] | list[tuple[str, str]]] = {
    "cute_start": ("couple", "for_videos (8).jpg"),
    "awkward_start": ("couple", "for_videos (10).jpg"),
    "memory_sequence": [
        ("memories", "for_videos (7).jpg"),
        ("memories", "for_videos (8).jpg"),
    ],
    "stronger_love": ("memories", "for_videos (9).jpg"),
    "look_alike": ("couple", "for_videos (29).jpg"),
    "shining": ("couple", "for_videos (34).jpg"),
    "holding_hands": ("couple", "for_videos (35).jpg"),
}

SCENES = [
    Scene(0.0, 5.5, "photo", "cute_start", "우리의 귀여운", "러브스토리 시작!", 730, (0.42, 0.64), (0.52, 0.56), 1.08, 1.18, (34, 22, 36)),
    Scene(5.5, 11.0, "photo", "awkward_start", "처음엔 조금", "어색했던 우리도", 885, (0.52, 0.76), (0.48, 0.62), 1.04, 1.14, (23, 34, 42)),
    Scene(11.0, 17.8, "video", "clip_4_live", "이제 많은 사람들 앞에서", "사랑도 외쳐보고", 935, (0.50, 0.50), (0.50, 0.50), 1.00, 1.05, (21, 26, 32)),
    Scene(17.8, 23.6, "photo_sequence", "memory_sequence", "재미난 추억도", "많이 쌓으면서", 188, (0.44, 0.40), (0.55, 0.47), 1.10, 1.20, (40, 26, 24), "left"),
    Scene(23.6, 29.4, "photo", "stronger_love", "우리의 사랑은", "더 단단해지고 있어", 980, (0.60, 0.52), (0.44, 0.48), 1.07, 1.17, (25, 36, 26)),
    Scene(29.4, 35.4, "video", "clip_1_motion", "함께 있으면", "작은 것에도 웃음이 나고", 912, (0.50, 0.50), (0.50, 0.50), 1.00, 1.06, (36, 25, 42)),
    Scene(35.4, 41.6, "photo", "look_alike", "이제는 꽤나 많이", "닮아가는 우리", 204, (0.36, 0.58), (0.58, 0.48), 1.05, 1.16, (35, 24, 30), "right"),
    Scene(41.6, 48.0, "video", "clip_2_memory", "조금 엉성할지라도", "서로에게 향하는 마음만은", 910, (0.50, 0.50), (0.50, 0.50), 1.00, 1.04, (28, 29, 40)),
    Scene(48.0, 54.4, "photo", "shining", "너무나", "눈이 부셔", 900, (0.52, 0.54), (0.46, 0.48), 1.08, 1.18, (44, 30, 25)),
    Scene(54.4, 62.0, "photo", "holding_hands", "앞으로도 두 손 꼭 잡고", "함께 하자, 사랑해♥", 790, (0.50, 0.64), (0.50, 0.54), 1.05, 1.21, (31, 24, 36)),
]


def natural_key(path: Path) -> list[object]:
    parts: list[object] = []
    current = ""
    for char in path.name:
        if char.isdigit():
            current += char
            continue
        if current:
            parts.append(int(current))
            current = ""
        parts.append(char.lower())
    if current:
        parts.append(int(current))
    return parts


def ease(value: float) -> float:
    value = max(0.0, min(1.0, value))
    return value * value * (3 - 2 * value)


def load_photo(path: Path, category: str) -> PhotoAsset | None:
    try:
        image = Image.open(path)
        image = ImageOps.exif_transpose(image).convert("RGB")
        image.thumbnail((1800, 1800), Image.Resampling.LANCZOS)
        return PhotoAsset(path=path, image=image.copy(), category=category)
    except Exception as exc:
        print(f"skipped image {path}: {exc}", flush=True)
        return None


def extract_video_frames(path: Path, start: float, duration: float, label: str) -> VideoAsset | None:
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    command = [
        ffmpeg,
        "-v",
        "error",
        "-ss",
        f"{start:.2f}",
        "-t",
        f"{duration:.2f}",
        "-i",
        str(path),
        "-vf",
        f"fps={FPS},scale={VIDEO_FRAME_WIDTH}:{VIDEO_FRAME_HEIGHT}:force_original_aspect_ratio=increase,crop={VIDEO_FRAME_WIDTH}:{VIDEO_FRAME_HEIGHT},setsar=1",
        "-f",
        "rawvideo",
        "-pix_fmt",
        "rgb24",
        "-",
    ]
    try:
        result = subprocess.run(command, check=True, capture_output=True)
    except Exception as exc:
        print(f"skipped video {path}: {exc}", flush=True)
        return None

    frame_size = VIDEO_FRAME_WIDTH * VIDEO_FRAME_HEIGHT * 3
    frames: list[Image.Image] = []
    for offset in range(0, len(result.stdout), frame_size):
        chunk = result.stdout[offset : offset + frame_size]
        if len(chunk) != frame_size:
            continue
        frames.append(ImageOps.mirror(Image.frombytes("RGB", (VIDEO_FRAME_WIDTH, VIDEO_FRAME_HEIGHT), chunk)))

    if not frames:
        print(f"skipped video {path}: no frames", flush=True)
        return None

    print(f"loaded {len(frames)} frames from {path.name} ({label})", flush=True)
    return VideoAsset(path=path, frames=frames, label=label)


def load_assets() -> None:
    for values in PHOTOS.values():
        values.clear()
    VIDEOS.clear()

    for category in ("couple", "memories"):
        folder = SOURCE_ROOT / category
        if not folder.exists():
            continue
        for path in sorted(folder.iterdir(), key=natural_key):
            if path.suffix.lower() not in IMAGE_EXTENSIONS:
                continue
            asset = load_photo(path, category)
            if asset:
                PHOTOS[category].append(asset)

    video_folder = SOURCE_ROOT / "couple"
    segments = [
        ("clip_4_live", ("for_videos (4).mp4",), 7.0, 6.8, "full screen live"),
        ("clip_1_motion", ("for_videos (1).mp4",), 0.0, 5.3, "short motion"),
        ("clip_2_memory", ("for_videos (2).mp4",), 0.0, 6.4, "moving memory"),
    ]
    for key, filenames, start, duration, label in segments:
        path = next((video_folder / filename for filename in filenames if (video_folder / filename).exists()), None)
        if path is None:
            print(f"skipped video {key}: no source file", flush=True)
            continue
        video = extract_video_frames(path, start, duration, label)
        if video:
            VIDEOS[key] = video

    print(
        f"loaded {len(PHOTOS['couple'])} couple photos, {len(PHOTOS['memories'])} memory photos, {len(VIDEOS)} clips",
        flush=True,
    )


def photo_refs_for_key(key: str) -> list[tuple[str, str]]:
    configured = SCENE_PHOTOS.get(key)
    if configured is not None:
        if isinstance(configured, list):
            return configured
        return [configured]

    # 기존 "category:file.jpg" 형태도 읽을 수 있게 남겨둡니다.
    if ":" in key:
        category, filename = key.split(":", 1)
        return [(category, filename)]

    raise KeyError(f"SCENE_PHOTOS에 '{key}' 사진 지정이 없습니다.")


def parse_photo_ref(category: str, filename: str) -> PhotoAsset | None:
    assets = PHOTOS.get(category, [])
    if not assets:
        return None
    for asset in assets:
        if asset.path.name == filename:
            return asset
    raise FileNotFoundError(f"SCENE_PHOTOS에 지정한 파일을 찾지 못했습니다: {category}/{filename}")


def parse_photo_key(key: str) -> PhotoAsset | None:
    category, filename = photo_refs_for_key(key)[0]
    return parse_photo_ref(category, filename)


def photo_frame_from_key(scene: Scene, key: str, progress: float) -> Image.Image | None:
    photo = parse_photo_key(key)
    if not photo:
        return None

    eased = ease(progress)
    pan = (
        scene.pan_from[0] + (scene.pan_to[0] - scene.pan_from[0]) * eased,
        scene.pan_from[1] + (scene.pan_to[1] - scene.pan_from[1]) * eased,
    )
    zoom = scene.zoom_from + (scene.zoom_to - scene.zoom_from) * eased
    return cover_transform(photo.image, WIDTH, HEIGHT, zoom, pan)


def get_video_frame(key: str, local_seconds: float) -> Image.Image | None:
    asset = VIDEOS.get(key)
    if not asset or not asset.frames:
        return None
    index = int(local_seconds * FPS) % len(asset.frames)
    return asset.frames[index]


def cover_transform(
    source: Image.Image,
    width: int,
    height: int,
    zoom: float,
    pan: tuple[float, float],
) -> Image.Image:
    base = max(width / source.width, height / source.height) * zoom
    resized_w = max(width, math.ceil(source.width * base))
    resized_h = max(height, math.ceil(source.height * base))
    resized = source.resize((resized_w, resized_h), Image.Resampling.LANCZOS)
    max_left = max(0, resized_w - width)
    max_top = max(0, resized_h - height)
    left = int(max_left * max(0.0, min(1.0, pan[0])))
    top = int(max_top * max(0.0, min(1.0, pan[1])))
    return resized.crop((left, top, left + width, top + height))


def scene_progress(scene: Scene, t: float) -> float:
    return max(0.0, min(1.0, (t - scene.start) / (scene.end - scene.start)))


def scene_source(scene: Scene, t: float) -> Image.Image:
    progress = ease(scene_progress(scene, t))
    pan = (
        scene.pan_from[0] + (scene.pan_to[0] - scene.pan_from[0]) * progress,
        scene.pan_from[1] + (scene.pan_to[1] - scene.pan_from[1]) * progress,
    )
    zoom = scene.zoom_from + (scene.zoom_to - scene.zoom_from) * progress

    if scene.kind == "video":
        frame = get_video_frame(scene.asset_key, t - scene.start)
        if frame:
            return cover_transform(frame, WIDTH, HEIGHT, zoom, pan)
        return Image.new("RGB", (WIDTH, HEIGHT), (38, 32, 38))

    if scene.kind == "photo_sequence":
        keys = photo_refs_for_key(scene.asset_key)
        local = scene_progress(scene, t)
        switch = 0.5
        fade = 0.16
        if len(keys) >= 2 and switch - fade <= local <= switch + fade:
            left = photo_frame_from_key(scene, f"{keys[0][0]}:{keys[0][1]}", min(1.0, local / switch))
            right = photo_frame_from_key(scene, f"{keys[1][0]}:{keys[1][1]}", max(0.0, (local - switch) / (1 - switch)))
            if left and right:
                return blend_images(left, right, ease((local - (switch - fade)) / (fade * 2)))
        ref = keys[0] if local < switch else keys[min(1, len(keys) - 1)]
        key = f"{ref[0]}:{ref[1]}"
        frame = photo_frame_from_key(scene, key, min(1.0, local / switch) if local < switch else max(0.0, (local - switch) / (1 - switch)))
        if frame:
            return frame

    photo = parse_photo_key(scene.asset_key)
    if photo:
        return cover_transform(photo.image, WIDTH, HEIGHT, zoom, pan)

    return Image.new("RGB", (WIDTH, HEIGHT), (38, 32, 38))


def blend_images(base: Image.Image, overlay: Image.Image, alpha: float) -> Image.Image:
    if alpha <= 0:
        return base
    if alpha >= 1:
        return overlay
    return Image.blend(base, overlay, alpha)


def current_scene(t: float) -> tuple[Scene, Scene | None, float]:
    for index, scene in enumerate(SCENES):
        if scene.start <= t < scene.end:
            next_scene = SCENES[index + 1] if index + 1 < len(SCENES) else None
            transition = 1.05
            next_alpha = 0.0
            if next_scene and t > scene.end - transition:
                next_alpha = ease((t - (scene.end - transition)) / transition)
            return scene, next_scene, next_alpha
    return SCENES[-1], None, 0.0


def add_color_grade(image: Image.Image, scene: Scene, t: float) -> Image.Image:
    layer = image.convert("RGBA")
    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (*scene.grade, 58))
    layer.alpha_composite(overlay)

    gradient = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    gradient_draw = ImageDraw.Draw(gradient, "RGBA")
    for y in range(HEIGHT):
        ratio = y / HEIGHT
        alpha = int(10 + 88 * ratio)
        gradient_draw.line([(0, y), (WIDTH, y)], fill=(4, 4, 8, alpha))
    layer.alpha_composite(gradient)

    vignette = Image.new("L", (WIDTH, HEIGHT), 0)
    vdraw = ImageDraw.Draw(vignette)
    vdraw.ellipse((-235, -140, WIDTH + 235, HEIGHT + 140), fill=244)
    vignette = vignette.filter(ImageFilter.GaussianBlur(110))
    edge = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 118))
    edge.putalpha(ImageOps.invert(vignette))
    layer.alpha_composite(edge)

    draw = ImageDraw.Draw(layer, "RGBA")
    draw.rounded_rectangle((-6, -4, WIDTH + 6, 74), radius=0, fill=(0, 0, 0, 205))
    draw.rounded_rectangle((-6, HEIGHT - 76, WIDTH + 6, HEIGHT + 4), radius=0, fill=(0, 0, 0, 205))
    draw.line((0, 78, WIDTH, 78), fill=(255, 255, 255, 28), width=2)
    draw.line((0, HEIGHT - 80, WIDTH, HEIGHT - 80), fill=(255, 255, 255, 22), width=2)

    leak = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    leak_draw = ImageDraw.Draw(leak, "RGBA")
    leak_x = int((math.sin(t * 0.22) * 0.5 + 0.5) * WIDTH)
    for radius in range(180, 0, -22):
        alpha = int((180 - radius) * 0.05)
        leak_draw.ellipse(
            (leak_x - radius, 60 - radius, leak_x + radius, 60 + radius),
            fill=(255, 198, 132, alpha),
        )
    layer.alpha_composite(leak)

    return layer


def text_width(text: str, text_font: ImageFont.ImageFont) -> int:
    box = ImageDraw.Draw(Image.new("RGB", (1, 1))).textbbox((0, 0), text, font=text_font)
    return box[2] - box[0]


def wrap_text(text: str, text_font: ImageFont.ImageFont, max_width: int) -> list[str]:
    words = text.split(" ")
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = word if not current else f"{current} {word}"
        if text_width(candidate, text_font) <= max_width:
            current = candidate
            continue
        if current:
            lines.append(current)
        current = word
    if current:
        lines.append(current)
    return lines


def draw_text_block(draw: ImageDraw.ImageDraw, scene: Scene, alpha: int) -> None:
    title_font = TITLE if len(scene.title) <= 13 else TITLE_SMALL
    title_lines = wrap_text(scene.title, title_font, 600)
    subtitle_lines = wrap_text(scene.subtitle, SUBTITLE, 600)
    align = "mm"
    x = WIDTH // 2
    if scene.text_align == "left":
        align = "lm"
        x = 58
    elif scene.text_align == "right":
        align = "rm"
        x = WIDTH - 58

    y = scene.text_y
    for line in title_lines:
        draw.text(
            (x + 2, y + 3),
            line,
            font=title_font,
            fill=(0, 0, 0, int(alpha * 0.46)),
            anchor=align,
            stroke_width=7,
            stroke_fill=(0, 0, 0, int(alpha * 0.32)),
        )
        draw.text(
            (x, y),
            line,
            font=title_font,
            fill=(255, 246, 232, alpha),
            anchor=align,
            stroke_width=4,
            stroke_fill=(55, 34, 46, int(alpha * 0.86)),
        )
        y += title_font.size + 10

    y += 22
    for line in subtitle_lines:
        draw.text(
            (x + 1, y + 2),
            line,
            font=SUBTITLE,
            fill=(0, 0, 0, int(alpha * 0.44)),
            anchor=align,
            stroke_width=5,
            stroke_fill=(0, 0, 0, int(alpha * 0.30)),
        )
        draw.text(
            (x, y),
            line,
            font=SUBTITLE,
            fill=(255, 255, 248, int(alpha * 0.96)),
            anchor=align,
            stroke_width=3,
            stroke_fill=(44, 33, 38, int(alpha * 0.78)),
        )
        y += SUBTITLE.size + 7


def add_film_texture(image: Image.Image, t: float) -> None:
    draw = ImageDraw.Draw(image, "RGBA")
    rng = random.Random(int(t * FPS) + 1107)
    for _ in range(120):
        x = rng.randrange(0, WIDTH)
        y = rng.randrange(0, HEIGHT)
        shade = rng.choice((0, 255))
        alpha = rng.randrange(6, 18)
        draw.point((x, y), fill=(shade, shade, shade, alpha))

    draw.text((52, HEIGHT - 38), "REC 08.14", font=CREDIT, fill=(255, 246, 232, 142), anchor="lm")
    draw.text((WIDTH - 52, HEIGHT - 38), "Jun  |  Jiyun", font=CREDIT, fill=(255, 246, 232, 132), anchor="rm")


def render_frame(frame_index: int) -> Image.Image:
    t = frame_index / FPS
    scene, next_scene, next_alpha = current_scene(t)
    frame = scene_source(scene, t)
    if next_scene:
        frame = blend_images(frame, scene_source(next_scene, next_scene.start), next_alpha)

    image = add_color_grade(frame, scene, t)
    draw = ImageDraw.Draw(image, "RGBA")
    local = scene_progress(scene, t)
    text_alpha = int(255 * min(ease(local / 0.18), ease((1 - local) / 0.16)))
    draw_text_block(draw, scene, text_alpha)
    add_film_texture(image, t)

    fade_in = min(1.0, t / 1.2)
    fade_out = min(1.0, (DURATION - t) / 1.4)
    visible = min(fade_in, fade_out)
    if visible < 1:
        image.alpha_composite(Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, int(255 * (1 - visible)))))

    return image.convert("RGB")


def note_frequency(note: str) -> float:
    names = {"C": -9, "C#": -8, "D": -7, "D#": -6, "E": -5, "F": -4, "F#": -3, "G": -2, "G#": -1, "A": 0, "A#": 1, "B": 2}
    if len(note) == 2:
        name, octave = note[0], int(note[1])
    else:
        name, octave = note[:2], int(note[2])
    semitone = names[name] + (octave - 4) * 12
    return 440.0 * (2 ** (semitone / 12))


def write_music(path: Path) -> None:
    sample_rate = 44100
    chords = [
        ("C4", "E4", "G4", "C5"),
        ("A3", "E4", "G4", "C5"),
        ("F3", "C4", "F4", "A4"),
        ("G3", "D4", "G4", "B4"),
        ("E3", "B3", "E4", "G4"),
        ("F3", "C4", "E4", "A4"),
        ("D3", "A3", "D4", "F4"),
        ("G3", "D4", "G4", "C5"),
    ]
    samples = bytearray()
    total_samples = int(DURATION * sample_rate)
    beat = 0.72
    for i in range(total_samples):
        seconds = i / sample_rate
        chord = chords[int(seconds / (beat * 2)) % len(chords)]
        local = (seconds % beat) / beat
        envelope = min(1.0, local / 0.12) * min(1.0, (1 - local) / 0.38)
        value = 0.0
        for index, note in enumerate(chord):
            freq = note_frequency(note)
            value += math.sin(2 * math.pi * freq * seconds) * (0.12 / (index + 1))
            value += math.sin(2 * math.pi * freq * 2.01 * seconds) * (0.018 / (index + 1))
        bass = note_frequency(chord[0])
        value += math.sin(2 * math.pi * bass * 0.5 * seconds) * 0.08
        shimmer = math.sin(2 * math.pi * note_frequency(chord[-1]) * 2 * seconds) * 0.018
        swell = 0.82 + math.sin(seconds * math.pi / 9) * 0.18
        sample = int(max(-1.0, min(1.0, (value + shimmer) * envelope * swell)) * 32767)
        samples.extend(struct.pack("<h", sample))

    with wave.open(str(path), "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(sample_rate)
        wav.writeframes(bytes(samples))


def encode_video(audio_path: Path) -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    command = [
        ffmpeg,
        "-y",
        "-f",
        "rawvideo",
        "-vcodec",
        "rawvideo",
        "-s",
        f"{WIDTH}x{HEIGHT}",
        "-pix_fmt",
        "rgb24",
        "-r",
        str(FPS),
        "-i",
        "-",
        "-i",
        str(audio_path),
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "22",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-b:a",
        "160k",
        "-shortest",
        str(OUTPUT),
    ]
    process = subprocess.Popen(command, stdin=subprocess.PIPE)
    assert process.stdin is not None
    for frame_index in range(TOTAL_FRAMES):
        process.stdin.write(render_frame(frame_index).tobytes())
        if frame_index % FPS == 0:
            print(f"rendered {frame_index // FPS:02d}/{DURATION}s", flush=True)
    process.stdin.close()
    code = process.wait()
    if code != 0:
        raise RuntimeError(f"ffmpeg exited with code {code}")


def write_preview() -> None:
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
    times = [1.4, 6.8, 12.8, 19.2, 25.0, 31.0, 37.0, 43.3, 50.0, 58.2]
    thumb_w = 180
    thumb_h = 320
    sheet = Image.new("RGB", (thumb_w * 5, thumb_h * 2), (18, 16, 20))
    for index, seconds in enumerate(times):
        thumb = render_frame(int(seconds * FPS)).resize((thumb_w, thumb_h), Image.Resampling.LANCZOS)
        x = (index % 5) * thumb_w
        y = (index // 5) * thumb_h
        sheet.paste(thumb, (x, y))
    path = PREVIEW_DIR / "video (2)-preview.jpg"
    sheet.save(path, quality=92)
    print(f"created preview {path}", flush=True)


def main() -> None:
    load_assets()
    if "--preview" in sys.argv:
        write_preview()
        return
    audio_path = Path(tempfile.gettempdir()) / "anniversary-cinematic-music.wav"
    write_music(audio_path)
    encode_video(audio_path)
    print(f"created {OUTPUT}", flush=True)


if __name__ == "__main__":
    main()

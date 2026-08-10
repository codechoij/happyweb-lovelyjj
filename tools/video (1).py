from __future__ import annotations

import math
import io
import random
import re
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
DURATION = 60
TOTAL_FRAMES = FPS * DURATION
GIFT_VIDEO_FILENAME = "video (1).mp4"
OUTPUT = ROOT / "assets" / "gift-videos" / GIFT_VIDEO_FILENAME
SOURCE_ROOT = ROOT / "assets" / "gift-videos" / "for_videos"


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
FONT_EMOJI = first_existing(
    [
        "C:/Windows/Fonts/seguiemj.ttf",
        "/mnt/c/Windows/Fonts/seguiemj.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
)


def font(path: str | None, size: int) -> ImageFont.FreeTypeFont:
    if path is None:
        return ImageFont.load_default(size=size)
    return ImageFont.truetype(path, size=size)


TITLE = font(FONT_BOLD, 58)
TITLE_SMALL = font(FONT_BOLD, 48)
BODY = font(FONT_REGULAR, 31)
BODY_SMALL = font(FONT_REGULAR, 25)
CAPTION = font(FONT_REGULAR, 32)
EMOJI = font(FONT_EMOJI, 42)
CAPTION_SMALL = font(FONT_REGULAR, 22)


@dataclass
class Scene:
    start: float
    end: float
    title: str
    subtitle: str
    accent: str


@dataclass
class PhotoAsset:
    path: Path
    image: Image.Image
    caption: str
    category: str


@dataclass
class VideoAsset:
    path: Path
    frames: list[Image.Image]
    caption: str
    start: float
    duration: float


@dataclass(frozen=True)
class VideoClipSpec:
    filename: str
    start: float = 0.0
    end: float | None = None


@dataclass
class VideoClipAsset:
    path: Path
    frames: list[Image.Image]
    caption: str
    category: str
    start: float
    end: float | None


MediaAsset = PhotoAsset | VideoClipAsset
MediaRef = tuple[str, str, str | VideoClipSpec]


def cut_video(filename: str, start: float = 0.0, end: float | None = None) -> VideoClipSpec:
    # PAGE_PHOTOS에서 사진 대신 영상 일부를 쓰고 싶을 때 사용합니다.
    # 예: ("couple", "짧은 영상", cut_video("for_videos (1).mp4", start=13, end=15))
    # end를 생략하면 start부터 영상 끝까지 사용합니다.
    return VideoClipSpec(filename=filename, start=start, end=end)


SCENES = [
    Scene(0.0, 5.5, "1년간 우리가 함께한 시간", "♥26.08.14 1주년 축하해!♥", "💖"),
    Scene(5.5, 11.5, "넘겨보는 우리의 추억", "한 장씩 다른 빛으로 쌓인 날들", "✨"),
    Scene(11.5, 19.0, "생동감 있던 순간", "움직이던 표정까지 그대로", "🎞"),
    Scene(19.0, 23.5, "함께 만들어간 우리", "한 컷마다 선명해지는 마음", "📸"),
    Scene(23.5, 30.0, "함께여서 더욱 빛난던 순간", "소중한 연인에게 전한 다정한 하루", "🫶"),
    Scene(30.0, 37.0, "웃음이 번지는 순간", "언제나 꼭 붙어있는 우리 모습", "💫"),
    Scene(37.0, 49.0, "필름에 더 담아둔 날", "아직 꺼내지 않은 사진들까지", "🎞"),
    Scene(49.0, 53.5, "잠깐 멈춘 또 다른 표정", "오래 보고 싶은 너무나 소중한 장면", "🌷"),
    Scene(53.5, 60.0, "다음 장면도 우리 함께", "Jun & Jiyun  |  Happy Anniversary", "💕"),
]

SCENE_KEYS = [
    "opening",
    "page_turn",
    "live_clip",
    "memory_scrapbook",
    "birthday_pair",
    "cute_motion",
    "filmstrip",
    "pause",
    "final",
]

SCENE_DURATIONS = {
    key: scene.end - scene.start
    for key, scene in zip(SCENE_KEYS, SCENES)
}


PALETTE = [
    (255, 111, 145),
    (255, 190, 118),
    (94, 184, 148),
    (92, 154, 204),
    (155, 114, 210),
]

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
VIDEO_EXTENSIONS = {".mp4", ".mov", ".m4v"}
VIDEO_FRAME_WIDTH = 405
VIDEO_FRAME_HEIGHT = 720
CARD_CACHE: dict[tuple[str, int, int, str], Image.Image] = {}
ASSETS: dict[str, list[PhotoAsset]] = {"couple": [], "memories": [], "videos": []}
VIDEO_ASSETS: dict[str, VideoAsset] = {}
VIDEO_CLIP_CACHE: dict[tuple[str, str, float, float | None, str], VideoClipAsset] = {}

# 장면별로 사용할 사진 파일을 한 곳에서 직접 지정합니다.
# video (2).mp4에서 사용한 사진은 피하고, 다른 사진 위주로 새로 골랐습니다.
# 사진이나 캡션을 바꾸고 싶으면 아래 지정값만 교체하면 됩니다.
# category는 assets/gift-videos/for_videos 아래 폴더명입니다.
# 사진을 쓰는 형태: ("couple", "카드 아래 캡션", "for_videos (1).jpg")
# 영상을 쓰는 형태: ("couple", "카드 아래 캡션", cut_video("for_videos (1).mp4", start=13, end=15))
# 영상은 해당 장면이 보이는 동안 재생되고, 장면보다 영상이 짧으면 자동으로 반복 재생됩니다.
PAGE_PHOTOS = {
    # 0. "우리의 사랑이 시작한 날" 첫 장면의 좌우 사진입니다.
    "opening": {
        "left": ("couple", "준이와 지윤이의", "for_videos (1).jpg"),
        "right": ("couple", "예쁜 러브 스토리", "for_videos (2).jpg"),
    },

    # 1. "넘겨보는 우리" 장면입니다.
    # pages는 오른쪽에서 넘어오는 큰 사진 5장이고, bottom_*은 하단의 작은 메모리 사진입니다.
    "page_turn": {
        "pages": [
            ("couple", "즐거운 베이킹클래스", "for_videos (4).jpg"),
            ("couple", "아이스링크장 우리", "for_videos (26).jpg"),
            ("couple", "찜질방 거울샷", "for_videos (14).jpg"),
            ("couple", "마법사 협회 참석", "for_videos (50).jpg"),
            ("couple", "괴도키드를 찾아", "for_videos (16).jpg"),
        ],
        "bottom_left": ("memories", "허공의 짜릿함", "for_videos (4).jpg"),
        "bottom_right": ("memories", "광화문 공룡", "for_videos (6).jpg"),
    },

    # 2. "생동감 있던 순간" 영상 장면 위에 살짝 얹히는 하단 사진입니다.
    "live_clip": {
        "lower_left": ("couple", "신난 뒷모습", "for_videos (43).jpg"),
        "lower_right": ("couple", "환상 회전목마", "for_videos (27).jpg"),
    },

    # 3. "우리가 남긴 장면들" 스크랩북 장면의 6장입니다.
    "memory_scrapbook": {
        "cards": [
            ("memories", "마음이 느껴지는", "for_videos (2).jpg"),
            ("memories", "달콤한 발렌타인", "for_videos (12).jpg"),
            ("memories", "J♡ 자수", "for_videos (15).jpg"),
            ("memories", "서로를 위한 키링", "for_videos (13).jpg"),
            ("memories", "최고의 초코 케이크", "for_videos (16).jpg"),
            ("memories", "비밀 파묘단", "for_videos (11).jpg"),
        ],
    },

    # 4. "함께여서 더욱 빛났던 순간" 장면의 좌우 큰 사진입니다.
    "birthday_pair": {
        "left": ("couple", "케이크 앞 준이", "for_videos (39).jpg"),
        "right": ("couple", "촛불 앞 지윤", "for_videos (40).jpg"),
        "bottom": ("memories", "함께 빛났던 기억", "for_videos (5).jpg"),
    },

    # 5. "귀여운 움직임" 영상 주변에 붙는 작은 사진 4장입니다.
    "cute_motion": {
        "side_cards": [
            ("couple", "our love", "for_videos (21).jpg"),
            ("couple", "cute", "for_videos (23).jpg"),
            ("couple", "bling bling", "for_videos (22).jpg"),
            ("couple", "our memory", "for_videos (33).jpg"),
        ],
    },

    # 6. "필름처럼 흐르는 날" 장면입니다.
    # top_photo_cards는 위쪽 사선 필름에 순서대로 들어가는 사진입니다.
    # bottom_strip은 아래쪽 수평 필름에 순서대로 들어가는 사진입니다.
    "filmstrip": {
        "top_photo_cards": [
            ("couple", "가평 빛나는 밤", "for_videos (36).jpg"),
            ("memories", "청계천 밤 산책", "for_videos (19).jpg"),
            ("memories", "장미꽃 선물", "for_videos (29).jpg"),
            ("memories", "가장 반짝이는 별", "for_videos (27).jpg"),
            ("memories", "불꽃이 수놓은 밤", "for_videos (1).jpg"),
            ("couple", "오리맘 준이", "for_videos (45).jpg"),
            ("couple", "할로윈 마녀지윤", "for_videos (56).jpg"),
            ("couple", "나뭇잎 하트", "for_videos (53).jpg"),
        ],
        "bottom_strip": [
            ("memories", "벚꽃잎 살랑", "for_videos (5).jpg"),
            ("couple", "눈꽃공주 하트", "for_videos (52).jpg"),
            ("couple", "경찰과 도둑", "for_videos (41).jpg"),
            ("couple", "폰 케이스 거울", "for_videos (47).jpg"),
            ("couple", "요정 지윤님", "for_videos (46).jpg"),
            ("couple", "겨울 모자 준이", "for_videos (48).jpg"),
            ("couple", "겨울 모자 지윤", "for_videos (49).jpg"),
            ("couple", "우연히 받은 선물", "for_videos (58).jpg"),
        ],
    },

    # 7. "잠깐 멈춘 예쁜 순간" 장면입니다.
    # top_right는 mp4에서 뽑아 만든 스냅샷이라 category가 videos입니다.
    "pause": {
        "top_left": ("couple", "넘어져도 행복한 우리", "for_videos (25).jpg"),
        "top_right": ("videos", "17초의 미소", "for_videos (4)-snapshot-417.png"),
        "bottom": ("couple", "웃긴 하회탈 찰칵", "for_videos (18).jpg"),
    },

    # 8. 마지막 "1주년 축하해" 장면입니다.
    "final": {
        "main": ("couple", "꽃처럼 남은 마음", "for_videos (55).jpg"),
        "bottom": ("memories", "기대되는 우리의 다음 장면", "for_videos (18).jpg"),
    },
}


def ease(value: float) -> float:
    value = max(0.0, min(1.0, value))
    return value * value * (3 - 2 * value)


def scene_elapsed(scene_key: str, local: float) -> float:
    return max(0.0, local) * SCENE_DURATIONS[scene_key]


def scene_alpha(t: float, scene: Scene) -> float:
    fade = 0.75
    return min(ease((t - scene.start) / fade), ease((scene.end - t) / fade))


def blend(a: tuple[int, int, int], b: tuple[int, int, int], ratio: float) -> tuple[int, int, int]:
    return tuple(int(a[i] + (b[i] - a[i]) * ratio) for i in range(3))


def add_alpha(color: tuple[int, int, int], alpha: int) -> tuple[int, int, int, int]:
    return color[0], color[1], color[2], alpha


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


def load_photo(path: Path, category: str) -> PhotoAsset | None:
    try:
        image = Image.open(path)
        image = ImageOps.exif_transpose(image).convert("RGB")
        image.thumbnail((1500, 1500), Image.Resampling.LANCZOS)
        return PhotoAsset(path=path, image=image.copy(), caption="", category=category)
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
        print(f"skipped video frames {path}: {exc}", flush=True)
        return None

    frame_size = VIDEO_FRAME_WIDTH * VIDEO_FRAME_HEIGHT * 3
    frames = []
    for offset in range(0, len(result.stdout), frame_size):
        chunk = result.stdout[offset:offset + frame_size]
        if len(chunk) != frame_size:
            continue
        frames.append(ImageOps.mirror(Image.frombytes("RGB", (VIDEO_FRAME_WIDTH, VIDEO_FRAME_HEIGHT), chunk)))

    if not frames:
        print(f"skipped video frames {path}: no frames", flush=True)
        return None

    print(f"loaded {len(frames)} frames from {path.name} ({label})", flush=True)
    return VideoAsset(path=path, frames=frames, caption=label, start=start, duration=duration)


def probe_video_duration(path: Path) -> float | None:
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    command = [ffmpeg, "-hide_banner", "-i", str(path)]
    result = subprocess.run(command, capture_output=True, text=True)
    match = re.search(r"Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)", result.stderr)
    if not match:
        return None

    hours, minutes, seconds = match.groups()
    return int(hours) * 3600 + int(minutes) * 60 + float(seconds)


def load_video_clip(category: str, caption: str, spec: VideoClipSpec, scene_key: str, slot: str) -> VideoClipAsset:
    cache_key = (category, spec.filename, float(spec.start), None if spec.end is None else float(spec.end), caption)
    cached = VIDEO_CLIP_CACHE.get(cache_key)
    if cached:
        return cached

    path = SOURCE_ROOT / category / spec.filename
    if not path.exists():
        raise FileNotFoundError(
            f"PAGE_PHOTOS['{scene_key}']['{slot}']에 지정한 영상 파일을 찾지 못했습니다: {path}"
        )

    start = max(0.0, float(spec.start))
    if spec.end is None:
        total_duration = probe_video_duration(path)
        if total_duration is None:
            raise RuntimeError(f"영상 길이를 읽지 못했습니다: {path}")
        end = total_duration
    else:
        end = float(spec.end)

    duration = end - start
    if duration <= 0:
        raise ValueError(
            f"PAGE_PHOTOS['{scene_key}']['{slot}']의 영상 종료 초는 시작 초보다 커야 합니다: "
            f"start={start}, end={end}"
        )

    video = extract_video_frames(path, start, duration, caption)
    if video is None:
        raise RuntimeError(f"영상 프레임을 읽지 못했습니다: {path}")

    asset = VideoClipAsset(
        path=path,
        frames=video.frames,
        caption=caption,
        category=category,
        start=start,
        end=None if spec.end is None else end,
    )
    VIDEO_CLIP_CACHE[cache_key] = asset
    return asset


def extract_video_snapshot(path: Path, seconds: float, index: int) -> PhotoAsset | None:
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    command = [
        ffmpeg,
        "-v",
        "error",
        "-ss",
        f"{seconds:.2f}",
        "-i",
        str(path),
        "-frames:v",
        "1",
        "-f",
        "image2pipe",
        "-vcodec",
        "png",
        "-",
    ]
    try:
        result = subprocess.run(command, check=True, capture_output=True)
        image = ImageOps.mirror(Image.open(io.BytesIO(result.stdout)).convert("RGB"))
        image.thumbnail((1500, 1500), Image.Resampling.LANCZOS)
        return PhotoAsset(
            path=path.with_name(f"{path.stem}-snapshot-{index}.png"),
            image=image.copy(),
            caption="video moment",
            category="videos",
        )
    except Exception as exc:
        print(f"skipped video snapshot {path}: {exc}", flush=True)
        return None


def load_assets() -> None:
    CARD_CACHE.clear()
    ASSETS["couple"].clear()
    ASSETS["memories"].clear()
    ASSETS["videos"].clear()
    VIDEO_ASSETS.clear()
    VIDEO_CLIP_CACHE.clear()

    for category in ("couple", "memories"):
        folder = SOURCE_ROOT / category
        if not folder.exists():
            continue
        for path in sorted(folder.iterdir(), key=natural_key):
            if path.suffix.lower() not in IMAGE_EXTENSIONS:
                continue
            asset = load_photo(path, category)
            if asset:
                ASSETS[category].append(asset)

    couple_video_folder = SOURCE_ROOT / "couple"
    if couple_video_folder.exists():
        video_files = sorted([item for item in couple_video_folder.iterdir() if item.suffix.lower() in VIDEO_EXTENSIONS],
                             key=natural_key)
        for video_index, path in enumerate(video_files, start=1):
            snapshot = extract_video_snapshot(path, 1.15, video_index)
            if snapshot:
                ASSETS["videos"].append(snapshot)

        preferred_segments = [
            ("clip_1", ("for_videos (1).mp4",), 0.0, 5.2, "cute motion"),
            ("clip_2", ("for_videos (2).mp4",), 20.5, 7.0, "moving memory"),
            ("clip_4_live", ("for_videos (4).mp4", "for_videos (2).mp4"), 7.0, 6.2, "live moment"),
        ]
        for key, filenames, start, duration, label in preferred_segments:
            path = next((couple_video_folder / filename for filename in filenames if (couple_video_folder / filename).exists()), None)
            if path is None:
                continue
            video = extract_video_frames(path, start, duration, label)
            if video:
                VIDEO_ASSETS[key] = video

        hug_path = couple_video_folder / "for_videos (2).mp4"
        if hug_path.exists():
            hug_still = extract_video_snapshot(hug_path, 17.0, 217)
            if hug_still:
                hug_still.caption = "17 sec"
                ASSETS["videos"].append(hug_still)

        still_path = couple_video_folder / "for_videos (4).mp4"
        if still_path.exists():
            still_17 = extract_video_snapshot(still_path, 17.0, 417)
            if still_17:
                still_17.caption = "17 sec"
                ASSETS["videos"].append(still_17)

            for still_index, seconds in enumerate((15.3, 16.4), start=1):
                still = extract_video_snapshot(still_path, seconds, 40 + still_index)
                if still:
                    still.caption = "favorite pause"
                    ASSETS["videos"].append(still)

def pick_asset_by_name(category: str, filename: str) -> PhotoAsset | None:
    for asset in ASSETS.get(category, []):
        if asset.path.name == filename:
            return asset
    return None


def require_photo(category: str, filename: str, scene_key: str, slot: str) -> PhotoAsset:
    asset = pick_asset_by_name(category, filename)
    if asset:
        return asset

    folder = SOURCE_ROOT / category
    raise FileNotFoundError(
        f"PAGE_PHOTOS['{scene_key}']['{slot}']에 지정한 파일을 찾지 못했습니다: "
        f"{folder / filename}"
    )


def require_media(category: str, caption: str, item: str | VideoClipSpec, scene_key: str, slot: str) -> MediaAsset:
    if not caption:
        raise ValueError(f"PAGE_PHOTOS['{scene_key}']['{slot}']에는 캡션이 반드시 필요합니다.")
    if isinstance(item, VideoClipSpec):
        return load_video_clip(category, caption, item, scene_key, slot)
    photo = require_photo(category, item, scene_key, slot)
    return PhotoAsset(path=photo.path, image=photo.image, caption=caption, category=photo.category)


def scene_media(scene_key: str, slot: str) -> MediaAsset:
    # 단일 슬롯을 가져옵니다. 예: scene_media("opening", "left")
    category, caption, item = PAGE_PHOTOS[scene_key][slot]
    return require_media(category, caption, item, scene_key, slot)


def scene_media_list(scene_key: str, slot: str) -> list[MediaAsset]:
    # 여러 장이 들어가는 슬롯을 순서대로 가져옵니다. 예: page_turn의 pages, filmstrip의 bottom_strip
    refs = PAGE_PHOTOS[scene_key][slot]
    return [
        require_media(category, caption, item, scene_key, f"{slot}[{index}]")
        for index, (category, caption, item) in enumerate(refs)
    ]


def pick_bottom_film_media(index: int) -> MediaAsset | None:
    assets = scene_media_list("filmstrip", "bottom_strip")
    if not assets:
        return None
    return assets[index % len(assets)]


def cover_image(image: Image.Image, width: int, height: int) -> Image.Image:
    ratio = max(width / image.width, height / image.height)
    resized = image.resize((math.ceil(image.width * ratio), math.ceil(image.height * ratio)), Image.Resampling.LANCZOS)
    left = (resized.width - width) // 2
    top = (resized.height - height) // 2
    return resized.crop((left, top, left + width, top + height))


def multiply_alpha(image: Image.Image, alpha: int) -> Image.Image:
    if alpha >= 255:
        return image
    result = image.copy()
    channel = result.getchannel("A").point(lambda value: int(value * alpha / 255))
    result.putalpha(channel)
    return result


def build_image_card(image: Image.Image, card_w: int, card_h: int, caption: str) -> Image.Image:
    margin = max(12, int(card_w * 0.075))
    bottom = max(46, int(card_h * 0.18))
    photo_w = card_w - margin * 2
    photo_h = card_h - margin - bottom
    card = Image.new("RGBA", (card_w, card_h), (255, 252, 246, 255))
    draw = ImageDraw.Draw(card, "RGBA")
    draw.rounded_rectangle((0, 0, card_w - 1, card_h - 1), radius=10, fill=(255, 252, 246, 255), outline=(239, 221, 213, 255))

    photo = cover_image(image, photo_w, photo_h).convert("RGBA")
    mask = Image.new("L", (photo_w, photo_h), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, photo_w, photo_h), radius=6, fill=255)
    card.paste(photo, (margin, margin), mask)
    draw.rounded_rectangle((margin, margin, margin + photo_w, margin + photo_h), radius=6, outline=(255, 255, 255, 190), width=3)
    draw.text((card_w / 2, card_h - bottom / 2 + 4), caption, font=CAPTION_SMALL, fill=(112, 88, 82, 255), anchor="mm")
    return card


def build_photo_card(asset: PhotoAsset, card_w: int, card_h: int, caption: str) -> Image.Image:
    key = (str(asset.path), card_w, card_h, caption)
    if key in CARD_CACHE:
        return CARD_CACHE[key]

    card = build_image_card(asset.image, card_w, card_h, caption)
    CARD_CACHE[key] = card
    return card


def draw_photo_card(
    layer: Image.Image,
    asset: PhotoAsset | None,
    x: float,
    y: float,
    card_w: int,
    card_h: int,
    angle: float,
    alpha: int,
    caption: str | None = None,
) -> None:
    if asset is None or alpha <= 0:
        return
    card = build_photo_card(asset, card_w, card_h, caption or asset.caption)
    shadow = Image.new("RGBA", card.size, (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow, "RGBA")
    shadow_draw.rounded_rectangle((8, 8, card.width - 8, card.height - 8), radius=12, fill=(49, 44, 53, int(alpha * 0.18)))
    shadow = shadow.filter(ImageFilter.GaussianBlur(12))
    shadow = shadow.rotate(angle, resample=Image.Resampling.BICUBIC, expand=True)
    layer.alpha_composite(shadow, (int(x - shadow.width / 2 + 8), int(y - shadow.height / 2 + 12)))

    prepared = multiply_alpha(card, alpha).rotate(angle, resample=Image.Resampling.BICUBIC, expand=True)
    layer.alpha_composite(prepared, (int(x - prepared.width / 2), int(y - prepared.height / 2)))


def media_image(asset: MediaAsset, elapsed: float) -> Image.Image:
    if isinstance(asset, PhotoAsset):
        return asset.image

    frame_index = int(max(0.0, elapsed) * FPS) % len(asset.frames)
    return asset.frames[frame_index]


def build_media_card(asset: MediaAsset, card_w: int, card_h: int, caption: str, elapsed: float) -> Image.Image:
    if isinstance(asset, PhotoAsset):
        return build_photo_card(asset, card_w, card_h, caption)
    return build_image_card(media_image(asset, elapsed), card_w, card_h, caption)


def draw_media_card(
    layer: Image.Image,
    asset: MediaAsset | None,
    elapsed: float,
    x: float,
    y: float,
    card_w: int,
    card_h: int,
    angle: float,
    alpha: int,
    caption: str | None = None,
) -> None:
    if asset is None or alpha <= 0:
        return
    card = build_media_card(asset, card_w, card_h, caption or asset.caption, elapsed)
    shadow = Image.new("RGBA", card.size, (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow, "RGBA")
    shadow_draw.rounded_rectangle((8, 8, card.width - 8, card.height - 8), radius=12, fill=(49, 44, 53, int(alpha * 0.18)))
    shadow = shadow.filter(ImageFilter.GaussianBlur(12))
    shadow = shadow.rotate(angle, resample=Image.Resampling.BICUBIC, expand=True)
    layer.alpha_composite(shadow, (int(x - shadow.width / 2 + 8), int(y - shadow.height / 2 + 12)))

    prepared = multiply_alpha(card, alpha).rotate(angle, resample=Image.Resampling.BICUBIC, expand=True)
    layer.alpha_composite(prepared, (int(x - prepared.width / 2), int(y - prepared.height / 2)))


def get_video_frame(key: str, elapsed: float) -> Image.Image | None:
    video = VIDEO_ASSETS.get(key)
    if not video or not video.frames:
        return None
    frame_index = int(max(0.0, elapsed) * FPS) % len(video.frames)
    return video.frames[frame_index]


def draw_video_card(
    layer: Image.Image,
    key: str,
    elapsed: float,
    x: float,
    y: float,
    card_w: int,
    card_h: int,
    angle: float,
    alpha: int,
    caption: str,
) -> None:
    frame = get_video_frame(key, elapsed)
    if frame is None or alpha <= 0:
        return
    card = build_image_card(frame, card_w, card_h, caption)
    shadow = Image.new("RGBA", card.size, (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow, "RGBA")
    shadow_draw.rounded_rectangle((8, 8, card.width - 8, card.height - 8), radius=12, fill=(49, 44, 53, int(alpha * 0.2)))
    shadow = shadow.filter(ImageFilter.GaussianBlur(14)).rotate(angle, resample=Image.Resampling.BICUBIC, expand=True)
    layer.alpha_composite(shadow, (int(x - shadow.width / 2 + 8), int(y - shadow.height / 2 + 12)))

    prepared = multiply_alpha(card, alpha).rotate(angle, resample=Image.Resampling.BICUBIC, expand=True)
    layer.alpha_composite(prepared, (int(x - prepared.width / 2), int(y - prepared.height / 2)))


def draw_video_backdrop(layer: Image.Image, key: str, elapsed: float, alpha: int) -> None:
    frame = get_video_frame(key, elapsed)
    if frame is None:
        return
    backdrop = cover_image(frame, WIDTH, HEIGHT).convert("RGBA")
    backdrop = backdrop.filter(ImageFilter.GaussianBlur(9))
    tint = Image.new("RGBA", (WIDTH, HEIGHT), (255, 250, 246, int(alpha * 0.36)))
    backdrop.alpha_composite(tint)
    layer.alpha_composite(multiply_alpha(backdrop, int(alpha * 0.72)))


def draw_framed_video(layer: Image.Image, key: str, elapsed: float, x: float, y: float, width: int, height: int, alpha: int) -> None:
    frame = get_video_frame(key, elapsed)
    if frame is None:
        return
    image = cover_image(frame, width, height).convert("RGBA")
    shell = Image.new("RGBA", (width + 34, height + 34), (255, 255, 255, 0))
    shell_draw = ImageDraw.Draw(shell, "RGBA")
    shell_draw.rounded_rectangle((0, 0, shell.width - 1, shell.height - 1), radius=28, fill=(255, 252, 246, alpha), outline=(238, 222, 215, alpha), width=3)
    mask = Image.new("L", (width, height), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, width, height), radius=18, fill=255)
    shell.paste(multiply_alpha(image, alpha), (17, 17), mask)
    shadow = Image.new("RGBA", shell.size, (0, 0, 0, 0))
    ImageDraw.Draw(shadow, "RGBA").rounded_rectangle((8, 8, shell.width - 8, shell.height - 8), radius=30, fill=(49, 44, 53, int(alpha * 0.2)))
    shadow = shadow.filter(ImageFilter.GaussianBlur(18))
    layer.alpha_composite(shadow, (int(x - shadow.width / 2 + 10), int(y - shadow.height / 2 + 14)))
    layer.alpha_composite(shell, (int(x - shell.width / 2), int(y - shell.height / 2)))


def draw_background(draw: ImageDraw.ImageDraw, t: float) -> None:
    top_a = (250, 238, 234)
    top_b = (224, 240, 244)
    bottom_a = (255, 205, 180)
    bottom_b = (188, 214, 190)
    shift = (math.sin(t * 0.24) + 1) / 2
    top = blend(top_a, top_b, shift)
    bottom = blend(bottom_a, bottom_b, 1 - shift)
    for y in range(HEIGHT):
        ratio = y / HEIGHT
        draw.line([(0, y), (WIDTH, y)], fill=blend(top, bottom, ratio))


def draw_heart(draw: ImageDraw.ImageDraw, x: float, y: float, size: float, color: tuple[int, int, int], alpha: int) -> None:
    fill = add_alpha(color, alpha)
    points = []
    scale = size / 32
    for step in range(96):
        theta = math.tau * step / 96
        px = 16 * (math.sin(theta) ** 3)
        py = -(13 * math.cos(theta) - 5 * math.cos(2 * theta) - 2 * math.cos(3 * theta) - math.cos(4 * theta))
        points.append((x + px * scale, y + py * scale + size * 0.08))
    draw.polygon(points, fill=fill)


def draw_star(draw: ImageDraw.ImageDraw, x: float, y: float, size: float, color: tuple[int, int, int], alpha: int) -> None:
    fill = add_alpha(color, alpha)
    points = []
    for i in range(10):
        radius = size if i % 2 == 0 else size * 0.38
        angle = -math.pi / 2 + i * math.pi / 5
        points.append((x + math.cos(angle) * radius, y + math.sin(angle) * radius))
    draw.polygon(points, fill=fill)


def draw_floating_shapes(layer: Image.Image, t: float) -> None:
    draw = ImageDraw.Draw(layer, "RGBA")
    rng = random.Random(1107)
    for i in range(46):
        base_x = rng.randint(-80, WIDTH + 80)
        base_y = rng.randint(-200, HEIGHT + 120)
        speed = rng.uniform(18, 62)
        drift = math.sin(t * rng.uniform(0.35, 0.85) + rng.random() * 8) * rng.uniform(8, 34)
        y = (base_y - t * speed) % (HEIGHT + 240) - 120
        x = base_x + drift
        size = rng.uniform(10, 30)
        color = PALETTE[i % len(PALETTE)]
        alpha = int(rng.uniform(58, 132))
        if i % 3 == 0:
            draw_star(draw, x, y, size * 0.48, color, alpha)
        else:
            draw_heart(draw, x, y, size, color, alpha)


def text_width(text: str, text_font: ImageFont.ImageFont) -> int:
    box = ImageDraw.Draw(Image.new("RGB", (1, 1))).textbbox((0, 0), text, font=text_font)
    return box[2] - box[0]


def line_height(text_font: ImageFont.ImageFont) -> int:
    box = ImageDraw.Draw(Image.new("RGB", (1, 1))).textbbox((0, 0), "가Aj", font=text_font)
    return max(text_font.size, box[3] - box[1])


def wrap_korean(text: str, text_font: ImageFont.ImageFont, max_width: int) -> list[str]:
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


def measure_centered_text(
    text: str,
    y: int,
    text_font: ImageFont.ImageFont,
    max_width: int,
    line_gap: int,
) -> tuple[list[str], tuple[int, int, int, int], int]:
    lines = wrap_korean(text, text_font, max_width)
    height = line_height(text_font)
    widths = [text_width(line, text_font) for line in lines] or [0]
    top = y - height // 2
    bottom = y + (len(lines) - 1) * (text_font.size + line_gap) + height // 2
    bounds = (
        int(WIDTH / 2 - max(widths) / 2),
        int(top),
        int(WIDTH / 2 + max(widths) / 2),
        int(bottom),
    )
    next_y = y + len(lines) * (text_font.size + line_gap)
    return lines, bounds, next_y


def draw_centered_lines(
    draw: ImageDraw.ImageDraw,
    lines: list[str],
    y: int,
    text_font: ImageFont.ImageFont,
    fill: tuple[int, int, int, int],
    line_gap: int,
) -> int:
    for line in lines:
        draw.text(
            (WIDTH / 2 + 2, y + 3),
            line,
            font=text_font,
            fill=(72, 54, 62, int(fill[3] * 0.22)),
            anchor="mm",
            stroke_width=6,
            stroke_fill=(72, 54, 62, int(fill[3] * 0.16)),
        )
        draw.text(
            (WIDTH / 2, y),
            line,
            font=text_font,
            fill=fill,
            anchor="mm",
            stroke_width=5,
            stroke_fill=(255, 252, 246, int(fill[3] * 0.96)),
        )
        y += text_font.size + line_gap
    return y


def draw_scene_text_block(
    draw: ImageDraw.ImageDraw,
    title: str,
    subtitle: str,
    y: int,
    title_font: ImageFont.ImageFont,
    alpha: int,
    accent_color: tuple[int, int, int],
) -> None:
    title_lines, title_bounds, next_y = measure_centered_text(title, y, title_font, 620, 18)
    subtitle_y = next_y + 34
    subtitle_lines, subtitle_bounds, _ = measure_centered_text(subtitle, subtitle_y, BODY, 590, 10)
    bounds = (
        min(title_bounds[0], subtitle_bounds[0]),
        title_bounds[1],
        max(title_bounds[2], subtitle_bounds[2]),
        subtitle_bounds[3],
    )
    draw_centered_lines(draw, title_lines, y, title_font, (64, 54, 62, alpha), 18)
    draw_centered_lines(draw, subtitle_lines, subtitle_y, BODY, (98, 83, 88, alpha), 10)
    line_y = bounds[3] + 24
    line_width = min(320, max(150, int((bounds[2] - bounds[0]) * 0.58)))
    draw.rounded_rectangle(
        (WIDTH / 2 - line_width / 2, line_y, WIDTH / 2 + line_width / 2, line_y + 6),
        radius=3,
        fill=add_alpha(accent_color, int(alpha * 0.58)),
    )


def draw_polaroid(layer: Image.Image, x: int, y: int, angle: float, scale: float, accent: tuple[int, int, int], alpha: int) -> None:
    card_w = int(238 * scale)
    card_h = int(300 * scale)
    photo_h = int(218 * scale)
    card = Image.new("RGBA", (card_w, card_h), (255, 252, 246, alpha))
    cdraw = ImageDraw.Draw(card, "RGBA")
    cdraw.rounded_rectangle((0, 0, card_w - 1, card_h - 1), radius=int(8 * scale), fill=(255, 252, 246, alpha), outline=(245, 226, 210, alpha))
    cdraw.rounded_rectangle((int(18 * scale), int(18 * scale), card_w - int(18 * scale), photo_h), radius=int(5 * scale), fill=add_alpha(accent, int(alpha * 0.78)))
    draw_heart(cdraw, card_w * 0.42, photo_h * 0.42, 64 * scale, (255, 96, 128), int(alpha * 0.95))
    draw_star(cdraw, card_w * 0.68, photo_h * 0.36, 24 * scale, (255, 220, 112), int(alpha * 0.9))
    cdraw.text((card_w / 2, photo_h + int(42 * scale)), "2026.07.29", font=CAPTION, fill=(112, 88, 82, alpha), anchor="mm")
    rotated = card.rotate(angle, resample=Image.Resampling.BICUBIC, expand=True)
    layer.alpha_composite(rotated, (x - rotated.width // 2, y - rotated.height // 2))


def draw_scene_label(
    draw: ImageDraw.ImageDraw,
    scene: Scene,
    index: int,
    y: int,
    icon_y: int,
    alpha: int,
    accent_color: tuple[int, int, int],
) -> None:
    pulse = 1 + math.sin((scene.start + scene.end) * 0.35) * 0.025
    draw_heart(draw, WIDTH / 2, icon_y, 48 * pulse, accent_color, int(alpha * 0.68))
    title_font = TITLE if len(scene.title) <= 12 else TITLE_SMALL
    draw_scene_text_block(draw, scene.title, scene.subtitle, y, title_font, alpha, accent_color)


def draw_opening_scene(layer: Image.Image, t: float, alpha: int, local: float) -> None:
    rise = (1 - ease(local)) * 88
    elapsed = scene_elapsed("opening", local)
    draw_media_card(layer, scene_media("opening", "left"), elapsed, 162, 338 + rise, 218, 292, -10 + math.sin(t * 0.9) * 2, int(alpha * 0.9))
    draw_media_card(layer, scene_media("opening", "right"), elapsed, 545, 365 - rise * 0.15, 216, 292, 9 + math.cos(t * 0.8) * 2, int(alpha * 0.86))
    draw_video_card(layer, "clip_1", t, 360, 880, 250, 330, -2 + math.sin(t) * 1.2, int(alpha * 0.72), "지금 바로 시작합니다!")


def draw_page_turn_scene(layer: Image.Image, t: float, alpha: int, local: float) -> None:
    elapsed = scene_elapsed("page_turn", local)
    assets = scene_media_list("page_turn", "pages")
    for index, asset in enumerate(assets):
        phase = ease(min(1.0, max(0.0, local * 1.3 - index * 0.19)))
        x = 900 - phase * 700 + index * 24
        y = 420 + index * 86 + math.sin(t * 1.1 + index) * 8
        angle = 10 - phase * 17 + math.sin(t + index) * 1.2
        draw_media_card(layer, asset, elapsed, x, y, 245, 322, angle, int(alpha * (0.55 + phase * 0.4)))
    draw_media_card(layer, scene_media("page_turn", "bottom_left"), elapsed, 160, 960, 205, 270, -8, int(alpha * 0.58))
    draw_media_card(layer, scene_media("page_turn", "bottom_right"), elapsed, 568, 982, 205, 270, 7, int(alpha * 0.58))


def draw_live_clip_scene(layer: Image.Image, t: float, alpha: int, local: float) -> None:
    draw_video_backdrop(layer, "clip_4_live", local * 6.2, alpha)
    zoom = 1 + math.sin(local * math.pi) * 0.02
    elapsed = scene_elapsed("live_clip", local)
    draw_framed_video(layer, "clip_4_live", local * 6.2, WIDTH / 2, 560, int(460 * zoom), int(818 * zoom), int(alpha * 0.96))
    draw_media_card(layer, scene_media("live_clip", "lower_left"), elapsed, 132, 1018, 170, 226, -8, int(alpha * 0.56))
    draw_media_card(layer, scene_media("live_clip", "lower_right"), elapsed, 602, 1012, 170, 226, 8, int(alpha * 0.56))


def draw_memory_scrapbook_scene(layer: Image.Image, t: float, alpha: int, local: float) -> None:
    lower = 60
    elapsed = scene_elapsed("memory_scrapbook", local)
    assets = scene_media_list("memory_scrapbook", "cards")
    positions = [
        (150, 380 + lower, 214, 280, -9),
        (365, 438 + lower, 214, 280, 4),
        (575, 392 + lower, 202, 266, 10),
        (148, 760 + lower, 214, 280, 8),
        (376, 790 + lower, 230, 296, -5),
        (585, 766 + lower, 198, 260, 9),
    ]
    for index, (x, y, w, h, angle) in enumerate(positions):
        drift = math.sin(t * 0.9 + index + 1) * 12
        draw_media_card(layer, assets[index], elapsed, x, y + drift, w, h, angle, int(alpha * 0.82))


#def draw_pair_scene(layer: Image.Image, t: float, alpha: int, local: float) -> None:
#    elapsed = scene_elapsed("birthday_pair", local)
#    left = scene_media("birthday_pair", "left")
#    right = scene_media("birthday_pair", "right")
#    spread = 16 + ease(local) * 24
#    draw_media_card(layer, left, elapsed, WIDTH / 2 - 130 - spread, 434, 312, 402, -6 + math.sin(t) * 1.3, int(alpha * 0.98))
#    draw_media_card(layer, right, elapsed, WIDTH / 2 + 130 + spread, 444, 312, 402, 7 + math.cos(t) * 1.3, int(alpha * 0.98))
#    draw_video_card(layer, "clip_4_live", 6.0 + local * 2.0, 360, 1072, 170, 224, 1.5, int(alpha * 0.4), "afterglow")
    
def draw_pair_scene(layer: Image.Image, t: float, alpha: int, local: float) -> None:
  elapsed = scene_elapsed("birthday_pair", local)
  left = scene_media("birthday_pair", "left")
  right = scene_media("birthday_pair", "right")
  bottom = scene_media("birthday_pair", "bottom")

  spread = 16 + ease(local) * 24
  draw_media_card(layer, left, elapsed, WIDTH / 2 - 130 - spread, 434, 312, 402, -6 + math.sin(t) * 1.3, int(alpha *
  0.98))
  draw_media_card(layer, right, elapsed, WIDTH / 2 + 130 + spread, 444, 312, 402, 7 + math.cos(t) * 1.3, int(alpha *
  0.98))
  draw_media_card(layer, bottom, elapsed, 360, 1072, 170, 224, 1.5, int(alpha * 0.4))


def draw_cute_motion_scene(layer: Image.Image, t: float, alpha: int, local: float) -> None:
    draw_framed_video(layer, "clip_1", local * 5.2, 360, 500, 390, 694, int(alpha * 0.96))
    elapsed = scene_elapsed("cute_motion", local)
    assets = scene_media_list("cute_motion", "side_cards")
    for index, asset in enumerate(assets):
        angle = [-10, 9, -6, 7][index] + math.sin(t + index) * 1.4
        x = [118, 606, 124, 604][index]
        y = [260, 322, 852, 898][index]
        draw_media_card(layer, asset, elapsed, x, y, 154, 206, angle, int(alpha * 0.54))


def draw_bottom_photo_filmstrip(layer: Image.Image, t: float, alpha: int, local: float) -> None:
    strip_w = WIDTH + 620
    strip_h = 238
    photo_w = 118
    photo_h = 154
    strip = Image.new("RGBA", (strip_w, strip_h), (255, 252, 246, int(alpha * 0.82)))
    sdraw = ImageDraw.Draw(strip, "RGBA")

    for hole_x in range(22, strip.width, 48):
        sdraw.rounded_rectangle((hole_x, 16, hole_x + 22, 38), radius=5, fill=(49, 44, 53, int(alpha * 0.22)))
        sdraw.rounded_rectangle((hole_x, strip_h - 38, hole_x + 22, strip_h - 16), radius=5, fill=(49, 44, 53, int(alpha * 0.22)))

    flow = ease(math.sin(local * math.pi))
    base_x = 52 - flow * 420
    elapsed = scene_elapsed("filmstrip", local)
    bottom_assets = scene_media_list("filmstrip", "bottom_strip")
    wrapped_assets = [bottom_assets[-1], *bottom_assets, bottom_assets[0]]
    for index, asset in enumerate(wrapped_assets):
        x = int(base_x + 92 + index * 148)
        image = cover_image(media_image(asset, elapsed), photo_w, photo_h).convert("RGBA")
        strip.alpha_composite(multiply_alpha(image, int(alpha * 0.9)), (x, 48))
        sdraw.rounded_rectangle((x - 5, 43, x + photo_w + 5, 48 + photo_h + 5), radius=5, outline=(255, 255, 255, int(alpha * 0.78)), width=3)
        sdraw.line((x + photo_w + 24, 44, x + photo_w + 24, strip_h - 44), fill=(49, 44, 53, int(alpha * 0.11)), width=2)

    rotated = strip.rotate(1.0 + math.sin(t * 0.55) * 0.45, resample=Image.Resampling.BICUBIC, expand=True)
    layer.alpha_composite(rotated, (int(WIDTH / 2 - rotated.width / 2), int(900 + math.sin(t * 0.45) * 6)))


def draw_filmstrip_scene(layer: Image.Image, t: float, alpha: int, local: float) -> None:
    strip = Image.new("RGBA", (WIDTH + 980, 310), (255, 252, 246, int(alpha * 0.92)))
    sdraw = ImageDraw.Draw(strip, "RGBA")
    for hole_x in range(22, strip.width, 54):
        sdraw.rounded_rectangle((hole_x, 18, hole_x + 26, 44), radius=5, fill=(49, 44, 53, int(alpha * 0.28)))
        sdraw.rounded_rectangle((hole_x, 266, hole_x + 26, 292), radius=5, fill=(49, 44, 53, int(alpha * 0.28)))
    flow = ease(math.sin(local * math.pi))
    base_x = 320 - flow * 480
    elapsed = scene_elapsed("filmstrip", local)
    top_photo_assets = scene_media_list("filmstrip", "top_photo_cards")
    wrapped_assets = [top_photo_assets[-1], *top_photo_assets, top_photo_assets[0]]
    for index, asset in enumerate(wrapped_assets):
        x = base_x + index * 156
        image = cover_image(media_image(asset, elapsed), 140, 210).convert("RGBA")
        strip.alpha_composite(image, (int(x), 54))
        sdraw.rounded_rectangle((int(x), 54, int(x) + 140, 264), radius=4, outline=(255, 255, 255, int(alpha * 0.75)), width=3)
    rotated = strip.rotate(-4 + math.sin(t) * 1.2, resample=Image.Resampling.BICUBIC, expand=True)
    layer.alpha_composite(rotated, (int(WIDTH / 2 - rotated.width / 2), 470))
    draw_bottom_photo_filmstrip(layer, t, alpha, local)


def draw_pause_scene(layer: Image.Image, t: float, alpha: int, local: float) -> None:
    elapsed = scene_elapsed("pause", local)
    draw_media_card(layer, scene_media("pause", "top_left"), elapsed, 210, 420, 274, 352, -7 + math.sin(t) * 1.2, int(alpha * 0.96))
    draw_media_card(layer, scene_media("pause", "top_right"), elapsed, 510, 444, 274, 352, 7 + math.cos(t) * 1.2, int(alpha * 0.96))
    draw_media_card(layer, scene_media("pause", "bottom"), elapsed, 360, 960, 230, 300, 0, int(alpha * 0.58))


def draw_final_scene(layer: Image.Image, t: float, alpha: int, local: float) -> None:
    draw_video_backdrop(layer, "clip_1", local * 5.2, int(alpha * 0.72))
    elapsed = scene_elapsed("final", local)
    draw_media_card(layer, scene_media("final", "main"), elapsed, 360, 352, 286, 360, -1 + math.sin(t) * 1.2, int(alpha * 0.78))
    for index, (x, y, key) in enumerate(((124, 754, "clip_4_live"), (596, 760, "clip_2"))):
        draw_video_card(layer, key, local * 6 + index, x, y, 178, 236, [-8, 8][index], int(alpha * 0.62), "live")
    draw_media_card(layer, scene_media("final", "bottom"), elapsed, 360, 1030, 200, 260, 2, int(alpha * 0.52))


def draw_scene(layer: Image.Image, t: float) -> None:
    draw = ImageDraw.Draw(layer, "RGBA")
    for index, scene in enumerate(SCENES):
        alpha_f = scene_alpha(t, scene)
        if alpha_f <= 0:
            continue
        alpha = int(255 * alpha_f)
        local = (t - scene.start) / (scene.end - scene.start)
        lift = int((1 - ease(local)) * 26)
        accent_color = PALETTE[index % len(PALETTE)]

        if index == 0:
            draw_opening_scene(layer, t, alpha, local)
            draw_scene_label(draw, scene, index, 605 + lift, 262 + lift, alpha, accent_color)
        elif index == 1:
            draw_page_turn_scene(layer, t, alpha, local)
            draw_scene_label(draw, scene, index, 152 + lift, 92 + lift, alpha, accent_color)
        elif index == 2:
            draw_live_clip_scene(layer, t, alpha, local)
            draw_scene_label(draw, scene, index, 1042 + lift, 968 + lift, alpha, accent_color)
        elif index == 3:
            draw_memory_scrapbook_scene(layer, t, alpha, local)
            draw_scene_label(draw, scene, index, 158 + lift, 92 + lift, alpha, accent_color)
        elif index == 4:
            draw_pair_scene(layer, t, alpha, local)
            draw_scene_label(draw, scene, index, 792 + lift, 718 + lift, alpha, accent_color)
        elif index == 5:
            draw_cute_motion_scene(layer, t, alpha, local)
            draw_scene_label(draw, scene, index, 932 + lift, 860 + lift, alpha, accent_color)
        elif index == 6:
            draw_filmstrip_scene(layer, t, alpha, local)
            draw_scene_label(draw, scene, index, 154 + lift, 92 + lift, alpha, accent_color)
        elif index == 7:
            draw_pause_scene(layer, t, alpha, local)
            draw_scene_label(draw, scene, index, 670 + lift, 598 + lift, alpha, accent_color)
        else:
            draw_final_scene(layer, t, alpha, local)
            draw_scene_label(draw, scene, index, 672 + lift, 592 + lift, alpha, accent_color)

    draw.text((WIDTH / 2, 1218), "made with love", font=BODY_SMALL, fill=(92, 76, 82, 118), anchor="mm")


def render_frame(frame_index: int) -> Image.Image:
    t = frame_index / FPS
    image = Image.new("RGBA", (WIDTH, HEIGHT), (255, 255, 255, 255))
    draw = ImageDraw.Draw(image)
    draw_background(draw, t)
    layer = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw_floating_shapes(layer, t)
    draw_scene(layer, t)
    image.alpha_composite(layer)

    fade_in = min(1.0, t / 1.2)
    fade_out = min(1.0, (DURATION - t) / 1.1)
    visible = min(fade_in, fade_out)
    if visible < 1:
        overlay = Image.new("RGBA", (WIDTH, HEIGHT), (255, 250, 245, int(255 * (1 - visible))))
        image.alpha_composite(overlay)
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
    melody = [
        ("C5", "E5", "G5", "B5"),
        ("D5", "F5", "A5", "C6"),
        ("E5", "G5", "B5", "D6"),
        ("G5", "B5", "D6", "E6"),
        ("F5", "A5", "C6", "E6"),
        ("E5", "G5", "C6", "D6"),
        ("D5", "F5", "A5", "C6"),
        ("C5", "E5", "G5", "C6"),
    ]
    beat = 0.48
    samples = bytearray()
    total_samples = int(DURATION * sample_rate)
    for i in range(total_samples):
        seconds = i / sample_rate
        chord = melody[int(seconds / beat) % len(melody)]
        local = (seconds % beat) / beat
        envelope = min(1.0, local / 0.08) * min(1.0, (1 - local) / 0.22)
        value = 0.0
        for idx, note in enumerate(chord):
            freq = note_frequency(note)
            value += math.sin(2 * math.pi * freq * seconds) * (0.16 / (idx + 1))
        bass = note_frequency(chord[0][0] + "3")
        value += math.sin(2 * math.pi * bass * seconds) * 0.07
        sparkle = math.sin(2 * math.pi * note_frequency(chord[-1]) * seconds * 2) * 0.025
        sample = int(max(-1.0, min(1.0, (value + sparkle) * envelope)) * 32767)
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
        frame = render_frame(frame_index)
        process.stdin.write(frame.tobytes())
        if frame_index % FPS == 0:
            print(f"rendered {frame_index // FPS:02d}/{DURATION}s", flush=True)
    process.stdin.close()
    code = process.wait()
    if code != 0:
        raise RuntimeError(f"ffmpeg exited with code {code}")


def main() -> None:
    load_assets()
    audio_path = Path(tempfile.gettempdir()) / "anniversary-celebration-music.wav"
    write_music(audio_path)
    encode_video(audio_path)
    print(f"created {OUTPUT}")


if __name__ == "__main__":
    main()

import argparse
import time
from typing import List, Tuple, Optional

import pyautogui
from PIL import Image
import pytesseract


Coordinate = Tuple[int, int]
Region = Tuple[int, int, int, int]  # left, top, width, height


def capture_region(region: Region) -> Image.Image:
	left, top, width, height = region
	return pyautogui.screenshot(region=(left, top, width, height))


def find_text_in_region(target_text: str, region: Region, lang: str = "eng") -> Optional[Tuple[int, int]]:
	"""
	OCR the region looking for target_text.
	Returns the center (x, y) within the region-local coordinates if found, else None.
	"""
	image = capture_region(region)
	# Use Tesseract to get bounding boxes
	data = pytesseract.image_to_data(image, lang=lang, output_type=pytesseract.Output.DICT)
	n = len(data.get("text", []))
	best_idx = None
	best_conf = -1.0
	for i in range(n):
		word = (data["text"][i] or "").strip()
		if not word:
			continue
		# Compare case-insensitively and allow substring matches
		if target_text.lower() in word.lower():
			try:
				conf = float(data.get("conf", ["-1"][i]))
			except Exception:
				conf = -1.0
			if conf > best_conf:
				best_conf = conf
				best_idx = i
	if best_idx is None:
		return None
	left = int(data["left"][best_idx])
	top = int(data["top"][best_idx])
	width = int(data["width"][best_idx])
	height = int(data["height"][best_idx])
	center_x = left + width // 2
	center_y = top + height // 2
	return (center_x, center_y)


def choose_coordinate(candidates: List[Coordinate], preferred_index: Optional[int], anchor: Optional[Coordinate]) -> Coordinate:
	if preferred_index is not None:
		if preferred_index < 0 or preferred_index >= len(candidates):
			raise IndexError("preferred_index out of range")
		return candidates[preferred_index]
	# Choose the candidate closest to the anchor (if provided), else the first
	if anchor is None:
		return candidates[0]
	ax, ay = anchor
	best = min(candidates, key=lambda c: (c[0] - ax) ** 2 + (c[1] - ay) ** 2)
	return best


def click_coordinate(coord: Coordinate, clicks: int = 1, interval: float = 0.0, button: str = "left") -> None:
	pyautogui.click(x=coord[0], y=coord[1], clicks=clicks, interval=interval, button=button)


def main():
	parser = argparse.ArgumentParser(description="Find text in screen region and click one of four coordinates")
	parser.add_argument("text", help="Target text to find (substring match)")
	parser.add_argument("left", type=int, help="Region left (x)")
	parser.add_argument("top", type=int, help="Region top (y)")
	parser.add_argument("width", type=int, help="Region width")
	parser.add_argument("height", type=int, help="Region height")
	parser.add_argument("c1x", type=int, help="Candidate 1 x")
	parser.add_argument("c1y", type=int, help="Candidate 1 y")
	parser.add_argument("c2x", type=int, help="Candidate 2 x")
	parser.add_argument("c2y", type=int, help="Candidate 2 y")
	parser.add_argument("c3x", type=int, help="Candidate 3 x")
	parser.add_argument("c3y", type=int, help="Candidate 3 y")
	parser.add_argument("c4x", type=int, help="Candidate 4 x")
	parser.add_argument("c4y", type=int, help="Candidate 4 y")
	parser.add_argument("-i", "--index", type=int, default=None, help="Preferred candidate index (0-3)")
	parser.add_argument("-l", "--lang", default="eng", help="Tesseract language (default: eng)")
	parser.add_argument("-d", "--delay", type=float, default=0.0, help="Optional delay before click (seconds)")
	parser.add_argument("-b", "--button", default="left", choices=["left", "right", "middle"], help="Mouse button")
	parser.add_argument("--double", action="store_true", help="Double click instead of single")

	args = parser.parse_args()
	region: Region = (args.left, args.top, args.width, args.height)
	candidates: List[Coordinate] = [(args.c1x, args.c1y), (args.c2x, args.c2y), (args.c3x, args.c3y), (args.c4x, args.c4y)]

	anchor = find_text_in_region(args.text, region, lang=args.lang)
	if anchor is None:
		raise SystemExit("Target text not found in the specified region")

	chosen = choose_coordinate(candidates, args.index, anchor)
	if args.delay > 0:
		time.sleep(args.delay)
	clicks = 2 if args.double else 1
	click_coordinate(chosen, clicks=clicks, button=args.button)
	print(f"Clicked at {chosen}")


if __name__ == "__main__":
	main()

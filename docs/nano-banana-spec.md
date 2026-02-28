# Nano Banana

A CLI tool for formatting sprite assets for Epoch Runner level packs.

## Overview

Nano Banana processes image files and prepares them for use in Epoch Runner custom level packs. It handles resizing, transparency, spritesheet generation, hitbox calculation, and batch processing.

## Installation

```bash
npm install -g nano-banana
```

Or run locally:

```bash
npx nano-banana <command> [options]
```

## Commands

### `resize`

Resize sprites to standard tile sizes.

```bash
nano-banana resize <input> [options]

Options:
  -s, --size <size>     Target size: 32, 64, or custom WxH (default: 32)
  -o, --output <dir>    Output directory (default: ./output)
  -m, --mode <mode>     Resize mode: contain, cover, stretch (default: contain)
  --maintain-aspect     Maintain aspect ratio (default: true)
```

**Examples:**

```bash
# Resize to 64x64 (standard tile size)
nano-banana resize ./sprites/*.png -s 64

# Resize to 128x128 with cover mode
nano-banana resize player.png -s 128 -m cover

# Custom size
nano-banana resize background.png -s 960x540
```

---

### `transparency`

Add or fix transparency in sprites.

```bash
nano-banana transparency <input> [options]

Options:
  -c, --color <hex>     Color to make transparent (e.g., #FF00FF)
  -t, --threshold <n>   Color match threshold 0-255 (default: 10)
  -o, --output <dir>    Output directory
  --trim                Trim transparent edges
  --padding <n>         Add padding around sprite (default: 0)
```

**Examples:**

```bash
# Make magenta transparent
nano-banana transparency sprite.png -c "#FF00FF"

# Remove white background with tolerance
nano-banana transparency *.png -c "#FFFFFF" -t 20

# Trim and add padding
nano-banana transparency sprite.png --trim --padding 2
```

---

### `spritesheet`

Combine multiple sprites into a spritesheet.

```bash
nano-banana spritesheet <input-pattern> [options]

Options:
  -o, --output <file>   Output filename (default: spritesheet.png)
  -c, --cols <n>        Number of columns (default: auto)
  -r, --rows <n>        Number of rows (default: auto)
  --cell-size <WxH>     Force cell size (default: auto from largest)
  --json                Generate JSON metadata file
  --names               Include filenames in JSON
```

**Examples:**

```bash
# Create spritesheet from folder
nano-banana spritesheet ./player/*.png -o player-sheet.png --json

# Specific grid layout
nano-banana spritesheet ./tiles/*.png -c 8 -r 4

# With metadata
nano-banana spritesheet ./enemies/*.png --json --names
```

**Output JSON format:**

```json
{
  "image": "spritesheet.png",
  "cellWidth": 64,
  "cellHeight": 64,
  "cols": 8,
  "rows": 4,
  "frames": [
    { "name": "idle_0", "x": 0, "y": 0 },
    { "name": "idle_1", "x": 64, "y": 0 }
  ]
}
```

---

### `hitbox`

Auto-generate hitbox polygons from sprite alpha channel.

```bash
nano-banana hitbox <input> [options]

Options:
  -o, --output <file>   Output JSON file (default: hitboxes.json)
  -t, --threshold <n>   Alpha threshold 0-255 (default: 128)
  -s, --simplify <n>    Polygon simplification tolerance (default: 2)
  --preview             Generate preview images with hitbox overlay
  --format <type>       Output format: polygon, aabb, both (default: polygon)
```

**Examples:**

```bash
# Generate hitboxes for all sprites
nano-banana hitbox ./sprites/*.png -o hitboxes.json

# With preview images
nano-banana hitbox player.png --preview

# Adjust sensitivity
nano-banana hitbox detailed-sprite.png -t 64 -s 1
```

**Output JSON format:**

```json
{
  "player_idle": {
    "polygon": [
      [8, 0], [56, 0], [62, 16], [62, 112], [40, 128], [24, 128], [0, 112], [0, 16]
    ],
    "aabb": { "x": 0, "y": 0, "width": 64, "height": 128 }
  }
}
```

---

### `preview`

Preview how sprites will look in-game.

```bash
nano-banana preview <input> [options]

Options:
  -t, --type <type>     Asset type: tile, player, background, ui
  -z, --zoom <n>        Zoom level 1-8 (default: 2)
  --grid                Show tile grid overlay
  --animate             Animate player sprites
  -o, --output <file>   Save preview as image
```

**Examples:**

```bash
# Preview tile sprite
nano-banana preview grass.png -t tile --grid

# Preview player animation
nano-banana preview ./player/*.png -t player --animate

# Save preview image
nano-banana preview custom-bg.png -t background -o preview.png
```

---

### `batch`

Process multiple files with a config file.

```bash
nano-banana batch <config-file>

Config file: nano-banana.config.json
```

**Config file format:**

```json
{
  "input": "./raw-assets",
  "output": "./processed",
  "tasks": [
    {
      "pattern": "tiles/*.png",
      "operations": [
        { "cmd": "transparency", "color": "#FF00FF" },
        { "cmd": "resize", "size": 64 }
      ]
    },
    {
      "pattern": "player/*.png",
      "operations": [
        { "cmd": "resize", "size": "64x128" },
        { "cmd": "hitbox", "threshold": 100 }
      ]
    },
    {
      "pattern": "backgrounds/*.png",
      "operations": [
        { "cmd": "resize", "size": "1024x768" }
      ]
    }
  ]
}
```

**Example:**

```bash
nano-banana batch nano-banana.config.json
```

---

## Workflow Example

Complete workflow for preparing assets for an Epoch Runner level pack:

```bash
# 1. Fix transparency on raw tile sprites
nano-banana transparency ./raw/tiles/*.png -c "#FF00FF" -o ./clean/tiles

# 2. Resize tiles to 64x64
nano-banana resize ./clean/tiles/*.png -s 64 -o ./final/tiles

# 3. Process player sprites (1 tile wide, 2 tiles tall)
nano-banana transparency ./raw/player/*.png -c "#FFFFFF" --trim
nano-banana resize ./raw/player/*.png -s "64x128" -o ./final/player

# 4. Generate hitboxes
nano-banana hitbox ./final/**/*.png -o ./final/hitboxes.json --preview

# 5. Preview results
nano-banana preview ./final/tiles/grass.png -t tile --grid
nano-banana preview ./final/player/*.png -t player --animate
```

## Asset Requirements for Epoch Runner

| Asset Type | Recommended Size | Notes |
|------------|------------------|-------|
| Tiles | 64x64 | Must be square (TILE_SIZE) |
| Player (idle) | 64x128 | 1 tile wide, 2 tiles tall |
| Player (run) | 64x128 | Same as idle |
| Player (jump) | 64x128 | Same as idle |
| Background | 1024x768 | Viewport size (16:12 ratio) |
| UI Icons | 32x32 or 64x64 | Hearts, coins |

## Technical Details

### Alpha-Based Hitbox Generation

Uses Marching Squares algorithm to trace sprite outline:

1. Scan image for alpha values above threshold
2. Generate contour points around opaque pixels
3. Simplify polygon using Ramer-Douglas-Peucker algorithm
4. Output as array of [x, y] coordinate pairs

### Supported Formats

- **Input:** PNG, JPG, GIF, WebP, BMP
- **Output:** PNG (with alpha channel)

### Dependencies

- `sharp` - Image processing
- `commander` - CLI framework
- `chalk` - Terminal colors
- `glob` - File pattern matching

## Future Features

- [ ] Palette swapping for theme variants
- [ ] Animation frame extraction from GIFs
- [ ] Tile autotiling rule generator
- [ ] Direct upload to Epoch Runner editor
- [ ] GUI mode with Electron

## License

MIT

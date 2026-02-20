"""
Lens Shape Extractor
Extracts clean, normalized lens shape outlines from PNG images using OpenCV.
Outputs:
  1. Normalized JSON point array (for shapeGenerators.js)
  2. Clean SVG preview
  3. JavaScript code snippet ready to paste
"""

import cv2
import numpy as np
import json
import sys
import os

def extract_contour(image_path, epsilon_factor=0.005, blur_size=3):
    """Extract the main contour from a PNG image."""
    # Load image in grayscale
    img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    if img is None:
        print(f"Error: Could not load image '{image_path}'")
        sys.exit(1)
    
    h, w = img.shape
    print(f"Image size: {w}x{h}")
    
    # Apply slight Gaussian blur to smooth edges
    if blur_size > 0:
        img = cv2.GaussianBlur(img, (blur_size, blur_size), 0)
    
    # Threshold to binary (invert so shape is white on black)
    _, thresh = cv2.threshold(img, 200, 255, cv2.THRESH_BINARY_INV)
    
    # Find external contours
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    
    if not contours:
        print("Error: No contours found!")
        sys.exit(1)
    
    # Pick the largest contour
    contours = sorted(contours, key=lambda c: cv2.contourArea(c), reverse=True)
    main_contour = contours[0]
    
    area = cv2.contourArea(main_contour)
    print(f"Found {len(contours)} contour(s). Largest area: {area:.0f} px²")
    print(f"Raw contour points: {len(main_contour)}")
    
    # Smooth the contour using approxPolyDP
    perimeter = cv2.arcLength(main_contour, True)
    epsilon = epsilon_factor * perimeter
    smoothed = cv2.approxPolyDP(main_contour, epsilon, True)
    print(f"Smoothed to {len(smoothed)} points (epsilon={epsilon:.1f})")
    
    return smoothed, (w, h)


def normalize_points(contour, img_size):
    """
    Normalize contour points to centered coordinates.
    Maps to range roughly [-0.5, 0.5] based on the shape's bounding box.
    Returns list of {x, z} dicts (x=horizontal, z=vertical in our 3D system).
    """
    # Extract x, y from contour
    points = contour.reshape(-1, 2).astype(float)
    
    # Get bounding box of the shape
    x_min, y_min = points.min(axis=0)
    x_max, y_max = points.max(axis=0)
    
    shape_w = x_max - x_min
    shape_h = y_max - y_min
    
    # Center of the shape
    cx = (x_min + x_max) / 2
    cy = (y_min + y_max) / 2
    
    # Normalize: center at origin, scale so max dimension = 1.0
    # Keep aspect ratio
    scale = max(shape_w, shape_h)
    
    normalized = []
    for px, py in points:
        nx = (px - cx) / scale
        ny = (py - cy) / scale
        # In our 3D system: x = horizontal, z = vertical (flip y)
        normalized.append({'x': round(nx, 5), 'z': round(-ny, 5)})
    
    # Calculate width ratio (used by LensModel.jsx for bridge calculations)
    width_ratio = shape_w / shape_h
    
    print(f"Shape bounds: {shape_w:.0f}x{shape_h:.0f} px")
    print(f"Width ratio: {width_ratio:.3f}")
    
    return normalized, width_ratio


def resample_points(points, target_count=120):
    """
    Resample the point list to have exactly target_count evenly-spaced points.
    This ensures consistent geometry generation.
    """
    # Convert to numpy array for easier manipulation
    pts = np.array([[p['x'], p['z']] for p in points])
    
    # Close the loop by appending the first point
    pts = np.vstack([pts, pts[0]])
    
    # Calculate cumulative arc length
    diffs = np.diff(pts, axis=0)
    segment_lengths = np.sqrt((diffs ** 2).sum(axis=1))
    cumulative = np.concatenate([[0], np.cumsum(segment_lengths)])
    total_length = cumulative[-1]
    
    # Create evenly spaced parameter values
    target_distances = np.linspace(0, total_length, target_count, endpoint=False)
    
    # Interpolate x and z at each target distance
    resampled = []
    for d in target_distances:
        # Find the segment containing this distance
        idx = np.searchsorted(cumulative, d, side='right') - 1
        idx = min(idx, len(pts) - 2)
        
        # Linear interpolation within the segment
        seg_start = cumulative[idx]
        seg_len = segment_lengths[idx]
        if seg_len < 1e-10:
            t = 0
        else:
            t = (d - seg_start) / seg_len
        
        x = pts[idx, 0] + t * (pts[idx + 1, 0] - pts[idx, 0])
        z = pts[idx, 1] + t * (pts[idx + 1, 1] - pts[idx, 1])
        resampled.append({'x': round(float(x), 5), 'z': round(float(z), 5)})
    
    return resampled


def generate_svg(points, filename, width=400, height=400):
    """Generate a clean SVG preview of the normalized shape."""
    # Map normalized coordinates to SVG viewport
    margin = 20
    view_w = width - 2 * margin
    view_h = height - 2 * margin
    
    path_data = "M "
    for i, p in enumerate(points):
        # Map from [-0.5, 0.5] to SVG coordinates
        sx = margin + (p['x'] + 0.5) * view_w
        sy = margin + (-p['z'] + 0.5) * view_h  # flip z back to y
        if i == 0:
            path_data += f"{sx:.1f},{sy:.1f} "
        else:
            path_data += f"L {sx:.1f},{sy:.1f} "
    path_data += "Z"
    
    svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">
  <rect width="{width}" height="{height}" fill="#f8f8f8"/>
  <path d="{path_data}" fill="none" stroke="#333" stroke-width="1.5"/>
  <!-- Center crosshair -->
  <line x1="{width/2}" y1="{margin}" x2="{width/2}" y2="{height-margin}" stroke="#ddd" stroke-width="0.5"/>
  <line x1="{margin}" y1="{height/2}" x2="{width-margin}" y2="{height/2}" stroke="#ddd" stroke-width="0.5"/>
</svg>'''
    
    with open(filename, 'w') as f:
        f.write(svg)
    print(f"SVG preview saved: {filename}")


def generate_js_snippet(points, width_ratio, shape_name="extracted"):
    """Generate a JavaScript code snippet for shapeGenerators.js"""
    # Format points as JS array
    js_points = json.dumps(points, indent=None)
    # Make it more readable
    js_points = js_points.replace('}, {', '},\n    {')
    js_points = js_points.replace('[{', '[\n    {')
    js_points = js_points.replace('}]', '}\n  ]')
    # Replace double quotes with no quotes for keys
    js_points = js_points.replace('"x":', 'x:')
    js_points = js_points.replace('"z":', 'z:')
    
    snippet = f"""
// --- Extracted from PNG: {shape_name} ---
// Width ratio: {width_ratio:.3f}
export function generate{shape_name.capitalize()}(numPoints = {len(points)}) {{
  const raw = {js_points};
  
  // Resample if different point count requested
  if (numPoints !== raw.length) {{
    return resamplePoints(raw, numPoints);
  }}
  return raw;
}}
"""
    return snippet


def save_json(points, width_ratio, filename):
    """Save normalized points as JSON."""
    data = {
        'widthRatio': round(width_ratio, 4),
        'pointCount': len(points),
        'points': points
    }
    with open(filename, 'w') as f:
        json.dump(data, f, indent=2)
    print(f"JSON data saved: {filename}")


def main():
    # Configuration
    input_image = sys.argv[1] if len(sys.argv) > 1 else "public/lenses01.png"
    output_dir = os.path.dirname(input_image) or "."
    base_name = os.path.splitext(os.path.basename(input_image))[0]
    
    # Parameters
    epsilon_factor = 0.003  # Lower = more points, higher = smoother
    target_points = 120     # Number of evenly-spaced output points
    blur_size = 3           # Gaussian blur kernel size (0 to disable)
    
    print(f"\n{'='*50}")
    print(f"Lens Shape Extractor")
    print(f"{'='*50}")
    print(f"Input: {input_image}")
    print(f"Epsilon factor: {epsilon_factor}")
    print(f"Target points: {target_points}")
    print(f"{'='*50}\n")
    
    # Step 1: Extract contour
    contour, img_size = extract_contour(input_image, epsilon_factor, blur_size)
    
    # Step 2: Normalize to centered coordinates
    norm_points, width_ratio = normalize_points(contour, img_size)
    
    # Step 3: Resample to even spacing
    resampled = resample_points(norm_points, target_points)
    print(f"Resampled to {len(resampled)} evenly-spaced points")
    
    # Step 4: Generate outputs
    svg_path = os.path.join(output_dir, f"{base_name}_traced.svg")
    json_path = os.path.join(output_dir, f"{base_name}_shape.json")
    js_path = os.path.join(output_dir, f"{base_name}_generator.js")
    
    generate_svg(resampled, svg_path)
    save_json(resampled, width_ratio, json_path)
    
    # Generate JS snippet
    js_code = generate_js_snippet(resampled, width_ratio, base_name)
    with open(js_path, 'w') as f:
        f.write(js_code)
    print(f"JS snippet saved: {js_path}")
    
    print(f"\n{'='*50}")
    print(f"Done! Width ratio: {width_ratio:.3f}")
    print(f"{'='*50}\n")


if __name__ == "__main__":
    main()

import cv2
import numpy as np


def preprocess(colour: cv2.Mat) -> cv2.Mat:
    # Convert to grayscale
    gray = cv2.cvtColor(colour, cv2.COLOR_BGR2GRAY)
    
    # Invert so text is white (255) and background is black (0)
    # Using OTSU simply helps handle varying lighting conditions automatically
    _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

    height, width = binary.shape
    
    # ---------------------------------------------------------
    # STEP 1: Surgical Footer Removal (The Fix)
    # ---------------------------------------------------------
    # Instead of cropping, we find the page number and paint over it.
    
    # Define Footer ROI (Bottom 8% of the page)
    footer_h = int(height * 0.08)
    footer_roi = binary[height - footer_h:, :]
    
    # Find contours in the footer area
    contours, _ = cv2.findContours(footer_roi, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    for c in contours:
        x, y, w, h = cv2.boundingRect(c)
        
        # Filter: Page numbers are usually centered and smallish
        # Check if centered-ish (within middle 50% of page width)
        center_x = x + w//2
        if (width * 0.25) < center_x < (width * 0.75):
            # Check size (ignore tiny noise specs)
            if w > 10 and h > 3:
                # MASK IT OUT: Draw a white rectangle over the original image
                # Note: y is relative to the ROI, so add (height - footer_h)
                top_left = (x, height - footer_h + y - 5) # -5 padding
                bottom_right = (x + w, height - footer_h + y + h + 5)
                cv2.rectangle(colour, top_left, bottom_right, (255, 255, 255), -1)
                cv2.rectangle(binary, top_left, bottom_right, 0, -1) # Also clear from binary for later steps

    # ---------------------------------------------------------
    # STEP 2: Surgical Header Removal
    # ---------------------------------------------------------
    # Similar logic for the top header (Running heads like "ONI, 2")
    header_h = int(height * 0.08)
    header_roi = binary[:header_h, :]
    contours, _ = cv2.findContours(header_roi, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    for c in contours:
        x, y, w, h = cv2.boundingRect(c)
        if h > 3 and w > 5: # Minimal noise filter
            # Mask out the header
            cv2.rectangle(colour, (x, y), (x+w, y+h), (255, 255, 255), -1)
            cv2.rectangle(binary, (x, y), (x+w, y+h), 0, -1)

    
    cv2.imwrite(f"{output_dir}/debug_masked.jpg", colour)
    
    # ---------------------------------------------------------
    # STEP 3: Trim Excess Whitespace (The New Logic)
    # ---------------------------------------------------------
    # Find all non-zero pixels (text) in the binary image
    
    eroded = cv2.erode(binary, None, iterations=1)
    coords = cv2.findNonZero(eroded)
    
    if len(coords):
        # Get the bounding box of the actual text content
        x, y, w, h = cv2.boundingRect(coords)
        
        # Add a tiny padding (e.g., 10px) so text doesn't touch the edge
        padding = 10
        x_new = max(0, x - padding)
        y_new = max(0, y - padding)
        w_new = min(width - x_new, w + padding)
        h_new = min(height - y_new, h + padding)
        
        # Crop both images
        img_cropped = colour[y_new:y_new+h_new, x_new:x_new+w_new]
        bin_cropped = binary[y_new:y_new+h_new, x_new:x_new+w_new]
        
        colour, binary = img_cropped, bin_cropped
    else:
        print("No text found!")
        
    
    
    # If page is empty, return original
    return colour, binary


def page2col(colour: cv2.Mat, binary: cv2.Mat) -> cv2.Mat[4]:

    # ---------------------------------------------------------
    # 2. Robust Column Splitting (The Fix)
    # ---------------------------------------------------------

    # Sum pixels vertically to get the projection profile
    v_proj = np.sum(binary, axis=0)
    height, width = binary.shape
    
    # Define the "Search Zone" (middle 20% of the page)
    # The gutter is always roughly in the center.
    search_start = int(width * 0.40)
    search_end = int(width * 0.60)
    center_proj = v_proj[search_start:search_end]
    
    # Heuristic: A "gap" is any column with very few black pixels.
    # We use a low threshold (e.g., < 1% of height) to allow for some noise/dust.
    noise_threshold = height * 255 * 0.01 
    
    # Find indices in the search zone that are "quiet"
    quiet_indices = np.where(center_proj < noise_threshold)[0]
    
    if len(quiet_indices) > 0:
        # We found a gap! 
        # Shift indices back to original image coordinates
        quiet_indices_global = quiet_indices + search_start
        
        # Calculate the median or mean of these quiet indices to find the visual center
        split_x = int(np.mean(quiet_indices_global))
    else:
        # Fallback: If no gap found (e.g., massive ink blot), just use dead center
        print("Warning: No clear gutter found. Defaulting to center.")
        split_x = width // 2

    # ---------------------------------------------------------
    # 3. Visualize the Cut (Debug)
    # ---------------------------------------------------------
    # Draw a line where we are cutting to verify
    debug_img = colour.copy()
    cv2.line(debug_img, (split_x, 0), (split_x, height), (0, 0, 255), 2)
    
    # Save debug image
    # cv2.imwrite(f"{output_dir}/debug_split.jpg", debug_img)
    print(f"Splitting page at X = {split_x}")

    # Return the two column images for the next step (row segmentation)
    bin_left = binary[:, :split_x]
    bin_right = binary[:, split_x:]
    col_left = colour[:, :split_x]
    col_right = colour[:, split_x:]
    
    return col_left, col_right, bin_left, bin_right

def segment_entries(col_img: cv2.Mat, bin_img: cv2.Mat) -> tuple[cv2.Mat]:
    h, w = bin_img.shape
    
    # 1. Get the Left Strip (Vertical Script Zone)
    # We only care about the ink in this region
    strip_width = int(w * 0.15)
    script_strip = bin_img[:, :strip_width]
    
    # 2. Aggressive Dilation (The "Smear")
    # We use a vertical kernel (1 pixel wide, 5 pixels tall)
    # We apply it 6 times (or just use a (1, 30) kernel once, which is cleaner)
    # This turns "dotted lines" into one solid black bar.
    # kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 30)) 
    dilated_mask = cv2.dilate(script_strip, None, iterations=3)
    
    # 3. Find Blocks
    # Now we find contours on this "smeared" mask.
    contours, _ = cv2.findContours(dilated_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # 4. Extract Cut Points
    cut_points = []
    for c in contours:
        x, y, w_c, h_c = cv2.boundingRect(c)
        
        # Filter: Ignore tiny noise specks (e.g., dust < 30px tall)
        if h_c > 30:
            cut_points.append(y)
            
    cut_points.sort()
    
    # 5. Slice the Original Image
    entries = []
    for i in range(len(cut_points)):
        y_start = cut_points[i]
        
        # The end of this entry is the start of the next one
        if i < len(cut_points) - 1:
            y_end = cut_points[i+1]
        else:
            y_end = h 
        
        # Optional: Add a tiny buffer (-5) to y_start to include top serifs
        safe_y = max(0, y_start - 5)
        
        sliced = col_img[safe_y:y_end, :]
        if sliced.shape[0] > 0:
            # check if the area is empty
            
            entries.append(sliced)
        else:
            print("No entry found!")
        # entries.append()
        
    return entries


# --- USAGE ---
# col_left, col_right, col_left_bin, col_right_bin = page2col(imColour, imBinary)

# left_entries = segment_entries(col_left, col_left_bin)
# right_entries = segment_entries(col_right, col_right_bin)

# print(f"Found {len(left_entries)} entries in left column")
# Save them to test
# for i, entry in enumerate(left_entries):
#     cv2.imwrite(f"output/entry_L_{i}.jpg", entry)

output_dir = "output"
filename = '../.legacy/Lessing Images/D/LessingDict_Page_0258.jpg'

imColour = cv2.imread(filename)

cv2.imwrite(f'{output_dir}/debug_original.jpg', imColour)
imColour, imBinary = preprocess(imColour)
colLeft, colRight, binLeft, binRight = page2col(imColour, imBinary)

cv2.imwrite(f"{output_dir}/debug_cropped.jpg", imColour)
cv2.imwrite(f"{output_dir}/debug_split_left.jpg", colLeft)
cv2.imwrite(f"{output_dir}/debug_split_right.jpg", colRight)

left_entries = segment_entries(colLeft, binLeft)
right_entries = segment_entries(colRight, binRight)

print(f"Found {len(left_entries)} entries in left column")
print(f"Found {len(right_entries)} entries in right column")

for i, entry in enumerate(left_entries):
    cv2.imwrite(f"{output_dir}/entries/entry-0258L-{i:02}.jpg", entry)

for i, entry in enumerate(right_entries):
    cv2.imwrite(f"{output_dir}/entries/entry-0258R-{i:02}.jpg", entry)

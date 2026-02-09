import cv2
import numpy as np


def preprocess(img: cv2.Mat) -> cv2.Mat:
    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
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
            if w > 10 and h > 10:
                # MASK IT OUT: Draw a white rectangle over the original image
                # Note: y is relative to the ROI, so add (height - footer_h)
                top_left = (x, height - footer_h + y - 5) # -5 padding
                bottom_right = (x + w, height - footer_h + y + h + 5)
                cv2.rectangle(img, top_left, bottom_right, (255, 255, 255), -1)
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
        if h > 5 and w > 5: # Minimal noise filter
            # Mask out the header
            cv2.rectangle(img, (x, y), (x+w, y+h), (255, 255, 255), -1)
            cv2.rectangle(binary, (x, y), (x+w, y+h), 0, -1)

    return binary


def page2col(binary: cv2.Mat) -> tuple[cv2.Mat, cv2.Mat]:

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
    debug_img = img.copy()
    cv2.line(debug_img, (split_x, 0), (split_x, height), (0, 0, 255), 2)
    
    # Save debug image
    cv2.imwrite(f"{output_dir}/debug_split.jpg", debug_img)
    print(f"Splitting page at X = {split_x}")

    # Return the two column images for the next step (row segmentation)
    col_left = img[:, :split_x]
    col_right = img[:, split_x:]
    
    return col_left, col_right
    # entries = []
    # for col in cols:
    #     # 3. Split Entries (Horizontal Projection)
    #     # We focus on the right side of the column to avoid vertical script noise
    #     col_h, col_w = col.shape[:2]
    #     right_side_roi = col[:, int(col_w*0.25):] # Look at English text area only
    #     gray_roi = cv2.cvtColor(right_side_roi, cv2.COLOR_BGR2GRAY)
    #     _, bin_roi = cv2.threshold(gray_roi, 150, 255, cv2.THRESH_BINARY_INV)
        
    #     # Dilate to merge lines into blocks
    #     kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (20, 5))
    #     dilated = cv2.dilate(bin_roi, kernel, iterations=1)
        
    #     # Find contours (potential text blocks)
    #     contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
    #     # Filter and Sort contours top-to-bottom
    #     # (This gives you the bounding box for each entry)
    #     entry_boxes = []
    #     for c in contours:
    #         x, y, w, h = cv2.boundingRect(c)
    #         if h > 20 and w > 50: # Filter noise
    #             # Expand box to left to include the Vertical Mongol Script
    #             entries.append(col[y:y+h, 0:col_w]) 
                
    #     entries.append(entry_boxes)
        
    # return entries # Returns list of cropped images



filename = '../.legacy/Lessing Images/D/LessingDict_Page_0258.jpg'

imBinary = preprocess(cv2.imread(filename))

cv2.imwrite("debug_preprocess.jpg", imBinary)
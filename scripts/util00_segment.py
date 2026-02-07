import cv2
import numpy as np

def page2col(image_path):
    # 1. Load and Binarize
    img = cv2.imread(image_path)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    _, binary = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY_INV)

    # 2. Split Columns (Vertical Projection)
    # Sum pixels vertically to find the big gap in the middle
    v_proj = np.sum(binary, axis=0)
    height, width = binary.shape
    midpoint = width // 2
    # Find the "quietest" zone around the midpoint
    split_x = midpoint - 50 + np.argmin(v_proj[midpoint-50:midpoint+50])
    
    cols = [img[:, :split_x], img[:, split_x:]]
    return cols
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


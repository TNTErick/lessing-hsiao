import os
from pathlib import Path
from PIL import Image

def main():
    # Get the directory where the script is located
    script_dir = Path(__file__).parent
    
    # Define source and destination directories relative to the project root
    project_root = script_dir.parent
    source_dir = project_root / '.legacy' / 'Lessing Images'
    dest_dir = project_root / 'public' / 'dict'

    if not source_dir.exists():
        print(f"Source directory does not exist: {source_dir}")
        return

    # Find all images in the source directory
    extensions = {'.jpg', '.jpeg', '.png', '.webp'}
    image_paths = [p for p in source_dir.rglob('*') if p.suffix.lower() in extensions]

    print(f"Found {len(image_paths)} images. Starting compression...")

    for img_path in image_paths:
        # Calculate relative path to preserve folder structure
        rel_path = img_path.relative_to(source_dir)
        dest_path = dest_dir / rel_path

        # Ensure target subdirectories exist
        dest_path.parent.mkdir(parents=True, exist_ok=True)

        try:
            with Image.open(img_path) as img:
                # Convert RGBA/Palette to RGB if saving as JPEG
                if img.mode in ('RGBA', 'P') and dest_path.suffix.lower() in ('.jpg', '.jpeg'):
                    img = img.convert('RGB')
                
                # Save with compression (quality=70 and optimization are good defaults)
                img.save(dest_path, optimize=True, quality=70)
                print(f"Successfully compressed: {rel_path}")
        except Exception as e:
            print(f"Failed to compress {rel_path}: {e}")

if __name__ == "__main__":
    main()
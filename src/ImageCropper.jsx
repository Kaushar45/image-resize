import React, { useState, useRef, useEffect } from "react";
import { Upload, Crop, Maximize2, Download, RotateCw } from "lucide-react";

export default function ImageCropperResizer() {
  const [image, setImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 200, height: 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [maintainAspect, setMaintainAspect] = useState(false);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const containerRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setImage(event.target.result);
          setDimensions({ width: img.width, height: img.height });
          setCrop({
            x: 0,
            y: 0,
            width: Math.min(200, img.width),
            height: Math.min(200, img.height),
          });
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMouseDown = (e, type) => {
    e.preventDefault();
    setIsDragging(true);
    setDragType(type);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const scaleX = imageRef.current.naturalWidth / rect.width;
    const scaleY = imageRef.current.naturalHeight / rect.height;

    const deltaX = (e.clientX - dragStart.x) * scaleX;
    const deltaY = (e.clientY - dragStart.y) * scaleY;

    if (dragType === "move") {
      setCrop((prev) => ({
        ...prev,
        x: Math.max(
          0,
          Math.min(prev.x + deltaX, imageRef.current.naturalWidth - prev.width)
        ),
        y: Math.max(
          0,
          Math.min(
            prev.y + deltaY,
            imageRef.current.naturalHeight - prev.height
          )
        ),
      }));
    } else if (dragType === "resize") {
      setCrop((prev) => ({
        ...prev,
        width: Math.max(
          50,
          Math.min(prev.width + deltaX, imageRef.current.naturalWidth - prev.x)
        ),
        height: Math.max(
          50,
          Math.min(
            prev.height + deltaY,
            imageRef.current.naturalHeight - prev.y
          )
        ),
      }));
    }

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragType(null);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  const applyCrop = () => {
    if (!imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = crop.width;
    canvas.height = crop.height;

    ctx.drawImage(
      imageRef.current,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      crop.width,
      crop.height
    );

    const croppedImage = canvas.toDataURL("image/png");
    setImage(croppedImage);

    const img = new Image();
    img.onload = () => {
      setDimensions({ width: img.width, height: img.height });
      setCrop({ x: 0, y: 0, width: img.width, height: img.height });
    };
    img.src = croppedImage;
  };

  const applyResize = () => {
    if (!imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    ctx.drawImage(imageRef.current, 0, 0, dimensions.width, dimensions.height);

    const resizedImage = canvas.toDataURL("image/png");
    setImage(resizedImage);
    setCrop({ x: 0, y: 0, width: dimensions.width, height: dimensions.height });
  };

  const downloadImage = () => {
    if (!image) return;
    const link = document.createElement("a");
    link.download = "edited-image.png";
    link.href = image;
    link.click();
  };

  const getCropStyle = () => {
    if (!imageRef.current) return {};
    const rect = imageRef.current.getBoundingClientRect();
    const scaleX = rect.width / imageRef.current.naturalWidth;
    const scaleY = rect.height / imageRef.current.naturalHeight;

    return {
      left: `${crop.x * scaleX}px`,
      top: `${crop.y * scaleY}px`,
      width: `${crop.width * scaleX}px`,
      height: `${crop.height * scaleY}px`,
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <Crop className="text-indigo-600" size={32} />
            Image Cropper & Resizer
          </h1>

          {!image ? (
            <div className="border-4 border-dashed border-indigo-300 rounded-xl p-12 text-center hover:border-indigo-500 transition-colors">
              <Upload className="mx-auto text-indigo-400 mb-4" size={64} />
              <label className="cursor-pointer">
                <span className="text-lg text-gray-700 font-medium">
                  Click to upload an image
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Crop Section */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Crop size={20} className="text-indigo-600" />
                    Crop Image
                  </h2>
                  <div
                    ref={containerRef}
                    className="relative inline-block mb-4"
                  >
                    <img
                      ref={imageRef}
                      src={image}
                      alt="Preview"
                      className="max-w-full h-auto rounded-lg"
                      style={{ maxHeight: "400px" }}
                    />
                    <div
                      className="absolute border-2 border-indigo-500 bg-indigo-500 bg-opacity-20 cursor-move"
                      style={getCropStyle()}
                      onMouseDown={(e) => handleMouseDown(e, "move")}
                    >
                      <div
                        className="absolute bottom-0 right-0 w-4 h-4 bg-indigo-600 cursor-nwse-resize"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          handleMouseDown(e, "resize");
                        }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={applyCrop}
                    className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                  >
                    Apply Crop
                  </button>
                </div>

                {/* Resize Section */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Maximize2 size={20} className="text-indigo-600" />
                    Resize Image
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Width (px)
                      </label>
                      <input
                        type="number"
                        value={dimensions.width}
                        onChange={(e) =>
                          setDimensions((prev) => ({
                            width: parseInt(e.target.value) || 0,
                            height: maintainAspect
                              ? Math.round(
                                  (parseInt(e.target.value) || 0) *
                                    (imageRef.current.naturalHeight /
                                      imageRef.current.naturalWidth)
                                )
                              : prev.height,
                          }))
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Height (px)
                      </label>
                      <input
                        type="number"
                        value={dimensions.height}
                        onChange={(e) =>
                          setDimensions((prev) => ({
                            height: parseInt(e.target.value) || 0,
                            width: maintainAspect
                              ? Math.round(
                                  (parseInt(e.target.value) || 0) *
                                    (imageRef.current.naturalWidth /
                                      imageRef.current.naturalHeight)
                                )
                              : prev.width,
                          }))
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={maintainAspect}
                        onChange={(e) => setMaintainAspect(e.target.checked)}
                        className="w-4 h-4 text-indigo-600"
                      />
                      <span className="text-sm text-gray-700">
                        Maintain aspect ratio
                      </span>
                    </label>
                    <button
                      onClick={applyResize}
                      className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                    >
                      Apply Resize
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={downloadImage}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Download size={20} />
                  Download Image
                </button>
                <label className="flex-1 bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium flex items-center justify-center gap-2 cursor-pointer">
                  <RotateCw size={20} />
                  Upload New Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

import React, { useState, useRef, useEffect } from "react";
import { Upload, Crop, Download, RotateCw, Image } from "lucide-react";

export default function AdvancedImageEditor() {
  const [image, setImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 200, height: 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [aspectRatio, setAspectRatio] = useState("free");
  const [outputFormat, setOutputFormat] = useState("png");
  const [quality, setQuality] = useState(0.92);
  const [targetFileSize, setTargetFileSize] = useState(500);
  const [multipleOutputs, setMultipleOutputs] = useState([
    { width: 1920, height: 1080, enabled: false },
    { width: 1280, height: 720, enabled: false },
    { width: 640, height: 480, enabled: false },
  ]);
  const [processedImages, setProcessedImages] = useState([]);

  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  const aspectRatios = {
    free: { label: "Free", ratio: null },
    "1:1": { label: "1:1 Square", ratio: 1 },
    "4:3": { label: "4:3 Standard", ratio: 4 / 3 },
    "16:9": { label: "16:9 Widescreen", ratio: 16 / 9 },
    "21:9": { label: "21:9 Ultrawide", ratio: 21 / 9 },
    "9:16": { label: "9:16 Portrait", ratio: 9 / 16 },
    "3:4": { label: "3:4 Portrait", ratio: 3 / 4 },
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new window.Image();
        img.onload = () => {
          setImage(event.target.result);
          const size = Math.min(img.width, img.height, 300);
          setCrop({
            x: (img.width - size) / 2,
            y: (img.height - size) / 2,
            width: size,
            height: size,
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
      const ratio = aspectRatios[aspectRatio].ratio;

      if (ratio) {
        const newWidth = Math.max(
          50,
          Math.min(crop.width + deltaX, imageRef.current.naturalWidth - crop.x)
        );
        const newHeight = newWidth / ratio;

        if (crop.y + newHeight <= imageRef.current.naturalHeight) {
          setCrop((prev) => ({ ...prev, width: newWidth, height: newHeight }));
        }
      } else {
        setCrop((prev) => ({
          ...prev,
          width: Math.max(
            50,
            Math.min(
              prev.width + deltaX,
              imageRef.current.naturalWidth - prev.x
            )
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

  useEffect(() => {
    const ratio = aspectRatios[aspectRatio].ratio;
    if (ratio && imageRef.current) {
      setCrop((prev) => ({
        ...prev,
        height: prev.width / ratio,
      }));
    }
  }, [aspectRatio]);

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

  const compressToTargetSize = async (canvas, format, targetKB) => {
    let currentQuality = 0.92;
    let blob;

    for (let i = 0; i < 10; i++) {
      blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, `image/${format}`, currentQuality)
      );

      const sizeKB = blob.size / 1024;

      if (sizeKB <= targetKB || currentQuality <= 0.1) break;

      currentQuality -= 0.1;
    }

    return blob;
  };

  const processImage = async () => {
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

    const results = [];

    // Main cropped image
    let mainBlob;
    if (targetFileSize > 0) {
      mainBlob = await compressToTargetSize(
        canvas,
        outputFormat,
        targetFileSize
      );
    } else {
      mainBlob = await new Promise((resolve) =>
        canvas.toBlob(resolve, `image/${outputFormat}`, quality)
      );
    }

    const mainUrl = URL.createObjectURL(mainBlob);
    results.push({
      name: `cropped.${outputFormat}`,
      url: mainUrl,
      size: (mainBlob.size / 1024).toFixed(2),
      dimensions: `${crop.width}x${crop.height}`,
    });

    // Multiple sized outputs
    for (const output of multipleOutputs) {
      if (output.enabled) {
        const resizeCanvas = document.createElement("canvas");
        const resizeCtx = resizeCanvas.getContext("2d");

        resizeCanvas.width = output.width;
        resizeCanvas.height = output.height;

        resizeCtx.drawImage(canvas, 0, 0, output.width, output.height);

        let resizeBlob;
        if (targetFileSize > 0) {
          resizeBlob = await compressToTargetSize(
            resizeCanvas,
            outputFormat,
            targetFileSize
          );
        } else {
          resizeBlob = await new Promise((resolve) =>
            resizeCanvas.toBlob(resolve, `image/${outputFormat}`, quality)
          );
        }

        const resizeUrl = URL.createObjectURL(resizeBlob);
        results.push({
          name: `${output.width}x${output.height}.${outputFormat}`,
          url: resizeUrl,
          size: (resizeBlob.size / 1024).toFixed(2),
          dimensions: `${output.width}x${output.height}`,
        });
      }
    }

    setProcessedImages(results);
  };

  const downloadImage = (url, name) => {
    const link = document.createElement("a");
    link.download = name;
    link.href = url;
    link.click();
  };

  const downloadAll = () => {
    processedImages.forEach((img, i) => {
      setTimeout(() => downloadImage(img.url, img.name), i * 200);
    });
  };

  const updateMultipleOutput = (index, field, value) => {
    setMultipleOutputs((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-br from-purple-50 to-blue-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <Image className="text-purple-600" size={32} />
            Advanced Image Cropper & Compressor
          </h1>

          {!image ? (
            <div className="border-4 border-dashed border-purple-300 rounded-xl p-12 text-center hover:border-purple-500 transition-colors">
              <Upload className="mx-auto text-purple-400 mb-4" size={64} />
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
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left: Preview & Crop */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Crop size={20} className="text-purple-600" />
                    Crop Area
                  </h2>
                  <div className="relative inline-block mb-4">
                    <img
                      ref={imageRef}
                      src={image}
                      alt="Preview"
                      className="max-w-full h-auto rounded-lg"
                      style={{ maxHeight: "500px" }}
                    />
                    <div
                      className="absolute border-2 border-purple-500  bg-opacity-20 cursor-move"
                      style={getCropStyle()}
                      onMouseDown={(e) => handleMouseDown(e, "move")}
                    >
                      <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                        {[...Array(9)].map((_, i) => (
                          <div
                            key={i}
                            className="border border-purple-300 border-opacity-50"
                          ></div>
                        ))}
                      </div>
                      <div
                        className="absolute bottom-0 right-0 w-5 h-5 bg-purple-600 cursor-nwse-resize rounded-tl"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          handleMouseDown(e, "resize");
                        }}
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Aspect Ratio
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {Object.entries(aspectRatios).map(([key, val]) => (
                        <button
                          key={key}
                          onClick={() => setAspectRatio(key)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            aspectRatio === key
                              ? "bg-purple-600 text-white"
                              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          }`}
                        >
                          {val.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Processed Images */}
                {processedImages.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold text-gray-800">
                        Processed Images
                      </h2>
                      <button
                        onClick={downloadAll}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        <Download size={16} />
                        Download All
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {processedImages.map((img, i) => (
                        <div key={i} className="bg-white rounded-lg p-3 shadow">
                          <img
                            src={img.url}
                            alt={img.name}
                            className="w-full h-32 object-cover rounded mb-2"
                          />
                          <p className="text-xs font-medium text-gray-800 truncate">
                            {img.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {img.dimensions}
                          </p>
                          <p className="text-xs text-gray-500 mb-2">
                            {img.size} KB
                          </p>
                          <button
                            onClick={() => downloadImage(img.url, img.name)}
                            className="w-full bg-purple-600 text-white px-2 py-1 rounded text-xs hover:bg-purple-700"
                          >
                            Download
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Settings */}
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Export Settings
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Output Format
                      </label>
                      <select
                        value={outputFormat}
                        onChange={(e) => setOutputFormat(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-neutral-950"
                      >
                        <option value="png">PNG</option>
                        <option value="jpeg">JPEG</option>
                        <option value="webp">WebP</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quality: {Math.round(quality * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.01"
                        value={quality}
                        onChange={(e) => setQuality(parseFloat(e.target.value))}
                        className="w-full text-neutral-950"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Target File Size (KB) - 0 to disable
                      </label>
                      <input
                        type="number"
                        value={targetFileSize}
                        onChange={(e) =>
                          setTargetFileSize(parseInt(e.target.value) || 0)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-neutral-950"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Multiple Sizes
                  </h2>
                  <div className="space-y-3">
                    {multipleOutputs.map((output, i) => (
                      <div key={i} className="bg-white rounded-lg p-3">
                        <label className="flex items-center gap-2 mb-2">
                          <input
                            type="checkbox"
                            checked={output.enabled}
                            onChange={(e) =>
                              updateMultipleOutput(
                                i,
                                "enabled",
                                e.target.checked
                              )
                            }
                            className="w-4 h-4 text-purple-600"
                          />
                          <span className="text-sm font-medium text-gray-700">
                            {output.width}x{output.height}
                          </span>
                        </label>
                        {output.enabled && (
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="number"
                              value={output.width}
                              onChange={(e) =>
                                updateMultipleOutput(
                                  i,
                                  "width",
                                  parseInt(e.target.value) || 0
                                )
                              }
                              placeholder="Width"
                              className="px-2 py-1 border border-gray-300 rounded text-neutral-950 text-sm"
                            />
                            <input
                              type="number"
                              value={output.height}
                              onChange={(e) =>
                                updateMultipleOutput(
                                  i,
                                  "height",
                                  parseInt(e.target.value) || 0
                                )
                              }
                              placeholder="Height"
                              className="px-2 py-1 border border-gray-300 text-neutral-950 rounded text-sm"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={processImage}
                  className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium text-lg"
                >
                  Process Image
                </button>

                <label className="w-full bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium flex items-center justify-center gap-2 cursor-pointer">
                  <RotateCw size={20} />
                  Upload New Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden "
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

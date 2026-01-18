import React, { useState, useRef, useEffect } from "react";
import { Upload, Crop, Download, RotateCw, Image, Trash2 } from "lucide-react";

function AdvancedImageCropper() {
  const [image, setImage] = useState(null);
  const [crop, setCrop] = useState({ x: 50, y: 50, width: 300, height: 300 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, cropStart: {} });
  const [aspectRatio, setAspectRatio] = useState("free");
  const [outputFormat, setOutputFormat] = useState("jpeg");
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
  const containerRef = useRef(null);

  const aspectRatios = {
    free: { label: "Free", ratio: null },
    "1:1": { label: "1:1", ratio: 1 },
    "4:3": { label: "4:3", ratio: 4 / 3 },
    "16:9": { label: "16:9", ratio: 16 / 9 },
    "21:9": { label: "21:9", ratio: 21 / 9 },
    "9:16": { label: "9:16", ratio: 9 / 16 },
    "4:5": { label: "4:5", ratio: 4 / 5 },
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new window.Image();
        img.onload = () => {
          setImage(event.target.result);
          const size = Math.min(img.width, img.height, 400);
          setCrop({
            x: (img.width - size) / 2,
            y: (img.height - size) / 2,
            width: size,
            height: size,
          });
          setProcessedImages([]);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const getMousePosition = (e) => {
    if (!imageRef.current) return { x: 0, y: 0 };
    const rect = imageRef.current.getBoundingClientRect();
    const scaleX = imageRef.current.naturalWidth / rect.width;
    const scaleY = imageRef.current.naturalHeight / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    const pos = getMousePosition(e);
    setIsDragging(true);
    setDragType(type);
    setDragStart({
      x: pos.x,
      y: pos.y,
      cropStart: { ...crop },
    });
  };

  const constrainCrop = (newCrop) => {
    if (!imageRef.current) return newCrop;
    const maxWidth = imageRef.current.naturalWidth;
    const maxHeight = imageRef.current.naturalHeight;

    return {
      x: Math.max(0, Math.min(newCrop.x, maxWidth - newCrop.width)),
      y: Math.max(0, Math.min(newCrop.y, maxHeight - newCrop.height)),
      width: Math.max(50, Math.min(newCrop.width, maxWidth - newCrop.x)),
      height: Math.max(50, Math.min(newCrop.height, maxHeight - newCrop.y)),
    };
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !imageRef.current) return;

    const pos = getMousePosition(e);
    const deltaX = pos.x - dragStart.x;
    const deltaY = pos.y - dragStart.y;
    const ratio = aspectRatios[aspectRatio].ratio;

    let newCrop = { ...crop };

    if (dragType === "move") {
      newCrop = {
        ...crop,
        x: dragStart.cropStart.x + deltaX,
        y: dragStart.cropStart.y + deltaY,
      };
    } else if (dragType === "nw") {
      const newWidth = dragStart.cropStart.width - deltaX;
      const newHeight = ratio
        ? newWidth / ratio
        : dragStart.cropStart.height - deltaY;
      newCrop = {
        x: dragStart.cropStart.x + dragStart.cropStart.width - newWidth,
        y: dragStart.cropStart.y + dragStart.cropStart.height - newHeight,
        width: newWidth,
        height: newHeight,
      };
    } else if (dragType === "ne") {
      const newWidth = dragStart.cropStart.width + deltaX;
      const newHeight = ratio
        ? newWidth / ratio
        : dragStart.cropStart.height - deltaY;
      newCrop = {
        x: dragStart.cropStart.x,
        y: dragStart.cropStart.y + dragStart.cropStart.height - newHeight,
        width: newWidth,
        height: newHeight,
      };
    } else if (dragType === "sw") {
      const newWidth = dragStart.cropStart.width - deltaX;
      const newHeight = ratio
        ? newWidth / ratio
        : dragStart.cropStart.height + deltaY;
      newCrop = {
        x: dragStart.cropStart.x + dragStart.cropStart.width - newWidth,
        y: dragStart.cropStart.y,
        width: newWidth,
        height: newHeight,
      };
    } else if (dragType === "se") {
      const newWidth = dragStart.cropStart.width + deltaX;
      const newHeight = ratio
        ? newWidth / ratio
        : dragStart.cropStart.height + deltaY;
      newCrop = {
        x: dragStart.cropStart.x,
        y: dragStart.cropStart.y,
        width: newWidth,
        height: newHeight,
      };
    } else if (dragType === "n") {
      const newHeight = dragStart.cropStart.height - deltaY;
      const newWidth = ratio ? newHeight * ratio : dragStart.cropStart.width;
      newCrop = {
        x: ratio
          ? dragStart.cropStart.x + (dragStart.cropStart.width - newWidth) / 2
          : dragStart.cropStart.x,
        y: dragStart.cropStart.y + dragStart.cropStart.height - newHeight,
        width: newWidth,
        height: newHeight,
      };
    } else if (dragType === "s") {
      const newHeight = dragStart.cropStart.height + deltaY;
      const newWidth = ratio ? newHeight * ratio : dragStart.cropStart.width;
      newCrop = {
        x: ratio
          ? dragStart.cropStart.x + (dragStart.cropStart.width - newWidth) / 2
          : dragStart.cropStart.x,
        y: dragStart.cropStart.y,
        width: newWidth,
        height: newHeight,
      };
    } else if (dragType === "w") {
      const newWidth = dragStart.cropStart.width - deltaX;
      const newHeight = ratio ? newWidth / ratio : dragStart.cropStart.height;
      newCrop = {
        x: dragStart.cropStart.x + dragStart.cropStart.width - newWidth,
        y: ratio
          ? dragStart.cropStart.y + (dragStart.cropStart.height - newHeight) / 2
          : dragStart.cropStart.y,
        width: newWidth,
        height: newHeight,
      };
    } else if (dragType === "e") {
      const newWidth = dragStart.cropStart.width + deltaX;
      const newHeight = ratio ? newWidth / ratio : dragStart.cropStart.height;
      newCrop = {
        x: dragStart.cropStart.x,
        y: ratio
          ? dragStart.cropStart.y + (dragStart.cropStart.height - newHeight) / 2
          : dragStart.cropStart.y,
        width: newWidth,
        height: newHeight,
      };
    }

    setCrop(constrainCrop(newCrop));
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
  }, [isDragging, dragStart, crop]);

  useEffect(() => {
    const ratio = aspectRatios[aspectRatio].ratio;
    if (ratio && imageRef.current) {
      setCrop((prev) => {
        const newCrop = {
          ...prev,
          height: prev.width / ratio,
        };
        return constrainCrop(newCrop);
      });
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
        canvas.toBlob(resolve, `image/${format}`, currentQuality),
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
      crop.height,
    );

    const results = [];

    // Main cropped image
    let mainBlob;
    if (targetFileSize > 0) {
      mainBlob = await compressToTargetSize(
        canvas,
        outputFormat,
        targetFileSize,
      );
    } else {
      mainBlob = await new Promise((resolve) =>
        canvas.toBlob(resolve, `image/${outputFormat}`, quality),
      );
    }

    const mainUrl = URL.createObjectURL(mainBlob);
    results.push({
      name: `cropped-${Math.round(crop.width)}x${Math.round(crop.height)}.${outputFormat}`,
      url: mainUrl,
      size: (mainBlob.size / 1024).toFixed(2),
      dimensions: `${Math.round(crop.width)}x${Math.round(crop.height)}`,
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
            targetFileSize,
          );
        } else {
          resizeBlob = await new Promise((resolve) =>
            resizeCanvas.toBlob(resolve, `image/${outputFormat}`, quality),
          );
        }

        const resizeUrl = URL.createObjectURL(resizeBlob);
        results.push({
          name: `resized-${output.width}x${output.height}.${outputFormat}`,
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

  const addNewSize = () => {
    setMultipleOutputs((prev) => [
      ...prev,
      { width: 800, height: 600, enabled: true },
    ]);
  };

  const removeSize = (index) => {
    setMultipleOutputs((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-2 flex items-center gap-3">
              <Image className="text-indigo-600" size={40} />
              Image Cropper
            </h1>
            <p className="text-gray-600">
              Crop with precision, resize to perfection
            </p>
          </div>

          {!image ? (
            <div className="border-4 border-dashed border-indigo-300 rounded-2xl p-16 text-center hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-300">
              <Upload className="mx-auto text-indigo-400 mb-6" size={80} />
              <label className="cursor-pointer">
                <span className="text-xl text-gray-700 font-semibold">
                  Drop your image here or click to browse
                </span>
                <p className="text-gray-500 mt-2">Supports JPG, PNG, WebP</p>
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
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 shadow-inner">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                      <Crop size={24} className="text-indigo-600" />
                      Crop Area
                    </h2>
                    <div className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full">
                      {Math.round(crop.width)} × {Math.round(crop.height)}
                    </div>
                  </div>

                  <div
                    ref={containerRef}
                    className="relative inline-block mb-6 bg-black bg-opacity-5 rounded-xl p-4"
                  >
                    <img
                      ref={imageRef}
                      src={image}
                      alt="Preview"
                      className="max-w-full h-auto rounded-lg shadow-lg"
                      style={{ maxHeight: "500px" }}
                    />
                    <div
                      className="absolute border-2 border-indigo-500 shadow-2xl cursor-move"
                      style={getCropStyle()}
                      onMouseDown={(e) => handleMouseDown(e, "move")}
                    >
                      {/* Grid lines */}
                      <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                        {[...Array(9)].map((_, i) => (
                          <div
                            key={i}
                            className="border border-white border-opacity-30"
                          ></div>
                        ))}
                      </div>

                      {/* Corner handles */}
                      <div
                        onMouseDown={(e) => handleMouseDown(e, "nw")}
                        className="absolute -top-2 -left-2 w-4 h-4 bg-white border-2 border-indigo-600 rounded-full cursor-nw-resize hover:scale-125 transition-transform"
                      ></div>
                      <div
                        onMouseDown={(e) => handleMouseDown(e, "ne")}
                        className="absolute -top-2 -right-2 w-4 h-4 bg-white border-2 border-indigo-600 rounded-full cursor-ne-resize hover:scale-125 transition-transform"
                      ></div>
                      <div
                        onMouseDown={(e) => handleMouseDown(e, "sw")}
                        className="absolute -bottom-2 -left-2 w-4 h-4 bg-white border-2 border-indigo-600 rounded-full cursor-sw-resize hover:scale-125 transition-transform"
                      ></div>
                      <div
                        onMouseDown={(e) => handleMouseDown(e, "se")}
                        className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border-2 border-indigo-600 rounded-full cursor-se-resize hover:scale-125 transition-transform"
                      ></div>

                      {/* Edge handles */}
                      <div
                        onMouseDown={(e) => handleMouseDown(e, "n")}
                        className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-indigo-600 rounded-full cursor-n-resize hover:scale-125 transition-transform"
                      ></div>
                      <div
                        onMouseDown={(e) => handleMouseDown(e, "s")}
                        className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-indigo-600 rounded-full cursor-s-resize hover:scale-125 transition-transform"
                      ></div>
                      <div
                        onMouseDown={(e) => handleMouseDown(e, "w")}
                        className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-indigo-600 rounded-full cursor-w-resize hover:scale-125 transition-transform"
                      ></div>
                      <div
                        onMouseDown={(e) => handleMouseDown(e, "e")}
                        className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-indigo-600 rounded-full cursor-e-resize hover:scale-125 transition-transform"
                      ></div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Aspect Ratio
                    </label>
                    <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                      {Object.entries(aspectRatios).map(([key, val]) => (
                        <button
                          key={key}
                          onClick={() => setAspectRatio(key)}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                            aspectRatio === key
                              ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105"
                              : "bg-white text-gray-700 hover:bg-gray-100 shadow-sm hover:shadow-md"
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
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 shadow-lg">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-2xl font-bold text-gray-800">
                        ✨ Processed Images
                      </h2>
                      <button
                        onClick={downloadAll}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-2 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl text-sm font-semibold flex items-center gap-2"
                      >
                        <Download size={18} />
                        Download All ({processedImages.length})
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {processedImages.map((img, i) => (
                        <div
                          key={i}
                          className="bg-white rounded-xl p-3 shadow-md hover:shadow-xl transition-shadow"
                        >
                          <img
                            src={img.url}
                            alt={img.name}
                            className="w-full h-32 object-cover rounded-lg mb-3"
                          />
                          <p className="text-xs font-bold text-gray-800 truncate mb-1">
                            {img.name}
                          </p>
                          <div className="flex justify-between text-xs text-gray-600 mb-2">
                            <span>{img.dimensions}</span>
                            <span className="font-semibold text-indigo-600">
                              {img.size} KB
                            </span>
                          </div>
                          <button
                            onClick={() => downloadImage(img.url, img.name)}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all"
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
              <div className="space-y-6 text-neutral-900">
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 shadow-lg">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">
                    ⚙️ Export Settings
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Format
                      </label>
                      <select
                        value={outputFormat}
                        onChange={(e) => setOutputFormat(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium"
                      >
                        <option value="png">PNG</option>
                        <option value="jpeg">JPEG</option>
                        <option value="webp">WebP</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Quality: {Math.round(quality * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.01"
                        value={quality}
                        onChange={(e) => setQuality(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Target Size (KB)
                      </label>
                      <input
                        type="number"
                        value={targetFileSize}
                        onChange={(e) =>
                          setTargetFileSize(parseInt(e.target.value) || 0)
                        }
                        placeholder="0 = disabled"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Set to 0 to disable compression
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 shadow-lg ">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">
                      📐 Multiple Sizes
                    </h2>
                    <button
                      onClick={addNewSize}
                      className="text-sm bg-purple-600 text-white px-3 py-1 rounded-lg hover:bg-purple-700 font-semibold"
                    >
                      + Add
                    </button>
                  </div>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {multipleOutputs.map((output, i) => (
                      <div
                        key={i}
                        className="bg-white rounded-xl p-4 shadow-sm"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={output.enabled}
                              onChange={(e) =>
                                updateMultipleOutput(
                                  i,
                                  "enabled",
                                  e.target.checked,
                                )
                              }
                              className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                            />
                            <span className="text-sm font-bold text-gray-700">
                              {output.width} × {output.height}
                            </span>
                          </label>
                          {multipleOutputs.length > 1 && (
                            <button
                              onClick={() => removeSize(i)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                        {output.enabled && (
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="number"
                              value={output.width}
                              onChange={(e) =>
                                updateMultipleOutput(
                                  i,
                                  "width",
                                  parseInt(e.target.value) || 0,
                                )
                              }
                              placeholder="Width"
                              className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                            <input
                              type="number"
                              value={output.height}
                              onChange={(e) =>
                                updateMultipleOutput(
                                  i,
                                  "height",
                                  parseInt(e.target.value) || 0,
                                )
                              }
                              placeholder="Height"
                              className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={processImage}
                  className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-4 rounded-2xl hover:shadow-2xl transition-all text-lg font-bold shadow-lg transform hover:scale-105"
                >
                  🚀 Process Image
                </button>

                <label className="w-full bg-gradient-to-r from-gray-700 to-gray-900 text-white py-4 rounded-2xl hover:shadow-xl transition-all font-bold flex items-center justify-center gap-3 cursor-pointer shadow-lg">
                  <RotateCw size={22} />
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

export default AdvancedImageCropper;

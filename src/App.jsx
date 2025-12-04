import ImageCropper from "./ImageCropper";

function App() {
  return (
    <>
      {" "}
      <div className="min-h-screen p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Image Resize</h1>
        <ImageCropper />
      </div>
    </>
  );
}

export default App;

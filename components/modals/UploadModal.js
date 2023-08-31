import { useState, useEffect } from "react";
import * as backendRequests from "../../pages/api/backendRequests";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const UploadModal = (props) => {
  const [file, setFile] = useState(undefined);
  const [cid, setCid] = useState("");
  const [invalidFile, setInvalidFile] = useState(false);
  const [preview, setPreview] = useState();
  // const [status, setStatus] = useState(undefined);
  const [category, setCategory] = useState(undefined);
  const [isLoading, setIsLoading] = useState(false);

  const categories = [
    "Certificate",
    "Identification",
    "Transcript",
    "Reference Letter",
    "Recommendation Letter",
    "Diploma",
    "Other",
  ];

  const uploadToIPFS = async () => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file, { filename: file.name });

      const res = await fetch("/api/ipfs", {
        method: "POST",
        body: formData,
      });
      const ipfsHash = await res.text();
      setCid(ipfsHash);
    } catch (e) {
      console.log(e);
      alert("Trouble uploading file");
    }
  };

  useEffect(() => {
    if (!file) {
      setPreview(undefined);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    // free memory when ever this component is unmounted
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  useEffect(() => {
    if (!cid) {
      return;
    }

    const documentInfo = {
      nft_id: cid,
      user_id: props.user.address,
      name: file.name,
      format: file.type.split("/")[1].toUpperCase(),
      status: "Uploaded",
      category: category,
      created_at: new Date(),
    };

    backendRequests.addNft(documentInfo)
      .then(response => {
        if (response.success) {
          toast.success(response.message);
          props.setUploadSuccess(true);
          props.cancelHandler();
          setIsLoading(false);
        } else {
          toast.error(response.message);
          props.setUploadSuccess(false);
          setIsLoading(false);
        }
      })
      .catch(error => {
        toast.error("An unexpected error occurred.");
      });
  }, [cid]);

  return (
      <div className="modal-background">
        <div className="modal-content">
          <h2 className="text-xl font-bold mb-2">Upload Document</h2>
          {isLoading && (<p className={"text-gray-800"}><em>Uploading Document: Please Wait...</em></p>)}
          <DragDropFile setFile={setFile} setInvalidFile={setInvalidFile}/>
          {invalidFile && (
              <p className="error">
                Invalid file type. Please choose a PDF, PNG, or JPEG file.
              </p>
          )}
          {file && (
              <>
                <p style={{fontStyle: "italic"}}>{file.name}</p>
                {/*<div>
                  <label htmlFor="status">Status </label>
                  <select name="status" id="status" onChange={(e) => setStatus(e.target.value)}>
                    <option value="minted">Minted</option>
                    <option value="shared">Shared</option>
                    <option value="verified">Verified</option>
                  </select>
                </div>*/}
                {(file.type === "image/png" || file.type === "image/jpeg") && (
                    <img className="preview" src={preview}/>
                )}
                {file.type === "application/pdf" && <iframe src={preview}/>}
                <div>
                  <label htmlFor="category">Category </label>
                  <select
                      name="category"
                      id="category"
                      onChange={(e) => setCategory(e.target.value)}
                  >
                    {categories.map((category) => {
                      return (
                          <option key={category} value={category.toLowerCase()}>
                            {category}
                          </option>
                      );
                    })}
                  </select>
                </div>
              </>
          )}
          <div>
        <span className="pr-1">
          <button
              className={`${
                  (file && !isLoading)
                      ? "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
                      : "bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-full"
              } text-${file ? "white" : "gray"}-500`}
              onClick={uploadToIPFS}
              style={{cursor: !file ? "not-allowed" : ""}}
              disabled={!file || (file && isLoading)}
          >
            Confirm
          </button>
        </span>
            <span className="pl-1">
          <button
              className={`bg-gray-200 "hover:bg-gray-300 text-gray-500 font-bold py-2 px-4 rounded-full`}
              onClick={() => {
                props.cancelHandler();
                setFile(undefined);
              }}
          >
            Cancel
          </button>
        </span>
          </div>
        </div>
      </div>
  );
};

const DragDropFile = (props) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = function (e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = function (e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      if (isValidFile(e.dataTransfer.files[0])) {
        props.setFile(e.dataTransfer.files[0]);
        props.setInvalidFile(false);
      } else {
        props.setFile(undefined);
        props.setInvalidFile(true);
      }
    }
  };

  const handleChange = function (e) {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      if (isValidFile(e.target.files[0])) {
        props.setFile(e.target.files[0]);
        props.setInvalidFile(false);

      } else {
        props.setFile(undefined);
        props.setInvalidFile(true);
      }
    }
  };

  const isValidFile = function (file) {
    return (
      file.type === "application/pdf" ||
      file.type === "image/png" ||
      file.type === "image/jpeg"
    );
  };

  return (
    <form
      id="form-file-upload"
      onDragEnter={handleDrag}
      onSubmit={(e) => e.preventDefault()}
    >
      <input
        type="file"
        id="input-file-upload"
        multiple={false}
        onChange={handleChange}
      />
      <label
        id="label-file-upload"
        htmlFor="input-file-upload"
        className={dragActive ? "drag-active" : ""}
      >
        <div>
          <p>Drag and Drop File Here</p>
          {/*<button className="upload-button">Upload a file</button>*/}
        </div>
      </label>
      {dragActive && (
        <div
          id="drag-file-element"
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        ></div>
      )}
    </form>
  );
};

export default UploadModal;
